import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/account/me
 * Returns the authenticated user's profile and last 10 payments.
 */
export async function GET() {
    const session = await getSession();
    if (!session) {
        // Return 200 with an empty/unauthenticated flag so Navbar doesn't spam 401s in console
        return NextResponse.json({ authenticated: false }, { status: 200 });
    }

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

    // Auto-sync stale session cookie if DB plan state diverged
    // Note: planExpiry is no longer fetched, so this part of the condition will always be false
    if (user.plan !== session.plan) { // Simplified condition as planExpiry is no longer fetched
        const { signSession } = await import('@/lib/auth');
        await signSession({
            userId: user.id,
            email: user.email,
            plan: user.plan as 'FREE' | 'PRO',
        });
    }

    return NextResponse.json(user);
}
