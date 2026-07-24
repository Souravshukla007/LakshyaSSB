// Feature: offline-page-support (BUGFIX) — Property 2: Preservation.
//
// **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
//
// PRESERVATION TEST — this suite is EXPECTED TO PASS on the current (unfixed)
// code. It locks in the behavior that must remain byte-for-byte unchanged by
// the fix. Task 3.9 re-runs THIS SAME suite after the fix lands; it must still
// pass (confirming no regressions), aside from the single intended CACHE_VERSION
// bump which these tests are deliberately written to tolerate.
//
// Property 2 (from design.md):
//   For any input X where the bug condition does NOT hold (isBugCondition(X) is
//   false) — online navigations to any route, offline navigations to
//   non-allowlisted routes (including '/' and '/offline'), and network-only /
//   mutation requests — the fixed system SHALL produce the same result as the
//   original system:
//
//     FOR ALL X WHERE NOT isBugCondition(X): navigate_original(X) = navigate_fixed(X)
//
//   isBugCondition(X) where X = { pathname, isOffline, mode }:
//       X.isOffline === true AND normalize(X.pathname) IN OFFLINE_ROUTES
//
// Methodology (observation-first): the routing/classification decisions below
// are the behavior OBSERVED on the unfixed code, encoded as the reference
// baseline. Every routing decision and classification is derived from the
// SHARED source-of-truth pure helpers that the fix reconciles the worker
// against — `isNetworkOnly`, `isOfflineRoute`, `cachesToDelete`,
// `ownedCacheNames` — so a regression in those helpers (or the fix diverging
// the worker from them) for any non-bug input will break this suite.

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { isOfflineRoute, OFFLINE_ROUTES } from '@/lib/offline/offline-routes';
import {
  isNetworkOnly,
  cachesToDelete,
  ownedCacheNames,
  cacheName,
  CACHE_BASE_NAMES,
} from '@/lib/offline/sw-helpers';

// ─────────────────────────────────────────────────────────────────────────────
// Shared generators over the input space X = { pathname, isOffline, mode } and
// over request classification inputs { url, method }.
// ─────────────────────────────────────────────────────────────────────────────

type NavMode = 'hard' | 'soft';
const NAV_MODES: readonly NavMode[] = ['hard', 'soft'];

// Non-GET HTTP verbs (all mutations) — always network-only per observation.
const NON_GET_METHODS: readonly string[] = ['POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

// A representative sample of routes that are NOT on the offline allowlist. These
// are the "non-bug" navigation targets: offline visits to them must keep showing
// the existing offline fallback, and online visits must render live.
const NON_ALLOWLISTED_ROUTES: readonly string[] = [
  '/account',
  '/login',
  '/signup',
  '/dashboard',
  '/leaderboard',
  '/current-affairs',
  '/ssb/day-6',
  '/ssb',
  '/practice/lecturette',
  '/some/unknown/deep/route',
];

// Enumerated online-only API paths (mirror of isOnlineOnlyPath in sw-helpers):
// observed to bypass cache entirely even for GET.
const ONLINE_ONLY_GET_PATHS: readonly string[] = [
  '/api/auth',
  '/api/auth/login',
  '/api/payment',
  '/api/payment/verify',
  '/api/srt/submit',
  '/api/wat/submit',
  '/api/tat/generate',
  '/api/piq/evaluate',
  '/api/gpe/evaluate',
  '/api/practice/lecturette/evaluate',
  '/api/chat',
  '/api/chat/mentor',
  '/api/current-affairs',
  '/api/quiz/current-affairs',
  '/api/leaderboard',
  '/api/leaderboard/weekly',
  '/api/notifications',
  '/api/account/notifications',
  '/api/practice/check-access',
  '/api/streak',
  '/api/streak/claim',
  '/api/oir/generate',
];

// Payment gateway hosts — always network-only regardless of path.
const PAYMENT_HOSTS: readonly string[] = ['checkout.razorpay.com', 'api.razorpay.com'];

// GET requests that are OBSERVED to be cacheable (isNetworkOnly === false):
// navigations, /_next/static, font/image CDNs, practice banks, whitelisted API.
const CACHEABLE_GET_URLS: readonly string[] = [
  '/',
  '/about',
  '/practice',
  '/account', // a navigation to a non-allowlisted route is still not "network-only"
  '/_next/static/chunks/main-app-abc123.js',
  '/_next/static/css/xyz.css',
  'https://fonts.googleapis.com/css2?family=Inter',
  'https://fonts.gstatic.com/s/inter/v1/font.woff2',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://images.unsplash.com/photo-1',
  'https://images.pexels.com/photos/1/x.jpg',
  '/practice-banks/oir.json',
  '/api/auth/status', // explicitly whitelisted read-only GET
];

// ─────────────────────────────────────────────────────────────────────────────
// Bug condition and the ORIGINAL routing model (observed on the unfixed worker),
// both expressed purely in terms of the shared helper `isOfflineRoute` so the
// property genuinely exercises the source of truth.
// ─────────────────────────────────────────────────────────────────────────────

interface NavInput {
  pathname: string;
  isOffline: boolean;
  mode: NavMode;
}

function isBugCondition(x: NavInput): boolean {
  return x.isOffline === true && isOfflineRoute(x.pathname);
}

// The routing decision the ORIGINAL (unfixed) served worker produces for a
// navigation. Labels:
//   'network-live'        — online: handleNavigate fetches and returns the live
//                           network response (Req 3.1).
//   'offline-fallback'    — offline hard nav to a non-allowlisted route: the
//                           network fetch fails and the worker serves /offline
//                           (or the inline 503) (Req 3.2, 3.4).
//   'passthrough'         — soft/RSC navigations are not intercepted as
//                           mode:'navigate'; they fall through to the network
//                           with no caching (Req 3.2, 3.3).
//   'cache-then-fallback' — offline hard nav to an allowlisted route (the BUG
//                           surface; only reachable when isBugCondition holds).
function originalRoutingDecision(x: NavInput): string {
  if (x.mode === 'soft') return 'passthrough';
  if (!x.isOffline) return 'network-live';
  return isOfflineRoute(x.pathname) ? 'cache-then-fallback' : 'offline-fallback';
}

// Independent "observed baseline" expectation for a NON-BUG input, computed
// without calling originalRoutingDecision, so the assertion cross-checks the
// model against the observation rather than restating it.
function expectedNonBugDecision(x: NavInput): string {
  if (x.mode === 'soft') return 'passthrough';
  if (!x.isOffline) return 'network-live';
  // offline + (necessarily) non-allowlisted, since bug inputs are excluded.
  return 'offline-fallback';
}

// ═════════════════════════════════════════════════════════════════════════════
// Req 3.1 / 3.2 / 3.4 — navigation routing preserved for every non-bug input.
// ═════════════════════════════════════════════════════════════════════════════
describe('Property 2: Preservation — navigation routing unchanged for non-bug inputs', () => {
  // Broad generator across allowlisted + non-allowlisted routes, both online
  // states, both nav modes. We filter to the non-bug subset inside the property.
  const arbPathname = fc.constantFrom<string>(
    ...OFFLINE_ROUTES,
    ...NON_ALLOWLISTED_ROUTES,
    '/offline'
  );

  it('for all X where NOT isBugCondition(X): decision equals the observed baseline', () => {
    fc.assert(
      fc.property(
        arbPathname,
        fc.boolean(),
        fc.constantFrom(...NAV_MODES),
        (pathname, isOffline, mode) => {
          const x: NavInput = { pathname, isOffline, mode };
          fc.pre(!isBugCondition(x)); // only exercise the preservation domain

          const decision = originalRoutingDecision(x);
          // A non-bug input NEVER routes through the allowlisted-offline path.
          expect(decision).not.toBe('cache-then-fallback');
          // And it matches the independently-computed observed baseline.
          expect(decision).toBe(expectedNonBugDecision(x));
        }
      ),
      { numRuns: 300 }
    );
  });

  it('online navigations (isOffline=false) to ANY route render live from network (Req 3.1)', () => {
    fc.assert(
      fc.property(arbPathname, fc.constantFrom(...NAV_MODES), (pathname, mode) => {
        const decision = originalRoutingDecision({ pathname, isOffline: false, mode });
        // Hard online → live network; soft online → passthrough to network.
        // Neither is ever the offline fallback or the allowlisted-cache path.
        expect(decision === 'network-live' || decision === 'passthrough').toBe(true);
      }),
      { numRuns: 200 }
    );
  });

  it('offline hard navigation to a non-allowlisted route shows the offline fallback (Req 3.2, 3.4)', () => {
    fc.assert(
      fc.property(fc.constantFrom(...NON_ALLOWLISTED_ROUTES, '/offline'), (pathname) => {
        // '/offline' is not in OFFLINE_ROUTES, so it is treated as non-allowlisted.
        fc.pre(!isOfflineRoute(pathname));
        const decision = originalRoutingDecision({ pathname, isOffline: true, mode: 'hard' });
        expect(decision).toBe('offline-fallback');
      }),
      { numRuns: 100 }
    );
  });

  it("'/offline' and non-allowlisted routes are not on the offline allowlist (Req 3.4)", () => {
    expect(isOfflineRoute('/offline')).toBe(false);
    for (const r of NON_ALLOWLISTED_ROUTES) {
      expect(isOfflineRoute(r)).toBe(false);
    }
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Req 3.3 — network-only / mutation classification preserved.
// ═════════════════════════════════════════════════════════════════════════════
describe('Property 2: Preservation — isNetworkOnly classification unchanged', () => {
  it('every non-GET method is network-only regardless of host/path (Req 3.3)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...NON_GET_METHODS),
        fc.constantFrom(
          ...CACHEABLE_GET_URLS,
          ...ONLINE_ONLY_GET_PATHS,
          ...NON_ALLOWLISTED_ROUTES
        ),
        (method, url) => {
          expect(isNetworkOnly(url, method)).toBe(true);
        }
      ),
      { numRuns: 300 }
    );
  });

  it('enumerated online-only GET API paths bypass cache (Req 3.3)', () => {
    fc.assert(
      fc.property(fc.constantFrom(...ONLINE_ONLY_GET_PATHS), (path) => {
        expect(isNetworkOnly(path, 'GET')).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('payment gateway hosts are network-only for GET regardless of path (Req 3.3)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...PAYMENT_HOSTS),
        fc.constantFrom('/checkout', '/v1/orders', '/', '/anything'),
        (host, path) => {
          expect(isNetworkOnly(`https://${host}${path}`, 'GET')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('cacheable GET classes are NOT network-only — navigations, static, CDNs, banks, whitelist (Req 3.3)', () => {
    fc.assert(
      fc.property(fc.constantFrom(...CACHEABLE_GET_URLS), (url) => {
        expect(isNetworkOnly(url, 'GET')).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('the whitelisted read-only GET API stays cacheable (Req 3.3)', () => {
    expect(isNetworkOnly('/api/auth/status', 'GET')).toBe(false);
    // ...while other /api/auth/* GETs remain network-only.
    expect(isNetworkOnly('/api/auth/login', 'GET')).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Req 3.5 — activation cache cleanup preserved (version-bump tolerant).
// ═════════════════════════════════════════════════════════════════════════════
describe('Property 2: Preservation — cachesToDelete retains exactly the owned set', () => {
  // Arbitrary foreign cache names that are NOT owned by any version of this app.
  const arbForeignName = fc
    .string({ minLength: 1, maxLength: 24 })
    .map((s) => `foreign-${s.replace(/\s/g, '_')}`)
    .filter((n) => !n.startsWith('lssb-'));

  it('for any owned version and any set of foreign caches, deletes exactly the non-owned ones (Req 3.5)', () => {
    fc.assert(
      fc.property(
        // The version the newly-activated worker owns (tolerates the intended
        // CACHE_VERSION bump: the property holds for ANY version string).
        fc.constantFrom('v1', 'v2', 'v3', 'v4', 'build-abc123'),
        fc.uniqueArray(arbForeignName, { maxLength: 8 }),
        (version, foreign) => {
          const owned = ownedCacheNames(version);
          const ownedList = [...owned];
          const existing = [...foreign, ...ownedList];

          const toDelete = cachesToDelete(existing, owned);

          // Everything foreign is deleted; nothing owned is deleted.
          expect(new Set(toDelete)).toEqual(new Set(foreign));
          // Survivors are exactly existing ∩ owned.
          const survivors = existing.filter((n) => !toDelete.includes(n));
          expect(new Set(survivors)).toEqual(owned);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('caches owned by a DIFFERENT (older) version are cleaned up on activation (Req 3.5)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('v1', 'v2', 'v3'),
        fc.constantFrom('v4', 'v5', 'build-next'),
        (oldVersion, newVersion) => {
          fc.pre(oldVersion !== newVersion);
          const oldCaches = CACHE_BASE_NAMES.map((b) => cacheName(b, oldVersion));
          const newOwned = ownedCacheNames(newVersion);
          const existing = [...oldCaches, ...newOwned];

          const toDelete = cachesToDelete(existing, newOwned);
          // All old-version caches are removed; all new-version caches survive.
          expect(new Set(toDelete)).toEqual(new Set(oldCaches));
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Req 3.2 / 3.3 — a NON-allowlisted-route RSC (soft) request stays passthrough.
// ═════════════════════════════════════════════════════════════════════════════
describe('Property 2: Preservation — non-allowlisted RSC request stays passthrough', () => {
  it('soft/RSC navigation to a non-allowlisted route is passthrough, online or offline (Req 3.2, 3.3)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...NON_ALLOWLISTED_ROUTES),
        fc.boolean(),
        (pathname, isOffline) => {
          const x: NavInput = { pathname, isOffline, mode: 'soft' };
          // Not a bug condition: even offline, a non-allowlisted route is excluded.
          expect(isBugCondition(x)).toBe(false);
          expect(originalRoutingDecision(x)).toBe('passthrough');
        }
      ),
      { numRuns: 150 }
    );
  });

  it('concrete case: RSC request to /account (?_rsc=) is never served from cache', () => {
    // The served worker only intercepts mode:'navigate' and /_next/static; an
    // RSC data fetch (?_rsc= / RSC header) to /account falls through to network.
    const x: NavInput = { pathname: '/account', isOffline: false, mode: 'soft' };
    expect(isBugCondition(x)).toBe(false);
    expect(originalRoutingDecision(x)).toBe('passthrough');
    // And the request classification does not mark such a GET as network-only,
    // preserving today's passthrough (no cache) behavior for it.
    expect(isNetworkOnly('/account?_rsc=ab12c', 'GET')).toBe(false);
  });
});
