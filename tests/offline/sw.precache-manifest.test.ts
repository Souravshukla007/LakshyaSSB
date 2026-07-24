// Feature: offline-page-support (BUGFIX) — Task 4 supporting UNIT tests.
//
// **Validates: Requirements 2.1, 2.3**
//
// Unit coverage for the SERVED worker's build-time precache-manifest
// CONSUMPTION at install (public/sw.js → precacheFromManifest / precacheRoute).
// The design requires the per-page precache to be RESILIENT: a single page /
// chunk / RSC failure must NOT abort install (the critical app shell is the only
// all-or-nothing part — that atomicity is covered by sw.install.test.ts).
//
// Approach mirrors sw.install.test.ts: load the REAL public/sw.js into a
// sandboxed node:vm context with a mock Cache Storage + a mock `fetch` that
// serves a fabricated offline-manifest and can be told to FAIL for specific
// URLs. We drive the captured `install` handler and assert the resilience +
// routing-to-correct-cache contract against the real worker code.

import { describe, it, expect, vi } from 'vitest';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SW_SOURCE = readFileSync(resolve(process.cwd(), 'public', 'sw.js'), 'utf8');

const OFFLINE_MANIFEST_URL = '/offline-manifest.json';

// A small, fabricated manifest covering a few allowlisted routes. `document`
// and `rsc` are route strings (as the real generator emits); js/css are
// content-hashed static URLs.
const TEST_MANIFEST = {
  cacheVersion: 'v4',
  buildId: 'test-build',
  shared: ['/_next/static/chunks/shared-runtime.js', '/_next/static/chunks/framework.js'],
  routes: [
    {
      route: '/about',
      document: '/about',
      rsc: '/about',
      css: ['/_next/static/chunks/about.css'],
      js: ['/_next/static/chunks/about-page.js', '/_next/static/chunks/about-extra.js'],
    },
    {
      route: '/roadmap',
      document: '/roadmap',
      rsc: '/roadmap',
      css: ['/_next/static/chunks/roadmap.css'],
      js: ['/_next/static/chunks/roadmap-page.js'],
    },
    {
      route: '/ssb/day-5',
      document: '/ssb/day-5',
      rsc: '/ssb/day-5',
      css: [],
      js: ['/_next/static/chunks/day5-page.js'],
    },
  ],
};

interface Harness {
  listeners: Record<string, (event: { waitUntil: (p: Promise<unknown>) => void }) => void>;
  store: Map<string, Set<string>>;
  self: { skipWaiting: ReturnType<typeof vi.fn>; clients: { claim: ReturnType<typeof vi.fn> } };
  fetchedUrls: string[];
}

function keyOf(input: unknown): string {
  if (typeof input === 'string') return input;
  if (input && typeof input === 'object' && 'url' in (input as Record<string, unknown>)) {
    return String((input as { url: unknown }).url);
  }
  return String(input);
}

/**
 * @param opts.throwUrls   URLs (or route strings) whose `fetch` REJECTS.
 * @param opts.notOkUrls   URLs whose `fetch` resolves with `ok:false`.
 * @param opts.manifest    manifest object to serve at /offline-manifest.json;
 *                         pass `null` to make the manifest fetch reject.
 */
function loadServiceWorker(opts: {
  throwUrls?: string[];
  notOkUrls?: string[];
  manifest?: unknown;
} = {}): Harness {
  const throwUrls = new Set(opts.throwUrls ?? []);
  const notOkUrls = new Set(opts.notOkUrls ?? []);
  const manifest = 'manifest' in opts ? opts.manifest : TEST_MANIFEST;

  const listeners: Harness['listeners'] = {};
  const store = new Map<string, Set<string>>();
  const cachesByName = new Map<string, { addAll: (u: string[]) => Promise<void>; put: (r: unknown) => Promise<void>; match: () => Promise<undefined> }>();
  const fetchedUrls: string[] = [];

  function openCache(name: string) {
    if (!store.has(name)) store.set(name, new Set());
    if (!cachesByName.has(name)) {
      cachesByName.set(name, {
        async addAll(urls: string[]) {
          // Atomic (used for the critical shell + best-effort page docs).
          for (const u of urls) {
            if (throwUrls.has(u) || notOkUrls.has(u)) throw new Error(`addAll failed: ${u}`);
          }
          for (const u of urls) store.get(name)!.add(u);
        },
        async put(request: unknown) {
          store.get(name)!.add(keyOf(request));
        },
        async match() {
          return undefined;
        },
      });
    }
    return cachesByName.get(name)!;
  }

  const caches = {
    async open(name: string) {
      return openCache(name);
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

  function makeResponse(body: unknown, ok: boolean) {
    return {
      ok,
      type: 'basic',
      clone() {
        return this;
      },
      headers: {
        get(h: string) {
          return String(h).toLowerCase() === 'content-type' ? 'text/x-component' : null;
        },
      },
      async json() {
        return body;
      },
    };
  }

  const fetchMock = async (input: unknown) => {
    const url = keyOf(input);
    fetchedUrls.push(url);
    if (url === OFFLINE_MANIFEST_URL) {
      if (manifest === null) throw new Error('manifest fetch failed');
      return makeResponse(manifest, true);
    }
    if (throwUrls.has(url)) throw new Error(`fetch rejected: ${url}`);
    if (notOkUrls.has(url)) return makeResponse(null, false);
    return makeResponse(null, true);
  };

  const self = {
    addEventListener(type: string, handler: Harness['listeners'][string]) {
      listeners[type] = handler;
    },
    skipWaiting: vi.fn(),
    clients: { claim: vi.fn(async () => {}) },
  };

  // Browser-like Request shim: unlike Node/undici's global Request, a Service
  // Worker's `new Request('/about', ...)` accepts a RELATIVE URL (resolved
  // against the document base). The worker constructs exactly that for RSC
  // precache, so model it faithfully (store url + a case-insensitive headers.get).
  class SWRequest {
    url: string;
    headers: { get: (k: string) => string | null };
    constructor(input: string | { url: string }, init?: { headers?: Record<string, string> }) {
      this.url = typeof input === 'string' ? input : input.url;
      const h = init?.headers ?? {};
      this.headers = {
        get(k: string) {
          const key = String(k).toLowerCase();
          for (const hk of Object.keys(h)) if (hk.toLowerCase() === key) return h[hk];
          return null;
        },
      };
    }
  }

  const sandbox: Record<string, unknown> = {
    self,
    caches,
    fetch: fetchMock,
    Response,
    Request: SWRequest,
    URL,
    console,
    setTimeout,
    clearTimeout,
  };
  vm.createContext(sandbox);
  vm.runInContext(SW_SOURCE, sandbox, { filename: 'sw.js' });

  return { listeners, store, self, fetchedUrls };
}

async function runInstall(h: Harness): Promise<Promise<unknown>> {
  let waited: Promise<unknown> | undefined;
  h.listeners.install({ waitUntil: (p) => (waited = p) });
  expect(waited, 'install must call event.waitUntil(...)').toBeDefined();
  return waited!;
}

const STATIC = 'lssb-static-v4';
const PAGES = 'lssb-pages-v4';
const DATA = 'lssb-data-v4';

describe('install precache-manifest consumption — happy path (Req 2.3)', () => {
  it('precaches every route document (PAGES), chunk/CSS (STATIC), and RSC (DATA)', async () => {
    const h = loadServiceWorker();
    await expect(runInstall(h)).resolves.toBeUndefined();

    const pages = h.store.get(PAGES)!;
    const staticCache = h.store.get(STATIC)!;
    const data = h.store.get(DATA)!;

    // Documents → PAGES.
    for (const r of ['/about', '/roadmap', '/ssb/day-5']) {
      expect(pages.has(r), `document ${r} → PAGES`).toBe(true);
    }
    // Shared runtime chunks + per-route JS/CSS → STATIC.
    for (const asset of [
      '/_next/static/chunks/shared-runtime.js',
      '/_next/static/chunks/framework.js',
      '/_next/static/chunks/about-page.js',
      '/_next/static/chunks/about.css',
      '/_next/static/chunks/roadmap-page.js',
      '/_next/static/chunks/day5-page.js',
    ]) {
      expect(staticCache.has(asset), `${asset} → STATIC`).toBe(true);
    }
    // RSC payloads → DATA (keyed by the route URL).
    for (const r of ['/about', '/roadmap', '/ssb/day-5']) {
      expect(data.has(r), `RSC ${r} → DATA`).toBe(true);
    }
  });
});

describe('install precache-manifest consumption — resilience (Req 2.1, 2.3)', () => {
  it('a single chunk fetch failure does NOT abort install and does not block sibling assets', async () => {
    // /about-extra.js throws; /about-page.js + about.css + other routes must still land.
    const h = loadServiceWorker({ throwUrls: ['/_next/static/chunks/about-extra.js'] });
    await expect(runInstall(h)).resolves.toBeUndefined();

    const staticCache = h.store.get(STATIC)!;
    expect(staticCache.has('/_next/static/chunks/about-extra.js')).toBe(false); // failed
    expect(staticCache.has('/_next/static/chunks/about-page.js')).toBe(true); // sibling ok
    expect(staticCache.has('/_next/static/chunks/roadmap-page.js')).toBe(true); // other route ok
    expect(h.store.get(PAGES)!.has('/about')).toBe(true);
  });

  it('a failing RSC fetch for one route does not abort install; other routes keep their RSC', async () => {
    const h = loadServiceWorker({ throwUrls: ['/roadmap'] }); // /roadmap doc + RSC fetch throw
    await expect(runInstall(h)).resolves.toBeUndefined();

    const data = h.store.get(DATA)!;
    expect(data.has('/roadmap')).toBe(false); // failed RSC
    expect(data.has('/about')).toBe(true); // unaffected
    expect(data.has('/ssb/day-5')).toBe(true); // unaffected
  });

  it('a not-ok (HTTP error) asset response is skipped without aborting install', async () => {
    const h = loadServiceWorker({ notOkUrls: ['/_next/static/chunks/day5-page.js'] });
    await expect(runInstall(h)).resolves.toBeUndefined();

    const staticCache = h.store.get(STATIC)!;
    expect(staticCache.has('/_next/static/chunks/day5-page.js')).toBe(false);
    // Its document/RSC still cached; the route is simply missing one chunk.
    expect(h.store.get(PAGES)!.has('/ssb/day-5')).toBe(true);
    expect(h.store.get(DATA)!.has('/ssb/day-5')).toBe(true);
  });

  it('a completely missing manifest does NOT abort install (best-effort skip)', async () => {
    const h = loadServiceWorker({ manifest: null }); // manifest fetch rejects
    await expect(runInstall(h)).resolves.toBeUndefined();
    // The critical shell still installs (all-or-nothing succeeded).
    const precache = [...h.store.keys()].find((n) => n.includes('precache'));
    expect(precache).toBeTruthy();
    expect(h.store.get(precache!)!.has('/offline')).toBe(true);
  });

  it('still calls skipWaiting() during a manifest-driven install', async () => {
    const h = loadServiceWorker();
    await runInstall(h);
    expect(h.self.skipWaiting).toHaveBeenCalledTimes(1);
  });
});
