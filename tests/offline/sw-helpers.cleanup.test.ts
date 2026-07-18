// Feature: offline-support, Property 3: Cache cleanup retains exactly the owned caches — For any set of existing cache names present in the Cache_Store, the activation cleanup routine deletes every cache name that is not in the current OWNED set and retains every cache name that is in OWNED, so that after cleanup the surviving names are exactly existing ∩ OWNED.

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { cachesToDelete } from '@/lib/offline/sw-helpers';

// Arbitrary cache name (mix of owned-looking and foreign names).
const nameArb = fc.oneof(
  fc.stringMatching(/^lssb-[a-z-]+-v[0-9]+$/),
  fc.string({ minLength: 1, maxLength: 30 })
);

describe('Property 3: cache cleanup retains exactly the owned caches', () => {
  it('deletes exactly the existing names not in owned; survivors === existing ∩ owned', () => {
    fc.assert(
      fc.property(
        fc.array(nameArb, { maxLength: 30 }),
        fc.array(nameArb, { maxLength: 30 }),
        (existing, ownedList) => {
          const owned = new Set(ownedList);
          const toDelete = cachesToDelete(existing, owned);

          // 1) Every deleted name is an existing name and is NOT owned.
          for (const name of toDelete) {
            expect(existing).toContain(name);
            expect(owned.has(name)).toBe(false);
          }

          // 2) Survivors = existing minus deleted.
          const deletedSet = new Set(toDelete);
          const survivors = existing.filter((n) => !deletedSet.has(n));

          // 3) Survivors are exactly existing ∩ owned.
          const intersection = existing.filter((n) => owned.has(n));
          expect(new Set(survivors)).toEqual(new Set(intersection));

          // 4) Every owned existing name is retained (never deleted).
          for (const name of existing) {
            if (owned.has(name)) {
              expect(deletedSet.has(name)).toBe(false);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
