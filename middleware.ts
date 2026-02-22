import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession, decrypt } from '@/lib/auth';
import { isPro } from '@/lib/plan';

// Routes that require login
const AUTH_PROTECTED = ['/dashboard', '/account'];

// Routes that require an active PRO subscription
const PRO_PROTECTED = ['/ssb', '/piq', '/practice', '/daily-question', '/medical', '/olq-report'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Slide the session expiry window forward on every request
    await updateSession(request);

    const sessionCookie = request.cookies.get('session')?.value;

    // ── Auth guard ─────────────────────────────────────────────────────────────
    const needsAuth = AUTH_PROTECTED.some((p) => pathname.startsWith(p));
    if (needsAuth) {
        if (!sessionCookie) {
            return NextResponse.redirect(new URL('/auth', request.url));
        }
    }

    // ── PRO guard ──────────────────────────────────────────────────────────────
    const needsPro = PRO_PROTECTED.some((p) => pathname.startsWith(p));
    if (needsPro) {
        if (!sessionCookie) {
            return NextResponse.redirect(new URL('/auth', request.url));
        }

        try {
            const session = await decrypt(sessionCookie);
            if (!isPro(session.plan, session.planExpiry)) {
                // Not PRO (or expired) — send to pricing
                return NextResponse.redirect(new URL('/pricing', request.url));
            }
        } catch {
            // Invalid/expired JWT — treat as logged out
            return NextResponse.redirect(new URL('/auth', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/account/:path*',
        '/ssb/:path*',
        '/piq/:path*',
        '/practice/:path*',
        '/daily-question/:path*',
        '/medical/:path*',
        '/olq-report/:path*',
    ],
};
