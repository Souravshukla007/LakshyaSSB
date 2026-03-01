import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { evaluateTat, TatInput } from '@/lib/evaluators/tatEvaluator';

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();

        // Body can optionally have multiple stories, but the UI might send one at a time or all 12.
        // The prompt says: Input: { image_id, theme, difficulty, story_text }
        // We will accept an array of these to evaluate the full TAT. 
        // If it's a single object, we wrap it in an array.
        const inputsRaw = body.stories || [body];

        if (!Array.isArray(inputsRaw) || inputsRaw.length === 0) {
            return NextResponse.json({ error: 'Invalid input format' }, { status: 400 });
        }

        const tatInputs: TatInput[] = inputsRaw.map((item: any) => ({
            image_id: String(item.image_id),
            theme: item.theme || 'General',
            difficulty: item.difficulty || 'medium',
            story_text: String(item.story_text || ''),
        }));

        // 1. Evaluate
        const evaluation = evaluateTat(tatInputs);

        // 2. Save to DB
        const result = await prisma.tatResult.create({
            data: {
                userId: session.userId,
                totalScore: evaluation.percentage, // Storing percentage out of 100 as totalScore for easier UI reading
                themeScores: evaluation.themeScores,
                riskLevel: evaluation.riskLevel,
            },
        });

        // 3. Respond
        return NextResponse.json({
            message: 'TAT Evaluated and saved natively.',
            resultId: result.id,
            evaluation
        });

    } catch (error: any) {
        console.error('[tat/submit]', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
