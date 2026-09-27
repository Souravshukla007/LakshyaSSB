import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const session = await getSession();
        if (!session?.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Bounded: was unpaginated, so the payload grew without limit.
        const history = await prisma.srtResult.findMany({
            where: { userId: session.userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        return NextResponse.json({ history });

    } catch (error) {
        console.error('Error fetching SRT history:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
