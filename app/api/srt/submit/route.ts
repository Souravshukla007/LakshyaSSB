import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { evaluateSrt, SrtInput } from '@/lib/evaluators/srtEvaluator';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
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
                userId: session.user.id,
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
