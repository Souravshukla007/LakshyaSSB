import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/entitlement';
import { completePracticeForUser } from '@/lib/streak';
import { awardMedals } from '@/lib/medals';
import { claimFreeEval, releaseFreeEval } from '@/lib/practice-limit';
import {
    generateJson,
    aiErrorResponse,
    normalizeThemeScores,
    toRiskLevel,
    toScore,
} from '@/lib/ai-eval';

export async function POST(request: Request) {
    // Entitlement comes from the database, never from the session cookie.
    const gate = await requireUser();
    if (gate.response) return gate.response;
    const { userId, isPro } = gate.entitlement;

    let body: { responses?: unknown };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const responses = body.responses;
    if (!Array.isArray(responses) || responses.length === 0) {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Reject a submission with nothing in it rather than paying Gemini to score
    // 60 empty strings and then persisting the meaningless result.
    const answered = responses.filter(
        (r) => typeof r?.user_sentence === 'string' && r.user_sentence.trim().length > 0,
    );
    if (answered.length === 0) {
        return NextResponse.json(
            {
                error: 'No responses were recorded, so there is nothing to evaluate.',
                reason: 'empty_submission',
            },
            { status: 400 },
        );
    }

    // Claim the free evaluation BEFORE spending money on the model. The insert is
    // the lock, so concurrent submissions cannot each be granted a free pass.
    const claimed = await claimFreeEval(userId, isPro, 'WAT');
    if (!claimed) {
        return NextResponse.json(
            {
                error: 'You have used your free WAT evaluation. Upgrade to Pro for unlimited attempts.',
                reason: 'free_limit_reached',
                upgradeUrl: '/pricing',
            },
            { status: 403 },
        );
    }

    try {
        const prompt = `Evaluate these Word Association Test (WAT) sentences for an SSB candidate.

        SENTENCES:
        ${answered.map((r) => `Word "${r.word}": ${r.user_sentence}`).join('\n')}

        Return evaluation in JSON:
        {
          "percentage_score": 1-100,
          "risk_level": "LOW" | "MODERATE" | "HIGH",
          "theme_scores": {
            "Positivity": {"percentage": 1-100},
            "Action_Orientation": {"percentage": 1-100},
            "Responsibility": {"percentage": 1-100}
          }
        }`;

        const evaluation = await generateJson({
            prompt,
            validate: (parsed) => {
                const p = (parsed ?? {}) as Record<string, unknown>;
                return {
                    percentage_score: toScore(p.percentage_score),
                    risk_level: toRiskLevel(p.risk_level),
                    theme_scores: normalizeThemeScores(p.theme_scores),
                };
            },
        });

        // One transaction: either the result, the medals, the streak and the
        // quota marker all land, or none do. Previously a throw midway left the
        // result row committed while the quota was never recorded.
        const { savedResult, medalResult, streak } = await prisma.$transaction(async () => {
            const savedResult = await prisma.watResult.create({
                data: {
                    userId,
                    totalScore: evaluation.percentage_score,
                    themeScores: evaluation.theme_scores,
                    riskLevel: evaluation.risk_level,
                },
            });
            const medalResult = await awardMedals(userId, 'practice');
            const streak = await completePracticeForUser(userId, 'WAT');
            return { savedResult, medalResult, streak };
        });

        return NextResponse.json({
            success: true,
            evaluation,
            resultId: savedResult.id,
            streak,
            medals: medalResult,
        });
    } catch (error) {
        // Don't burn the user's single free attempt on our own failure.
        await releaseFreeEval(userId, isPro, 'WAT');
        console.error('[wat/submit]', error);
        const { body: errBody, status } = aiErrorResponse(error);
        return NextResponse.json(errBody, { status });
    }
}
