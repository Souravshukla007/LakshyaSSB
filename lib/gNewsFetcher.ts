/**
 * lib/gNewsFetcher.ts
 * Fetches defence/India-relevant news from the GNews API.
 * No AI involved — pure HTTP fetch + keyword filter.
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
    'economy', 'inflation', 'gdp', 'rupee',
];

// Search query covering SSB-relevant topics
const GNEWS_QUERY = 'india defence army navy missile border security geopolitics';

/**
 * Fetch news from GNews and filter to only SSB-relevant articles.
 * Returns up to 15 articles sorted by recency.
 */
export async function fetchGNews(): Promise<RawArticle[]> {
    const apiKey = process.env.GNEWS_API_KEY;

    if (!apiKey) {
        console.error('[gNewsFetcher] GNEWS_API_KEY is not set');
        return [];
    }

    const params = new URLSearchParams({
        q: GNEWS_QUERY,
        lang: 'en',
        country: 'in',
        max: '15',
        sortby: 'publishedAt',
        apikey: apiKey,
    });

    const url = `https://gnews.io/api/v4/search?${params.toString()}`;

    try {
        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            // Next.js: do not cache this fetch — always fresh
            cache: 'no-store',
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[gNewsFetcher] API error ${response.status}:`, errorText);
            return [];
        }

        const data = await response.json();
        const articles: any[] = data.articles || [];

        console.log(`[gNewsFetcher] Received ${articles.length} articles from GNews`);

        // Filter to only keep SSB-relevant articles
        const relevant = articles.filter((article) => {
            const text = `${article.title || ''} ${article.description || ''}`.toLowerCase();
            return RELEVANCE_KEYWORDS.some((kw) => text.includes(kw.toLowerCase()));
        });

        console.log(`[gNewsFetcher] ${relevant.length} articles passed keyword filter`);

        // Map to our RawArticle interface
        return relevant.map((article) => ({
            title: article.title || 'Untitled',
            description: article.description || article.content || '',
            url: article.url || '',
            publishedAt: article.publishedAt || new Date().toISOString(),
        }));

    } catch (error) {
        console.error('[gNewsFetcher] Fetch failed:', error);
        return [];
    }
}
