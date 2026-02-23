import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession, decrypt } from '@/lib/auth';
import { isPro } from '@/lib/plan';

// Routes that require login
const AUTH_PROTECTED = ['/dashboard', '/account'];

// Routes that require an active PRO subscription
const PRO_PROTECTED = [
    '/piq',
    '/daily-question',
    '/olq-report',
    // Sub-paths like tests inside medical, practice, and ssb are protected 
    // but the root page is accessible publicly.
    // E.g., /medical/test (if any), /practice/oir, /practice/wat, /practice/tat, etc.
    '/practice/oir', '/practice/wat', '/practice/tat', '/practice/srt', '/practice/lecturette',
    // Currently, /medical doesn't seem to have sub-pages from what we saw, but if it does, add them here.
    // For ssb, /ssb is accessible, but what about /ssb/day-1? 
    // The user requested: "keep the links open for the all 5 day in your path to recommedation section in landing page for all users." 
    // This means /ssb/day-1, day-2, etc. should be accessible to all users. 
    // If there are tests under /ssb, they would be protected.
];

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
        // ssb root & day-X are public, but if there are tests, they might be /ssb/day-1/test etc.
        // For now, no strict matcher for /ssb/:path* needed unless we add protected sub-routes under it.
        // Actually, if we don't include it in matcher, middleware won't run. So we should include routes we want to protect.
        '/piq/:path*',
        '/practice/oir/:path*',
        '/practice/wat/:path*',
        '/practice/tat/:path*',
        '/practice/srt/:path*',
        '/practice/lecturette/:path*',
        '/daily-question/:path*',
        '/olq-report/:path*',
    ],
};
