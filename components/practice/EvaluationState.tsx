'use client';

import Link from 'next/link';

/**
 * Shared loading / error / paywall panel for AI evaluation results.
 *
 * Why this exists: every practice page used to gate its report on
 * `isSubmitting || !result`, and every submit handler swallowed a non-OK
 * response into `console.error`. So a free user who had used their one
 * evaluation — or anyone who hit a model timeout — sat in front of
 * "Analyzing Responses…" forever, after typing 60 sentences, with no error, no
 * retry and no upgrade prompt.
 *
 * Feed it the `reason` the API already sends and it renders the right thing.
 */

export interface EvaluationFailure {
    reason: string;
    message: string;
    upgradeUrl?: string;
}

/** Pull a usable failure out of a non-OK fetch Response. */
export async function toEvaluationFailure(res: Response): Promise<EvaluationFailure> {
    let payload: Record<string, unknown> = {};
    try {
        payload = await res.json();
    } catch {
        /* non-JSON error body */
    }

    const reason = typeof payload.reason === 'string' ? payload.reason : `http_${res.status}`;
    const message =
        typeof payload.error === 'string'
            ? payload.error
            : res.status === 401
              ? 'Your session has expired. Please sign in again.'
              : 'We could not evaluate your responses. Please try again.';

    return {
        reason,
        message,
        upgradeUrl: typeof payload.upgradeUrl === 'string' ? payload.upgradeUrl : undefined,
    };
}

export function EvaluationLoading({
    title = 'Analyzing Responses...',
    subtitle = 'Our AI engine is processing your submission.',
}: {
    title?: string;
    subtitle?: string;
}) {
    return (
        <div className="py-20 flex flex-col items-center justify-center text-center" role="status" aria-live="polite">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-brand-orange rounded-full animate-spin mb-6"></div>
            <h2 className="text-2xl font-hero font-bold text-brand-dark mb-2">{title}</h2>
            <p className="text-gray-500 font-noname">{subtitle}</p>
        </div>
    );
}

export function EvaluationError({
    failure,
    onRetry,
}: {
    failure: EvaluationFailure;
    onRetry?: () => void;
}) {
    const isPaywall = failure.reason === 'free_limit_reached' || failure.reason === 'pro_required';
    const isAuth = failure.reason === 'unauthenticated' || failure.reason === 'http_401';

    if (isPaywall) {
        return (
            <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center mb-6">
                    <i className="fa-solid fa-lock text-2xl text-brand-orange" aria-hidden="true"></i>
                </div>
                <h2 className="text-2xl font-hero font-bold text-brand-dark mb-3">
                    You&apos;ve used your free evaluation
                </h2>
                <p className="text-gray-500 font-noname max-w-md mb-2">{failure.message}</p>
                <p className="text-sm text-gray-400 font-noname max-w-md mb-8">
                    Your answers were recorded. Upgrade to Pro for unlimited AI evaluations across
                    every module.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                        href={failure.upgradeUrl ?? '/pricing'}
                        className="px-8 py-3.5 rounded-full bg-brand-dark text-white font-bold hover:bg-brand-orange transition-all shadow-lg"
                    >
                        Upgrade to Pro
                    </Link>
                    <Link
                        href="/dashboard"
                        className="px-8 py-3.5 rounded-full bg-white border-2 border-gray-100 text-brand-dark font-bold hover:border-gray-200 hover:bg-gray-50 transition-all"
                    >
                        Back to dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mb-6">
                <i className="fa-solid fa-circle-exclamation text-2xl text-red-500" aria-hidden="true"></i>
            </div>
            <h2 className="text-2xl font-hero font-bold text-brand-dark mb-3">
                {isAuth ? 'Session expired' : 'Evaluation failed'}
            </h2>
            <p className="text-gray-500 font-noname max-w-md mb-8">{failure.message}</p>
            <div className="flex flex-col sm:flex-row gap-3">
                {isAuth ? (
                    <Link
                        href="/auth"
                        className="px-8 py-3.5 rounded-full bg-brand-dark text-white font-bold hover:bg-brand-orange transition-all shadow-lg"
                    >
                        Sign in again
                    </Link>
                ) : (
                    onRetry && (
                        <button
                            onClick={onRetry}
                            className="px-8 py-3.5 rounded-full bg-brand-dark text-white font-bold hover:bg-brand-orange transition-all shadow-lg"
                        >
                            Retry evaluation
                        </button>
                    )
                )}
                <Link
                    href="/practice"
                    className="px-8 py-3.5 rounded-full bg-white border-2 border-gray-100 text-brand-dark font-bold hover:border-gray-200 hover:bg-gray-50 transition-all"
                >
                    Back to practice
                </Link>
            </div>
        </div>
    );
}
