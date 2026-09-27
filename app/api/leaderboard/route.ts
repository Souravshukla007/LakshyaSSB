import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/entitlement';

/** Free users see the top 10; PRO sees the full board. Enforced here, not in the UI. */
const FREE_VISIBLE_ROWS = 10;

// Helper to determine badge
function getBadge(medals: number): string {
    if (medals >= 200) return '🎯 Elite Cadet';
    if (medals >= 150) return '⚔️ War Veteran';
    if (medals >= 100) return '🛡️ Shield Bearer';
    if (medals >= 75) return '🌟 Rising Star';
    if (medals >= 50) return '🔥 Streak Master';
    if (medals >= 25) return '💪 Dedicated';
    if (medals >= 10) return '📚 Scholar';
    if (medals >= 5) return '🎖️ Achiever';
    return '🎯 Aspirant';
}

/**
 * Show a first name plus an initial rather than everyone's full legal name.
 * This endpoint was completely unauthenticated and returned `fullName` for the
 * top 50 users along with their profile photos — a straightforward PII leak.
 */
function toDisplayName(fullName: string): string {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'Cadet';
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

export async function GET(request: Request) {
    try {
        // Requires a signed-in user: a leaderboard of real people is not public data.
        const gate = await requireUser();
        if (gate.response) return gate.response;
        const { userId: currentUserId, isPro } = gate.entitlement;

        const { searchParams } = new URL(request.url);
        const tab = searchParams.get('tab') || 'overall';

        let orderBy: any = { medals_total: 'desc' };

        if (tab === 'weekly') {
            orderBy = { medals_weekly: 'desc' };
        } else if (tab === 'streak') {
            orderBy = { current_streak: 'desc' };
        }

        // Ensure we always have a secondary sort for consistent ranking
        orderBy = [orderBy, { id: 'asc' }];

        // `profileImageUrl` is still not selected in this query, on purpose.
        //
        // It is a @db.Text column that historically held base64 data-URL images, so
        // selecting it for 50 rows pulled megabytes out of Postgres on every request
        // and this endpoint took 15–22s. Avatars now live in object storage and the
        // column holds a short URL (see lib/avatar-storage.ts), but any row that has
        // not been migrated yet could still contain a multi-megabyte string.
        const users = await prisma.user.findMany({
            select: {
                id: true,
                fullName: true,
                medals_total: true,
                medals_weekly: true,
                current_streak: true,
            },
            orderBy,
            take: 50,
        });

        /**
         * Avatars are fetched in a second pass that discards oversized values *in
         * SQL*, so an un-migrated base64 row is never transferred or serialised.
         *
         * This is what makes showing everyone's avatar safe again regardless of
         * migration state: a migrated row returns its short URL, a legacy row
         * returns NULL and falls back to initials, and the endpoint stays fast
         * either way. It also self-heals as rows are migrated.
         */
        const avatarRows = users.length
            ? await prisma.$queryRaw<Array<{ id: string; avatar: string | null }>>`
                SELECT "id",
                       CASE WHEN "profileImageUrl" LIKE 'data:%' THEN NULL
                            ELSE "profileImageUrl"
                       END AS "avatar"
                FROM "User"
                WHERE "id" IN (${Prisma.join(users.map((u) => u.id))})
              `
            : [];

        const avatarById = new Map(avatarRows.map((r) => [r.id, r.avatar]));

        const allRows = users.map((u, index) => ({
            rank: index + 1,
            username: toDisplayName(u.fullName),
            medals: u.medals_total,
            weeklyMedals: u.medals_weekly,
            currentStreak: u.current_streak,
            longestStreak: u.current_streak, // Using current_streak as longest for now
            weeklyStreak: u.current_streak, // Simplified; a separate weekly streak needs more schema
            badge: getBadge(tab === 'weekly' ? u.medals_weekly : u.medals_total),
            /**
             * Everyone's avatar is exposed again, which is a deliberate reversal.
             *
             * It was restricted to the caller's own photo when the response also
             * carried every user's full legal name — photo + real name for the top 50
             * was a genuine privacy problem. Names are now reduced to a first name
             * and an initial by `toDisplayName()` above, so an avatar beside
             * "Rohan R." is standard leaderboard presentation rather than a leak.
             *
             * The cost objection is handled by the SQL projection above, not by
             * withholding the field.
             */
            avatar: avatarById.get(u.id) ?? null,
            isCurrentUser: u.id === currentUserId,
        }));

        // Truncate server-side. The page also slices for display, but a client-side
        // slice is not a paywall — the full board used to be in the response.
        const visible = isPro ? allRows : allRows.slice(0, FREE_VISIBLE_ROWS);

        // Always include the caller's own row so a free user outside the top 10 can
        // still see where they stand.
        const ownRow = allRows.find((r) => r.isCurrentUser);
        const includesOwn = visible.some((r) => r.isCurrentUser);

        return NextResponse.json({
            rows: visible,
            currentUserRow: !includesOwn && ownRow ? ownRow : null,
            restricted: !isPro,
            totalRanked: allRows.length,
            visibleCount: visible.length,
        });

    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
