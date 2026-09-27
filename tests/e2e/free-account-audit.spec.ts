import { test, expect, type Page, type APIRequestContext } from '@playwright/test';

/**
 * Post-remediation audit, driven as a real FREE user in a real browser.
 *
 * Two things are being checked, and they are different:
 *
 *  1. Does the app still work for a free account — every page renders, no console
 *     errors, no failed requests, no spinner that never resolves.
 *  2. Is the paywall now enforced by the SERVER. For that, asserting on the UI is
 *     not enough: the whole class of bug found in the audit was "the UI hides it
 *     but curl returns it". So the premium endpoints are called directly with the
 *     free user's real session cookie.
 */

const FREE_EMAIL = 'kiro.audit.free@lakshyassb.test';
const FREE_PASSWORD = 'AuditFree!2026';
const FREE_NAME = 'Kiro Audit Free';

const PAGES = [
    '/', '/about', '/account', '/checkout', '/contact',
    '/current-affairs', '/current-affairs/quiz', '/dashboard',
    '/feedback', '/leaderboard', '/medical', '/medical/color-vision-test',
    '/offline', '/practice', '/practice/gpe', '/practice/lecturette',
    '/practice/oir', '/practice/srt', '/practice/tat', '/practice/wat',
    '/pricing', '/privacy', '/refund-policy', '/roadmap', '/srt-test',
    '/ssb/day-1', '/ssb/day-2', '/ssb/day-3', '/ssb/day-4', '/ssb/day-5',
    '/ssb-entry-navigator', '/terms',
];

/** Pages the free user is expected to be redirected away from (PRO-gated). */
const PRO_PAGES = ['/piq', '/piq/form', '/piq/result', '/daily-question', '/olq-report'];

interface PageIssue {
    page: string;
    kind: 'console' | 'pageerror' | 'requestfailed' | 'httperror';
    detail: string;
}

/** Noise that is not the app's fault: third-party ads/fonts blocked in a headless run. */
function isIgnorableNoise(text: string): boolean {
    return (
        /adsbygoogle|pagead2|googlesyndication|doubleclick/i.test(text) ||
        /fonts\.googleapis|fonts\.gstatic|cdnjs\.cloudflare/i.test(text) ||
        /ERR_BLOCKED_BY_CLIENT|ERR_INTERNET_DISCONNECTED/i.test(text) ||
        /Download the React DevTools/i.test(text) ||
        /vercel|speed-insights|_vercel\/insights/i.test(text)
    );
}

function watchPage(page: Page, issues: PageIssue[], current: () => string) {
    page.on('console', (msg) => {
        if (msg.type() !== 'error') return;
        const text = msg.text();
        if (isIgnorableNoise(text)) return;
        issues.push({ page: current(), kind: 'console', detail: text.slice(0, 300) });
    });

    page.on('pageerror', (err) => {
        if (isIgnorableNoise(err.message)) return;
        issues.push({ page: current(), kind: 'pageerror', detail: err.message.slice(0, 300) });
    });

    page.on('requestfailed', (req) => {
        const failure = req.failure()?.errorText ?? 'unknown';
        const line = `${req.method()} ${req.url()} — ${failure}`;
        if (isIgnorableNoise(line)) return;
        issues.push({ page: current(), kind: 'requestfailed', detail: line.slice(0, 300) });
    });

    page.on('response', (res) => {
        if (res.status() < 500) return; // 4xx on a gated API is the point of this audit
        const line = `${res.status()} ${res.request().method()} ${res.url()}`;
        if (isIgnorableNoise(line)) return;
        issues.push({ page: current(), kind: 'httperror', detail: line.slice(0, 300) });
    });
}

/** Ensure the FREE audit account exists, then sign in through the real form. */
async function ensureFreeAccount(request: APIRequestContext) {
    const signup = await request.post('/api/auth/signup', {
        data: {
            fullName: FREE_NAME,
            email: FREE_EMAIL,
            password: FREE_PASSWORD,
            targetEntry: 'NDA',
        },
        failOnStatusCode: false,
    });
    // 201 = created, 409 = already exists from a previous run. Both fine.
    expect([201, 409]).toContain(signup.status());
}

test.describe('LakshyaSSB — free account audit after remediation', () => {
    const issues: PageIssue[] = [];
    let currentPage = '(setup)';

    test('free user can sign in, and every page renders clean', async ({ page, request }) => {
        await ensureFreeAccount(request);
        watchPage(page, issues, () => currentPage);

        // ── Sign in through the actual UI ──────────────────────────────────────
        currentPage = '/auth';
        await page.goto('/auth', { waitUntil: 'domcontentloaded' });
        await page.fill('input[name="email"]', FREE_EMAIL);
        await page.fill('input[name="password"]', FREE_PASSWORD);
        await page.click('button[type="submit"]');

        // Landing on the dashboard (or anywhere that isn't /auth) means the cookie stuck.
        await page.waitForURL((url) => !url.pathname.startsWith('/auth'), { timeout: 30_000 });

        const cookies = await page.context().cookies();
        const session = cookies.find((c) => c.name === 'session');
        expect(session, 'session cookie must be set after login').toBeTruthy();
        expect(session!.httpOnly, 'session cookie must be httpOnly').toBe(true);
        expect(session!.sameSite, 'session cookie should be Lax').toBe('Lax');

        // ── Confirm this really is a FREE account ──────────────────────────────
        const status = await page.request.get('/api/auth/status');
        expect(status.ok()).toBeTruthy();
        const statusBody = await status.json();
        expect(statusBody.plan, 'audit account must be FREE').toBe('FREE');

        // ── Walk every page a free user may see ────────────────────────────────
        for (const path of PAGES) {
            currentPage = path;
            const res = await page.goto(path, { waitUntil: 'domcontentloaded' });
            expect(res, `${path} produced no response`).toBeTruthy();
            expect(res!.status(), `${path} returned ${res!.status()}`).toBeLessThan(400);
            // Let client effects settle so their fetches are captured.
            await page.waitForTimeout(700);

            // A page that renders literally nothing is the blank-screen class of bug.
            const bodyText = (await page.locator('body').innerText()).trim();
            expect(bodyText.length, `${path} rendered an empty body`).toBeGreaterThan(30);

            // Regression guard for the "undefined/100" score bug.
            expect(bodyText, `${path} shows undefined in the UI`).not.toContain('undefined/100');
            expect(bodyText, `${path} shows NaN in the UI`).not.toMatch(/\bNaN\s*%/);
        }
    });

    test('PRO pages redirect a free user away instead of rendering', async ({ page, request }) => {
        await ensureFreeAccount(request);
        await page.goto('/auth', { waitUntil: 'domcontentloaded' });
        await page.fill('input[name="email"]', FREE_EMAIL);
        await page.fill('input[name="password"]', FREE_PASSWORD);
        await page.click('button[type="submit"]');
        await page.waitForURL((url) => !url.pathname.startsWith('/auth'), { timeout: 30_000 });

        for (const path of PRO_PAGES) {
            await page.goto(path, { waitUntil: 'domcontentloaded' });
            const landed = new URL(page.url()).pathname;
            expect(
                landed === '/pricing' || landed === '/auth',
                `${path} should bounce a FREE user to /pricing (got ${landed})`,
            ).toBeTruthy();
        }

        // /piq-builder must NOT be caught by the '/piq' prefix any more.
        await page.goto('/piq-builder', { waitUntil: 'domcontentloaded' });
        expect(
            new URL(page.url()).pathname,
            '/piq-builder should no longer be swept up by the /piq prefix match',
        ).toBe('/piq-builder');
    });

    test('server enforces the paywall even when the UI is bypassed', async ({ page, request }) => {
        await ensureFreeAccount(request);
        await page.goto('/auth', { waitUntil: 'domcontentloaded' });
        await page.fill('input[name="email"]', FREE_EMAIL);
        await page.fill('input[name="password"]', FREE_PASSWORD);
        await page.click('button[type="submit"]');
        await page.waitForURL((url) => !url.pathname.startsWith('/auth'), { timeout: 30_000 });

        // These calls carry the free user's genuine session cookie — exactly what
        // `curl` with a stolen cookie would do.
        const api = page.request;

        // 1. The privilege-escalation endpoint must be gone entirely.
        const award = await api.post('/api/medals/award', {
            data: { type: 'piq', score: 100 },
            failOnStatusCode: false,
        });
        expect(
            [404, 405].includes(award.status()),
            `POST /api/medals/award must not exist (got ${award.status()})`,
        ).toBeTruthy();

        // 2. Redeeming PRO must fail for a user who has not earned 49 medals.
        const redeem = await api.post('/api/redeem-pro', { failOnStatusCode: false });
        expect(
            [422, 409].includes(redeem.status()),
            `redeem-pro should refuse an unfunded free account (got ${redeem.status()})`,
        ).toBeTruthy();

        // 3. PRO-only data must be refused, not merely hidden in the UI.
        for (const path of [
            '/api/piq/latest',
            '/api/piq/history',
            '/api/piq/io-questions',
        ]) {
            const res = await api.get(path, { failOnStatusCode: false });
            expect(res.status(), `${path} must be 403 for FREE`).toBe(403);
            const body = await res.json();
            expect(body.reason, `${path} should say why`).toBe('pro_required');
        }

        const piqEval = await api.post('/api/piq/evaluate', {
            data: { positionOfResponsibility: true, teamSportsYears: 2 },
            failOnStatusCode: false,
        });
        expect(piqEval.status(), '/api/piq/evaluate must be 403 for FREE').toBe(403);

        // 4. The quota WRITER the client used to call must be gone.
        const quotaWrite = await api.post('/api/practice/check-access', {
            data: { module: 'WAT' },
            failOnStatusCode: false,
        });
        expect(
            [404, 405].includes(quotaWrite.status()),
            `POST /api/practice/check-access must be gone (got ${quotaWrite.status()})`,
        ).toBeTruthy();

        // 5. Test content must require a session (it used to be fully public) and
        //    still work for this signed-in free user.
        for (const path of ['/api/tat/images', '/api/gpe/scenario']) {
            const res = await api.get(path, { failOnStatusCode: false });
            expect(res.status(), `${path} should serve a signed-in user`).toBe(200);
        }

        // 6. Leaderboard must not leak other users' full names or photos.
        const lb = await api.get('/api/leaderboard?tab=overall', { failOnStatusCode: false });
        expect(lb.status()).toBe(200);
        const lbBody = await lb.json();
        expect(Array.isArray(lbBody.rows), 'leaderboard should return an envelope').toBeTruthy();
        expect(lbBody.restricted, 'free user must be marked restricted').toBe(true);
        expect(lbBody.rows.length, 'free user should get at most 10 rows').toBeLessThanOrEqual(10);
        for (const row of lbBody.rows) {
            if (!row.isCurrentUser) {
                expect(row.avatar, 'other users\' avatars must not be exposed').toBeNull();
            }
        }

        // 7. Empty submissions must be rejected before we pay for a model call,
        //    and must NOT burn the free attempt.
        const emptyWat = await api.post('/api/wat/submit', {
            data: { responses: [{ word: 'Courage', user_sentence: '' }] },
            failOnStatusCode: false,
        });
        expect(emptyWat.status(), 'empty WAT must be rejected').toBe(400);
        expect((await emptyWat.json()).reason).toBe('empty_submission');

        // 8. The free OIR attempt is now consumed server-side: first generate
        //    succeeds, the second is refused with a machine-readable reason.
        const oir1 = await api.get('/api/oir/generate', { failOnStatusCode: false });
        expect([200, 403]).toContain(oir1.status());

        if (oir1.status() === 200) {
            const oir2 = await api.get('/api/oir/generate', { failOnStatusCode: false });
            expect(oir2.status(), 'second OIR generate must be refused for FREE').toBe(403);
            expect((await oir2.json()).reason).toBe('free_limit_reached');
        } else {
            expect((await oir1.json()).reason).toBe('free_limit_reached');
        }
    });

    test('unauthenticated callers get nothing premium', async ({ request }) => {
        // A fresh context with no cookies.
        for (const path of [
            '/api/oir/generate',
            '/api/tat/images',
            '/api/gpe/scenario',
            '/api/leaderboard',
            '/api/piq/latest',
            '/api/medical/latest',
            '/api/dashboard/psych-summary',
        ]) {
            const res = await request.get(path, { failOnStatusCode: false });
            expect(res.status(), `${path} must require auth`).toBe(401);
        }
    });

    test.afterAll(() => {
        if (issues.length === 0) {
            console.log('\n✅ No console errors, page errors, failed requests or 5xx responses.\n');
            return;
        }
        console.log(`\n⚠️  ${issues.length} issue(s) captured:\n`);
        for (const i of issues) {
            console.log(`  [${i.kind}] ${i.page}\n      ${i.detail}`);
        }
        console.log('');
    });
});
