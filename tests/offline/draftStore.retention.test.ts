// Feature: offline-support, Property 6: Saved drafts are never silently lost (data integrity / retention) — For any draft saved to the Local_Draft_Store, the draft remains retrievable with a byte-identical payload until it is explicitly acknowledged by a successful server submission; a failed submission leaves the draft present and unmodified (status failed), and a blocked offline scoring submission leaves the user's entered answers fully recoverable.

// fake-indexeddb/auto installs a global `indexedDB` so the Node/Vitest
// environment can exercise the real IndexedDB-backed draft store.
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import {
  saveDraft,
  getDraft,
  removeDraft,
  markStatus,
  listPending,
  type Draft,
} from '@/lib/offline/draftStore';
import { closeDb, getAll, del, DB_NAME } from '@/lib/offline/idb';

// --- Test isolation helpers ------------------------------------------------

/** Delete the offline database so each test case starts from a clean slate. */
function deleteDatabase(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(name);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    // A blocked delete still eventually clears once connections close; don't hang.
    req.onblocked = () => resolve();
  });
}

/** Remove every record from the drafts store (per-iteration cleanup). */
async function clearStore(): Promise<void> {
  const all = await getAll<Draft>();
  await Promise.all(all.map((d) => del(d.id)));
}

/** JSON round-trip normalization used to assert byte-identical payloads. */
function jsonRoundTrip(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value));
}

beforeEach(async () => {
  // Drop the cached connection, then delete the DB to isolate cases.
  await closeDb();
  await deleteDatabase(DB_NAME);
});

afterEach(async () => {
  await closeDb();
});

// --- Arbitraries -----------------------------------------------------------

const flowArb = fc.constantFrom<Draft['flow']>(
  'piq',
  'srt',
  'wat',
  'tat',
  'gpe',
  'lecturette'
);

const statusArb = fc.constantFrom<Draft['status']>('draft', 'pending', 'failed');

// Arbitrary JSON-serializable payload, kept modest so 100 IndexedDB runs stay fast.
const payloadArb = fc.jsonValue();

const draftArb: fc.Arbitrary<Draft> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 24 }),
  flow: flowArb,
  payload: payloadArb,
  endpoint: fc.webUrl(),
  updatedAt: fc.integer({ min: 0 }),
  status: statusArb,
  attempts: fc.nat({ max: 10 }),
});

// Distinct-id set of drafts for the listPending property.
const draftSetArb: fc.Arbitrary<Draft[]> = fc
  .array(
    fc.record({
      flow: flowArb,
      payload: payloadArb,
      status: statusArb,
      attempts: fc.nat({ max: 10 }),
    }),
    { minLength: 0, maxLength: 8 }
  )
  .map((items) =>
    items.map((it, i): Draft => ({
      id: `draft-${i}`,
      endpoint: '/api/submit',
      updatedAt: 0,
      ...it,
    }))
  );

// --- Properties ------------------------------------------------------------

describe('Property 6: saved drafts are never silently lost (retention)', () => {
  it('saveDraft → getDraft returns a byte-identical payload', () => {
    return fc.assert(
      fc.asyncProperty(draftArb, async (d) => {
        await clearStore();
        await saveDraft(d);

        const got = await getDraft(d.id);
        expect(got).toBeDefined();
        expect(jsonRoundTrip(got!.payload)).toEqual(jsonRoundTrip(d.payload));

        await removeDraft(d.id);
      }),
      { numRuns: 100 }
    );
  });

  it('markStatus("failed", attempts+1) keeps the draft present with an unchanged payload', () => {
    return fc.assert(
      fc.asyncProperty(draftArb, async (d) => {
        await clearStore();
        await saveDraft(d);

        await markStatus(d.id, 'failed', d.attempts + 1);

        const afterFail = await getDraft(d.id);
        expect(afterFail).toBeDefined();
        // Only status/attempts changed.
        expect(afterFail!.status).toBe('failed');
        expect(afterFail!.attempts).toBe(d.attempts + 1);
        // Payload is fully recoverable and unchanged.
        expect(jsonRoundTrip(afterFail!.payload)).toEqual(jsonRoundTrip(d.payload));

        await removeDraft(d.id);
      }),
      { numRuns: 100 }
    );
  });

  it('removeDraft(id) makes the draft unretrievable (getDraft → undefined)', () => {
    return fc.assert(
      fc.asyncProperty(draftArb, async (d) => {
        await clearStore();
        await saveDraft(d);
        expect(await getDraft(d.id)).toBeDefined();

        await removeDraft(d.id);
        expect(await getDraft(d.id)).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });

  it('listPending returns exactly the pending|failed drafts and excludes drafts with status "draft"', () => {
    return fc.assert(
      fc.asyncProperty(draftSetArb, async (drafts) => {
        await clearStore();
        for (const d of drafts) {
          await saveDraft(d);
        }

        const pending = await listPending();
        const expectedIds = drafts
          .filter((d) => d.status === 'pending' || d.status === 'failed')
          .map((d) => d.id)
          .sort();

        expect(pending.map((p) => p.id).sort()).toEqual(expectedIds);
        for (const p of pending) {
          expect(['pending', 'failed']).toContain(p.status);
        }

        await clearStore();
      }),
      { numRuns: 100 }
    );
  });
});
