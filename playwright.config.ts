import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for the post-remediation audit.
 *
 * Points at an already-running `npm run dev` on :3000 rather than starting its
 * own server, so the run reuses the same process whose logs we're watching.
 */
export default defineConfig({
    testDir: './tests/e2e',
    timeout: 120_000,
    expect: { timeout: 15_000 },
    fullyParallel: false,
    workers: 1,
    retries: 0,
    reporter: [['list']],
    use: {
        baseURL: 'http://localhost:3000',
        trace: 'off',
        screenshot: 'only-on-failure',
        // Dev-mode Turbopack compiles on first hit; be patient.
        navigationTimeout: 60_000,
        actionTimeout: 20_000,
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});
