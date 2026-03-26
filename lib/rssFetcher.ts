import Parser from 'rss-parser';

const parser = new Parser({
    customFields: {
        item: ['description', 'pubDate', 'category'],
    }
});

const RSS_FEEDS = [
    // Defence-focused & National feeds
    'https://www.defense.gov/DesktopModules/ArticleCS/RSS.ashx?max=10&Types=1&Site=945',
    'https://www.thehindu.com/news/national/feeder/default.rss',
    'http://feeds.bbci.co.uk/news/world/asia/india/rss.xml'
];

const KEYWORDS = [
    "defence", "army", "navy", "air force",
    "india", "china", "border", "war", "military",
    "missile", "geopolitics", "security", "drdo", "isro"
];

export interface RawArticle {
    title: string;
    link: string;
    content: string;
    pubDate: string;
}

export async function fetchRelevantNews(): Promise<RawArticle[]> {
    const allArticles: RawArticle[] = [];

    for (const url of RSS_FEEDS) {
        try {
            const feed = await parser.parseURL(url);
            
            for (const item of feed.items) {
                const title = item.title || "";
                const content = item.contentSnippet || item.description || "";
                
                // Keyword filtering
                const textToCheck = (title + " " + content).toLowerCase();
                const isRelevant = KEYWORDS.some(kw => textToCheck.includes(kw.toLowerCase()));
                
                if (isRelevant) {
                    allArticles.push({
                        title: item.title || "Breaking News",
                        link: item.link || "",
                        content,
                        pubDate: item.pubDate || new Date().toISOString()
                    });
                }
            }
        } catch (error) {
            console.error(`Failed to fetch RSS feed: ${url}`, error);
        }
    }

    // Sort by pubDate (newest first)
    allArticles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    // Return latest 20 relevant items to prevent overwhelming Gemini
    return allArticles.slice(0, 20);
}
