import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/account/activity
 * Returns recent activity logs for the current user.
 */
export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const logs = await prisma.activityLog.findMany({
            where: { userId: session.userId },
            orderBy: { createdAt: 'desc' },
            take: 20,
            select: {
                id: true,
                action: true,
                details: true,
                createdAt: true,
            },
        });

        return NextResponse.json(logs);
    } catch (error) {
        console.error('[activity]', error);
        return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
    }
}
