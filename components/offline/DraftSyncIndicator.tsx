'use client';

import { useEffect, useRef, useState } from 'react';
import { CloudUpload, RefreshCw, CheckCircle2, AlertTriangle, CircleAlert } from 'lucide-react';
import { useDraftSync } from '@/hooks/useDraftSync';

/** How long the transient "Submitted" success tick stays visible (ms). */
const SUCCESS_DURATION_MS = 3000;

/**
 * DraftSyncIndicator — draft persistence + deferred-submission status badge
 * (Requirement 6.2, 6.4, 6.5, 6.6).
 *
 * A small, non-intrusive fixed badge driven entirely by `useDraftSync()`. It is
 * pinned to the bottom-center of the viewport so it never overlaps the
 * `ConnectivityIndicator` (bottom-left, `z-[70]`) or the AI mentor launcher
 * (bottom-right, `z-[80]`). It uses a lower stacking context and only renders
 * when there is something to say.
 *
 * States:
 * - pendingCount > 0 (not yet a terminal result): persistent
 *   "Saved locally — not yet submitted" pill (Req 6.2).
 * - lastResult === 'syncing': "Submitting…" pill with a spinning icon (Req 6.3).
 * - lastResult === 'success': brief "Submitted" success tick, auto-hides after
 *   ~3s (Req 6.4).
 * - lastResult === 'failed': "Submission failed — will retry" pill (Req 6.5).
 * - lastResult === 'manual-retry': "Manual retry required" pill (Req 6.6).
 *
 * Accessible: the container is a polite live region (`role="status"`,
 * `aria-live="polite"`) so screen readers announce state changes without
 * interrupting the user. Icons are decorative (`aria-hidden`); the text carries
 * the meaning.
 *
 * Brand styling: `brand-dark`/`brand-orange`/`brand-green` with `font-noname`,
 * matching `ConnectivityIndicator`. lucide-react icons.
 *
 * Standards-based only: no Capacitor imports or native plugins (Req 11.1).
 */
export default function DraftSyncIndicator() {
    const { pendingCount, lastResult } = useDraftSync();

    // Whether to show the transient "Submitted" success tick.
    const [showSuccess, setShowSuccess] = useState(false);
    const prevResultRef = useRef(lastResult);

    useEffect(() => {
        const prev = prevResultRef.current;
        prevResultRef.current = lastResult;

        if (prev !== 'success' && lastResult === 'success') {
            setShowSuccess(true);
            const timer = window.setTimeout(() => setShowSuccess(false), SUCCESS_DURATION_MS);
            return () => window.clearTimeout(timer);
        }
        if (lastResult !== 'success') {
            setShowSuccess(false);
        }
    }, [lastResult]);

    const isSyncing = lastResult === 'syncing';
    const isFailed = lastResult === 'failed';
    const isManualRetry = lastResult === 'manual-retry';
    const hasPending = pendingCount > 0;

    // Decide what (if anything) to render. Failure/manual-retry take precedence
    // because they need the user's attention; then syncing, then the transient
    // success tick, then the persistent "saved locally" pill.
    let content: React.ReactNode = null;

    if (isManualRetry) {
        content = (
            <span className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-brand-dark text-white text-xs font-semibold px-3 py-1.5 shadow-lg ring-1 ring-brand-orange/40">
                <CircleAlert className="w-3.5 h-3.5 text-brand-orange" aria-hidden="true" />
                Manual retry required
                {hasPending ? ` (${pendingCount})` : ''}
            </span>
        );
    } else if (isFailed) {
        content = (
            <span className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-brand-dark text-white text-xs font-semibold px-3 py-1.5 shadow-lg ring-1 ring-white/10">
                <AlertTriangle className="w-3.5 h-3.5 text-brand-orange" aria-hidden="true" />
                Submission failed — will retry
                {hasPending ? ` (${pendingCount})` : ''}
            </span>
        );
    } else if (isSyncing) {
        content = (
            <span className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-brand-dark text-white text-xs font-semibold px-3 py-1.5 shadow-lg ring-1 ring-white/10">
                <RefreshCw className="w-3.5 h-3.5 text-brand-orange animate-spin" aria-hidden="true" />
                Submitting…
            </span>
        );
    } else if (showSuccess) {
        content = (
            <span className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-brand-green text-white text-xs font-semibold px-3 py-1.5 shadow-lg ring-1 ring-white/10">
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                Submitted
            </span>
        );
    } else if (hasPending) {
        content = (
            <span className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-brand-dark text-white text-xs font-semibold px-3 py-1.5 shadow-lg ring-1 ring-white/10">
                <CloudUpload className="w-3.5 h-3.5 text-brand-orange" aria-hidden="true" />
                Saved locally — not yet submitted
                {pendingCount > 1 ? ` (${pendingCount})` : ''}
            </span>
        );
    }

    return (
        <div
            role="status"
            aria-live="polite"
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2 font-noname pointer-events-none"
        >
            {content}
        </div>
    );
}
