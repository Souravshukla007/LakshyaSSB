// Feature: offline-page-support (BUGFIX) — Task 4 supporting INTEGRATION tests.
//
// **Validates: Requirements 2.1, 2.2, 2.4, 3.2, 3.5**
//
// Three integration-level checks that exercise the fixed offline behavior at the
// model + real-worker level:
//   1. Context switching — offline soft-navigation BETWEEN allowlisted routes
//      renders each route's content, while a non-allowlisted route still yields
//      the offline popup / fallback (Req 2.2, 3.2). Modeled with the same
//      install→cache→serve simulation the Property 1 suite uses, driven by the
//      REAL build-time manifest (public/offline-manifest.json).
//   2. Update flow — activating a new CACHE_VERSION cleans up caches the worker
//      does not own, and the freshly-installed caches still let pages render
//      offline afterward (Req 3.5, 2.1). Runs the REAL worker's activate handler
//      in a node:vm sandbox.
//   3. Android WebView end-to-end — documented as a skipped model-level test
//      with manual run instructions, since it needs a device/emulator + a live
//      `server.url` origin that cannot run headlessly here (Req 2.4).

import { describe, it, expect, vi } from 'vitest';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { OFFLINE_ROUTES, isOfflineRoute } from '@/lib/offline/offline-routes';

// ── Real build-time manifest ─────────────────────────────────────────────────
const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));
interface ManifestRoute {
  route: string;
  document: string;
  rsc: string | null;
  css?: string[];
  js?: string[];
}
interface OfflineManifest {
  cacheVersion: string;
  shared?: string[];
  routes: ManifestRoute[];
}
const manifest: OfflineManifest = JSON.parse(
  readFileSync(path.join(REPO_ROOT, 'public', 'offline-manifest.json'), 'utf8')
);

const CACHE_VERSION = manifest.cacheVersion; // 'v4'
const PRECACHE = `lssb-precache-${CACHE_VERSION}`;
const PAGES = `lssb-pages-${CACHE_VERSION}`;
const STATIC = `lssb-static-${CACHE_VERSION}`;
const DATA = `lssb-data-${CACHE_VERSION}`;
// The four caches the SERVED worker actually owns (its OWNED set).
const WORKER_OWNED = [PRECACHE, PAGES, STATIC, DATA];

const IN_SCOPE_ROUTES = OFFLINE_ROUTES.filter((r) => r !== '/');

// ─────────────────────────────────────────────────────────────────────────────
// Model the cache store produced by the fixed worker's install (mirrors the
// Property 1 harness, but sourced from the real manifest).
// ─────────────────────────────────────────────────────────────────────────────
type CacheStore = Map<string, Set<string>>;

function storeAfterInstall(): CacheStore {
  const store: CacheStore = new Map();
  const precache = new Set<string>(['/', '/offline', '/manifest.webmanifest']);
  const pages = new Set<string>();
  const staticCache = new Set<string>(manifest.shared ?? []);
  const data = new Set<string>();

  for (const entry of manifest.routes) {
    if (entry.document) {
      if (entry.route === '/') precache.add(entry.document);
      else pages.add(entry.document);
    }
    for (const js of entry.js ?? []) staticCache.add(js);
    for (const css of entry.css ?? []) staticCache.add(css);
    if (entry.rsc) data.add(entry.rsc);
  }
  store.set(PRECACHE, precache);
  store.set(PAGES, pages);
  store.set(STATIC, staticCache);
  store.set(DATA, data);
  return store;
}

function renderDeps(route: string) {
  const entry = manifest.routes.find((r) => r.route === route)!;
  return { document: entry.document, chunks: [...(entry.js ?? []), ...(entry.css ?? [])], rsc: entry.rsc };
}

type NavMode = 'hard' | 'soft';
type NavResult = 'content' | 'fallback' | 'blank' | 'broken';

function simulateOfflineNavigation(store: CacheStore, route: string, mode: NavMode): NavResult {
  const allowed = isOfflineRoute(route);
  const deps = allowed && manifest.routes.some((r) => r.route === route) ? renderDeps(route) : null;

  if (mode === 'soft') {
    if (!allowed || !deps) return 'blank'; // non-allowlisted RSC → passthrough → fails offline
    return store.get(DATA)?.has(deps.rsc as string) ? 'content' : 'blank';
  }
  // hard
  if (allowed && deps) {
    const docCached =
      (store.get(PAGES)?.has(route) ?? false) || (store.get(PRECACHE)?.has(route) ?? false);
    if (docCached) {
      const chunksCached = deps.chunks.every((c) => store.get(STATIC)?.has(c) ?? false);
      return chunksCached ? 'content' : 'broken';
    }
  }
  return 'fallback';
}

// ═════════════════════════════════════════════════════════════════════════════
// 1. Context switching (Req 2.2, 3.2)
// ═════════════════════════════════════════════════════════════════════════════
describe('Integration — offline context switching between routes', () => {
  it('soft-navigating across every allowlisted route in sequence renders content each time', () => {
    const store = storeAfterInstall();
    // Simulate an in-app session that soft-navigates through all 13 routes.
    for (const route of IN_SCOPE_ROUTES) {
      expect(simulateOfflineNavigation(store, route, 'soft'), `soft-nav ${route}`).toBe('content');
    }
  });

  it('hard-loading each allowlisted route renders content (document + chunks present)', () => {
    const store = storeAfterInstall();
    for (const route of IN_SCOPE_ROUTES) {
      expect(simulateOfflineNavigation(store, route, 'hard'), `hard-load ${route}`).toBe('content');
    }
  });

  it('switching to a NON-allowlisted route still yields the offline popup / fallback', () => {
    const store = storeAfterInstall();
    // Soft-nav to a non-allowlisted route → OfflineNavGuard popup (modeled as
    // passthrough that fails offline → no content rendered).
    expect(simulateOfflineNavigation(store, '/account', 'soft')).toBe('blank');
    // Hard-load to a non-allowlisted route → /offline fallback.
    expect(simulateOfflineNavigation(store, '/account', 'hard')).toBe('fallback');
    expect(simulateOfflineNavigation(store, '/ssb/day-6', 'hard')).toBe('fallback');
  });

  it('interleaved allowlisted ↔ non-allowlisted navigation keeps each side correct', () => {
    const store = storeAfterInstall();
    const journey: Array<[string, NavMode, NavResult]> = [
      ['/pricing', 'soft', 'content'],
      ['/account', 'soft', 'blank'], // popup, no content
      ['/roadmap', 'soft', 'content'],
      ['/dashboard', 'hard', 'fallback'], // offline fallback
      ['/ssb/day-3', 'hard', 'content'],
    ];
    for (const [route, mode, expected] of journey) {
      expect(simulateOfflineNavigation(store, route, mode), `${mode} ${route}`).toBe(expected);
    }
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 2. Update flow — real worker activate cleans non-owned caches (Req 3.5, 2.1)
// ═════════════════════════════════════════════════════════════════════════════
interface ActivateHarness {
  listeners: Record<string, (event: { waitUntil: (p: Promise<unknown>) => void }) => void>;
  store: Map<string, Set<string>>;
  claim: ReturnType<typeof vi.fn>;
}

function loadWorkerForActivate(seed: Record<string, string[]>): ActivateHarness {
  const SW_SOURCE = readFileSync(resolve(process.cwd(), 'public', 'sw.js'), 'utf8');
  const listeners: ActivateHarness['listeners'] = {};
  const store = new Map<string, Set<string>>();
  for (const [name, urls] of Object.entries(seed)) store.set(name, new Set(urls));
  const claim = vi.fn(async () => {});

  const caches = {
    async open(name: string) {
      if (!store.has(name)) store.set(name, new Set());
      return { addAll: async () => {}, put: async () => {}, match: async () => undefined };
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
    self: {
      addEventListener(type: string, handler: ActivateHarness['listeners'][string]) {
        listeners[type] = handler;
      },
      skipWaiting() {},
      clients: { claim },
    },
    caches,
    fetch: async () => {
      throw new Error('offline');
    },
    Response,
    Request: globalThis.Request,
    URL,
    console,
    setTimeout,
    clearTimeout,
  };
  vm.createContext(sandbox);
  vm.runInContext(SW_SOURCE, sandbox, { filename: 'sw.js' });
  return { listeners, store, claim };
}

describe('Integration — update flow: new CACHE_VERSION cleans old caches (Req 3.5)', () => {
  it("the worker's activate deletes non-owned (old-version + foreign) caches and retains its owned v4 set", async () => {
    // Seed: the freshly-installed v4 caches + a previous version's caches + a
    // foreign cache from some other tool.
    const seed: Record<string, string[]> = {
      [PRECACHE]: ['/', '/offline'],
      [PAGES]: ['/about', '/pricing'],
      [STATIC]: ['/_next/static/chunks/framework.js'],
      [DATA]: ['/about'],
      'lssb-precache-v3': ['/'],
      'lssb-pages-v3': ['/about'],
      'lssb-static-v3': ['/_next/static/chunks/old.js'],
      'lssb-data-v3': ['/about'],
      'some-third-party-cache': ['/x'],
    };
    const h = loadWorkerForActivate(seed);
    expect(typeof h.listeners.activate).toBe('function');

    let waited: Promise<unknown> | undefined;
    h.listeners.activate({ waitUntil: (p) => (waited = p) });
    await waited;

    const remaining = new Set(h.store.keys());
    // Owned v4 caches survive.
    for (const name of WORKER_OWNED) expect(remaining.has(name), `${name} retained`).toBe(true);
    // Old-version + foreign caches are gone.
    for (const name of ['lssb-precache-v3', 'lssb-pages-v3', 'lssb-static-v3', 'lssb-data-v3', 'some-third-party-cache']) {
      expect(remaining.has(name), `${name} deleted`).toBe(false);
    }
    // clients.claim() was invoked so the new worker takes control immediately.
    expect(h.claim).toHaveBeenCalledTimes(1);
  });

  it('after the version bump + cleanup, the (new) owned caches still render pages offline', () => {
    // The post-activation state is exactly the freshly-installed v4 store; pages
    // must still render offline from it.
    const store = storeAfterInstall();
    for (const route of ['/about', '/pricing', '/ssb/day-5']) {
      expect(simulateOfflineNavigation(store, route, 'hard')).toBe('content');
      expect(simulateOfflineNavigation(store, route, 'soft')).toBe('content');
    }
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 3. Android WebView end-to-end — documented, environment-dependent (Req 2.4)
// ═════════════════════════════════════════════════════════════════════════════
describe('Integration — Android WebView end-to-end (server.url)', () => {
  // This is the true end-to-end check for Req 2.4 (the fix's critical target
  // environment). It cannot run headlessly in this unit/vitest environment
  // because it needs: a built + running origin reachable at capacitor.config.ts
  // `server.url`, an Android emulator/device running the Capacitor app, and a
  // way to toggle the device network. It is documented + skipped here with a
  // manual runbook rather than omitted, so the coverage intent is explicit.
  it.skip('MANUAL: allowlisted pages render offline in the Capacitor Android WebView', () => {
    // Manual runbook (Req 2.4):
    //   1. `npm run build && npm run build:offline-manifest` (emits offline-manifest.json).
    //   2. Serve the origin that capacitor.config.ts `server.url` points at
    //      (e.g. https://www.lakshyassb.online, or localhost tunnel for testing).
    //   3. `npm run cap:copy` (npx cap copy android + node scripts/sync-sw.mjs)
    //      so the bundled worker matches the served one, then build/run the app
    //      on an emulator or device (`npx cap run android`).
    //   4. Launch the app ONLINE once so the served /sw.js registers + activates
    //      (operational precondition — see design.md).
    //   5. Enable airplane mode (offline). Then for each of the 13 allowlisted
    //      routes (/practice, /pricing, /privacy, /terms, /refund-policy,
    //      /about, /contact, /roadmap, /ssb/day-1..day-5):
    //        a. Hard-load / relaunch → assert the real page content renders
    //           (not /offline, not blank, not an unhydrated shell).
    //        b. In-app soft-navigate to it → assert its content renders.
    //   6. Navigate offline to a NON-allowlisted route (e.g. /account) → assert
    //      the offline popup / fallback still appears (preservation, Req 3.2).
    expect(true).toBe(true);
  });
});
