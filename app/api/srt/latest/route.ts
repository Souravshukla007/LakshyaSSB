import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const session = await getSession();
        if (!session?.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const latestResult = await prisma.srtResult.findFirst({
            where: { userId: session.userId },
            orderBy: { createdAt: 'desc' },
        });

        if (!latestResult) {
            return NextResponse.json({ result: null });
        }

        return NextResponse.json({ result: latestResult });

    } catch (error) {
        console.error('Error fetching latest SRT result:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
