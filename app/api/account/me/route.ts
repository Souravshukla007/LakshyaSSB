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

    try {
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
                profileImageUrl: true,
                createdAt: true,
                payments: {
                    // Only settled payments. PENDING rows are abandoned checkout
                    // attempts — a customer who clicked Pay four times before
                    // deciding saw four "PENDING" entries in their own history and
                    // reasonably read that as four charges.
                    where: { status: 'SUCCESS' },
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

        // Keep the cookie's `plan` hint aligned with the database. This is now
        // only a UI convenience — entitlement is decided by lib/entitlement.ts,
        // which always reads the database — but a correct hint avoids the UI
        // flashing the wrong lock state.
        const { getLiveEntitlement } = await import('@/lib/entitlement');
        const entitlement = await getLiveEntitlement();
        if (entitlement && entitlement.plan !== session.plan) {
            const { signSession } = await import('@/lib/auth');
            await signSession({
                userId: user.id,
                email: user.email,
                plan: entitlement.plan,
                tokenVersion: session.tokenVersion,
            });
        }

        return NextResponse.json(user);
    } catch (error: any) {
        // Prisma P1001 => DB temporarily unreachable (common in local dev / network hiccups).
        //
        // This used to answer HTTP 200 with `{ authenticated: false }`, which any
        // client reasonably reads as "logged out" — so a transient database blip
        // bounced signed-in users to /auth. A 503 says "try again", not "you're out".
        if (error?.code === 'P1001') {
            return NextResponse.json(
                {
                    error: 'Temporarily unable to load your account. Please try again.',
                    temporary: true,
                    reason: 'database_unreachable',
                },
                { status: 503, headers: { 'Retry-After': '5' } }
            );
        }

        console.error('[ACCOUNT_ME_ERROR]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
