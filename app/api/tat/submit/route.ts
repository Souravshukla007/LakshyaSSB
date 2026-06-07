import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { awardMedals } from '@/lib/medals';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const stories = body.stories;

        if (!Array.isArray(stories) || stories.length === 0) {
            return NextResponse.json({ error: 'Invalid input format' }, { status: 400 });
        }

        // 1. Prepare Prompt for Gemini
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `Analyze these ${stories.length} TAT (Thematic Apperception Test) stories for an SSB candidate.
        
        STORIES:
        ${stories.map((s, i) => `Image ${i+1}: ${s.story_text}`).join('\n\n')}
        
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

        const result = await model.generateContent(prompt);
        const evaluation = JSON.parse(result.response.text());

        // 2. Save to DB
        const savedResult = await prisma.tatResult.create({
            data: {
                userId: session.userId,
                totalScore: evaluation.percentage,
                themeScores: evaluation.themeScores,
                riskLevel: evaluation.riskLevel,
            },
        });

        // 3. Award Medals
        const medalResult = await awardMedals(session.userId, 'practice');

        // 4. Respond
        return NextResponse.json({
            message: 'TAT Evaluated by AI and saved.',
            resultId: savedResult.id,
            evaluation,
            medals: medalResult
        });

    } catch (error: any) {
        console.error('[tat/submit]', error);
        return NextResponse.json({ error: 'Failed to evaluate TAT' }, { status: 500 });
    }
}
