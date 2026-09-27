import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/entitlement';
import { freeEvalLimitReached, isGatedModule } from '@/lib/practice-limit';

/**
 * GET /api/practice/check-access?module=WAT
 *
 * Advisory pre-flight so the UI can route a user to /pricing before they sit
 * through a 15-minute test they cannot have scored. Never the actual gate — that
 * is `claimFreeEval()` in the submit/evaluate routes.
 *
 * The `POST` half of this route has been REMOVED. It was the quota *writer*:
 * the browser was trusted to call it to "consume" an attempt, so a free user
 * skipping that one request got unlimited attempts, and it accepted any
 * `module` string, letting the table be polluted with junk. Quota is now
 * recorded server-side at evaluation time only.
 */
export async function GET(request: Request) {
    try {
        const gate = await requireUser();
        if (gate.response) {
            return NextResponse.json({ error: 'Unauthorized', allowed: false }, { status: 401 });
        }
        const { userId, isPro } = gate.entitlement;

        const { searchParams } = new URL(request.url);
        const moduleName = searchParams.get('module')?.toUpperCase();

        if (!moduleName) {
            return NextResponse.json(
                { error: 'Module parameter is required', allowed: false },
                { status: 400 },
            );
        }
        if (!isGatedModule(moduleName)) {
            return NextResponse.json({ error: 'Unknown module', allowed: false }, { status: 400 });
        }

        if (isPro) {
            return NextResponse.json({ allowed: true, isPro: true, used: false });
        }

        const used = await freeEvalLimitReached(userId, isPro, moduleName);

        return NextResponse.json({
            allowed: !used,
            isPro: false,
            used,
            ...(used ? { reason: 'free_limit_reached', upgradeUrl: '/pricing' } : {}),
        });
    } catch (error) {
        console.error('[CHECK_ACCESS_ERROR]', error);
        return NextResponse.json({ error: 'Internal server error', allowed: false }, { status: 500 });
    }
}
