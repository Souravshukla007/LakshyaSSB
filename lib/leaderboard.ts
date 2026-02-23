/**
 * lib/leaderboard.ts
 * Query helpers for the three leaderboard views.
 *
 * FREE  users → top 10 rows + caller's own row appended if outside top 10
 * PRO   users → full list, caller's row gets isCurrentUser: true
 */

import { prisma } from '@/lib/prisma';

export interface LeaderboardEntry {
    rank: number;
    userId: string;
    name: string;
    medals: number;
    streak: number;
    is_pro: boolean;
    isCurrentUser: boolean;
}

type SortKey = 'medals_total' | 'medals_weekly' | 'current_streak';

// ─── shared helper ────────────────────────────────────────────────────────────

async function buildLeaderboard(
    sortKey: SortKey,
    callerId: string,
    callerIsPro: boolean,
): Promise<LeaderboardEntry[]> {
    const orderField =
        sortKey === 'medals_total'
            ? { medals_total: 'desc' as const }
            : sortKey === 'medals_weekly'
                ? { medals_weekly: 'desc' as const }
                : { current_streak: 'desc' as const };

    const medalField =
        sortKey === 'medals_total' ? 'medals_total' : sortKey === 'medals_weekly' ? 'medals_weekly' : 'medals_total';

    // PRO: full list; FREE: top 10 only (we fetch 11 to check if caller is inside)
    const take = callerIsPro ? undefined : 10;

    const rows = await prisma.user.findMany({
        orderBy: orderField,
        take,
        select: {
            id: true,
            fullName: true,
            medals_total: true,
            medals_weekly: true,
            current_streak: true,
            is_pro: true,
        },
    });

    const toEntry = (u: (typeof rows)[number], rank: number): LeaderboardEntry => ({
        rank,
        userId: u.id,
        name: u.fullName,
        medals: sortKey === 'medals_weekly' ? u.medals_weekly : u.medals_total,
        streak: u.current_streak,
        is_pro: u.is_pro,
        isCurrentUser: u.id === callerId,
    });

    const entries: LeaderboardEntry[] = rows.map((u, i) => toEntry(u, i + 1));

    // For FREE users: if caller is not in the top 10, append their row
    if (!callerIsPro) {
        const callerInTop = entries.some((e) => e.isCurrentUser);
        if (!callerInTop) {
            const caller = await prisma.user.findUnique({
                where: { id: callerId },
                select: {
                    id: true,
                    fullName: true,
                    medals_total: true,
                    medals_weekly: true,
                    current_streak: true,
                    is_pro: true,
                },
            });

            if (caller) {
                // Calculate actual rank via count
                const better = await prisma.user.count({
                    where: { [sortKey]: { gt: caller[sortKey] } },
                });
                entries.push(toEntry(caller, better + 1));
            }
        }
    }

    return entries;
}

// ─── public API ───────────────────────────────────────────────────────────────

export function getOverallLeaderboard(callerId: string, callerIsPro: boolean) {
    return buildLeaderboard('medals_total', callerId, callerIsPro);
}

export function getWeeklyLeaderboard(callerId: string, callerIsPro: boolean) {
    return buildLeaderboard('medals_weekly', callerId, callerIsPro);
}

export function getStreakLeaderboard(callerId: string, callerIsPro: boolean) {
    return buildLeaderboard('current_streak', callerId, callerIsPro);
}
