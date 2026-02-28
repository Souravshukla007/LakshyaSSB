import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { evaluateWat, WatResponse } from '@/lib/watEvaluator';

export async function POST(request: Request) {
    try {
        const userId = request.headers.get('x-user-id');
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        if (!body.responses || !Array.isArray(body.responses)) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        const responses: WatResponse[] = body.responses;

        // Evaluate the responses 
        const evaluation = evaluateWat(responses);

        // Save to DB
        const savedResult = await prisma.watResult.create({
            data: {
                userId,
                totalScore: evaluation.percentage_score, // We store the percentage as the main totalScore
                themeScores: evaluation.theme_scores,
                riskLevel: evaluation.risk_level,
            }
        });

        return NextResponse.json({
            success: true,
            evaluation,
            resultId: savedResult.id
        });

    } catch (error) {
        console.error('Error processing WAT submission:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
