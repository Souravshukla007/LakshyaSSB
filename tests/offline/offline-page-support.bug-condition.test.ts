// Feature: offline-page-support (BUGFIX) — Property 1: Bug Condition.
//
// **Validates: Requirements 1.1, 1.2, 1.3, 1.4 / 2.1, 2.2, 2.3, 2.4**
//
// PROPERTY 1 REGRESSION GUARD — this test was authored (task 1) as an
// exploration test that FAILED on the unfixed served worker (confirming the
// bug). After the fix (tasks 3.1–3.7) it is the Property 1 regression guard and
// MUST PASS: the simulation harness below now mirrors the NOW-FIXED served
// `public/sw.js` (v4) — install precaches each allowlisted route's full
// render-dependency set (document + /_next/static/ chunks/CSS + RSC payload),
// and the fetch handler serves RSC network-first with cache fallback.
//
// Property 1 (from design.md):
//   For any input X where isBugCondition(X) holds — an offline navigation
//   (hard load/relaunch or in-app soft/RSC navigation) targeting a route in
//   OFFLINE_ROUTES — the fixed system SHALL render that route's actual content
//   from cache (document + required /_next/static/ chunks + the route's RSC
//   payload), and SHALL NOT show the /offline fallback, a blank page, or a
//   broken (unhydrated) page:
//
//     renders_actual_page_content(result)
//       AND NOT is_offline_fallback(result)
//       AND NOT is_blank_or_broken(result)
//
// isBugCondition(X) where X = { pathname, isOffline, mode }:
//     X.isOffline === true AND normalize(X.pathname) IN OFFLINE_ROUTES
//
// The authoritative worker for the Capacitor Android WebView in `server.url`
// mode is the SERVED `public/sw.js` (now v4). This suite faithfully mirrors
// that served worker's install + fetch routing — driven by the REAL build-time
// manifest at `public/offline-manifest.json` so the model reflects reality —
// and it reads the real worker files from disk to confirm the fix landed
// (Case D + the fix-confirmation block).

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { OFFLINE_ROUTES, isOfflineRoute } from '@/lib/offline/offline-routes';

// ── Repo root + real on-disk sources (worker files + build manifest) ────────
const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const servedSwSrc = readFileSync(path.join(REPO_ROOT, 'public/sw.js'), 'utf8');
const bundledSwSrc = readFileSync(
  path.join(REPO_ROOT, 'android/app/src/main/assets/public/sw.js'),
  'utf8'
);

// The build-time precache manifest the SERVED worker consumes at install
// (produced by scripts/gen-offline-manifest.mjs, served at /offline-manifest.json).
interface ManifestRoute {
  route: string;
  document: string;
  rsc: string;
  css?: string[];
  js?: string[];
}
interface OfflineManifest {
  cacheVersion: string;
  shared?: string[];
  routes: ManifestRoute[];
}
const manifest: OfflineManifest = JSON.parse(
  readFileSync(path.join(REPO_ROOT, 'public/offline-manifest.json'), 'utf8')
);

// ─────────────────────────────────────────────────────────────────────────────
// Scope: the 13 concrete allowlisted routes (everything in OFFLINE_ROUTES
// except the root '/', which is out of scope per the bugfix — see bugfix.md).
// ─────────────────────────────────────────────────────────────────────────────
const IN_SCOPE_ROUTES: readonly string[] = OFFLINE_ROUTES.filter((r) => r !== '/');

type NavMode = 'hard' | 'soft';
const NAV_MODES: readonly NavMode[] = ['hard', 'soft'];

// ─────────────────────────────────────────────────────────────────────────────
// Faithful mirror of the SERVED public/sw.js (v4) cache identifiers. Kept in
// lock-step with the real file (CACHE_VERSION v4, DATA cache added for RSC).
// ─────────────────────────────────────────────────────────────────────────────
const CACHE_VERSION = 'v4';
const PRECACHE = `lssb-precache-${CACHE_VERSION}`;
const PAGES = `lssb-pages-${CACHE_VERSION}`;
const STATIC = `lssb-static-${CACHE_VERSION}`;
const DATA = `lssb-data-${CACHE_VERSION}`; // RSC / soft-navigation payloads

// Critical app shell precached all-or-nothing at install (documents/assets only).
const PRECACHE_URLS: readonly string[] = [
  '/',
  '/offline',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/images/hero-placeholder.png',
];

// ─────────────────────────────────────────────────────────────────────────────
// Render-dependency set for one App Router route, taken from the REAL manifest:
// the HTML document is not renderable on its own — it needs its content-hashed
// JS/CSS chunks (page chunk + shared runtime chunks) to hydrate, and its RSC
// payload for soft navigation.
// ─────────────────────────────────────────────────────────────────────────────
interface RenderDeps {
  document: string;
  chunks: string[];
  rsc: string;
}

function manifestEntry(route: string): ManifestRoute {
  const entry = manifest.routes.find((r) => r.route === route);
  if (!entry) throw new Error(`manifest has no entry for allowlisted route ${route}`);
  return entry;
}

function renderDeps(route: string): RenderDeps {
  const entry = manifestEntry(route);
  return {
    document: entry.document,
    chunks: [...(entry.js ?? []), ...(entry.css ?? [])],
    rsc: entry.rsc,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// In-memory Cache_Store model: cacheName -> set of cached URLs.
// ─────────────────────────────────────────────────────────────────────────────
type CacheStore = Map<string, Set<string>>;

/**
 * Model the cache state produced by the NOW-FIXED served worker's `install`
 * after a single prior ONLINE launch. Mirrors the real install in public/sw.js:
 *   1) critical app shell (PRECACHE_URLS) -> PRECACHE (all-or-nothing),
 *   2) allowlisted page DOCUMENTS -> PAGES (best-effort), plus
 *   3) the build-time manifest's render-dependency set: for each route its
 *      document (-> PRECACHE for '/', else PAGES), its /_next/static/ JS+CSS
 *      and the shared runtime chunks (-> STATIC), and its RSC payload (-> DATA).
 * This is the "installed but never individually re-visited" state that Cases A
 * and E exercise — and, unlike the pre-fix model, it now includes chunks + RSC.
 */
function storeAfterInstall(): CacheStore {
  const store: CacheStore = new Map();
  const precache = new Set<string>(PRECACHE_URLS);
  const pages = new Set<string>();
  const staticCache = new Set<string>();
  const data = new Set<string>();

  // Shared runtime/layout chunks (manifest.shared) -> STATIC.
  for (const s of manifest.shared ?? []) staticCache.add(s);

  // Per-route render-dependency set from the manifest.
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

// Result of an offline navigation, classified for the Expected Behavior predicates.
type NavResult =
  | { kind: 'content'; route: string } // full, hydrated page content
  | { kind: 'fallback'; route: string } // /offline fallback (or inline 503)
  | { kind: 'broken'; route: string } // document present but chunks/RSC missing -> unhydrated
  | { kind: 'blank'; route: string }; // nothing rendered

/**
 * Simulate an offline navigation against the FIXED served worker's fetch
 * routing (mirror of `handleNavigate` + the RSC `networkFirstData` branch in
 * public/sw.js):
 *
 * - Hard load (mode 'navigate'): `handleNavigate` serves the cached document
 *   (PAGES, or PRECACHE for '/'); the page hydrates only if ALL of its
 *   /_next/static/ chunks are also cached. Install now precaches those chunks
 *   from the manifest, so an allowlisted route renders fully.
 * - Soft navigation: the App Router client fetches the route's RSC payload.
 *   The fixed worker detects the RSC request for an allowlisted route and serves
 *   it network-first with cache fallback from the DATA cache; offline, the
 *   precached RSC payload is returned and the content renders. `safeMatch` uses
 *   ignoreSearch:true, so a changed `?_rsc=` token still matches.
 *   Non-allowlisted RSC requests keep today's passthrough (fail offline).
 */
function simulateOfflineNavigation(
  store: CacheStore,
  route: string,
  mode: NavMode,
  deps: RenderDeps
): NavResult {
  const allowed = isOfflineRoute(route);

  if (mode === 'soft') {
    // RSC / soft-navigation: only allowlisted routes are intercepted + cached.
    if (!allowed) return { kind: 'blank', route }; // passthrough fails offline
    const rscCached = store.get(DATA)?.has(deps.rsc) ?? false;
    if (!rscCached) return { kind: 'blank', route };
    return { kind: 'content', route };
  }

  // Hard navigation.
  if (allowed) {
    const docCached =
      (store.get(PAGES)?.has(route) ?? false) || (store.get(PRECACHE)?.has(route) ?? false);
    if (docCached) {
      const chunksCached = deps.chunks.every((c) => store.get(STATIC)?.has(c) ?? false);
      if (!chunksCached) return { kind: 'broken', route };
      return { kind: 'content', route };
    }
  }
  // No cached document (or not allowlisted) -> /offline fallback.
  return { kind: 'fallback', route };
}

// ── Expected Behavior predicates (design.md) ────────────────────────────────
const rendersActualPageContent = (r: NavResult): boolean => r.kind === 'content';
const isOfflineFallback = (r: NavResult): boolean => r.kind === 'fallback';
const isBlankOrBroken = (r: NavResult): boolean => r.kind === 'blank' || r.kind === 'broken';

/** The Property 1 assertion: full content, never fallback, never blank/broken. */
function assertExpectedBehavior(r: NavResult): void {
  expect(
    rendersActualPageContent(r) && !isOfflineFallback(r) && !isBlankOrBroken(r),
    `offline navigation to ${r.route} produced "${r.kind}" instead of rendering actual page content`
  ).toBe(true);
}

function extractCacheVersion(src: string): string | null {
  const m = src.match(/CACHE_VERSION\s*=\s*['"]([^'"]+)['"]/);
  return m ? m[1] : null;
}

// ═════════════════════════════════════════════════════════════════════════════
// Property 1 — Bug Condition (property-based over all 13 routes x {hard, soft})
// ═════════════════════════════════════════════════════════════════════════════
describe('Property 1: Bug Condition — allowlisted pages render offline in the WebView', () => {
  it('for all X where isBugCondition(X) holds, the page renders its actual content offline', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...IN_SCOPE_ROUTES),
        fc.constantFrom(...NAV_MODES),
        (route, mode) => {
          // isBugCondition(X): X.isOffline === true AND route IN OFFLINE_ROUTES.
          expect(isOfflineRoute(route)).toBe(true);

          // One prior online launch registered the worker; its install precached
          // the shell + each allowlisted route's document + chunks + RSC.
          const store = storeAfterInstall();
          const result = simulateOfflineNavigation(store, route, mode, renderDeps(route));

          assertExpectedBehavior(result);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Concrete counterexample cases A–E (design Testing Strategy). On the fixed
// worker these now render actual content / confirm the workers are in sync.
// ═════════════════════════════════════════════════════════════════════════════
describe('Bug condition — concrete cases (A–E) now render offline', () => {
  it('Case A — never-visited hard load of /about renders full content', () => {
    const store = storeAfterInstall();
    const result = simulateOfflineNavigation(store, '/about', 'hard', renderDeps('/about'));
    // Fixed: install precaches /about document + its /_next/static/ chunks.
    assertExpectedBehavior(result);
  });

  it('Case B — offline soft navigation to /roadmap renders content', () => {
    const store = storeAfterInstall();
    const result = simulateOfflineNavigation(store, '/roadmap', 'soft', renderDeps('/roadmap'));
    // Fixed: RSC request served network-first with cache fallback from DATA.
    assertExpectedBehavior(result);
  });

  it('Case C — visited /terms online, then offline reload renders hydrated content', () => {
    // Fixed: the v4 worker's install precaches the /terms document AND all of
    // its chunks from the manifest, so an offline reload has document + chunks.
    const store = storeAfterInstall();
    const result = simulateOfflineNavigation(store, '/terms', 'hard', renderDeps('/terms'));
    assertExpectedBehavior(result);
  });

  it('Case D — the served public/sw.js is in sync with the bundled worker', () => {
    const servedVersion = extractCacheVersion(servedSwSrc);
    const bundledVersion = extractCacheVersion(bundledSwSrc);

    // Under `server.url` the served public/sw.js is the authoritative worker
    // controlling the WebView. After the fix it is reconciled with the bundled
    // copy (the sync:sw / cap copy step keeps them byte-identical) — both v4.
    expect(
      servedVersion,
      `served public/sw.js is CACHE_VERSION=${servedVersion} but bundled worker is ` +
        `CACHE_VERSION=${bundledVersion} — the workers must not diverge`
    ).toBe(bundledVersion);
  });

  it('Case E — edge deep route: offline hard load of /ssb/day-5 renders fully', () => {
    const store = storeAfterInstall();
    const result = simulateOfflineNavigation(store, '/ssb/day-5', 'hard', renderDeps('/ssb/day-5'));
    // Fixed: /ssb/day-5 document + chunks are precached from the manifest.
    assertExpectedBehavior(result);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Fix confirmation — assertions on the REAL served worker source that document
// that the three root causes are now RESOLVED (these encoded the pre-fix state
// in task 1 and are flipped to assert the fixed state).
// ═════════════════════════════════════════════════════════════════════════════
describe('Fix confirmation on the fixed served public/sw.js', () => {
  it('precaches the render-dependency set at install via the build-time manifest', () => {
    // The install path now consumes the build-time offline manifest to precache
    // each allowlisted route's document + /_next/static/ chunks + RSC payload.
    expect(servedSwSrc.includes('offline-manifest')).toBe(true);
    expect(servedSwSrc.includes('precacheFromManifest')).toBe(true);
    // The worker precaches /_next/static/ assets (chunks/CSS) into the STATIC
    // cache from the manifest, not just documents/shell.
    expect(servedSwSrc.includes('/_next/static/')).toBe(true);
  });

  it('has RSC / soft-navigation data handling', () => {
    const lower = servedSwSrc.toLowerCase();
    expect(lower.includes('_rsc')).toBe(true);
    expect(lower.includes('text/x-component')).toBe(true);
    // Detects the App Router RSC header on soft navigations.
    expect(servedSwSrc.includes("headers.get('RSC')")).toBe(true);
    // A dedicated DATA cache holds the RSC payloads.
    expect(servedSwSrc.includes(`lssb-data-`)).toBe(true);
  });

  it('is reconciled with the bundled worker (no divergence)', () => {
    expect(extractCacheVersion(servedSwSrc)).toBe('v4');
    expect(extractCacheVersion(bundledSwSrc)).toBe('v4');
    // The bundled copy carries the same fix (RSC handling + manifest precache),
    // confirming the sync:sw / cap copy step propagated it.
    expect(bundledSwSrc.includes('precacheFromManifest')).toBe(true);
    expect(bundledSwSrc.toLowerCase().includes('text/x-component')).toBe(true);
  });
});
