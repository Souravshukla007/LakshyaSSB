// Feature: offline-page-support (BUGFIX) — Task 4 supporting UNIT tests.
//
// **Validates: Requirements 2.1, 2.2, 3.2**
//
// Focused unit coverage of the offline ALLOWLIST membership + normalization
// helper `isOfflineRoute` (lib/offline/offline-routes.ts). This is the single
// source of truth mirrored verbatim into public/sw.js, so every allowlisted
// route must be recognised (with and without a trailing slash) and every
// representative non-allowlisted route must be rejected. The property-based
// suites exercise routing decisions built ON TOP of this helper; here we pin
// the helper's exact input→output contract with concrete examples.

import { describe, it, expect } from 'vitest';
import { OFFLINE_ROUTES, isOfflineRoute } from '@/lib/offline/offline-routes';

// The 13 concrete in-scope allowlisted routes from bugfix.md (everything in
// OFFLINE_ROUTES except the root '/', which is out of scope for the fix but is
// still an allowlisted route for membership purposes).
const IN_SCOPE_ROUTES: readonly string[] = [
  '/practice',
  '/pricing',
  '/privacy',
  '/terms',
  '/refund-policy',
  '/about',
  '/contact',
  '/roadmap',
  '/ssb/day-1',
  '/ssb/day-2',
  '/ssb/day-3',
  '/ssb/day-4',
  '/ssb/day-5',
];

// Representative routes that are NOT on the offline allowlist.
const NON_ALLOWLISTED_ROUTES: readonly string[] = [
  '/offline',
  '/account',
  '/login',
  '/signup',
  '/dashboard',
  '/leaderboard',
  '/current-affairs',
  '/ssb',
  '/ssb/day-6',
  '/ssb/day-0',
  '/practice/lecturette',
  '/pricing/extra',
  '/about-us',
  '/some/unknown/deep/route',
  '/api/auth/status',
];

describe('isOfflineRoute — allowlist membership (Req 2.1, 2.2)', () => {
  it('recognises every one of the 13 in-scope allowlisted routes', () => {
    for (const route of IN_SCOPE_ROUTES) {
      expect(isOfflineRoute(route), `${route} should be allowlisted`).toBe(true);
    }
  });

  it("recognises the root '/' allowlisted route", () => {
    expect(isOfflineRoute('/')).toBe(true);
  });

  it('recognises all 14 entries declared in OFFLINE_ROUTES', () => {
    // Guards against the exported allowlist drifting from the intended set.
    expect(OFFLINE_ROUTES.length).toBe(14);
    for (const route of OFFLINE_ROUTES) {
      expect(isOfflineRoute(route)).toBe(true);
    }
  });
});

describe('isOfflineRoute — trailing-slash normalization (Req 2.1, 2.2)', () => {
  it('treats a single trailing slash as equivalent for every in-scope route', () => {
    for (const route of IN_SCOPE_ROUTES) {
      expect(isOfflineRoute(`${route}/`), `${route}/ should normalize to ${route}`).toBe(true);
    }
  });

  it("keeps root '/' allowlisted and does not strip it to the empty string", () => {
    // Normalization strips a trailing slash ONLY when length > 1, so '/' stays '/'.
    expect(isOfflineRoute('/')).toBe(true);
  });

  it('does not over-normalize: a double trailing slash is NOT an allowlisted route', () => {
    // Only a single trailing slash is stripped; '/about//' is not '/about'.
    expect(isOfflineRoute('/about//')).toBe(false);
  });
});

describe('isOfflineRoute — non-allowlisted routes are rejected (Req 3.2)', () => {
  it('rejects every representative non-allowlisted route', () => {
    for (const route of NON_ALLOWLISTED_ROUTES) {
      expect(isOfflineRoute(route), `${route} must NOT be allowlisted`).toBe(false);
    }
  });

  it('rejects non-allowlisted routes even with a trailing slash', () => {
    for (const route of NON_ALLOWLISTED_ROUTES) {
      // '/api/auth/status/' etc. must still be rejected.
      expect(isOfflineRoute(`${route}/`)).toBe(false);
    }
  });

  it('rejects non-string / malformed input defensively', () => {
    // The helper guards `typeof pathname !== 'string'`.
    expect(isOfflineRoute(undefined as unknown as string)).toBe(false);
    expect(isOfflineRoute(null as unknown as string)).toBe(false);
    expect(isOfflineRoute(123 as unknown as string)).toBe(false);
    expect(isOfflineRoute('')).toBe(false);
  });
});
