#!/usr/bin/env node
/**
 * scripts/check-gemini-model.mjs
 *
 * Asserts that the Gemini model the app is configured to use actually exists and
 * supports generateContent.
 *
 * Why this exists: Google retired `gemini-1.5-flash` and `gemini-2.0-flash`, both
 * of which were hard-coded in the source. Every AI route started returning 500
 * while `tsc --noEmit` and `next build` stayed green, because a dead model name
 * is a runtime fact rather than a type error. The outage was only visible by
 * actually calling the API — so call it here, in CI, on purpose.
 *
 * Usage:  npm run check:ai
 * Exit 0 = configured model is live. Exit 1 = model missing or key broken.
 */

import { readFileSync, existsSync } from 'node:fs';

// Load .env for local runs. In CI the vars are already in the environment.
if (existsSync('.env')) {
    for (const line of readFileSync('.env', 'utf8').split('\n')) {
        const t = line.trim();
        if (!t || t.startsWith('#')) continue;
        const i = t.indexOf('=');
        if (i === -1) continue;
        const k = t.slice(0, i).trim();
        let v = t.slice(i + 1).trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
            v = v.slice(1, -1);
        }
        if (!process.env[k]) process.env[k] = v;
    }
}

const KEY = process.env.GEMINI_API_KEY;

/**
 * Must mirror `GEMINI_MODEL` / `GEMINI_MODELS` in lib/ai-eval.ts.
 *
 * This file used to default to 'gemini-flash-latest'. That was the primary in an
 * earlier revision, but the primary was then changed to the pinned
 * 'gemini-2.5-flash' (the alias was observed returning 503 under load on the
 * evaluation path). The default here was not updated with it, so `npm run
 * check:ai` was asserting a model the app only ever reaches on failover, while
 * the model serving virtually every real request went unchecked — the exact
 * retirement blind spot this script exists to close.
 */
const PRIMARY = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash';
const FALLBACKS = ['gemini-flash-latest', 'gemini-flash-lite-latest'].filter((m) => m !== PRIMARY);

/** List live flash-class text models, to suggest a replacement on failure. */
async function suggestReplacements() {
    try {
        const list = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${KEY}&pageSize=200`,
        ).then((r) => r.json());
        const names = (list.models || [])
            .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
            .map((m) => m.name.replace('models/', ''))
            .filter((n) => /flash/.test(n) && !/image|tts|audio|live|native|transcribe/.test(n));
        if (names.length) {
            console.error('\nLive flash-class models available to this key:');
            names.forEach((n) => console.error('  - ' + n));
        }
    } catch {
        console.error('  (could not list models)');
    }
}

/**
 * Probe one model name.
 *
 * Returns 'live' | 'retired' | 'error'. A 429/503 counts as **live**: the model
 * answered, it is merely busy or rate-limited. Treating that as a failure would
 * make this check flaky and train everyone to ignore it, which defeats the point
 * — the only thing worth failing CI over is a name that no longer exists.
 */
async function probe(model) {
    let res;
    try {
        res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${KEY}`,
            {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: 'Reply with the single word: ok' }] }],
                    generationConfig: { maxOutputTokens: 5 },
                }),
            },
        );
    } catch (err) {
        return { state: 'error', detail: `could not reach the Gemini API: ${err.message}` };
    }

    if (res.status === 200) return { state: 'live', detail: 'supports generateContent' };
    if (res.status === 429 || res.status === 503) {
        return { state: 'live', detail: `exists but is busy (HTTP ${res.status})` };
    }

    const body = await res.json().catch(() => ({}));
    const detail = body?.error?.message || `HTTP ${res.status}`;
    return { state: res.status === 404 ? 'retired' : 'error', detail };
}

async function main() {
    if (!KEY) {
        console.error('FAIL  GEMINI_API_KEY is not set — cannot verify the model.');
        return 1;
    }

    console.log(`Checking primary Gemini model "${PRIMARY}" ...`);
    const primary = await probe(PRIMARY);

    if (primary.state !== 'live') {
        console.error(`FAIL  primary "${PRIMARY}" is not usable: ${primary.detail}`);
        if (primary.state === 'retired') {
            console.error('\nThis model has been retired. Fix by either:');
            console.error('  - setting GEMINI_MODEL to a live model, or');
            console.error('  - updating the default in lib/ai-eval.ts (and this script).');
            await suggestReplacements();
        }
        return 1;
    }

    console.log(`PASS  "${PRIMARY}" is live — ${primary.detail}.`);

    // Fallbacks are checked but are not allowed to fail the build: the app only
    // reaches them when the primary is transiently unavailable, so a retired
    // fallback degrades resilience without breaking anything today.
    let retiredFallbacks = 0;
    for (const model of FALLBACKS) {
        const result = await probe(model);
        if (result.state === 'live') {
            console.log(`  ok    fallback "${model}" — ${result.detail}.`);
        } else {
            retiredFallbacks += 1;
            console.warn(`  WARN  fallback "${model}" is not usable: ${result.detail}`);
        }
    }

    if (retiredFallbacks > 0) {
        console.warn(
            `\n${retiredFallbacks} of ${FALLBACKS.length} fallback model(s) are unusable. ` +
            'The app still works, but it has less headroom when the primary is busy. ' +
            'Refresh the list in lib/ai-eval.ts.',
        );
    }

    return 0;
}

// Set `process.exitCode` rather than calling `process.exit()`. An abrupt exit
// while the fetch socket is still closing trips a libuv assertion on Windows
// ("!(handle->flags & UV_HANDLE_CLOSING)"), which looks like a CI failure even
// when the check passed.
process.exitCode = await main();
