import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/entitlement';
import { getModuleAccess, GATED_MODULES } from '@/lib/practice-limit';

/**
 * GET /api/practice/access-status
 *
 * Tells the UI which practice modules to show unlocked. Advisory by design — the
 * authoritative gate is `claimFreeEval()` inside each submit/evaluate route.
 *
 * What changed: this used to count raw `PracticeAttempt` rows with
 * `module = 'WAT'`, which the *client* wrote by POSTing to
 * /api/practice/check-access. A free user who simply didn't send that POST kept
 * an unlocked UI forever. It now reads the same server-written `*_EVAL` markers
 * the API enforces on, so the padlocks can no longer disagree with reality.
 */
export async function GET() {
    try {
        const gate = await requireUser();
        if (gate.response) {
            return NextResponse.json({ error: 'Unauthorized', isGuest: true }, { status: 401 });
        }
        const { userId, isPro } = gate.entitlement;

        const access = await getModuleAccess(userId, isPro);

        return NextResponse.json({
            isGuest: false,
            isPro,
            modules: Object.fromEntries(
                GATED_MODULES.map((m) => [m, { allowed: access[m].allowed, used: access[m].used }]),
            ),
        });
    } catch (error) {
        console.error('[ACCESS_STATUS_ERROR]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
