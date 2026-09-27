import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * Server-side enforcement of the FREE-tier single-evaluation limit for AI
 * practice modules (WAT/TAT/SRT/GPE/LECTURETTE/OIR).
 *
 * Design notes, because this used to be bypassable three different ways:
 *
 *  1. The client no longer participates. There was a `POST /api/practice/check-access`
 *     that the browser called to "consume" an attempt — a free user simply never
 *     sent it, and OIR had no other backstop at all. All counting is now driven by
 *     claims this module writes.
 *
 *  2. The claim row IS the lock. The previous implementation did `findFirst(...)`
 *     and then, after a 5–15s Gemini round-trip, `create(...)`. Concurrent
 *     submissions all observed "no marker" and all got free evaluations. We now
 *     insert first and treat a unique-constraint violation as "already claimed",
 *     which is atomic at the database level.
 *
 *  3. Entitlement comes from the database, not the session cookie. Callers pass an
 *     `isPro` boolean obtained from lib/entitlement.ts.
 *
 * Claims live in their own `FreeEvalClaim` table rather than as `<MODULE>_EVAL`
 * rows in `PracticeAttempt`: that table already held legacy duplicates from the old
 * client-driven counter, so a unique constraint could not be added to it without
 * deleting real user history.
 */

/** The practice modules that consume a free-tier evaluation. */
export const GATED_MODULES = ['WAT', 'TAT', 'SRT', 'GPE', 'LECTURETTE', 'OIR'] as const;
export type GatedModule = (typeof GATED_MODULES)[number];

export function isGatedModule(value: string): value is GatedModule {
    return (GATED_MODULES as readonly string[]).includes(value);
}

function normalize(moduleName: string): string {
    return moduleName.trim().toUpperCase();
}

/**
 * Atomically claim this user's one free evaluation for `moduleName`.
 *
 * Returns true when the claim succeeded (the caller may proceed with the
 * expensive AI call) and false when the free evaluation was already used.
 * PRO users always succeed and never leave a claim.
 *
 * Claim BEFORE spending money on the model, not after.
 */
export async function claimFreeEval(
    userId: string,
    isPro: boolean,
    moduleName: string,
): Promise<boolean> {
    if (isPro) return true;

    try {
        await prisma.freeEvalClaim.create({
            data: { userId, module: normalize(moduleName) },
        });
        return true;
    } catch (err) {
        // P2002 = unique constraint violation = already claimed.
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
            return false;
        }
        throw err;
    }
}

/**
 * Release a claim made by {@link claimFreeEval}.
 *
 * Called when the evaluation failed for a reason that is not the user's fault
 * (model error, malformed response, database write failure) so a free user does
 * not lose their single attempt to our outage.
 */
export async function releaseFreeEval(
    userId: string,
    isPro: boolean,
    moduleName: string,
): Promise<void> {
    if (isPro) return;
    try {
        await prisma.freeEvalClaim.deleteMany({
            where: { userId, module: normalize(moduleName) },
        });
    } catch (err) {
        console.error('[practice-limit] failed to release claim', err);
    }
}

/** Has this FREE user already used their one evaluation for this module? */
export async function freeEvalLimitReached(
    userId: string,
    isPro: boolean,
    moduleName: string,
): Promise<boolean> {
    if (isPro) return false;
    const existing = await prisma.freeEvalClaim.findUnique({
        where: { userId_module: { userId, module: normalize(moduleName) } },
        select: { id: true },
    });
    return Boolean(existing);
}

/**
 * Which gated modules this user may still evaluate. Drives the UI lock state, and
 * is derived from exactly the same claims the server enforces on — so the padlocks
 * the user sees can no longer disagree with what the API will allow.
 */
export async function getModuleAccess(
    userId: string,
    isPro: boolean,
): Promise<Record<GatedModule, { allowed: boolean; used: boolean }>> {
    const result = {} as Record<GatedModule, { allowed: boolean; used: boolean }>;

    if (isPro) {
        for (const m of GATED_MODULES) result[m] = { allowed: true, used: false };
        return result;
    }

    const claims = await prisma.freeEvalClaim.findMany({
        where: { userId, module: { in: [...GATED_MODULES] } },
        select: { module: true },
    });
    const used = new Set(claims.map((r) => r.module));

    for (const m of GATED_MODULES) {
        const isUsed = used.has(m);
        result[m] = { allowed: !isUsed, used: isUsed };
    }
    return result;
}
