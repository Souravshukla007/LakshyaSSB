import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { evaluateSrt, SrtInput } from '@/lib/evaluators/srtEvaluator';

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session?.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const inputs: SrtInput[] = body.inputs;

        if (!inputs || !Array.isArray(inputs)) {
            return NextResponse.json({ error: 'Invalid input format' }, { status: 400 });
        }

        // Run Evaluator
        const evaluationResult = evaluateSrt(inputs);

        // Save to Database
        const srtResult = await prisma.srtResult.create({
            data: {
                userId: session.userId,
                totalScore: evaluationResult.totalScore,
                themeScores: evaluationResult.themeScores,
                riskLevel: evaluationResult.riskLevel,
            }
        });

        return NextResponse.json({ success: true, result: srtResult, evaluation: evaluationResult });

    } catch (error) {
        console.error('SRT Evaluation Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
