import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const userId = request.headers.get('x-user-id');
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const history = await prisma.watResult.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });

        return NextResponse.json(history);
    } catch (error) {
        console.error('Error fetching WAT history:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
