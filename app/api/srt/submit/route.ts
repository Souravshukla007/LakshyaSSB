import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { completePracticeForUser } from '@/lib/streak';
import { awardMedals } from '@/lib/medals';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { freeEvalLimitReached, recordEvalCompletion } from '@/lib/practice-limit';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session?.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Enforce FREE-tier single-attempt limit server-side
        if (await freeEvalLimitReached(session.userId, session.plan, 'SRT')) {
            return NextResponse.json(
                { error: 'Free limit reached. Upgrade to Pro for unlimited attempts.', reason: 'free_limit_reached' },
                { status: 403 },
            );
        }

        const body = await req.json();
        const inputs = body.inputs;

        if (!inputs || !Array.isArray(inputs)) {
            return NextResponse.json({ error: 'Invalid input format' }, { status: 400 });
        }

        // 1. AI Evaluation
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `Evaluate these Situation Reaction Test (SRT) responses for an SSB candidate.
        
        RESPONSES:
        ${inputs.map((input, i) => `Srt ${i+1}: ${input.user_response}`).join('\n')}
        
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

        const result = await model.generateContent(prompt);
        const evaluationResult = JSON.parse(result.response.text());

        // 2. Save to Database
        const srtResult = await prisma.srtResult.create({
            data: {
                userId: session.userId,
                totalScore: evaluationResult.totalScore,
                themeScores: evaluationResult.themeScores,
                riskLevel: evaluationResult.riskLevel,
            }
        });

        // 3. Award Medals & Streak
        const medalResult = await awardMedals(session.userId, 'practice');
        const streak = await completePracticeForUser(session.userId, 'SRT');
        await recordEvalCompletion(session.userId, session.plan, 'SRT');

        return NextResponse.json({ 
            success: true, 
            result: srtResult, 
            evaluation: evaluationResult, 
            streak,
            medals: medalResult
        });

    } catch (error) {
        console.error('SRT Evaluation Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
