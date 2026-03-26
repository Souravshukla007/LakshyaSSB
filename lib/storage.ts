import fs from 'fs/promises';
import path from 'path';
import { prisma } from './prisma';

const STORAGE_FILE = path.join(process.cwd(), 'data', 'currentAffairs.json');

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
        // Query the database for the latest 50 articles
        const dbArticles = await prisma.currentAffair.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        // Map DB models to interface
        if (dbArticles.length > 0) {
            return dbArticles.map(a => ({
                id: a.id,
                title: a.title,
                category: a.category,
                date: a.date,
                summary: a.summary,
                ssb_importance: a.ssb_importance,
                gd_topic: a.gd_topic,
                lecturette: a.lecturette,
                interview_question: a.interview_question
            }));
        }

        // Fallback: If DB is empty, read the dummy seed data
        const fileContent = await fs.readFile(STORAGE_FILE, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.error('Error in getStoredNews:', error);
        return [];
    }
}

export async function storeNewArticles(newArticles: CurrentAffairItem[]) {
    try {
        if (!newArticles || newArticles.length === 0) return;

        // Map interface to DB models (omit id to let DB generate uuid)
        const dbReadyArticles = newArticles.map(a => ({
            title: a.title,
            category: a.category,
            date: a.date,
            summary: a.summary,
            ssb_importance: a.ssb_importance,
            gd_topic: a.gd_topic,
            lecturette: a.lecturette,
            interview_question: a.interview_question
        }));

        // Insert using createMany with skipDuplicates: true (using @unique on title)
        const result = await prisma.currentAffair.createMany({
            data: dbReadyArticles,
            skipDuplicates: true
        });

        console.log(`Successfully stored ${result.count} NEW unique articles to the database.`);
    } catch (error) {
        console.error('Failed to store news articles to DB:', error);
    }
}
