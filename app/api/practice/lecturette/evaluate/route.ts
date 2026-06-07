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

        const formData = await req.formData();
        const audioFile = formData.get('audio') as File;
        const topic = formData.get('topic') as string;
        const durationSeconds = parseInt(formData.get('duration') as string || '180');

        if (!audioFile || !topic) {
            return NextResponse.json({ error: 'Missing audio or topic' }, { status: 400 });
        }

        // Convert File to base64 for Gemini
        const arrayBuffer = await audioFile.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuffer).toString('base64');

        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `Analyze this audio recording of a candidate delivering an SSB Lecturette speech on the topic: "${topic}".
        
        Provide a detailed evaluation in JSON format with the following fields:
        - transcript: Full text transcript of the speech.
        - wpm: Approximate words per minute.
        - confidence: Score from 1-10.
        - clarity: Score from 1-10.
        - tone: A short descriptive phrase of their tone (e.g., "Confident and authoritative", "Steady but slightly monotonous", "Hesitant with frequent pauses").
        - contentScore: Score from 1-10 based on relevancy and depth.
        - fillerWords: List of filler words detected (um, ah, like, etc.).
        - fillerCount: Total count of filler words.
        - feedback: An object containing:
            - strengths: What they did well.
            - weaknesses: Areas of improvement.
            - tips: Concrete tips for better performance.
        
        Important: Be critical but constructive as an SSB GTO (Group Testing Officer) would be.`;

        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType: audioFile.type,
                    data: base64Audio
                }
            },
            { text: prompt }
        ]);

        const responseText = result.response.text();
        const evaluation = JSON.parse(responseText);

        // Award Medals
        const medalResult = await awardMedals(session.userId, 'practice');

        return NextResponse.json({ ...evaluation, medals: medalResult });

    } catch (error: any) {
        console.error('[lecturette/evaluate] Error:', error);
        return NextResponse.json({ error: 'Failed to evaluate speech' }, { status: 500 });
    }
}
