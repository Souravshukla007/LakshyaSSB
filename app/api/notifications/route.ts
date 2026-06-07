import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const notifications = await prisma.userNotification.findMany({
            where: { userId: session.userId },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        return NextResponse.json({ success: true, data: notifications });
    } catch (error) {
        console.error('[notifications] GET Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { notificationIds } = await req.json();

        if (Array.isArray(notificationIds)) {
            await prisma.userNotification.updateMany({
                where: {
                    id: { in: notificationIds },
                    userId: session.userId
                },
                data: { isRead: true }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[notifications] POST Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
