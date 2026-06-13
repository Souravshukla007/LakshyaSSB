import { NextResponse } from 'next/server';
import { fetchGNews } from '@/lib/gnews-fetcher';
import { enhanceForSSB, getCategory } from '@/lib/ssb-enhancer';
import { storeNewArticles, CurrentAffairItem } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET /api/cron/update-news
 * Fetches news from GNews API, enhances with pure logic (no AI),
 * and stores to DB. Run every 6 hours via Vercel Cron.
 */
export async function GET(request: Request) {
    // Security: require CRON_SECRET to be configured AND matched (fail closed)
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
        return new NextResponse('CRON_SECRET not configured', { status: 503 });
    }
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        console.log('[update-news] Starting Current Affairs Cron Job...');

        // ── Step 1: Fetch from GNews API ──────────────────────────────────────
        const rawArticles = await fetchGNews();
        console.log(`[update-news] Fetched ${rawArticles.length} relevant articles from GNews`);

        if (rawArticles.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No relevant articles returned by GNews.',
                count: 0,
            });
        }

        // ── Step 2: Enhance with pure SSB logic (no AI) ───────────────────────
        const processedItems: CurrentAffairItem[] = rawArticles.map((article, idx) => {
            const category = getCategory(article.title);
            const enhancement = enhanceForSSB(article.title, article.description);

            return {
                id: `gnews-${Date.now()}-${idx}`,
                title: article.title,
                category,
                date: article.publishedAt
                    ? new Date(article.publishedAt).toISOString().split('T')[0]
                    : new Date().toISOString().split('T')[0],
                url: article.url,
                summary: enhancement.summary,
                ssb_importance: enhancement.ssb_importance,
                gd_topic: enhancement.gd_topic,
                lecturette: enhancement.lecturette,
                interview_question: enhancement.interview_question,
            };
        });

        console.log(`[update-news] Enhanced ${processedItems.length} articles`);

        // ── Step 3: Store to DB (skipDuplicates by title) ─────────────────────
        await storeNewArticles(processedItems);

        return NextResponse.json({
            success: true,
            message: 'Pipeline completed successfully.',
            processedCount: processedItems.length,
            categories: processedItems.reduce<Record<string, number>>((acc, item) => {
                acc[item.category] = (acc[item.category] || 0) + 1;
                return acc;
            }, {}),
        });

    } catch (error) {
        console.error('[update-news] Cron job failed:', error);
        return NextResponse.json(
            { success: false, error: 'Pipeline failed. Check server logs.' },
            { status: 500 }
        );
    }
}
