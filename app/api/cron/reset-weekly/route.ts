import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/cron/reset-weekly
 *
 * Resets medals_weekly = 0 for every user.
 * Secured with CRON_SECRET — never exposed to browser sessions.
 *
 * Schedule this via Vercel Cron or any external scheduler at:
 *   Sunday 23:59 IST  →  Sunday 18:29 UTC
 */
export async function POST(request: NextRequest) {
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
        // Safety: if secret is not configured, refuse all requests
        return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 });
    }

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '').trim();

    if (!token || token !== cronSecret) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only run on Sundays (UTC) — optional guard for misconfigured schedulers
    const now = new Date();
    const dayUTC = now.getUTCDay(); // 0 = Sunday
    if (dayUTC !== 0) {
        return NextResponse.json(
            { skipped: true, reason: 'Not Sunday (UTC)', day: dayUTC },
            { status: 200 },
        );
    }

    const result = await prisma.user.updateMany({
        data: { medals_weekly: 0 },
    });

    console.log(`[cron/reset-weekly] Reset medals_weekly for ${result.count} users`);

    return NextResponse.json({
        success: true,
        reset: result.count,
        timestamp: now.toISOString(),
    });
}
