/**
 * lib/entitlement.ts
 *
 * THE single source of truth for "may this user do this?".
 *
 * Why this file exists: entitlement used to be read from the `plan` claim inside
 * the session JWT. That claim can be up to 7 days stale, which produced two real
 * bugs — a user who paid stayed locked out until something happened to hit
 * /api/account/me, and a user whose PRO was revoked kept it indefinitely because
 * the rolling refresh copied the old claim forward.
 *
 * Rules:
 *   - Entitlement is read from the DATABASE, never from the cookie.
 *   - Route handlers call `requirePro()` and return its response if non-null.
 *   - `session.plan` is a UI hint only.
 */

import { NextResponse } from 'next/server';
import { getSession, type SessionPayload } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { cache } from 'react';

export interface Entitlement {
    userId: string;
    email: string;
    isPro: boolean;
    plan: 'FREE' | 'PRO';
    /** null means "never expires" (a lifetime grant, e.g. medal redemption). */
    planExpiry: Date | null;
}

/**
 * Live entitlement for the current request, straight from the database.
 * Memoized per request, so several `requirePro()` calls in one handler cost one query.
 */
export const getLiveEntitlement = cache(async (): Promise<Entitlement | null> => {
    const session = await getSession();
    if (!session) return null;

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { id: true, email: true, plan: true, planExpiry: true },
    });
    if (!user) return null;

    // A lapsed paid plan falls back to FREE. planExpiry === null is a lifetime grant.
    const expired = user.planExpiry !== null && user.planExpiry.getTime() <= Date.now();
    const isPro = user.plan === 'PRO' && !expired;

    return {
        userId: user.id,
        email: user.email,
        isPro,
        plan: isPro ? 'PRO' : 'FREE',
        planExpiry: user.planExpiry,
    };
});

/** Shape every gated route returns on refusal, so clients can branch reliably. */
export const PRO_REQUIRED = {
    error: 'This feature is part of LakshyaSSB Pro. Upgrade to unlock it.',
    reason: 'pro_required' as const,
    upgradeUrl: '/pricing',
};

export const UNAUTHORIZED = {
    error: 'Unauthorized',
    reason: 'unauthenticated' as const,
};

/**
 * Guard for a route that requires an active PRO plan.
 *
 * Usage:
 *   const gate = await requirePro();
 *   if (gate.response) return gate.response;
 *   // gate.entitlement is non-null past this point
 */
export async function requirePro(): Promise<
    { response: NextResponse; entitlement: null } | { response: null; entitlement: Entitlement }
> {
    const entitlement = await getLiveEntitlement();

    if (!entitlement) {
        return {
            response: NextResponse.json(UNAUTHORIZED, { status: 401 }),
            entitlement: null,
        };
    }

    if (!entitlement.isPro) {
        return {
            response: NextResponse.json(PRO_REQUIRED, { status: 403 }),
            entitlement: null,
        };
    }

    return { response: null, entitlement };
}

/**
 * Guard for a route that only requires a logged-in user, but still wants the
 * live plan (e.g. to decide how much of a payload to return).
 */
export async function requireUser(): Promise<
    { response: NextResponse; entitlement: null } | { response: null; entitlement: Entitlement }
> {
    const entitlement = await getLiveEntitlement();

    if (!entitlement) {
        return {
            response: NextResponse.json(UNAUTHORIZED, { status: 401 }),
            entitlement: null,
        };
    }

    return { response: null, entitlement };
}

/**
 * Re-mint the session cookie so its `plan` hint matches the database.
 *
 * Call this immediately after any plan change (payment verified, medals
 * redeemed, plan revoked). Without it the user's cookie disagrees with the DB
 * until the next /api/account/me — which is how a paying customer used to get
 * 403s from the very feature they just bought.
 *
 * The caller passes the plan it just wrote. This used to re-read it through
 * `getLiveEntitlement()`, which is memoized per request: any handler that
 * happened to call `requirePro()` before changing the plan would get the
 * pre-write value back and mint a cookie still claiming FREE — silently
 * reintroducing the bug this function exists to prevent.
 */
export async function syncSessionPlan(
    session: SessionPayload,
    plan: 'FREE' | 'PRO',
): Promise<void> {
    const { signSession } = await import('@/lib/auth');

    await signSession({
        userId: session.userId,
        email: session.email,
        plan,
        tokenVersion: session.tokenVersion,
    });
}
