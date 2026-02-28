import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const latestResult = await prisma.srtResult.findFirst({
            where: { userId: session.user.id },
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
