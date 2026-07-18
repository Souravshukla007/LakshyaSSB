// Feature: offline-support — Task 3.2
// Unit test for the Service Worker install-time all-or-nothing precache.
// Validates: Requirements 1.4
//
// ── Approach / documented limitation ────────────────────────────────────────
// public/sw.js is plain browser ES that references `self.addEventListener(...)`
// at the top level and uses the Cache Storage / fetch APIs — none of which exist
// in Node. Rather than run it in a real browser (unavailable here) we load the
// source into a sandboxed `node:vm` context whose global provides a fabricated
// `self` (capturing the registered event handlers), a mock `caches` whose
// `addAll` REJECTS if any URL is in a configurable "failing" set, plus the few
// host globals the file touches (fetch, Response, URL, console).
//
// We then invoke the captured `install` handler with a fake event whose
// `waitUntil(promise)` stores the promise, and assert the all-or-nothing contract
// (Req 1.4): the install promise REJECTS when a precache URL fails and RESOLVES
// when all succeed. Because `cache.addAll` is atomic, a failed install writes no
// partial shell and any previously cached (older-version) shell is retained.
//
// In real SW semantics a rejected install promise is exactly what prevents the
// new worker from activating; we cannot exercise the browser's activation gate in
// a sandbox, so we assert the rejection mechanism itself (and that the separate
// `activate` handler was registered but never invoked here).
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, vi } from 'vitest';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SW_SOURCE = readFileSync(resolve(process.cwd(), 'public', 'sw.js'), 'utf8');

interface SwHarness {
    listeners: Record<string, (event: { waitUntil: (p: Promise<unknown>) => void }) => void>;
    self: {
        skipWaiting: ReturnType<typeof vi.fn>;
        clients: { claim: ReturnType<typeof vi.fn> };
    };
    /** cacheName -> Set of URLs currently stored. Simulates the Cache_Store. */
    store: Map<string, Set<string>>;
    addAllCalls: Array<{ name: string; urls: string[] }>;
}

/**
 * Load public/sw.js into a fresh vm context and return a harness exposing the
 * captured event listeners, the mock `self`, and the simulated cache store.
 *
 * @param failingUrls URLs for which `cache.addAll` should reject (simulating a
 *                    failed precache of one or more App_Shell resources).
 * @param seed        Optional pre-existing cache entries (e.g. a prior version's
 *                    shell) used to prove retention on failed install.
 */
function loadServiceWorker(
    failingUrls: string[] = [],
    seed: Record<string, string[]> = {}
): SwHarness {
    const listeners: SwHarness['listeners'] = {};
    const store = new Map<string, Set<string>>();
    for (const [name, urls] of Object.entries(seed)) {
        store.set(name, new Set(urls));
    }
    const addAllCalls: SwHarness['addAllCalls'] = [];

    const self = {
        addEventListener(type: string, handler: SwHarness['listeners'][string]) {
            listeners[type] = handler;
        },
        skipWaiting: vi.fn(),
        clients: { claim: vi.fn(() => Promise.resolve()) },
    };

    const caches = {
        async open(name: string) {
            return {
                async addAll(urls: string[]) {
                    addAllCalls.push({ name, urls: [...urls] });
                    // All-or-nothing: validate the whole set first; reject before
                    // writing anything if any URL is in the failing set.
                    for (const url of urls) {
                        if (failingUrls.includes(url)) {
                            throw new Error(`failed to cache ${url}`);
                        }
                    }
                    if (!store.has(name)) store.set(name, new Set());
                    for (const url of urls) store.get(name)!.add(url);
                },
                async put() {
                    /* no-op */
                },
                async match() {
                    return undefined;
                },
            };
        },
        async keys() {
            return [...store.keys()];
        },
        async delete(name: string) {
            return store.delete(name);
        },
        async match() {
            return undefined;
        },
    };

    const sandbox: Record<string, unknown> = {
        self,
        caches,
        fetch: async () => {
            throw new Error('network unavailable in test');
        },
        Response,
        URL,
        console,
        setTimeout,
        clearTimeout,
    };

    vm.createContext(sandbox);
    vm.runInContext(SW_SOURCE, sandbox, { filename: 'sw.js' });

    return { listeners, self, store, addAllCalls };
}

function precacheCacheName(store: Map<string, Set<string>>): string | undefined {
    return [...store.keys()].find((name) => name.includes('precache'));
}

describe('Service Worker install — all-or-nothing precache (Req 1.4)', () => {
    it('registers install and activate handlers on load', () => {
        const { listeners } = loadServiceWorker();
        expect(typeof listeners.install).toBe('function');
        expect(typeof listeners.activate).toBe('function');
        expect(typeof listeners.fetch).toBe('function');
    });

    it('rejects the install promise when a precache resource fails', async () => {
        const { listeners } = loadServiceWorker(['/offline']);
        let waited: Promise<unknown> | undefined;
        listeners.install({ waitUntil: (p) => { waited = p; } });
        expect(waited).toBeDefined();
        await expect(waited).rejects.toThrow();
    });

    it('caches no partial shell when install fails (atomic precache)', async () => {
        const { listeners, store } = loadServiceWorker(['/icons/icon-192.png']);
        let waited: Promise<unknown> | undefined;
        listeners.install({ waitUntil: (p) => { waited = p; } });
        await expect(waited).rejects.toThrow();
        // The current-version precache cache must not have been created/populated.
        expect(precacheCacheName(store)).toBeUndefined();
    });

    it('retains a previously cached (older-version) shell when install fails', async () => {
        const priorShell = { 'lssb-precache-v0': ['/offline', '/LSSB_logo.png'] };
        const { listeners, store } = loadServiceWorker(['/offline'], priorShell);
        let waited: Promise<unknown> | undefined;
        listeners.install({ waitUntil: (p) => { waited = p; } });
        await expect(waited).rejects.toThrow();
        // Prior version's shell is untouched (activation is what would clean it up,
        // and a failed install never activates).
        expect(store.get('lssb-precache-v0')).toBeDefined();
        expect(store.get('lssb-precache-v0')!.has('/offline')).toBe(true);
    });

    it('does not run the activate handler as part of a failed install', async () => {
        const { listeners, self } = loadServiceWorker(['/offline']);
        let waited: Promise<unknown> | undefined;
        listeners.install({ waitUntil: (p) => { waited = p; } });
        await expect(waited).rejects.toThrow();
        // clients.claim() lives in activate; it must not have been invoked.
        expect(self.clients.claim).not.toHaveBeenCalled();
    });

    it('resolves the install promise and precaches every URL when none fail', async () => {
        const { listeners, self, store } = loadServiceWorker();
        let waited: Promise<unknown> | undefined;
        listeners.install({ waitUntil: (p) => { waited = p; } });
        await expect(waited).resolves.toBeUndefined();

        const name = precacheCacheName(store);
        expect(name).toBeTruthy();
        // The full App_Shell precache list should have been written.
        expect(store.get(name!)!.size).toBeGreaterThan(0);
        expect(store.get(name!)!.has('/offline')).toBe(true);
        expect(store.get(name!)!.has('/manifest.webmanifest')).toBe(true);
    });

    it('calls skipWaiting() during install', () => {
        const { listeners, self } = loadServiceWorker();
        listeners.install({ waitUntil: () => {} });
        expect(self.skipWaiting).toHaveBeenCalledTimes(1);
    });
});
