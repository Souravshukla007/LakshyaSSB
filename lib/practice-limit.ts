import { prisma } from '@/lib/prisma';

/**
 * Server-side enforcement of the FREE-tier single-attempt limit for AI practice
 * evaluations (WAT/TAT/SRT/GPE/LECTURETTE).
 *
 * The client also records a PracticeAttempt at "start" (module = e.g. "WAT") to
 * drive the UI gate, but that is advisory only and trivially bypassable. To make
 * the limit authoritative we record a distinct server-only completion marker
 * (module = "<MODULE>_EVAL") whenever a FREE user successfully completes an
 * evaluation, and refuse further evaluations once that marker exists.
 *
 * PRO users are never limited.
 */

const MARKER_SUFFIX = '_EVAL';

function marker(moduleName: string) {
    return `${moduleName.toUpperCase()}${MARKER_SUFFIX}`;
}

/** Returns true if a FREE user has already used their one free evaluation for this module. */
export async function freeEvalLimitReached(
    userId: string,
    plan: string | undefined,
    moduleName: string,
): Promise<boolean> {
    if (plan === 'PRO') return false;
    const existing = await prisma.practiceAttempt.findFirst({
        where: { userId, module: marker(moduleName) },
        select: { id: true },
    });
    return Boolean(existing);
}

/** Records a successful evaluation completion for a FREE user (no-op for PRO). */
export async function recordEvalCompletion(
    userId: string,
    plan: string | undefined,
    moduleName: string,
): Promise<void> {
    if (plan === 'PRO') return;
    await prisma.practiceAttempt.create({
        data: { userId, module: marker(moduleName) },
    });
}
