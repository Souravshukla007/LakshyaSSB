import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getStoredNews } from '@/lib/storage';

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
        console.log("Generating fresh Daily Current Affairs Quiz...");
        
        // 1. Fetch the latest 10 stored news items
        const allNews = await getStoredNews();
        if (!allNews || allNews.length === 0) {
            return NextResponse.json({ success: false, error: "No current affairs data available to generate quiz." }, { status: 404 });
        }

        const newsToProcess = allNews.slice(0, 15);
        const newsText = JSON.stringify(newsToProcess.map(n => ({ title: n.title, summary: n.summary })));

        // 2. Generate MCQs using Gemini (v1beta is default in SDK >=0.21)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = PROMPT_TEMPLATE.replace("{NEWS_DATA}", newsText);

        const result = await model.generateContent(prompt);
        let responseText = result.response.text().trim();
        
        // Cleanup potential markdown wrappers
        responseText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();

        const quizData = JSON.parse(responseText);

        if (!Array.isArray(quizData) || quizData.length === 0) {
            throw new Error("Invalid format returned by AI");
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
