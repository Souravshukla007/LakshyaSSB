import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession, decrypt, SESSION_COOKIE } from '@/lib/auth';
import { isPro } from '@/lib/plan';

// Routes that require login.
// '/checkout' is here because it was reachable while logged out: the page
// rendered a full payment card and only revealed the problem as an
// "Unauthorized" error banner after the customer pressed Pay.
const AUTH_PROTECTED = ['/dashboard', '/account', '/checkout'];

/**
 * Prefix match on a path *segment* boundary.
 *
 * `pathname.startsWith('/piq')` also matched `/piq-builder`, so the PRO gate
 * fired on a page that was never listed. Require either an exact match or a
 * following '/', so '/piq' covers '/piq/form' but not '/piq-builder'.
 */
function matchesPath(pathname: string, prefixes: readonly string[]): boolean {
    return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

// Routes that require an active PRO subscription
const PRO_PROTECTED = [
    '/piq',
    '/daily-question',
    '/olq-report',
    // Sub-paths like tests inside medical, practice, and ssb are protected 
    // but the root page is accessible publicly.
    // E.g., /medical/test (if any)
    // Removed: '/practice/oir', '/practice/wat', '/practice/tat', '/practice/srt', '/practice/lecturette'
    // Currently, /medical doesn't seem to have sub-pages from what we saw, but if it does, add them here.
    // For ssb, /ssb is accessible, but what about /ssb/day-1? 
    // The user requested: "keep the links open for the all 5 day in your path to recommedation section in landing page for all users." 
    // This means /ssb/day-1, day-2, etc. should be accessible to all users. 
    // If there are tests under /ssb, they would be protected.
];

/**
 * Endpoints that write the `session` cookie themselves (sign-in, sign-out,
 * account deletion, plan re-issue). Refreshing here would emit a second,
 * competing `Set-Cookie` for the same name and the winner is ambiguous — which
 * is exactly how a logout ends up not sticking. The handler stays authoritative.
 */
const SESSION_WRITERS = [
    '/api/auth/',
    '/api/account/me',
    '/api/account/logout-all',
    '/api/account/delete',
];

/** Only safe, read-only navigations roll the session window forward. */
function canRefreshSession(request: NextRequest, pathname: string): boolean {
    if (request.method !== 'GET' && request.method !== 'HEAD') return false;
    return !SESSION_WRITERS.some((p) => pathname.startsWith(p));
}

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;

    const needsAuth = matchesPath(pathname, AUTH_PROTECTED);
    const needsPro = matchesPath(pathname, PRO_PROTECTED);

    if (needsAuth || needsPro) {
        if (!sessionCookie) {
            return NextResponse.redirect(new URL('/auth', request.url));
        }

        // Verify the token, don't just check that a cookie exists. The auth guard
        // used to accept `session=garbage` for /dashboard and /account, so the
        // page rendered a broken authenticated shell instead of redirecting.
        let session;
        try {
            session = await decrypt(sessionCookie);
        } catch {
            // Expired or tampered — treat as logged out. (Not logging the token
            // or the error body here; it can contain the raw JWT.)
            return NextResponse.redirect(new URL('/auth', request.url));
        }

        // The PRO decision here is a fast, best-effort redirect based on the
        // token's cached claim — this runs on the Edge runtime with no database
        // access. It can be stale, so it is NOT the security boundary: every
        // gated API route re-checks against the database via lib/entitlement.ts.
        // Worst case a just-upgraded user is bounced once, and /api/account/me
        // re-syncs the claim.
        if (needsPro && !isPro(session.plan)) {
            return NextResponse.redirect(new URL('/pricing', request.url));
        }
    }

    const response = NextResponse.next();

    // Slide the 7-day session window forward. The refreshed cookie is written
    // onto *this* response, so this is the response that has to be returned —
    // discarding it would mean no Set-Cookie ever reaches the browser or the
    // Android WebView, and the session would die a hard 7 days after login.
    if (!canRefreshSession(request, pathname)) {
        return response;
    }

    return updateSession(request, response);
}

export const config = {
    matcher: [
        /*
         * Runs on every page, RSC and API request so the rolling 7-day window is
         * extended wherever the user happens to browse, not just on the handful
         * of guarded routes.
         *
         * Excluded: static assets, the service worker and precached bundles —
         * they carry no session and must stay cacheable.
         *
         * Note this matcher only widens where the *refresh* runs. The access
         * checks above are still scoped to AUTH_PROTECTED / PRO_PROTECTED.
         */
        '/((?!_next/static|_next/image|sw\\.js|workbox-|favicon\\.ico|icons/|images/|practice-banks/|.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|woff|woff2|ttf|eot|css|js|map|txt|xml|json|mp3|mp4|webm)$).*)',
    ],
};
