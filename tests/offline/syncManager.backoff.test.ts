// Feature: offline-support, Property 7: Retry backoff schedule is bounded and strictly increasing — For any attempt count, computeBackoffSchedule() yields exactly 5 intervals that are strictly increasing with a first interval of 5000 ms, and nextDelay(attempts) returns a defined interval for attempts in 0..4 and null for attempts >= 5 (signalling manual retry required). A draft that receives a successful submission is subsequently absent from the store (save → acknowledge → absent round-trip).

// fake-indexeddb/auto installs a global `indexedDB` for the round-trip portion.
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import {
  computeBackoffSchedule,
  nextDelay,
  flushPending,
} from '@/lib/offline/syncManager';
import { saveDraft, getDraft, type Draft } from '@/lib/offline/draftStore';
import { closeDb, getAll, del, DB_NAME } from '@/lib/offline/idb';

// --- Test isolation helpers ------------------------------------------------

function deleteDatabase(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(name);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => resolve();
  });
}

async function clearStore(): Promise<void> {
  const all = await getAll<Draft>();
  await Promise.all(all.map((d) => del(d.id)));
}

beforeEach(async () => {
  await closeDb();
  await deleteDatabase(DB_NAME);
});

afterEach(async () => {
  await closeDb();
});

// --- Fetch stubs -----------------------------------------------------------

/** Simulates a successful server acknowledgement. */
const okFetch = (async () => ({ ok: true })) as unknown as typeof fetch;
/** Simulates a rejected/non-2xx server response. */
const failFetch = (async () => ({ ok: false })) as unknown as typeof fetch;

// --- Arbitraries -----------------------------------------------------------

const flowArb = fc.constantFrom<Draft['flow']>(
  'piq',
  'srt',
  'wat',
  'tat',
  'gpe',
  'lecturette'
);

const pendingDraftArb: fc.Arbitrary<Draft> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 24 }),
  flow: flowArb,
  payload: fc.jsonValue(),
  endpoint: fc.webUrl(),
  updatedAt: fc.integer({ min: 0 }),
  status: fc.constant<Draft['status']>('pending'),
  attempts: fc.nat({ max: 4 }),
});

// --- Schedule shape (direct assertions) ------------------------------------

describe('Property 7: retry backoff schedule is bounded and strictly increasing', () => {
  it('computeBackoffSchedule() returns exactly 5 strictly-increasing intervals starting at 5000', () => {
    const schedule = computeBackoffSchedule();
    expect(schedule).toEqual([5000, 10000, 20000, 40000, 80000]);
    expect(schedule).toHaveLength(5);
    expect(schedule[0]).toBe(5000);
    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i]).toBeGreaterThan(schedule[i - 1]);
    }
  });

  it('schedule invariants hold on every call and each call returns a fresh array', () => {
    fc.assert(
      fc.property(fc.integer(), () => {
        const a = computeBackoffSchedule();
        const b = computeBackoffSchedule();
        // Fresh array instance each call (callers cannot mutate shared state).
        expect(a).not.toBe(b);
        expect(a).toEqual(b);
        expect(a).toHaveLength(5);
        expect(a[0]).toBe(5000);
        for (let i = 1; i < a.length; i++) {
          expect(a[i]).toBeGreaterThan(a[i - 1]);
        }
      }),
      { numRuns: 100 }
    );
  });

  // --- nextDelay contract --------------------------------------------------

  it('nextDelay(attempts) === schedule[attempts] for attempts in 0..4', () => {
    const schedule = computeBackoffSchedule();
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 4 }), (attempts) => {
        expect(nextDelay(attempts)).toBe(schedule[attempts]);
      }),
      { numRuns: 100 }
    );
  });

  it('nextDelay(attempts) === null for attempts >= 5 (manual retry required)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 5, max: 1000 }), (attempts) => {
        expect(nextDelay(attempts)).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  it('nextDelay(negative) falls back to schedule[0]', () => {
    const first = computeBackoffSchedule()[0];
    fc.assert(
      fc.property(fc.integer({ min: -1000, max: -1 }), (attempts) => {
        expect(nextDelay(attempts)).toBe(first);
      }),
      { numRuns: 100 }
    );
  });

  // --- Round-trip via flushPending (fake-indexeddb) ------------------------

  it('save → successful submission → draft is absent from the store', () => {
    return fc.assert(
      fc.asyncProperty(pendingDraftArb, async (d) => {
        await clearStore();
        await saveDraft(d);

        const result = await flushPending(okFetch);

        expect(result.submitted).toContain(d.id);
        expect(await getDraft(d.id)).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });

  it('save → failed submission → draft remains present as failed with incremented attempts', () => {
    return fc.assert(
      fc.asyncProperty(pendingDraftArb, async (d) => {
        await clearStore();
        await saveDraft(d);

        const result = await flushPending(failFetch);

        expect(result.failed).toContain(d.id);
        const got = await getDraft(d.id);
        expect(got).toBeDefined();
        expect(got!.status).toBe('failed');
        expect(got!.attempts).toBe(d.attempts + 1);

        await clearStore();
      }),
      { numRuns: 100 }
    );
  });
});
