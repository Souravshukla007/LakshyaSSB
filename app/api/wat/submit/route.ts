import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { completePracticeForUser } from '@/lib/streak';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { awardMedals } from '@/lib/medals';
import { freeEvalLimitReached, recordEvalCompletion } from '@/lib/practice-limit';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session?.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = session.userId;

        // Enforce FREE-tier single-attempt limit server-side
        if (await freeEvalLimitReached(userId, session.plan, 'WAT')) {
            return NextResponse.json(
                { error: 'Free limit reached. Upgrade to Pro for unlimited attempts.', reason: 'free_limit_reached' },
                { status: 403 },
            );
        }

        const body = await request.json();
        const responses = body.responses;

        if (!responses || !Array.isArray(responses)) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        // 1. AI Evaluation
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `Evaluate these Word Association Test (WAT) sentences for an SSB candidate.
        
        SENTENCES:
        ${responses.map((r, i) => `Word "${r.word}": ${r.user_sentence}`).join('\n')}
        
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

        const result = await model.generateContent(prompt);
        const evaluation = JSON.parse(result.response.text());

        // 2. Save to DB
        const savedResult = await prisma.watResult.create({
            data: {
                userId,
                totalScore: evaluation.percentage_score,
                themeScores: evaluation.theme_scores,
                riskLevel: evaluation.risk_level,
            }
        });

        // 3. Mark completion for streak & Award Medals
        const medalResult = await awardMedals(userId, 'practice');
        const streak = await completePracticeForUser(userId, 'WAT');
        await recordEvalCompletion(userId, session.plan, 'WAT');

        return NextResponse.json({
            success: true,
            evaluation,
            resultId: savedResult.id,
            streak,
            medals: medalResult
        });

    } catch (error) {
        console.error('Error processing WAT submission:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
