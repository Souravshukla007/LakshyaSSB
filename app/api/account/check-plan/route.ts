import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { plan: true, planExpiry: true },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            plan: user.plan,
            planExpiry: user.planExpiry,
        });
    } catch (error) {
        console.error('[check-plan]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
