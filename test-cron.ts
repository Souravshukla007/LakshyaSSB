import 'dotenv/config';
import { fetchRelevantNews } from './lib/rssFetcher';
import { processNewsWithAI } from './lib/aiProcessor';
import { storeNewArticles } from './lib/storage';

async function main() {
    console.log("Starting Current Affairs offline data pump...");
    
    // 1. Fetch relevant news
    const rawArticles = await fetchRelevantNews();
    console.log(`Fetched ${rawArticles.length} relevant articles.`);

    if (rawArticles.length === 0) {
        console.log("No relevant news found.");
        return;
    }

    // 2. Process with AI (Sequential to avoid rate-limit 429s)
    const targetArticles = rawArticles.slice(0, 5); // Top 5 articles
    console.log(`Processing top ${targetArticles.length} articles with AI (sequentially)...`);
    
    const validNewItems: any[] = [];

    for (let idx = 0; idx < targetArticles.length; idx++) {
        const article = targetArticles[idx];
        try {
            console.log(`Processing article ${idx + 1}/${targetArticles.length}: ${article.title}`);
            const parsedData = await processNewsWithAI(article.title, article.content);
            if (!parsedData) {
                console.log(`Skipping article ${idx + 1} (AI returned null).`);
            } else {
                // Dynamically detect category
                const textToAnalyze = (article.title + ' ' + article.content).toLowerCase();
                let predictedCategory = 'India'; // Default
                if (/missile|navy|army|air force|drdo|defence|military|weapon|soldier|iaf|isro battle/.test(textToAnalyze)) predictedCategory = 'Defence';
                else if (/isro|space|satellite|science|research|technology|ai |quantum|innovation/.test(textToAnalyze)) predictedCategory = 'Science';
                else if (/economy|gdp|inflation|rupee|rbi|budget|trade|finance|market|export/.test(textToAnalyze)) predictedCategory = 'Economy';
                else if (/china|pakistan|russia|us |nato|international|global|foreign|trump|ukraine/.test(textToAnalyze)) predictedCategory = 'International';

                validNewItems.push({
                    id: `news-${Date.now()}-${idx}`,
                    title: article.title,
                    category: predictedCategory,
                    date: new Date().toISOString().split('T')[0],
                    summary: parsedData.summary,
                    ssb_importance: parsedData.ssb_importance,
                    gd_topic: parsedData.gd_topic,
                    lecturette: parsedData.lecturette,
                    interview_question: parsedData.interview_question
                });
            }
        } catch (e: any) {
            console.error(`Error with article "${article.title}":`, e.message);
        }

        // Wait 5s between articles to stay within free-tier rate limits
        if (idx < targetArticles.length - 1) {
            console.log('Waiting 5s before next article...');
            await new Promise(res => setTimeout(res, 5000));
        }
    }

    console.log(`Successfully processed ${validNewItems.length} articles via AI.`);

    // 3. Store in JSON/DB
    if (validNewItems.length > 0) {
        console.log("Storing new articles in database...");
        await storeNewArticles(validNewItems as any);
        console.log("Done storing articles.");
    }
}

main().then(() => {
    console.log("Finished pipeline.");
    process.exit(0);
}).catch((e) => {
    console.error("Pipeline failed:", e);
    process.exit(1);
});
