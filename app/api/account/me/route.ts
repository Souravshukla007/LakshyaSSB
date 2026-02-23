import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkAndDowngrade } from '@/lib/plan';

/**
 * GET /api/account/me
 * Returns the authenticated user's profile and last 10 payments.
 */
export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Auto-downgrade before returning data
    await checkAndDowngrade(session.userId);

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            targetEntry: true,
            attemptNumber: true,
            preferredSSBCenter: true,
            plan: true,
            planExpiry: true,
            createdAt: true,
            payments: {
                orderBy: { createdAt: 'desc' },
                take: 10,
                select: {
                    id: true,
                    amount: true,
                    status: true,
                    createdAt: true,
                    razorpayPaymentId: true,
                },
            },
        },
    });

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
}
