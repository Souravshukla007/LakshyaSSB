import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getStoredNews } from '@/lib/storage';
import { getSession } from '@/lib/auth';

// Never statically pre-render this route — Gemini must only be called at request time
export const dynamic = 'force-dynamic';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const PROMPT_TEMPLATE = `Generate 10 medium-difficulty multiple choice questions based on the following current affairs.
The questions must be highly relevant for SSB (Services Selection Board) aspirants, focusing on defence, geopolitics, national security, and key national events.

Return ONLY a valid JSON array matching this exact structure, with no markdown formatting or extra text:

[
  {
    "question": "The actual question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "The exact string of the correct option from the options array",
    "explanation": "A short 1-2 sentence explanation of why this is correct and its SSB relevance"
  }
]

Current Affairs Data:
{NEWS_DATA}`;

export async function GET() {
    try {
        // Require authentication — this route invokes a paid AI model per request.
        const session = await getSession();
        if (!session?.userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        console.log("Generating fresh Daily Current Affairs Quiz...");
        
        // 1. Fetch the latest 10 stored news items
        const allNews = await getStoredNews();
        if (!allNews || allNews.length === 0) {
            return NextResponse.json({ success: false, error: "No current affairs data available to generate quiz." }, { status: 404 });
        }

        const newsToProcess = allNews.slice(0, 15);
        const newsText = JSON.stringify(newsToProcess.map(n => ({ title: n.title, summary: n.summary })));

        // 2. Generate MCQs using Gemini with strict JSON enforcement and auto-retry
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash",
            generationConfig: { responseMimeType: "application/json" }
        });
        const prompt = PROMPT_TEMPLATE.replace("{NEWS_DATA}", newsText);

        let quizData: any[] = [];
        let retries = 0;
        
        while (retries < 2) {
            try {
                const result = await model.generateContent(prompt);
                const responseText = result.response.text().trim();
                quizData = JSON.parse(responseText);

                if (Array.isArray(quizData) && quizData.length > 0) {
                    break; // Success
                }
                throw new Error("Invalid format returned by AI: Not a valid Array");
            } catch (err) {
                retries++;
                console.warn(`Gemini Generation Attempt ${retries} failed. Retrying...`, err);
                if (retries >= 2) throw err; // Bubble up if it truly fails
                // Short pause before retrying
                await new Promise(res => setTimeout(res, 800));
            }
        }

        // Return the quiz. Cache with a short-lived header instead of ISR
        return NextResponse.json({
            success: true,
            date: new Date().toISOString().split('T')[0],
            questions: quizData
        }, {
            headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' }
        });

    } catch (error) {
        console.error("Quiz Generation Error:", error);
        return NextResponse.json({ success: false, error: "Failed to generate quiz." }, { status: 500 });
    }
}
