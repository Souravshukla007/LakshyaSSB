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

/**
 * Accept either shape for a response item and return the text.
 *
 * The standalone /srt-test page sent `Object.values(answers)` — plain strings —
 * while this route read `input.user_response`, so every prompt line was
 * literally "Srt 1: undefined" and the model scored nothing at all. The client
 * now sends `{ user_response }`, and this tolerates both so an older cached
 * bundle (or the Android WebView) can't silently produce garbage again.
 */
function toResponseText(input: unknown): string | null {
    if (typeof input === 'string') {
        return input.trim() || null;
    }
    if (input && typeof input === 'object') {
        const candidate =
            (input as { user_response?: unknown }).user_response ??
            (input as { response?: unknown }).response ??
            (input as { text?: unknown }).text;
        if (typeof candidate === 'string') return candidate.trim() || null;
    }
    return null;
}

export async function POST(req: Request) {
    const gate = await requireUser();
    if (gate.response) return gate.response;
    const { userId, isPro } = gate.entitlement;

    let body: { inputs?: unknown };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!Array.isArray(body.inputs)) {
        return NextResponse.json({ error: 'Invalid input format' }, { status: 400 });
    }

    const answers = body.inputs
        .map(toResponseText)
        .filter((t): t is string => t !== null);

    if (answers.length === 0) {
        return NextResponse.json(
            {
                error: 'No reactions were recorded, so there is nothing to evaluate.',
                reason: 'empty_submission',
            },
            { status: 400 },
        );
    }

    const claimed = await claimFreeEval(userId, isPro, 'SRT');
    if (!claimed) {
        return NextResponse.json(
            {
                error: 'You have used your free SRT evaluation. Upgrade to Pro for unlimited attempts.',
                reason: 'free_limit_reached',
                upgradeUrl: '/pricing',
            },
            { status: 403 },
        );
    }

    try {
        const prompt = `Evaluate these Situation Reaction Test (SRT) responses for an SSB candidate.

        RESPONSES:
        ${answers.map((text, i) => `Srt ${i + 1}: ${text}`).join('\n')}

        Return evaluation in JSON:
        {
          "totalScore": 1-100,
          "riskLevel": "LOW" | "MODERATE" | "HIGH",
          "themeScores": {
            "Action_Orientation": {"percentage": 1-100},
            "Responsibility": {"percentage": 1-100},
            "Emotional_Control": {"percentage": 1-100},
            "Decision_Making": {"percentage": 1-100}
          }
        }`;

        const evaluation = await generateJson({
            prompt,
            validate: (parsed) => {
                const p = (parsed ?? {}) as Record<string, unknown>;
                return {
                    totalScore: toScore(p.totalScore),
                    riskLevel: toRiskLevel(p.riskLevel),
                    themeScores: normalizeThemeScores(p.themeScores),
                };
            },
        });

        const { srtResult, medalResult, streak } = await prisma.$transaction(async () => {
            const srtResult = await prisma.srtResult.create({
                data: {
                    userId,
                    totalScore: evaluation.totalScore,
                    themeScores: evaluation.themeScores,
                    riskLevel: evaluation.riskLevel,
                },
            });
            const medalResult = await awardMedals(userId, 'practice');
            const streak = await completePracticeForUser(userId, 'SRT');
            return { srtResult, medalResult, streak };
        });

        return NextResponse.json({
            success: true,
            result: srtResult,
            evaluation,
            resultId: srtResult.id,
            streak,
            medals: medalResult,
        });
    } catch (error) {
        await releaseFreeEval(userId, isPro, 'SRT');
        console.error('[srt/submit]', error);
        const { body: errBody, status } = aiErrorResponse(error);
        return NextResponse.json(errBody, { status });
    }
}
