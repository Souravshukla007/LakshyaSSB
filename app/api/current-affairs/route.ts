import { NextResponse } from 'next/server';
import { getStoredNews } from '@/lib/storage';

// Force dynamic: always read fresh data from currentAffairs.json
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Read directly from our stored JSON file heavily optimized
        const finalData = await getStoredNews();
        
        // Add "Top 3 News" bonus logic if desired dynamically, but standard is fine
        // Using response cache headers for ultra fast CDN delivery
        return NextResponse.json({ success: true, data: finalData }, {
            headers: { 
                'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=86400' 
            }
        });
    } catch (error) {
        console.error('API Error reading stored news:', error);
        return NextResponse.json({ success: false, error: 'Failed to read stored news', data: [] }, { status: 500 });
    }
}
