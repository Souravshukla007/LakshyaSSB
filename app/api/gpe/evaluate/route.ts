import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/entitlement';
import { awardMedals } from '@/lib/medals';
import { claimFreeEval, releaseFreeEval } from '@/lib/practice-limit';
import { generateJson, aiErrorResponse, toScore } from '@/lib/ai-eval';

/** Clamp a 1-10 sub-score. */
function toTenPoint(value: unknown): number {
    return Math.round(toScore(value, 0) / 10) || Math.max(0, Math.min(10, Number(value) || 0));
}

function toFeedbackText(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
}

export async function POST(req: NextRequest) {
    const gate = await requireUser();
    if (gate.response) return gate.response;
    const { userId, isPro } = gate.entitlement;

    let reqBody: Record<string, unknown>;
    try {
        reqBody = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const situation = reqBody.situation;
    const actionPlan = reqBody.actionPlan;
    const timeManagement = reqBody.timeManagement ?? '';
    // Client sends `identifyProblems`; accept both spellings for safety.
    const identifiedProblems = reqBody.identifyProblems ?? reqBody.identifiedProblems ?? '';

    if (typeof situation !== 'string' || !situation.trim()) {
        return NextResponse.json({ error: 'Missing situation' }, { status: 400 });
    }
    if (typeof actionPlan !== 'string' || !actionPlan.trim()) {
        return NextResponse.json({ error: 'Missing action plan' }, { status: 400 });
    }

    const claimed = await claimFreeEval(userId, isPro, 'GPE');
    if (!claimed) {
        return NextResponse.json(
            {
                error: 'You have used your free GPE evaluation. Upgrade to Pro for unlimited attempts.',
                reason: 'free_limit_reached',
                upgradeUrl: '/pricing',
            },
            { status: 403 },
        );
    }

    try {
        const prompt = `Evaluate the following Group Planning Exercise (GPE) solution for an SSB candidate.

        SITUATION:
        ${situation}

        CANDIDATE'S IDENTIFIED PROBLEMS:
        ${identifiedProblems}

        CANDIDATE'S ACTION PLAN:
        ${actionPlan}

        CANDIDATE'S TIME/RESOURCE MANAGEMENT:
        ${timeManagement}

        Provide a detailed evaluation in JSON format with the following fields:
        - score: Overall score from 1-100.
        - reasoningScore: Score from 1-10 for Reasoning Ability.
        - organizingScore: Score from 1-10 for Organizing Ability.
        - initiativeScore: Score from 1-10 for Initiative.
        - socialScore: Score from 1-10 for Social Adaptability.
        - feedback: An object containing:
            - strengths: What they did well.
            - weaknesses: Areas of improvement.
            - missedProblems: List of any problems from the situation the candidate missed.
            - resourceUsage: Critique of how they used available resources.

        Be critical and constructive as an SSB GTO. Focus on logical sequencing and urgency prioritization.`;

        const evaluation = await generateJson({
            prompt,
            validate: (parsed) => {
                const p = (parsed ?? {}) as Record<string, unknown>;
                const fb = (p.feedback ?? {}) as Record<string, unknown>;
                return {
                    score: toScore(p.score),
                    reasoningScore: toTenPoint(p.reasoningScore),
                    organizingScore: toTenPoint(p.organizingScore),
                    initiativeScore: toTenPoint(p.initiativeScore),
                    socialScore: toTenPoint(p.socialScore),
                    feedback: {
                        strengths: toFeedbackText(fb.strengths),
                        weaknesses: toFeedbackText(fb.weaknesses),
                        missedProblems: Array.isArray(fb.missedProblems)
                            ? fb.missedProblems.filter((x): x is string => typeof x === 'string')
                            : toFeedbackText(fb.missedProblems),
                        resourceUsage: toFeedbackText(fb.resourceUsage),
                    },
                };
            },
        });

        const medalResult = await awardMedals(userId, 'practice');

        return NextResponse.json({ ...evaluation, medals: medalResult });
    } catch (error) {
        await releaseFreeEval(userId, isPro, 'GPE');
        console.error('[gpe/evaluate]', error);
        const { body: errBody, status } = aiErrorResponse(error);
        return NextResponse.json(errBody, { status });
    }
}
