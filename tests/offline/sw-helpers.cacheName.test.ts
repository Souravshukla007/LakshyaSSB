// Feature: offline-support, Property 4: Cache names encode exactly one version (round-trip) — For any cache base name and any CACHE_VERSION string, the derived cache name produced by the naming helper encodes that version such that parsing the version back out of the name yields the original version, and all names in a single OWNED set share one and the same version.

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  cacheName,
  parseVersion,
  ownedCacheNames,
} from '@/lib/offline/sw-helpers';

// Version identifiers do not themselves contain the '-' separator (e.g. `v1`,
// `v2`, or a build hash). The naming scheme is `lssb-{base}-{version}`, so the
// version is recovered as the final '-'-delimited segment; a version containing
// a '-' would be ambiguous and is outside the domain of the round-trip property.
const versionArb = fc.oneof(
  // `v` + digits, e.g. v1, v42
  fc.integer({ min: 0, max: 100000 }).map((n) => `v${n}`),
  // arbitrary alphanumeric string with no hyphen, at least 1 char
  fc
    .stringMatching(/^[A-Za-z0-9]+$/)
    .filter((s) => s.length > 0 && !s.includes('-'))
);

// Base names in this app may contain hyphens (e.g. `next-static`), which is fine
// because only the LAST segment is treated as the version.
const baseArb = fc
  .stringMatching(/^[A-Za-z0-9-]+$/)
  .filter((s) => s.length > 0 && !s.startsWith('-') && !s.endsWith('-'));

describe('Property 4: cache names encode exactly one version (round-trip)', () => {
  it('parseVersion(cacheName(base, v)) === v for any base and hyphen-free version', () => {
    fc.assert(
      fc.property(baseArb, versionArb, (base, version) => {
        const name = cacheName(base, version);
        expect(parseVersion(name)).toBe(version);
      }),
      { numRuns: 100 }
    );
  });

  it('all names in a single OWNED set share the same version', () => {
    fc.assert(
      fc.property(versionArb, (version) => {
        const owned = ownedCacheNames(version);
        // Non-empty owned set.
        expect(owned.size).toBeGreaterThan(0);
        for (const name of owned) {
          expect(parseVersion(name)).toBe(version);
        }
      }),
      { numRuns: 100 }
    );
  });
});
