/**
 * Offline practice selection + validation module.
 *
 * Pure, framework-free logic for the offline practice test flow (Requirement 4).
 * Only `loadBankFromCache` touches the platform (via `fetch`); everything else is
 * deterministic and directly unit/property testable.
 *
 * Feature: offline-support
 * Design: Components → Offline practice selection module; Correctness Properties 1, 2
 * Requirements: 4.4, 4.7
 */

/**
 * A single practice question as it appears in a raw bank JSON file. The shape is
 * intentionally permissive (banks come from several sources: OIR, SRT, WAT) — only
 * `question` is required for a well-formed entry. Extra fields are preserved.
 */
export interface RawQuestion {
  question?: string;
  options?: string[];
  answer?: string;
  [k: string]: unknown;
}

/** Result of validating a parsed bank. */
export type ValidateBankResult =
  | { ok: true; questions: RawQuestion[] }
  | { ok: false; reason: string };

/**
 * Returns true if `value` is a well-formed question: a non-null object with a
 * non-empty string `question` field, and (if `options` is present) a non-empty
 * array of strings.
 */
function isWellFormedQuestion(value: unknown): value is RawQuestion {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const q = value as Record<string, unknown>;

  if (typeof q.question !== 'string' || q.question.trim().length === 0) {
    return false;
  }

  // `options`, when present, must be a non-empty array of strings.
  if ('options' in q && q.options !== undefined) {
    const opts = q.options;
    if (!Array.isArray(opts) || opts.length === 0) {
      return false;
    }
    if (!opts.every((o) => typeof o === 'string')) {
      return false;
    }
  }

  return true;
}

/**
 * Validate a parsed bank JSON value (Requirement 4.7, Property 2).
 *
 * Returns `{ ok: true, questions }` if and only if `parsed` is an array containing
 * at least one well-formed question. The returned `questions` list contains only the
 * well-formed entries. For every other value (non-array, empty array, or an array
 * with no well-formed entry) it returns `{ ok: false, reason }` so the caller can
 * render the OfflineFallback UI and refuse to start the practice flow.
 */
export function validateBank(parsed: unknown): ValidateBankResult {
  if (!Array.isArray(parsed)) {
    return { ok: false, reason: 'Practice bank is not an array.' };
  }

  if (parsed.length === 0) {
    return { ok: false, reason: 'Practice bank is empty.' };
  }

  const questions = parsed.filter(isWellFormedQuestion);

  if (questions.length === 0) {
    return {
      ok: false,
      reason: 'Practice bank contains no well-formed questions.',
    };
  }

  return { ok: true, questions };
}

/** Clamp `value` into the inclusive range [min, max]. */
function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) {
    return min;
  }
  return Math.max(min, Math.min(max, value));
}

/**
 * Select practice questions client-side from a cached bank (Requirement 4.4, Property 1).
 *
 * Guarantees:
 * - `result.length === clamp(count, 1, pool.length)`
 * - every returned element is a member of `pool` (same reference)
 * - no element reference appears more than once
 * - deterministic when a seeded `rng` is supplied
 *
 * Uses a Fisher–Yates shuffle driven by `rng`, then slices the required count. A
 * copy of `pool` is shuffled so the caller's array is never mutated.
 */
export function selectQuestions(
  pool: RawQuestion[],
  count: number,
  rng: () => number = Math.random
): RawQuestion[] {
  const total = pool.length;
  if (total === 0) {
    return [];
  }

  const target = clamp(Math.floor(count), 1, total);

  // Fisher–Yates shuffle on a shallow copy (preserves element references).
  const shuffled = pool.slice();
  for (let i = total - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const bounded = clamp(j, 0, i);
    const tmp = shuffled[i];
    shuffled[i] = shuffled[bounded];
    shuffled[bounded] = tmp;
  }

  return shuffled.slice(0, target);
}

/**
 * Load a practice bank from the cached static asset (Requirement 4.6, 4.7).
 *
 * Fetches `/practice-banks/{bankId}.json`, parses it, and validates it with
 * `validateBank`. On success returns the well-formed questions. If the asset is
 * missing, cannot be parsed, or does not validate into >= 1 question, throws an
 * Error so callers can render the OfflineFallback UI and avoid starting the flow.
 */
export async function loadBankFromCache(bankId: string): Promise<RawQuestion[]> {
  const url = `/practice-banks/${bankId}.json`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch (cause) {
    throw new Error(`Practice bank "${bankId}" is unavailable offline.`, {
      cause,
    });
  }

  if (!response.ok) {
    throw new Error(
      `Practice bank "${bankId}" is unavailable offline (status ${response.status}).`
    );
  }

  let parsed: unknown;
  try {
    parsed = await response.json();
  } catch (cause) {
    throw new Error(`Practice bank "${bankId}" could not be parsed.`, { cause });
  }

  const result = validateBank(parsed);
  if (!result.ok) {
    throw new Error(`Practice bank "${bankId}" is invalid: ${result.reason}`);
  }

  return result.questions;
}
