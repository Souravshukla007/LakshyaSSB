import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { cache } from 'react';

/**
 * The signing secret. There is deliberately NO fallback value.
 *
 * A literal fallback (the previous `|| 'dev-only-insecure-fallback'`) is worse
 * than a crash: it is committed to the repo, so anyone can forge a session for
 * any account — including `plan: 'PRO'` — against every deployment that happens
 * to be missing the env var. Gating that on NODE_ENV did not help, because the
 * Android app is developed against a dev server and staging containers are
 * routinely started without NODE_ENV=production.
 *
 * Fail loudly at import time in every environment instead.
 */
const MIN_SECRET_BYTES = 32;

function loadKey(): Uint8Array {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error(
            'JWT_SECRET is not set. Generate one with `openssl rand -base64 48` and add it to .env — ' +
            'there is no fallback secret by design.',
        );
    }

    const encoded = new TextEncoder().encode(secret);
    if (encoded.byteLength < MIN_SECRET_BYTES) {
        throw new Error(
            `JWT_SECRET is too short (${encoded.byteLength} bytes). HS256 needs at least ${MIN_SECRET_BYTES} bytes ` +
            'of entropy. Generate one with `openssl rand -base64 48`.',
        );
    }

    return encoded;
}

const key = loadKey();

/** Name of the persistent session cookie (browser + Capacitor WebView). */
export const SESSION_COOKIE = 'session';

/**
 * How long a signed-in session survives without any re-login: 7 days.
 * This single constant drives the JWT `exp`, the cookie `Max-Age` and the cookie
 * `Expires` date, so those three can never drift apart (if they disagree, the
 * shortest one silently wins and the user is logged out early).
 */
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // seconds
const SESSION_MAX_AGE_MS = SESSION_MAX_AGE * 1000;

/**
 * The window is rolling: it slides forward while the user keeps using the app.
 * To avoid attaching `Set-Cookie` to every single response (which would make
 * every response uncacheable), only re-issue once the current token has been in
 * use for this long.
 */
const REFRESH_AFTER_MS = 12 * 60 * 60 * 1000; // 12 hours

export interface SessionPayload {
    userId: string;
    email: string;
    /**
     * Cached plan claim. Treat as a UI HINT ONLY — it can be up to 7 days stale.
     * Every entitlement decision must go through `requirePro()` /
     * `getLiveEntitlement()` in lib/entitlement.ts, which reads the database.
     */
    plan: 'FREE' | 'PRO';
    /**
     * Incremented in the database whenever every session for the user must die
     * (logout-all, password change, password reset, account delete). A token
     * whose `tokenVersion` is behind the stored one is rejected, which is what
     * makes those actions actually invalidate other devices.
     */
    tokenVersion: number;
    expires: string;
}

/** What actually comes back out of a verified JWT (standard claims included). */
type DecodedSession = SessionPayload & { iat?: number; exp?: number };

/**
 * Cookie attributes shared by every write of the session cookie.
 *
 * Both `expires` and `maxAge` are sent on purpose: `maxAge` is what makes this a
 * *persistent* cookie, so it survives browser restarts and Android WebView
 * process death; `expires` is the fallback for older clients.
 */
function cookieOptions(expires: Date) {
    return {
        expires,
        maxAge: SESSION_MAX_AGE,
        httpOnly: true,
        // Previously `NODE_ENV === 'production'`, which shipped the session
        // cookie in cleartext from every non-prod deployment. Opt out only for
        // genuine local http:// development.
        secure: !isPlainLocalhost(),
        sameSite: 'lax' as const,
        path: '/',
    };
}

/**
 * True only for local http development. Everything else — including LAN IPs used
 * by the Capacitor Android build and any tunnel — gets `Secure`.
 */
function isPlainLocalhost(): boolean {
    if (process.env.NODE_ENV === 'production') return false;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
    if (appUrl.startsWith('https://')) return false;
    return appUrl === '' || appUrl.includes('localhost') || appUrl.includes('127.0.0.1');
}

export async function encrypt(payload: SessionPayload): Promise<string> {
    // Pin the JWT's own expiry to the cookie's expiry.
    const parsed = new Date(payload.expires);
    const expiresAt = Number.isNaN(parsed.getTime())
        ? new Date(Date.now() + SESSION_MAX_AGE_MS)
        : parsed;

    return await new SignJWT(payload as unknown as Record<string, unknown>)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(expiresAt)
        .sign(key);
}

export async function decrypt(input: string): Promise<SessionPayload> {
    const { payload } = await jwtVerify(input, key, {
        algorithms: ['HS256'],
    });
    return payload as unknown as SessionPayload;
}

export async function signSession(payload: Omit<SessionPayload, 'expires'>) {
    const expires = new Date(Date.now() + SESSION_MAX_AGE_MS);
    const token = await encrypt({ ...payload, expires: expires.toISOString() });

    (await cookies()).set(SESSION_COOKIE, token, cookieOptions(expires));
}

/**
 * Clear the session cookie.
 *
 * The attributes MUST mirror the ones used when setting, or the browser can keep
 * the original cookie alongside the empty one. Use this everywhere instead of
 * hand-rolling `cookies().set('session', '', ...)` — that drift is exactly how a
 * logout ends up not sticking.
 */
export async function clearSessionCookie() {
    (await cookies()).set(SESSION_COOKIE, '', {
        expires: new Date(0),
        maxAge: 0,
        httpOnly: true,
        secure: !isPlainLocalhost(),
        sameSite: 'lax',
        path: '/',
    });
}

/** @deprecated use {@link clearSessionCookie} — kept for existing call sites. */
export const logout = clearSessionCookie;

/**
 * Decode the session cookie without touching the database.
 *
 * Cheap, but it cannot detect a revoked session. Prefer {@link getSession} in
 * route handlers; this exists for the Edge proxy, where Prisma is unavailable.
 */
export async function getSessionClaims(): Promise<SessionPayload | null> {
    const session = (await cookies()).get(SESSION_COOKIE)?.value;
    if (!session) return null;
    try {
        return await decrypt(session);
    } catch {
        return null;
    }
}

/**
 * The session for the current request, or null.
 *
 * Verifies the JWT *and* confirms the token has not been revoked by comparing
 * `tokenVersion` against the database. Memoized per request with React `cache()`,
 * so the ~50 routes that call this repeatedly still perform at most one lookup.
 *
 * NOTE: `session.plan` is a possibly-stale hint. Use `requirePro()` for gating.
 */
export const getSession = cache(async (): Promise<SessionPayload | null> => {
    const claims = await getSessionClaims();
    if (!claims) return null;

    // Tokens minted before tokenVersion existed have no claim; treat them as
    // version 0 so existing sessions survive the upgrade.
    const claimVersion = typeof claims.tokenVersion === 'number' ? claims.tokenVersion : 0;

    try {
        // Imported lazily so the Edge proxy can import decrypt/SESSION_COOKIE
        // from this module without pulling in Prisma.
        const { prisma } = await import('@/lib/prisma');
        const user = await prisma.user.findUnique({
            where: { id: claims.userId },
            select: { tokenVersion: true },
        });

        // Deleted account, or a session invalidated by logout-all / password change.
        if (!user) return null;
        if (user.tokenVersion !== claimVersion) return null;
    } catch (err) {
        // Database unreachable. Fail closed for revocation checking would log
        // every user out during a blip, so accept the verified JWT and log it.
        console.error('[auth] tokenVersion check skipped (database unreachable)', err);
    }

    return { ...claims, tokenVersion: claimVersion };
});

/**
 * Invalidate every existing session for a user by bumping the stored
 * tokenVersion. Call after logout-all, password change, password reset and
 * account deletion. Returns the new version so the caller can immediately
 * re-issue a valid cookie for the current device if it wants to.
 */
export async function bumpTokenVersion(userId: string): Promise<number> {
    const { prisma } = await import('@/lib/prisma');
    const updated = await prisma.user.update({
        where: { id: userId },
        data: { tokenVersion: { increment: 1 } },
        select: { tokenVersion: true },
    });
    return updated.tokenVersion;
}

/**
 * Slide the 7-day session window forward.
 *
 * The refreshed cookie is written onto the caller's `response`, which the caller
 * MUST return — a `Set-Cookie` on a response that gets thrown away never reaches
 * the client, and the session then dies a hard 7 days after login with no
 * sliding window at all.
 *
 * No-ops when there is no cookie, when the token is expired/tampered, or when
 * the token is still young enough that re-issuing would be pure churn.
 *
 * Deliberately does NOT extend or re-assert the `plan` claim beyond copying it:
 * this runs in the Edge proxy with no database access, so it cannot know the
 * current plan. `requirePro()` reads the database, so a stale claim here can
 * never grant entitlement — it only affects UI hints until the next
 * /api/account/me sync.
 */
export async function updateSession(
    request: NextRequest,
    response: NextResponse,
): Promise<NextResponse> {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) return response;

    let parsed: DecodedSession;
    try {
        parsed = (await decrypt(token)) as DecodedSession;
    } catch {
        // Expired or invalid — callers already treat this as logged out.
        return response;
    }

    const issuedAtMs = typeof parsed.iat === 'number' ? parsed.iat * 1000 : 0;
    if (issuedAtMs && Date.now() - issuedAtMs < REFRESH_AFTER_MS) {
        return response;
    }

    const expires = new Date(Date.now() + SESSION_MAX_AGE_MS);
    // Re-sign from known claims only, so a stale `iat`/`exp` isn't carried over.
    const refreshed = await encrypt({
        userId: parsed.userId,
        email: parsed.email,
        plan: parsed.plan,
        tokenVersion: typeof parsed.tokenVersion === 'number' ? parsed.tokenVersion : 0,
        expires: expires.toISOString(),
    });

    response.cookies.set(SESSION_COOKIE, refreshed, cookieOptions(expires));
    return response;
}
