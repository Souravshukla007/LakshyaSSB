/**
 * Feature: offline-support
 *
 * Deferred-submission sync manager for the Local_Draft_Store. On reconnect the
 * app flushes locally saved drafts to their target endpoints; failures are
 * retained and rescheduled using a bounded, strictly-increasing backoff.
 *
 * Design: §5 (Local draft store + deferred submission) and
 * Correctness Property 7 (Retry backoff schedule is bounded and strictly
 * increasing).
 *
 * Requirements:
 * - 6.3: flush begins on reconnect (callers invoke `flushPending`).
 * - 6.4: on successful submission the draft is removed from the store.
 * - 6.5: on failure the draft is retained unmodified except its `status`
 *        (`failed`) and incremented `attempts` counter.
 * - 6.6: retry backoff — increasing intervals starting at 5000 ms, up to 5
 *        attempts, after which manual retry is required (`nextDelay` → null).
 *
 * Platform neutrality (Requirement 11.1): this module is framework-free and
 * standards-based. It contains no Capacitor / native imports and depends only
 * on the injectable `fetch` (defaulting to the global `fetch`) and the draft
 * store.
 *
 * Scheduling note: `flushPending` performs exactly ONE submission attempt per
 * pending draft and updates the persisted `attempts` counter. It deliberately
 * does NOT sleep or run wall-clock timers (`setTimeout`) internally — doing so
 * would make the flush hard to test and would couple retry timing to a single
 * long-lived call. Instead, retry scheduling is driven by callers (e.g. the
 * `useDraftSync` hook), which read `nextDelay(attempts)` to decide when to call
 * `flushPending` again, and stop retrying automatically once `nextDelay`
 * returns `null` (manual retry required).
 */

import { listPending, removeDraft, markStatus, type Draft } from './draftStore';

/** Maximum number of automatic retry attempts before manual retry is required. */
const MAX_ATTEMPTS = 5;

/**
 * The fixed retry backoff schedule: exactly 5 strictly-increasing intervals in
 * milliseconds, beginning at 5000 ms (Requirement 6.6, Property 7). Each call
 * returns a fresh array so callers cannot mutate shared state.
 */
export function computeBackoffSchedule(): number[] {
  return [5000, 10000, 20000, 40000, 80000];
}

/**
 * Return the delay (ms) to wait before the retry that follows `attempts`
 * failed attempts:
 * - `attempts` in `0..4` → the corresponding schedule interval.
 * - `attempts >= 5`      → `null`, signalling that automatic retries are
 *   exhausted and manual retry is required (Requirement 6.6, Property 7).
 * - negative `attempts`  → treated as `0` (the first interval), guarding
 *   against nonsensical input.
 */
export function nextDelay(attempts: number): number | null {
  const schedule = computeBackoffSchedule();
  if (attempts < 0) {
    return schedule[0];
  }
  if (attempts >= MAX_ATTEMPTS) {
    return null;
  }
  return schedule[attempts];
}

/** Result of a single flush pass over all pending drafts. */
export interface FlushResult {
  /** Ids of drafts whose submission succeeded and were removed from the store. */
  submitted: string[];
  /** Ids of drafts whose submission failed and remain in the store as `failed`. */
  failed: string[];
}

/**
 * Attempt to submit every pending draft exactly once.
 *
 * For each draft returned by `listPending()` this POSTs `draft.payload` as JSON
 * to `draft.endpoint`. On a successful response (`res.ok`) the draft is removed
 * from the store and its id is recorded in `submitted` (Requirement 6.4). On a
 * non-ok response or a thrown/network error the draft is retained and its
 * status is set to `failed` with an incremented `attempts` counter, and its id
 * is recorded in `failed` (Requirement 6.5).
 *
 * A `fetch` implementation may be injected for testability; it defaults to the
 * global `fetch`. This function performs a single attempt per draft and does
 * not schedule its own retries — see the module-level scheduling note.
 */
export async function flushPending(
  fetchImpl: typeof fetch = fetch
): Promise<FlushResult> {
  const pending = await listPending();
  const submitted: string[] = [];
  const failed: string[] = [];

  for (const draft of pending) {
    if (await trySubmit(draft, fetchImpl)) {
      await removeDraft(draft.id);
      submitted.push(draft.id);
    } else {
      await markStatus(draft.id, 'failed', draft.attempts + 1);
      failed.push(draft.id);
    }
  }

  return { submitted, failed };
}

/**
 * Perform one submission attempt for a single draft. Returns `true` when the
 * server acknowledges it (`res.ok`), `false` on a non-ok response or any
 * thrown/network error.
 */
async function trySubmit(draft: Draft, fetchImpl: typeof fetch): Promise<boolean> {
  try {
    const res = await fetchImpl(draft.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft.payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}
