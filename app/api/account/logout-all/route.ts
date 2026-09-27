import { NextResponse } from 'next/server';
import { getSession, clearSessionCookie, bumpTokenVersion } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/account/logout-all
 *
 * Genuinely signs the user out everywhere.
 *
 * This used to only clear the calling device's cookie while the UI promised
 * "Invalidate your session on this and all other devices" — with stateless JWTs
 * and no revocation list, every other device stayed logged in for up to 7 days,
 * and a token refreshed in that window rolled forward indefinitely. Bumping
 * `tokenVersion` makes every outstanding token fail verification in
 * `getSession()`.
 */
export async function POST() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    await bumpTokenVersion(session.userId);

    // Attributes mirror the ones used when setting, or the browser can keep the
    // original cookie alongside the empty one.
    await clearSessionCookie();

    await prisma.activityLog.create({
        data: {
            userId: session.userId,
            action: 'LOGOUT_ALL',
            details: 'Signed out of all devices',
        },
    });

    return NextResponse.json({ success: true });
}
