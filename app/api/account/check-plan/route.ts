import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/account/check-plan
 * Returns the CURRENT authenticated user's plan only.
 * The user is resolved from the session cookie — never from client input —
 * to prevent reading other users' plans (IDOR).
 */
export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { plan: true },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ plan: user.plan });
    } catch (error) {
        console.error('[check-plan]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
