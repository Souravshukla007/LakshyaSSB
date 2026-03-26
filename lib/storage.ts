import fs from 'fs/promises';
import path from 'path';

const STORAGE_FILE = path.join(process.cwd(), 'data', 'currentAffairs.json');
const MAX_STORED_ITEMS = 100; // Keep file size manageable

export interface CurrentAffairItem {
    id: string;
    title: string;
    category: string;
    date: string;
    summary: string;
    ssb_importance: string;
    gd_topic: string;
    lecturette: string;
    interview_question: string;
}

export async function getStoredNews(): Promise<CurrentAffairItem[]> {
    try {
        const fileContent = await fs.readFile(STORAGE_FILE, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        return [];
    }
}

export async function storeNewArticles(newArticles: CurrentAffairItem[]) {
    try {
        const existingArticles = await getStoredNews();
        
        // 1. Deduplication: Filter out articles whose title already exists
        const existingTitles = new Set(existingArticles.map(a => a.title.toLowerCase()));
        
        const uniqueNewArticles = newArticles.filter(a => {
            return !existingTitles.has(a.title.toLowerCase());
        });

        if (uniqueNewArticles.length === 0) {
            console.log("No new unique articles to store.");
            return;
        }

        // 2. Prepend new articles and slice to MAX_STORED_ITEMS
        const mergedArticles = [...uniqueNewArticles, ...existingArticles].slice(0, MAX_STORED_ITEMS);
        
        // 3. Atomically-safe write (write to temp file then rename is best, but standard writeFile is okay for low concurrency)
        await fs.writeFile(STORAGE_FILE, JSON.stringify(mergedArticles, null, 2), 'utf-8');
        
        console.log(`Successfully stored ${uniqueNewArticles.length} new articles.`);
    } catch (error) {
        console.error('Failed to store news articles:', error);
    }
}
