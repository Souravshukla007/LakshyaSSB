import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { awardMedals } from '@/lib/medals';

/**
 * POST /api/user/daily-login
 *
 * Fired automatically by components/Navbar.tsx on every page load for a signed-in
 * user, so it must stay cheap and idempotent.
 *
 * This used to reimplement the daily-login award inline, and got two things wrong:
 *
 *  1. The day boundary was server-local:
 *         new Date(now.getFullYear(), now.getMonth(), now.getDate())
 *     On Vercel that is UTC midnight = 05:30 IST, so the bonus rolled over
 *     mid-morning for Indian users while medals and chat quota (which both go
 *     through lib/ist.ts) rolled over at 00:00 IST. lib/ist.ts exists specifically
 *     because this boundary had already been implemented three times with one of
 *     them wrong — this route was the fourth.
 *
 *  2. It incremented medals_total / medals_weekly and stamped last_login directly
 *     but never touched current_streak or longest_streak. Because it set
 *     last_login = now, the streak-aware path in lib/medals.ts then saw
 *     "already logged in today" and no-opped, so login streaks effectively never
 *     advanced past 1.
 *
 * Both are fixed by delegating to the single implementation. awardMedals('login')
 * is IST-correct, idempotent per IST day, and owns medals + streaks together.
 */
export async function POST() {
    try {
        const session = await getSession();
        if (!session?.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // getSession() already verified the user exists and the token is current,
        // but awardMedals uses findUniqueOrThrow, so translate a missing row into a
        // 404 rather than letting it surface as a 500.
        const exists = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { id: true },
        });
        if (!exists) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const result = await awardMedals(session.userId, 'login');

        return NextResponse.json({
            message: result.alreadyAwarded
                ? 'Already logged in today'
                : 'Daily login bonus awarded!',
            // Field kept for the existing caller in components/Navbar.tsx.
            awarded: !result.alreadyAwarded,
            medals_total: result.medals_total,
            medals_weekly: result.medals_weekly,
            current_streak: result.current_streak,
            longest_streak: result.longest_streak,
        });
    } catch (error) {
        console.error('Error tracking daily login:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
