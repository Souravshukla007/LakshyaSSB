import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const userId = request.headers.get('x-user-id');
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const latestResult = await prisma.watResult.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        if (!latestResult) {
            return NextResponse.json(null);
        }

        return NextResponse.json(latestResult);
    } catch (error) {
        console.error('Error fetching latest WAT:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
