/**
 * lib/ai-eval.ts
 *
 * One place for "call Gemini, get back a validated object".
 *
 * Every evaluation route used to do this inline:
 *
 *     const result = await model.generateContent(prompt);
 *     const evaluation = JSON.parse(result.response.text());
 *
 * which has four problems that all surfaced as the same symptom (an opaque 500,
 * which the client rendered as a spinner that never stopped):
 *
 *   1. `responseMimeType: 'application/json'` reduces but does not eliminate
 *      fenced or prose-wrapped output, and it does nothing about a MAX_TOKENS
 *      finish, which yields truncated — therefore invalid — JSON.
 *   2. `result.response.text()` *throws* when the model returns no candidate
 *      (safety block), so the failure isn't even a parse error.
 *   3. No timeout: a hung call held the request open indefinitely.
 *   4. No field validation, so `null`/`"85"` reached Prisma and blew up at write
 *      time, or reached the UI and rendered `NaN%`.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * THE single Gemini model configuration for the whole product.
 *
 * Why this is centralised: the model name used to be hard-coded in four files
 * (`lib/ai-eval.ts`, `lib/ai-processor.ts`, `app/api/quiz/current-affairs/route.ts`
 * and a six-entry fallback list in `app/api/chat/route.ts`). Google then retired
 * `gemini-1.5-flash` and `gemini-2.0-flash`, which returned 404 and took out SRT,
 * TAT, WAT, GPE, Lecturette evaluation and the current-affairs quiz all at once —
 * while `tsc` and `next build` stayed perfectly green, because a dead model name
 * is a runtime fact, not a type error.
 *
 * Why a pinned version is the PRIMARY and the moving alias is only a FALLBACK:
 * `gemini-flash-latest` avoids future retirements, but it is a shared,
 * high-traffic alias and was observed returning
 * "503 This model is currently experiencing high demand" on this very path. A
 * paid evaluation must not fail because an alias is busy. So: pin a specific
 * model for predictable capacity, keep the alias behind it for the day the pin
 * is retired, and let `npm run check:ai` turn that retirement into a loud CI
 * failure instead of silent 500s.
 *
 * NOTE on `||` rather than `??`: `.env.example` ships `GEMINI_MODEL=""`, and an
 * empty string is not nullish — copying the example would set the model name to
 * "" and 404 every request. Treat blank/whitespace as "not configured".
 */
export const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash';

/**
 * Tried in order. Only transient upstream failures (503/429/timeout) advance to
 * the next entry — a content problem retries the same model instead, because
 * changing model would not fix malformed or safety-blocked output.
 */
export const GEMINI_MODELS: readonly string[] = [
    // 'gemini-2.5-flash-lite' used to be the last entry and was already retired
    // ("no longer available to new users") — a dead link in the failover chain,
    // caught by `npm run check:ai` once it started probing the fallbacks and not
    // just the primary. The moving alias is used here deliberately: this slot is
    // last-resort capacity, so staying current matters more than a pinned version.
    ...new Set([GEMINI_MODEL, 'gemini-flash-latest', 'gemini-flash-lite-latest']),
];

const DEFAULT_MODEL = GEMINI_MODEL;

/** Thrown when the model could not be turned into a usable object. */
export class AiEvaluationError extends Error {
    constructor(
        message: string,
        readonly kind: 'timeout' | 'blocked' | 'malformed' | 'misconfigured' | 'upstream',
    ) {
        super(message);
        this.name = 'AiEvaluationError';
    }
}

function getClient(): GoogleGenerativeAI {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        // Previously `|| ''`, which turned a config mistake into a confusing 4xx
        // from Google instead of an obvious server misconfiguration.
        throw new AiEvaluationError('GEMINI_API_KEY is not configured', 'misconfigured');
    }
    return new GoogleGenerativeAI(apiKey);
}

/**
 * Strip markdown fences and any prose surrounding the JSON body.
 * Defensive: with responseMimeType set this is usually a no-op.
 */
export function extractJson(raw: string): string {
    let text = raw.trim();

    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) text = fenced[1].trim();

    // Trim to the outermost JSON object/array if the model added a preamble.
    const firstBrace = text.search(/[{[]/);
    if (firstBrace > 0) text = text.slice(firstBrace);

    const lastObj = text.lastIndexOf('}');
    const lastArr = text.lastIndexOf(']');
    const lastClose = Math.max(lastObj, lastArr);
    if (lastClose !== -1 && lastClose < text.length - 1) text = text.slice(0, lastClose + 1);

    return text.trim();
}

/** Coerce a model-supplied score into an integer in [0, 100]. */
export function toScore(value: unknown, fallback = 0): number {
    const n = typeof value === 'string' ? Number(value) : value;
    if (typeof n !== 'number' || !Number.isFinite(n)) return fallback;
    return Math.max(0, Math.min(100, Math.round(n)));
}

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH';

/** Coerce a model-supplied risk level into the enum Prisma expects. */
export function toRiskLevel(value: unknown, fallback: RiskLevel = 'MODERATE'): RiskLevel {
    if (typeof value !== 'string') return fallback;
    const upper = value.trim().toUpperCase();
    if (upper === 'LOW' || upper === 'MODERATE' || upper === 'HIGH') return upper;
    if (upper === 'MEDIUM') return 'MODERATE';
    return fallback;
}

/**
 * Normalise a `{ Theme: { percentage } }` map, tolerating the shapes the model
 * actually produces: a bare number, a string, a null, or a missing key.
 * Guarantees every value is `{ percentage: <0..100 int> }` so no UI mapper can
 * hit `undefined.percentage` or render `NaN%`.
 */
export function normalizeThemeScores(input: unknown): Record<string, { percentage: number }> {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return {};

    const out: Record<string, { percentage: number }> = {};
    for (const [theme, value] of Object.entries(input as Record<string, unknown>)) {
        if (value && typeof value === 'object' && 'percentage' in value) {
            out[theme] = { percentage: toScore((value as { percentage: unknown }).percentage) };
        } else {
            out[theme] = { percentage: toScore(value) };
        }
    }
    return out;
}

/** Coerce to a string array, dropping anything unusable. */
export function toStringArray(value: unknown, max = 10): string[] {
    if (!Array.isArray(value)) return [];
    return value
        .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
        .slice(0, max)
        .map((v) => v.trim());
}

interface GenerateJsonOptions<T> {
    prompt: string;
    /** Turns the raw parsed JSON into your validated domain shape. Throw to reject. */
    validate: (parsed: unknown) => T;
    model?: string;
    timeoutMs?: number;
    /** One retry by default: transient 5xx/429 and truncation are common. */
    retries?: number;
    /**
     * Non-text parts to send alongside the prompt — used by the Lecturette route,
     * which submits an audio recording for transcription and scoring.
     */
    inlineData?: { mimeType: string; data: string };
}

/**
 * Ask Gemini for JSON and return a validated object, or throw AiEvaluationError.
 */
export async function generateJson<T>({
    prompt,
    validate,
    model = DEFAULT_MODEL,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = 1,
    inlineData,
}: GenerateJsonOptions<T>): Promise<T> {
    const client = getClient();

    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> =
        inlineData ? [{ inlineData }, { text: prompt }] : [{ text: prompt }];

    let lastError: AiEvaluationError | null = null;

    /**
     * Candidate models. An explicit `model` option means the caller knows what it
     * wants, so respect it exactly; otherwise walk the shared fallback chain.
     *
     * This exists because a transient "503 high demand" from a shared alias used
     * to surface to the user as a failed evaluation. Retrying the same busy model
     * twice does not help; moving to the next one does.
     */
    const candidates = model === DEFAULT_MODEL ? GEMINI_MODELS : [model];

    for (const candidate of candidates) {
        const isLastCandidate = candidate === candidates[candidates.length - 1];
        const generativeModel = client.getGenerativeModel({
            model: candidate,
            generationConfig: { responseMimeType: 'application/json' },
        });

        let switchModel = false;

        for (let attempt = 0; attempt <= retries; attempt++) {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeoutMs);

            try {
                const result = await generativeModel.generateContent(
                    { contents: [{ role: 'user', parts }] },
                    { signal: controller.signal },
                );

                // Throws if the response was blocked or has no candidate.
                let raw: string;
                try {
                    raw = result.response.text();
                } catch {
                    throw new AiEvaluationError('Model returned no usable candidate', 'blocked');
                }

                if (!raw || !raw.trim()) {
                    throw new AiEvaluationError('Model returned an empty response', 'malformed');
                }

                let parsed: unknown;
                try {
                    parsed = JSON.parse(extractJson(raw));
                } catch {
                    throw new AiEvaluationError('Model response was not valid JSON', 'malformed');
                }

                return validate(parsed);
            } catch (err) {
                if (err instanceof AiEvaluationError) {
                    lastError = err;
                    // A misconfigured key will never succeed on retry.
                    if (err.kind === 'misconfigured') throw err;
                } else if (controller.signal.aborted) {
                    lastError = new AiEvaluationError(
                        `Model call exceeded ${timeoutMs}ms`,
                        'timeout',
                    );
                } else {
                    lastError = new AiEvaluationError(
                        err instanceof Error ? err.message : 'Unknown upstream error',
                        'upstream',
                    );
                }

                // Capacity, rate limit, timeout or a retired model are properties of
                // the *model*, not the prompt. Switch models rather than burning the
                // remaining attempts on something that is busy or gone. A malformed
                // or safety-blocked response is a content problem, so that retries
                // against the same model instead.
                const transient =
                    lastError.kind === 'upstream' ||
                    lastError.kind === 'timeout' ||
                    /\b(429|503|404)\b|high demand|overloaded|quota/i.test(lastError.message);

                if (transient && !isLastCandidate) {
                    switchModel = true;
                } else if (attempt < retries) {
                    await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
                }
            } finally {
                clearTimeout(timer);
            }

            if (switchModel) break;
        }
    }

    throw lastError ?? new AiEvaluationError('Evaluation failed', 'upstream');
}

/**
 * The HTTP shape every evaluation route returns when the model layer fails.
 * Distinct `reason` values let the client say something useful and offer a retry
 * instead of spinning forever.
 */
export function aiErrorResponse(err: unknown): { body: Record<string, string>; status: number } {
    if (err instanceof AiEvaluationError) {
        switch (err.kind) {
            case 'timeout':
                return {
                    body: {
                        error: 'The evaluation timed out. Your answers were not lost — please try again.',
                        reason: 'ai_timeout',
                    },
                    status: 504,
                };
            case 'blocked':
                return {
                    body: {
                        error: 'The evaluator could not process these responses. Please rephrase and try again.',
                        reason: 'ai_blocked',
                    },
                    status: 422,
                };
            case 'malformed':
                return {
                    body: {
                        error: 'The evaluator returned an unexpected result. Please try again.',
                        reason: 'ai_malformed',
                    },
                    status: 502,
                };
            case 'misconfigured':
                return {
                    body: { error: 'Evaluation is temporarily unavailable.', reason: 'ai_unavailable' },
                    status: 503,
                };
            default:
                return {
                    body: { error: 'Evaluation service is unavailable. Please try again.', reason: 'ai_upstream' },
                    status: 502,
                };
        }
    }
    return { body: { error: 'Internal Server Error', reason: 'internal' }, status: 500 };
}
