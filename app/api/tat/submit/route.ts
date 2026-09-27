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
    toStringArray,
} from '@/lib/ai-eval';

export async function POST(req: Request) {
    const gate = await requireUser();
    if (gate.response) return gate.response;
    const { userId, isPro } = gate.entitlement;

    let body: { stories?: unknown };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const stories = body.stories;
    if (!Array.isArray(stories) || stories.length === 0) {
        return NextResponse.json({ error: 'Invalid input format' }, { status: 400 });
    }

    const written = stories.filter(
        (s) => typeof s?.story_text === 'string' && s.story_text.trim().length > 0,
    );
    if (written.length === 0) {
        return NextResponse.json(
            {
                error: 'No stories were recorded, so there is nothing to evaluate.',
                reason: 'empty_submission',
            },
            { status: 400 },
        );
    }

    const claimed = await claimFreeEval(userId, isPro, 'TAT');
    if (!claimed) {
        return NextResponse.json(
            {
                error: 'You have used your free TAT evaluation. Upgrade to Pro for unlimited attempts.',
                reason: 'free_limit_reached',
                upgradeUrl: '/pricing',
            },
            { status: 403 },
        );
    }

    try {
        const prompt = `Analyze these ${written.length} TAT (Thematic Apperception Test) stories for an SSB candidate.

        STORIES:
        ${written.map((s, i) => `Image ${i + 1}: ${s.story_text}`).join('\n\n')}

        Evaluate the candidate's psychological profile and return JSON:
        {
          "percentage": 1-100,
          "riskLevel": "LOW" | "MODERATE" | "HIGH",
          "themeScores": {
            "Leadership": {"percentage": 1-100},
            "Initiative": {"percentage": 1-100},
            "Action": {"percentage": 1-100},
            "Social": {"percentage": 1-100},
            "Confidence": {"percentage": 1-100}
          },
          "insights": ["insight 1", "insight 2"]
        }

        Focus on Officer Like Qualities (OLQs), positivity, realism, and proactive problem-solving.`;

        const evaluation = await generateJson({
            prompt,
            validate: (parsed) => {
                const p = (parsed ?? {}) as Record<string, unknown>;
                return {
                    percentage: toScore(p.percentage),
                    riskLevel: toRiskLevel(p.riskLevel),
                    themeScores: normalizeThemeScores(p.themeScores),
                    insights: toStringArray(p.insights),
                };
            },
        });

        const { savedResult, medalResult, streak } = await prisma.$transaction(async () => {
            const savedResult = await prisma.tatResult.create({
                data: {
                    userId,
                    totalScore: evaluation.percentage,
                    themeScores: evaluation.themeScores,
                    riskLevel: evaluation.riskLevel,
                },
            });
            const medalResult = await awardMedals(userId, 'practice');
            const streak = await completePracticeForUser(userId, 'TAT');
            return { savedResult, medalResult, streak };
        });

        return NextResponse.json({
            success: true,
            message: 'TAT Evaluated by AI and saved.',
            resultId: savedResult.id,
            evaluation,
            streak,
            medals: medalResult,
        });
    } catch (error) {
        await releaseFreeEval(userId, isPro, 'TAT');
        console.error('[tat/submit]', error);
        const { body: errBody, status } = aiErrorResponse(error);
        return NextResponse.json(errBody, { status });
    }
}
