/**
 * lib/gNewsFetcher.ts
 * Fetches defence/India-relevant news from the GNews API.
 * No AI involved — pure HTTP fetch + keyword filter.
 *
 * NOTE: GNews free plan has a 12-hour news delay.
 * - Removed `country=in` (restricts to Indian sources only → 0 results on free)
 * - Removed `sortby=publishedAt` (not supported on free plan)
 * - Split into multiple focused queries to maximise article variety
 */

export interface RawArticle {
    title: string;
    description: string;
    url: string;
    publishedAt: string;
}

// Keywords used for relevance filtering
const RELEVANCE_KEYWORDS = [
    'defence', 'defense', 'army', 'navy', 'air force',
    'india', 'china', 'border', 'war', 'military',
    'missile', 'security', 'geopolitics', 'drdo', 'isro',
    'nuclear', 'strategic', 'armed forces', 'pakistan',
    'terrorism', 'ceasefire', 'sanctions', 'treaty',
    'parliament', 'government', 'modi', 'budget',
    'economy', 'inflation', 'gdp', 'rupee', 'indian',
    'agni', 'brahmos', 'iaf', 'surgical', 'bsf', 'crpf',
];

// Two focused queries — free plan allows multiple calls per day
const GNEWS_QUERIES = [
    'India defence military army security',
    'India geopolitics DRDO ISRO missile',
];

/**
 * Fetch from a single GNews query. Returns raw articles array.
 */
async function fetchSingleQuery(apiKey: string, query: string): Promise<any[]> {
    const params = new URLSearchParams({
        q: query,
        lang: 'en',
        max: '10',       // max 10 per request on free plan
        apikey: apiKey,
        // NOTE: no `country` and no `sortby` — not supported on free plan
    });

    const url = `https://gnews.io/api/v4/search?${params.toString()}`;

    try {
        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            cache: 'no-store',
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[gNewsFetcher] API error ${response.status} for query "${query}":`, errorText);
            return [];
        }

        const data = await response.json();
        const articles: any[] = data.articles || [];
        console.log(`[gNewsFetcher] Query "${query}" → ${articles.length} articles`);
        return articles;

    } catch (error) {
        console.error(`[gNewsFetcher] Fetch failed for query "${query}":`, error);
        return [];
    }
}

/**
 * Fetch news from GNews (multiple queries) and filter to SSB-relevant articles.
 * Returns up to 15 unique articles sorted by recency.
 */
export async function fetchGNews(): Promise<RawArticle[]> {
    const apiKey = process.env.GNEWS_API_KEY;

    if (!apiKey) {
        console.error('[gNewsFetcher] GNEWS_API_KEY is not set');
        return [];
    }

    // Fetch from all queries in parallel
    const results = await Promise.all(
        GNEWS_QUERIES.map((q) => fetchSingleQuery(apiKey, q))
    );

    // Merge + deduplicate by URL
    const seen = new Set<string>();
    const allArticles: any[] = [];
    for (const batch of results) {
        for (const article of batch) {
            if (article.url && !seen.has(article.url)) {
                seen.add(article.url);
                allArticles.push(article);
            }
        }
    }

    console.log(`[gNewsFetcher] Total unique articles after merge: ${allArticles.length}`);

    // Filter to only keep SSB-relevant articles
    const relevant = allArticles.filter((article) => {
        const text = `${article.title || ''} ${article.description || ''}`.toLowerCase();
        return RELEVANCE_KEYWORDS.some((kw) => text.includes(kw.toLowerCase()));
    });

    console.log(`[gNewsFetcher] ${relevant.length} articles passed keyword filter`);

    // Sort by date descending (most recent first)
    relevant.sort((a, b) => {
        const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return dateB - dateA;
    });

    // Map to RawArticle interface, limit to 15
    return relevant.slice(0, 15).map((article) => ({
        title: article.title || 'Untitled',
        description: article.description || article.content || '',
        url: article.url || '',
        publishedAt: article.publishedAt || new Date().toISOString(),
    }));
}
