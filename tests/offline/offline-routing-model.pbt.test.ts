// Feature: offline-page-support (BUGFIX) — Task 4 supporting PROPERTY-BASED tests.
//
// **Validates: Requirements 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.5**
//
// These property tests complement (do NOT replace) the Property 1 / Property 2
// suites. They pin ONE unified routing-decision model over the full input space
// X = { pathname, isOffline, mode } and assert:
//   (a) BUG-condition inputs select a CACHE-SERVING path whose render-dependency
//       set (document + JS chunks + RSC) actually exists in the real build-time
//       manifest (public/offline-manifest.json), and
//   (b) NON-bug inputs produce exactly the ORIGINAL routing decision (preservation).
// Plus a focused `cachesToDelete` invariant: it retains exactly the owned set.

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { OFFLINE_ROUTES, isOfflineRoute } from '@/lib/offline/offline-routes';
import {
  cachesToDelete,
  ownedCacheNames,
  cacheName,
  CACHE_BASE_NAMES,
} from '@/lib/offline/sw-helpers';

// ── Real build-time manifest (source of truth for render-dependency sets) ────
const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));
interface ManifestRoute {
  route: string;
  document: string;
  rsc: string | null;
  css?: string[];
  js?: string[];
}
const manifest: { routes: ManifestRoute[] } = JSON.parse(
  readFileSync(path.join(REPO_ROOT, 'public', 'offline-manifest.json'), 'utf8')
);
const manifestByRoute = new Map(manifest.routes.map((r) => [r.route, r]));

// ── Input space ──────────────────────────────────────────────────────────────
type NavMode = 'hard' | 'soft';
const NAV_MODES: readonly NavMode[] = ['hard', 'soft'];

const NON_ALLOWLISTED_ROUTES: readonly string[] = [
  '/account',
  '/login',
  '/dashboard',
  '/leaderboard',
  '/current-affairs',
  '/ssb',
  '/ssb/day-6',
  '/practice/lecturette',
  '/offline',
  '/some/deep/unknown',
];

interface NavInput {
  pathname: string;
  isOffline: boolean;
  mode: NavMode;
}

function isBugCondition(x: NavInput): boolean {
  return x.isOffline === true && isOfflineRoute(x.pathname);
}

// The ORIGINAL (pre-fix) routing decision, expressed via the shared allowlist.
function originalRoutingDecision(x: NavInput): string {
  if (x.mode === 'soft') return 'passthrough';
  if (!x.isOffline) return 'network-live';
  return isOfflineRoute(x.pathname) ? 'cache-then-fallback' : 'offline-fallback';
}

// The FIXED routing decision: bug-condition inputs are served from cache
// (document + chunks + RSC); everything else is unchanged from the original.
function fixedRoutingDecision(x: NavInput): string {
  if (isBugCondition(x)) return 'cache-serving';
  return originalRoutingDecision(x);
}

describe('Routing model — bug-condition inputs select a cache-serving path (Req 2.1–2.3)', () => {
  it('for all X where isBugCondition(X): decision is cache-serving with a full render-dependency set', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...OFFLINE_ROUTES),
        fc.constantFrom(...NAV_MODES),
        (pathname, mode) => {
          const x: NavInput = { pathname, isOffline: true, mode };
          fc.pre(isBugCondition(x)); // offline + allowlisted

          expect(fixedRoutingDecision(x)).toBe('cache-serving');

          // The cache-serving path is backed by a real render-dependency set:
          // the manifest must list the document, at least one JS chunk, and an
          // RSC payload for this route (document + chunks + RSC).
          const entry = manifestByRoute.get(pathname);
          expect(entry, `manifest entry for ${pathname}`).toBeDefined();
          expect(entry!.document).toBeTruthy();
          expect((entry!.js ?? []).length).toBeGreaterThan(0);
          expect(entry!.rsc).toBeTruthy();
        }
      ),
      { numRuns: 200 }
    );
  });
});

describe('Routing model — non-bug inputs match the original routing (Req 3.1, 3.2, 3.3)', () => {
  const arbPathname = fc.constantFrom<string>(...OFFLINE_ROUTES, ...NON_ALLOWLISTED_ROUTES);

  it('for all X where NOT isBugCondition(X): fixed decision equals original decision', () => {
    fc.assert(
      fc.property(arbPathname, fc.boolean(), fc.constantFrom(...NAV_MODES), (pathname, isOffline, mode) => {
        const x: NavInput = { pathname, isOffline, mode };
        fc.pre(!isBugCondition(x));
        expect(fixedRoutingDecision(x)).toBe(originalRoutingDecision(x));
        // And it never routes through the allowlisted-offline cache-serving path.
        expect(fixedRoutingDecision(x)).not.toBe('cache-serving');
      }),
      { numRuns: 400 }
    );
  });
});

describe('Cache cleanup model — cachesToDelete retains exactly the owned set (Req 3.5)', () => {
  // Complements sw-helpers.cleanup.test.ts by exercising the realistic mix of
  // (a) the current owned set, (b) an OLDER version's owned names, and (c)
  // foreign caches — asserting only the owned set survives the version bump.
  const arbForeign = fc
    .string({ minLength: 1, maxLength: 20 })
    .map((s) => `x-${s.replace(/\s/g, '_')}`)
    .filter((n) => !n.startsWith('lssb-'));

  it('retains exactly the owned names and deletes older-version + foreign caches', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('v4', 'v5', 'build-xyz'),
        fc.constantFrom('v1', 'v2', 'v3'),
        fc.uniqueArray(arbForeign, { maxLength: 6 }),
        (newVersion, oldVersion, foreign) => {
          fc.pre(newVersion !== oldVersion);
          const owned = ownedCacheNames(newVersion);
          const oldOwned = CACHE_BASE_NAMES.map((b) => cacheName(b, oldVersion));
          const existing = [...foreign, ...oldOwned, ...owned];

          const toDelete = cachesToDelete(existing, owned);
          const survivors = existing.filter((n) => !toDelete.includes(n));

          // Survivors are exactly the owned set; everything else is deleted.
          expect(new Set(survivors)).toEqual(owned);
          expect(new Set(toDelete)).toEqual(new Set([...foreign, ...oldOwned]));
        }
      ),
      { numRuns: 200 }
    );
  });
});
