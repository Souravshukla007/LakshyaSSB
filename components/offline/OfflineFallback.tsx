'use client';

import React from 'react';
import { WifiOff, RefreshCw, Home } from 'lucide-react';

interface OfflineFallbackProps {
    /** Heading shown at the top of the panel. */
    title?: string;
    /** Explanatory message describing why the content/feature is unavailable. */
    message?: string;
    /** Optional retry handler. When provided, a "Retry" button is rendered. */
    onRetry?: () => void;
}

const DEFAULT_TITLE = "You're offline";
const DEFAULT_MESSAGE =
    'This content needs an active internet connection. Reconnect and try again to pick up where you left off.';

/**
 * OfflineFallback
 *
 * A reusable, presentational panel shown when a capability cannot be served
 * offline. It informs the user that connectivity is required instead of
 * surfacing a raw network error. Purely presentational — it performs no data
 * fetching and holds no state.
 *
 * Requirements: 2.6, 3.5, 4.6, 4.7, 7.1
 */
export default function OfflineFallback({
    title = DEFAULT_TITLE,
    message = DEFAULT_MESSAGE,
    onRetry,
}: OfflineFallbackProps) {
    return (
        <section
            role="status"
            className="w-full flex items-center justify-center px-6 py-16"
        >
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden text-center">
                {/* Decorative banner */}
                <div className="relative w-full h-32 bg-brand-bg flex items-center justify-center overflow-hidden">
                    {/* Glowing effect */}
                    <div className="absolute top-[-50%] left-[-20%] w-[140%] h-[140%] bg-brand-orange/20 blur-3xl rounded-full mix-blend-multiply opacity-50" />

                    {/* Icon container */}
                    <div className="relative z-10 w-16 h-16 rounded-2xl bg-white shadow-lg border border-gray-100 flex items-center justify-center text-brand-orange">
                        <WifiOff className="w-8 h-8" aria-hidden="true" />
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 md:p-8 pt-8">
                    <h2 className="text-2xl font-hero font-bold tracking-tight text-brand-dark mb-2">
                        {title}
                    </h2>

                    <p
                        aria-live="polite"
                        className="text-gray-500 font-noname text-sm mb-8 max-w-[300px] mx-auto leading-relaxed"
                    >
                        {message}
                    </p>

                    {onRetry && (
                        <button
                            type="button"
                            onClick={onRetry}
                            className="w-full relative group bg-brand-dark text-white h-14 rounded-2xl font-bold flex items-center justify-center gap-3 overflow-hidden shadow-lg hover:shadow-xl hover:bg-brand-orange transition-all duration-300"
                        >
                            {/* Shiny sweep effect */}
                            <div className="absolute top-0 -inset-full h-full w-1/2 z-0 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />

                            <RefreshCw className="w-5 h-5 relative z-10" aria-hidden="true" />
                            <span className="relative z-10 tracking-wide">Retry</span>
                        </button>
                    )}

                    {/* Back to Home — the landing page works offline, so this always
                        gives the user a working destination. Uses a plain anchor so
                        it hard-navigates to '/', which the service worker serves from
                        cache while offline. */}
                    <a
                        href="/"
                        className={`w-full h-14 rounded-2xl font-bold flex items-center justify-center gap-3 border-2 border-gray-200 text-brand-dark hover:border-brand-dark hover:bg-brand-bg transition-all duration-300 ${onRetry ? 'mt-3' : ''}`}
                    >
                        <Home className="w-5 h-5" aria-hidden="true" />
                        <span className="tracking-wide">Back to Home</span>
                    </a>
                </div>
            </div>
        </section>
    );
}
