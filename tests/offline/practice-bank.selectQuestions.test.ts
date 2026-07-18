// Feature: offline-support, Property 1: Offline question selection is bounded and faithful — For any non-empty practice-bank pool and any requested count, selectQuestions(pool, count) returns a list whose length equals clamp(count, 1, pool.length), where every returned element is a member of pool and no element reference appears more than once.

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { selectQuestions, type RawQuestion } from '@/lib/offline/practice-bank';

/** clamp helper mirroring the module's contract. */
function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
}

/**
 * A tiny deterministic LCG mapped to [0, 1). Given the same seed it produces the
 * same sequence, so we can assert determinism of selectQuestions.
 */
function makeRng(seed: number): () => number {
  let state = seed >>> 0 || 1;
  return () => {
    // Numerical Recipes LCG constants.
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

// Build a pool of DISTINCT question objects (distinct references and ids).
const poolArb = fc
  .integer({ min: 1, max: 40 })
  .map((n): RawQuestion[] =>
    Array.from({ length: n }, (_, i) => ({ question: `Q${i}`, id: i }))
  );

// Count spans well below 1 (incl. negatives) and well above pool length.
const countArb = fc.integer({ min: -10, max: 60 });

describe('Property 1: offline question selection is bounded and faithful', () => {
  it('length === clamp(floor(count), 1, pool.length); members of pool; no dup refs', () => {
    fc.assert(
      fc.property(poolArb, countArb, fc.integer(), (pool, count, seed) => {
        const result = selectQuestions(pool, count, makeRng(seed));

        // Bounded length.
        expect(result.length).toBe(clamp(Math.floor(count), 1, pool.length));

        // Every returned item is a member of the pool by reference identity.
        for (const item of result) {
          expect(pool.includes(item)).toBe(true);
        }

        // No duplicate references.
        expect(new Set(result).size).toBe(result.length);
      }),
      { numRuns: 100 }
    );
  });

  it('is deterministic for a fixed seed', () => {
    fc.assert(
      fc.property(poolArb, countArb, fc.integer(), (pool, count, seed) => {
        const a = selectQuestions(pool, count, makeRng(seed));
        const b = selectQuestions(pool, count, makeRng(seed));
        expect(a).toEqual(b);
        // Same references in same order.
        a.forEach((item, i) => expect(b[i]).toBe(item));
      }),
      { numRuns: 100 }
    );
  });
});
