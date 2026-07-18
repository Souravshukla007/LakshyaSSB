// Feature: offline-support — Task 11.8
// Unit tests for draft autosave/persistence, the reconnect flush, quota
// handling, and the offline scoring "not sent" contract.
// Validates: Requirements 6.1, 6.2, 6.3, 6.7, 7.3
//
// ── Environment note / documented limitations ───────────────────────────────
// vitest.config.ts uses environment 'node' and this repo intentionally adds NO
// new test dependencies (no jsdom, no @testing-library/react). We therefore do
// NOT mount React drafting components or drive debounced-autosave timers /
// pending-indicator DOM here. Instead these tests exercise the real logic layer
// that those components delegate to — the IndexedDB-backed Local_Draft_Store
// (`lib/offline/draftStore.ts`) and the reconnect flush (`lib/offline/
// syncManager.ts`) — which is where the persistence, budget, quota, and
// "not sent" guarantees actually live:
//
//   • Autosave PERSISTENCE + pending-count SOURCE (Req 6.1, 6.2): a saved draft
//     is retrievable with a byte-identical payload and appears in `listPending`,
//     which is exactly what the "Saved locally — not yet submitted" badge counts
//     (`useDraftSync.pendingCount`). The 2s debounce TIMING that schedules the
//     save is a component concern verified in a DOM/integration environment.
//   • Reconnect flush BEGINS/WORKS (Req 6.3): `flushPending` with a stubbed OK
//     server removes the draft and reports it as submitted — the work the online
//     transition triggers within the 10s budget. The wall-clock "within 10s"
//     scheduling is owned by `useDraftSync` and covered at the integration layer.
//   • Quota handling (Req 6.7): reliably provoking a real QuotaExceededError from
//     fake-indexeddb is brittle, so we drive `saveDraft`'s PUBLIC contract through
//     a small, delegating mock at the `idb` module boundary (source is NOT
//     modified): one `put` is forced to reject with a DOMException named
//     'QuotaExceededError'. We assert `saveDraft` returns 'quota-exceeded' AND the
//     previously stored version stays intact (the failed write is atomic).
//   • Offline scoring "not sent" (Req 7.3): the SRT/WAT offline branch builds a
//     pending Draft addressed to '/api/srt/submit' / '/api/wat/submit' instead of
//     sending it. We assert the store accepts such a draft, lists it as pending,
//     and preserves the exact endpoint, so the reconnect flush later targets the
//     right online-only scoring API.
// ─────────────────────────────────────────────────────────────────────────────

// fake-indexeddb/auto installs a global `indexedDB` so the Node/Vitest
// environment can exercise the real IndexedDB-backed draft store.
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Shared, hoist-safe flag that lets one `put` call simulate a storage-quota
// failure without touching source files. `vi.hoisted` runs before the module
// factories below, so the mock factory can safely close over it.
const quota = vi.hoisted(() => ({ fail: false }));

// Delegating mock of the IndexedDB wrapper: every export is the REAL
// implementation (so fake-indexeddb still backs the store) except `put`, which
// rejects with a QuotaExceededError while `quota.fail` is set. Both '@/lib/
// offline/idb' and the './idb' specifier used inside lib/offline resolve to the
// same module id, so draftStore/syncManager pick up this mock too.
vi.mock('@/lib/offline/idb', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/offline/idb')>();
  return {
    ...actual,
    put: (value: { id: string }) => {
      if (quota.fail) {
        return Promise.reject(new DOMException('Simulated storage limit', 'QuotaExceededError'));
      }
      return actual.put(value);
    },
  };
});

import {
  saveDraft,
  listPending,
  getDraft,
  removeDraft,
  type Draft,
} from '@/lib/offline/draftStore';
import { flushPending } from '@/lib/offline/syncManager';
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

/** Remove every record from the drafts store (belt-and-suspenders cleanup). */
async function clearStore(): Promise<void> {
  const all = await getAll<Draft>();
  await Promise.all(all.map((d) => del(d.id)));
}

/** A successful server acknowledgement, matching the `fetch` shape flushPending uses. */
const okFetch = (async () => ({ ok: true })) as unknown as typeof fetch;

/** Build a representative pending draft. */
function pendingDraft(overrides: Partial<Draft> = {}): Draft {
  return {
    id: 'piq',
    flow: 'piq',
    payload: { name: 'Aspirant', why: 'To serve' },
    endpoint: '/api/piq/submit',
    updatedAt: 1000,
    status: 'pending',
    attempts: 0,
    ...overrides,
  };
}

beforeEach(async () => {
  quota.fail = false;
  await closeDb();
  await deleteDatabase(DB_NAME);
});

afterEach(async () => {
  quota.fail = false;
  await closeDb();
});

// --- Autosave persistence + pending-count source (Req 6.1, 6.2) ------------

describe('draft autosave persistence and pending indicator source (Req 6.1, 6.2)', () => {
  it('saveDraft with status "pending" makes the draft appear in listPending (badge count source)', async () => {
    const draft = pendingDraft();
    const result = await saveDraft(draft);
    expect(result).toBe('saved');

    const pending = await listPending();
    expect(pending.map((d) => d.id)).toContain(draft.id);
    // listPending().length is exactly what useDraftSync exposes as pendingCount.
    expect(pending.length).toBe(1);
  });

  it('round-trips the draft payload byte-for-byte (Req 6.1)', async () => {
    const draft = pendingDraft({
      id: 'piq:round-trip',
      payload: { fields: ['a', 'b'], nested: { n: 42, flag: true }, note: 'देश' },
    });
    await saveDraft(draft);

    const got = await getDraft(draft.id);
    expect(got).toBeDefined();
    expect(JSON.parse(JSON.stringify(got!.payload))).toEqual(
      JSON.parse(JSON.stringify(draft.payload))
    );
  });

  it('autosave overwrites the latest content for the same id (single record kept)', async () => {
    await saveDraft(pendingDraft({ payload: { v: 1 } }));
    await saveDraft(pendingDraft({ payload: { v: 2 } }));

    const pending = await listPending();
    expect(pending.length).toBe(1);
    const got = await getDraft('piq');
    expect((got!.payload as { v: number }).v).toBe(2);
  });
});

// --- Reconnect flush begins/works (Req 6.3) --------------------------------

describe('reconnect flush of pending drafts (Req 6.3)', () => {
  it('flushPending submits a pending draft and removes it from the store', async () => {
    const draft = pendingDraft({ id: 'piq:flush' });
    await saveDraft(draft);
    expect((await listPending()).length).toBe(1);

    const result = await flushPending(okFetch);

    // The draft was submitted on reconnect and is no longer pending.
    expect(result.submitted).toContain(draft.id);
    expect(result.failed).toEqual([]);
    expect(await getDraft(draft.id)).toBeUndefined();
    expect(await listPending()).toEqual([]);
  });

  it('flushPending POSTs each pending draft to its own endpoint', async () => {
    await saveDraft(pendingDraft({ id: 'a', endpoint: '/api/srt/submit' }));
    await saveDraft(pendingDraft({ id: 'b', endpoint: '/api/wat/submit' }));

    const calls: string[] = [];
    const recordingFetch = (async (url: string) => {
      calls.push(url);
      return { ok: true };
    }) as unknown as typeof fetch;

    const result = await flushPending(recordingFetch);

    expect(result.submitted.sort()).toEqual(['a', 'b']);
    expect(calls.sort()).toEqual(['/api/srt/submit', '/api/wat/submit']);
    expect(await listPending()).toEqual([]);
  });
});

// --- Quota handling (Req 6.7) ----------------------------------------------

describe('local-storage quota handling (Req 6.7)', () => {
  it('saveDraft returns "quota-exceeded" when the store throws a QuotaExceededError', async () => {
    quota.fail = true;
    const result = await saveDraft(pendingDraft({ id: 'piq:quota' }));
    expect(result).toBe('quota-exceeded');
  });

  it('keeps the previously saved version intact when the new save is rejected for quota', async () => {
    // First save succeeds and is the "previous" version the user must not lose.
    await saveDraft(pendingDraft({ id: 'piq:keep', payload: { text: 'original' } }));

    // A later autosave hits the quota limit.
    quota.fail = true;
    const result = await saveDraft(pendingDraft({ id: 'piq:keep', payload: { text: 'newer' } }));
    expect(result).toBe('quota-exceeded');

    // The prior content is still recoverable and unchanged (failed put is atomic).
    quota.fail = false;
    const got = await getDraft('piq:keep');
    expect(got).toBeDefined();
    expect((got!.payload as { text: string }).text).toBe('original');
  });
});

// --- Offline scoring "not sent" (Req 7.3) ----------------------------------

describe('offline scoring is deferred, not sent (Req 7.3)', () => {
  // Mirrors the SRT/WAT offline branch: instead of POSTing to the online-only AI
  // evaluation, the page saves a pending Draft addressed to that same endpoint.
  it.each([
    { flow: 'srt' as const, endpoint: '/api/srt/submit', payload: { inputs: [{ question_id: 1, user_response: 'help' }] } },
    { flow: 'wat' as const, endpoint: '/api/wat/submit', payload: { responses: [{ word_id: 1, user_sentence: 'lead' }] } },
  ])('%s offline submit stores a pending draft targeting its scoring endpoint', async ({ flow, endpoint, payload }) => {
    const draft: Draft = {
      id: `${flow}:${123}`,
      flow,
      payload,
      endpoint,
      updatedAt: 123,
      status: 'pending',
      attempts: 0,
    };

    const result = await saveDraft(draft);
    expect(result).toBe('saved');

    const pending = await listPending();
    const stored = pending.find((d) => d.id === draft.id);
    expect(stored).toBeDefined();
    // "Not sent": it is queued as pending, addressed to the online-only endpoint.
    expect(stored!.status).toBe('pending');
    expect(stored!.endpoint).toBe(endpoint);
    // The user's entered answers are fully recoverable from the stored payload (Req 7.2/7.3).
    expect(JSON.parse(JSON.stringify(stored!.payload))).toEqual(
      JSON.parse(JSON.stringify(payload))
    );
  });
});
