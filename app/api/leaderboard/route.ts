import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

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

export async function GET(request: Request) {
    try {
        const session = await getSession();
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

        // Fetch top 50 users (we limit visually for free users on the frontend)
        const users = await prisma.user.findMany({
            select: {
                id: true,
                fullName: true,
                targetEntry: true,
                medals_total: true,
                medals_weekly: true,
                current_streak: true,
                longest_streak: true,
            },
            orderBy,
            take: 50,
        });

        const currentUserId = session?.userId;

        const leaderboardData = users.map((u, index) => {
            // Append entry to username if available
            const entrySuffix = u.targetEntry ? `_${u.targetEntry}` : '';
            const username = `${u.fullName.split(' ')[0]}${entrySuffix}`;

            return {
                rank: index + 1,
                username,
                medals: u.medals_total,
                weeklyMedals: u.medals_weekly,
                currentStreak: u.current_streak,
                longestStreak: u.longest_streak,
                weeklyStreak: u.current_streak, // Simplified for now, tracking separate weekly streak requires more schema setup
                badge: getBadge(tab === 'weekly' ? u.medals_weekly : u.medals_total),
                isCurrentUser: !!(currentUserId && u.id === currentUserId)
            };
        });

        return NextResponse.json(leaderboardData);

    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
