// Feature: offline-support, Property 2: Bank validation accepts exactly valid banks — For any parsed JSON value, validateBank(value) returns ok: true with a non-empty question list if and only if the value is an array containing at least one well-formed question (having the fields the flow requires); for every other value (non-array, empty array, or malformed entries) it returns ok: false, and in that case the practice flow does not start.

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { validateBank } from '@/lib/offline/practice-bank';

// A well-formed question: object with a non-empty (non-whitespace) string `question`.
const wellFormedArb = fc.record({
  question: fc
    .string({ minLength: 1 })
    .filter((s) => s.trim().length > 0),
  // Optionally include a valid options array of strings.
  options: fc.option(fc.array(fc.string(), { minLength: 1 }), { nil: undefined }),
});

// Malformed entries: things that are NOT well-formed questions.
const malformedArb = fc.oneof(
  fc.constant(null),
  fc.constant(undefined),
  fc.integer(),
  fc.string(),
  fc.boolean(),
  fc.array(fc.anything()),
  // object with missing/empty/non-string question
  fc.record({ question: fc.constant('') }),
  fc.record({ question: fc.constant('   ') }),
  fc.record({ question: fc.integer() }),
  fc.record({ notQuestion: fc.string() }),
  // object with valid question text but invalid options (empty array / non-strings)
  fc.record({
    question: fc.constant('valid?'),
    options: fc.oneof(fc.constant([]), fc.array(fc.integer(), { minLength: 1 })),
  })
);

describe('Property 2: bank validation accepts exactly valid banks', () => {
  it('ok:true with non-empty questions when array has >= 1 well-formed question', () => {
    fc.assert(
      fc.property(
        fc.array(wellFormedArb, { minLength: 1, maxLength: 20 }),
        fc.array(malformedArb, { maxLength: 10 }),
        (valids, junk) => {
          // Mix valid + malformed entries; at least one valid guarantees ok:true
          // regardless of order.
          const mixed = [...junk, ...valids];
          const result = validateBank(mixed);
          expect(result.ok).toBe(true);
          if (result.ok) {
            expect(result.questions.length).toBeGreaterThanOrEqual(1);
            // Every returned question is well-formed (non-empty string `question`).
            for (const q of result.questions) {
              expect(typeof q.question).toBe('string');
              expect((q.question as string).trim().length).toBeGreaterThan(0);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('ok:false for non-arrays', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(null),
          fc.constant(undefined),
          fc.integer(),
          fc.string(),
          fc.boolean(),
          fc.object()
        ),
        (value) => {
          expect(validateBank(value).ok).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('ok:false for empty arrays and arrays whose entries are all malformed', () => {
    fc.assert(
      fc.property(fc.array(malformedArb, { maxLength: 15 }), (arr) => {
        expect(validateBank(arr).ok).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});
