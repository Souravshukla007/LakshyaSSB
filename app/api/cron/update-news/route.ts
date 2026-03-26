import { NextResponse } from 'next/server';
import { fetchRelevantNews } from '@/lib/rssFetcher';
import { processNewsWithAI, SSBParsedNews } from '@/lib/aiProcessor';
import { storeNewArticles, CurrentAffairItem } from '@/lib/storage';

export const maxDuration = 60; // Allow Vercel Function up to 60 seconds

export async function GET(request: Request) {
    // Basic security: only allow requests with correct secret if deployed
    const authHeader = request.headers.get('authorization');
    if (
        process.env.CRON_SECRET && 
        authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        console.log("Starting Current Affairs Cron Job...");
        
        // 1. Fetch relevant news
        const rawArticles = await fetchRelevantNews();
        console.log(`Fetched ${rawArticles.length} relevant articles.`);

        if (rawArticles.length === 0) {
            return NextResponse.json({ success: true, message: "No relevant news found.", count: 0 });
        }

        // 2. Process with AI (Batching using Promise.all)
        // Taking top 10 articles to process to keep under time/rate limits
        const targetArticles = rawArticles.slice(0, 10);
        
        const processedPromises = targetArticles.map(async (article, idx) => {
            const parsedData = await processNewsWithAI(article.title, article.content);
            if (!parsedData) return null;

            // Dynamically detect category
            const textToAnalyze = (article.title + ' ' + article.content).toLowerCase();
            let predictedCategory = 'India'; // Default
            if (/missile|navy|army|air force|drdo|defence|military|weapon|soldier|iaf|isro battle/.test(textToAnalyze)) predictedCategory = 'Defence';
            else if (/isro|space|satellite|science|research|technology|ai |quantum|innovation/.test(textToAnalyze)) predictedCategory = 'Science';
            else if (/economy|gdp|inflation|rupee|rbi|budget|trade|finance|market|export/.test(textToAnalyze)) predictedCategory = 'Economy';
            else if (/china|pakistan|russia|us |nato|international|global|foreign|trump|ukraine/.test(textToAnalyze)) predictedCategory = 'International';

            const finalItem: CurrentAffairItem = {
                id: `news-${Date.now()}-${idx}`,
                title: article.title,
                category: predictedCategory,
                date: new Date().toISOString().split('T')[0],
                summary: parsedData.summary,
                ssb_importance: parsedData.ssb_importance,
                gd_topic: parsedData.gd_topic,
                lecturette: parsedData.lecturette,
                interview_question: parsedData.interview_question
            };
            return finalItem;
        });

        const results = await Promise.all(processedPromises);
        
        // Filter out nulls (failed AI processings)
        const validNewItems = results.filter((item): item is CurrentAffairItem => item !== null);
        console.log(`Successfully processed ${validNewItems.length} articles via AI.`);

        // 3. Store in JSON avoiding duplicates
        if (validNewItems.length > 0) {
            await storeNewArticles(validNewItems);
        }

        return NextResponse.json({ 
            success: true, 
            message: "Pipeline completed.", 
            processedCount: validNewItems.length 
        });

    } catch (error) {
        console.error("Cron Job Execution Failed:", error);
        return NextResponse.json({ success: false, error: "Pipeline failed" }, { status: 500 });
    }
}
