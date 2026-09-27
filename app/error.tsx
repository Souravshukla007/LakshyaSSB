'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * Route-level error boundary for the whole app.
 *
 * Before this existed there was no error.tsx anywhere in app/, so a single
 * unexpected value — a malformed AI field reaching a chart mapper, say — took the
 * page to a blank white screen with no way back.
 */
export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('[app/error]', error);
    }, [error]);

    return (
        <main className="min-h-screen bg-brand-bg flex items-center justify-center px-6 py-20">
            <div className="max-w-lg w-full bg-white rounded-[2rem] border border-gray-100 shadow-xl p-10 text-center">
                <div className="w-16 h-16 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center mx-auto mb-6">
                    <i className="fa-solid fa-triangle-exclamation text-2xl text-brand-orange" aria-hidden="true"></i>
                </div>

                <h1 className="font-hero font-bold text-3xl text-brand-dark mb-3">
                    Something went wrong
                </h1>
                <p className="text-gray-500 font-noname mb-2">
                    This page hit an unexpected error. Your account and saved results are safe.
                </p>
                {error.digest && (
                    <p className="text-[11px] font-mono text-gray-400 mb-8">
                        Reference: {error.digest}
                    </p>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
                    <button
                        onClick={reset}
                        className="px-8 py-3.5 rounded-full bg-brand-dark text-white font-bold hover:bg-brand-orange transition-all shadow-lg"
                    >
                        Try again
                    </button>
                    <Link
                        href="/dashboard"
                        className="px-8 py-3.5 rounded-full bg-white border-2 border-gray-100 text-brand-dark font-bold hover:border-gray-200 hover:bg-gray-50 transition-all"
                    >
                        Back to dashboard
                    </Link>
                </div>
            </div>
        </main>
    );
}
