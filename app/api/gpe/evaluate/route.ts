import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSession } from '@/lib/auth';
import { awardMedals } from '@/lib/medals';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { situation, identifiedProblems, actionPlan, timeManagement } = await req.json();

        if (!situation || !actionPlan) {
            return NextResponse.json({ error: 'Missing situation or action plan' }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `Evaluate the following Group Planning Exercise (GPE) solution for an SSB candidate.
        
        SITUATION:
        ${situation}
        
        CANDIDATE'S IDENTIFIED PROBLEMS:
        ${identifiedProblems}
        
        CANDIDATE'S ACTION PLAN:
        ${actionPlan}
        
        CANDIDATE'S TIME/RESOURCE MANAGEMENT:
        ${timeManagement}
        
        Provide a detailed evaluation in JSON format with the following fields:
        - score: Overall score from 1-100.
        - reasoningScore: Score from 1-10 for Reasoning Ability.
        - organizingScore: Score from 1-10 for Organizing Ability.
        - initiativeScore: Score from 1-10 for Initiative.
        - socialScore: Score from 1-10 for Social Adaptability.
        - feedback: An object containing:
            - strengths: What they did well.
            - weaknesses: Areas of improvement.
            - missedProblems: List of any problems from the situation the candidate missed.
            - resourceUsage: Critique of how they used available resources.
        
        Be critical and constructive as an SSB GTO. Focus on logical sequencing and urgency prioritization.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const evaluation = JSON.parse(responseText);

        // Award Medals
        const medalResult = await awardMedals(session.userId, 'practice');

        return NextResponse.json({ ...evaluation, medals: medalResult });

    } catch (error: any) {
        console.error('[gpe/evaluate] Error:', error);
        return NextResponse.json({ error: 'Failed to evaluate GPE solution' }, { status: 500 });
    }
}
