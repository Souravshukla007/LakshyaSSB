import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getWeeklyLeaderboard } from '@/lib/leaderboard';

export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { is_pro: true },
    });

    const callerIsPro = dbUser?.is_pro ?? false;
    const data = await getWeeklyLeaderboard(session.userId, callerIsPro);

    const userEntry = data.find((e) => e.isCurrentUser);

    return NextResponse.json({
        data,
        userRank: userEntry?.rank ?? null,
        total: data.length,
        restricted: !callerIsPro,
    });
}
