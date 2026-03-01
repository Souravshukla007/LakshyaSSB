import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const history = await prisma.tatResult.findMany({
            where: { userId: session.userId },
            orderBy: { createdAt: 'desc' },
            take: 20, // Limit to last 20 tests
        });

        return NextResponse.json(history);

    } catch (error) {
        console.error('[tat/history]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
