/**
 * Feature: offline-support
 *
 * Local draft store built on top of the framework-free IndexedDB wrapper
 * (`lib/offline/idb.ts`). Backs deferred submission of user-authored drafts
 * (PIQ form, and SRT/WAT/TAT/GPE/lecturette answer drafting) whose real
 * submissions are online-only AI evaluations.
 *
 * Design: §5 (Local draft store + deferred submission) and
 * Data Models → Local_Draft_Store schema.
 *
 * Requirements: 6.1 (autosave-overwrite latest content), 6.3 (list pending for
 * reconnect flush), 6.4 (remove on successful submission), 6.5/7.2 (retain
 * unmodified failed drafts / recoverable answers), 6.7 (quota-exceeded keeps the
 * previously stored version intact).
 *
 * This module is standards-based and platform-neutral (Requirement 11.1): it
 * contains no Capacitor / native imports and relies only on the global
 * `indexedDB` via the `idb` wrapper.
 */

import { del, get, getAll, put, type WithId } from './idb';

/**
 * A single user draft. One record per draft `id` holds the latest content
 * (overwritten on autosave), its target `endpoint`, `status`, and `attempts`
 * counter used by the backoff schedule.
 */
export interface Draft extends WithId {
  /** Stable per (flow, entity), e.g. "piq" or "srt:<sessionId>". */
  id: string;
  /** Which drafting flow produced this record. */
  flow: 'piq' | 'srt' | 'wat' | 'tat' | 'gpe' | 'lecturette';
  /** The user-authored content to submit on reconnect. */
  payload: unknown;
  /** Where the draft will POST on reconnect. */
  endpoint: string;
  /** Epoch millis of the last local save. */
  updatedAt: number;
  /** Lifecycle status; only `pending`/`failed` are eligible for reconnect flush. */
  status: 'draft' | 'pending' | 'failed';
  /** Retry counter consumed by the sync manager's backoff schedule. */
  attempts: number;
}

/** Draft `status` values eligible for deferred submission on reconnect. */
const PENDING_STATUSES: ReadonlyArray<Draft['status']> = ['pending', 'failed'];

/**
 * Detect a storage-quota error across environments. Browsers throw a
 * `DOMException` named `QuotaExceededError`; the legacy numeric code `22` is
 * also accepted. `fake-indexeddb` and some engines surface a plain error whose
 * `name` is `QuotaExceededError`.
 */
function isQuotaExceeded(err: unknown): boolean {
  if (!err) return false;
  if (typeof DOMException !== 'undefined' && err instanceof DOMException) {
    return err.name === 'QuotaExceededError' || err.code === 22;
  }
  const name = (err as { name?: unknown }).name;
  const code = (err as { code?: unknown }).code;
  return name === 'QuotaExceededError' || code === 22;
}

/**
 * Autosave a draft, always overwriting the latest content for its `id`
 * (Requirement 6.1). Sets `updatedAt` to the current time when the caller did
 * not provide one.
 *
 * On `QuotaExceededError` the previously stored version is left intact — the
 * failed `put` does not remove or corrupt the existing record — and
 * `'quota-exceeded'` is returned so the flow can warn the user (Requirement 6.7).
 * Returns `'saved'` on success. Any non-quota error propagates to the caller.
 */
export async function saveDraft(d: Draft): Promise<'saved' | 'quota-exceeded'> {
  const record: Draft = {
    ...d,
    updatedAt: typeof d.updatedAt === 'number' ? d.updatedAt : Date.now(),
  };

  try {
    await put(record);
    return 'saved';
  } catch (err) {
    if (isQuotaExceeded(err)) {
      // A failed put is atomic: the prior record remains unchanged. We do NOT
      // attempt any further writes here, so existing content is never corrupted.
      return 'quota-exceeded';
    }
    throw err;
  }
}

/**
 * Return all drafts awaiting deferred submission — those whose status is
 * `pending` or `failed` (Requirement 6.3). Used by the sync manager on
 * reconnect.
 */
export async function listPending(): Promise<Draft[]> {
  const all = await getAll<Draft>();
  return all.filter((draft) => PENDING_STATUSES.includes(draft.status));
}

/** Retrieve a single draft by `id`, or `undefined` when absent. */
export function getDraft(id: string): Promise<Draft | undefined> {
  return get<Draft>(id);
}

/**
 * Delete a draft by `id`. Called after a successful server submission
 * acknowledges the draft (Requirement 6.4).
 */
export function removeDraft(id: string): Promise<void> {
  return del(id);
}

/**
 * Update a draft's `status` (and optionally its `attempts` counter) in place,
 * preserving the stored `payload` and other fields. Used by the sync manager to
 * mark drafts `pending`/`failed` across retry attempts. No-op when the draft is
 * absent. Does not modify `updatedAt`, so the user's content timestamp is
 * preserved.
 */
export async function markStatus(
  id: string,
  status: Draft['status'],
  attempts?: number
): Promise<void> {
  const existing = await get<Draft>(id);
  if (!existing) return;

  const updated: Draft = {
    ...existing,
    status,
    attempts: typeof attempts === 'number' ? attempts : existing.attempts,
  };
  await put(updated);
}
