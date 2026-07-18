'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { listPending, type Draft } from '@/lib/offline/draftStore';
import { flushPending, nextDelay } from '@/lib/offline/syncManager';

/**
 * useDraftSync — draft pending-count tracking + reconnect flush (Requirement 6).
 *
 * Bridges the Local_Draft_Store (`lib/offline/draftStore.ts`) and the deferred
 * submission sync manager (`lib/offline/syncManager.ts`) to the UI. It exposes
 * the number of drafts awaiting submission and the outcome of the most recent
 * flush, so a badge can surface the "Saved locally — not yet submitted",
 * success, failed, and manual-retry states (Req 6.2, 6.4, 6.5, 6.6).
 *
 * Behavior:
 * - On mount it refreshes `pendingCount` from `listPending()` and, if online,
 *   attempts a flush so any drafts left over from a previous offline session are
 *   submitted promptly (well within the 10s reconnect budget, Req 6.3).
 * - Whenever `useOnlineStatus()` transitions offline -> online, it calls
 *   `flushPending()` immediately (Req 6.3) and refreshes the count.
 * - `lastResult` reflects the latest flush: `syncing` while in flight, `success`
 *   when every pending draft was submitted (Req 6.4), `manual-retry` when a
 *   retained draft has exhausted its automatic attempts (`nextDelay` → null,
 *   Req 6.6), and `failed` when some drafts failed but may still be retried
 *   (Req 6.5). It starts at `idle`.
 *
 * SSR / IndexedDB safety (Requirement 11.1): no `window`/`indexedDB` access
 * happens during render. Every store access runs inside an effect or callback
 * and is wrapped in try/catch, so an unavailable IndexedDB (SSR, private mode,
 * or a failed open) degrades gracefully to `pendingCount: 0` without throwing.
 */
export type DraftSyncResult = 'idle' | 'syncing' | 'success' | 'failed' | 'manual-retry';

export interface DraftSyncState {
    /** Number of drafts currently awaiting submission (status pending/failed). */
    pendingCount: number;
    /** Outcome of the most recent flush attempt. */
    lastResult: DraftSyncResult;
}

/** True when at least one draft has exhausted its automatic retry attempts. */
function hasManualRetry(drafts: Draft[]): boolean {
    return drafts.some((d) => nextDelay(d.attempts) === null);
}

export function useDraftSync(): DraftSyncState {
    const status = useOnlineStatus();

    const [pendingCount, setPendingCount] = useState(0);
    const [lastResult, setLastResult] = useState<DraftSyncResult>('idle');

    // Guard against overlapping flushes (e.g. mount + a fast online transition).
    const flushingRef = useRef(false);
    // Track previous connectivity to detect a genuine offline -> online transition.
    const prevStatusRef = useRef(status);
    // Avoid state updates after unmount.
    const mountedRef = useRef(true);

    /** Refresh `pendingCount` from the store; safe against an unavailable IndexedDB. */
    const refreshCount = useCallback(async () => {
        try {
            const pending = await listPending();
            if (mountedRef.current) {
                setPendingCount(pending.length);
            }
        } catch {
            // IndexedDB unavailable / SSR / open failure: treat as no pending drafts.
            if (mountedRef.current) {
                setPendingCount(0);
            }
        }
    }, []);

    /** Attempt one flush pass over all pending drafts and update UI state. */
    const flush = useCallback(async () => {
        if (flushingRef.current) return;
        flushingRef.current = true;
        if (mountedRef.current) {
            setLastResult('syncing');
        }

        try {
            const { failed } = await flushPending();
            // Re-read the store to compute the count and the manual-retry state.
            let remaining: Draft[] = [];
            try {
                remaining = await listPending();
            } catch {
                remaining = [];
            }

            if (mountedRef.current) {
                setPendingCount(remaining.length);
                if (failed.length === 0) {
                    setLastResult('success');
                } else if (hasManualRetry(remaining)) {
                    setLastResult('manual-retry');
                } else {
                    setLastResult('failed');
                }
            }
        } catch {
            // A flush-level failure (e.g. store unreadable): reflect a failed pass
            // and refresh whatever count we can.
            if (mountedRef.current) {
                setLastResult('failed');
            }
            await refreshCount();
        } finally {
            flushingRef.current = false;
        }
    }, [refreshCount]);

    // On mount: refresh the pending count, and flush immediately when online.
    useEffect(() => {
        mountedRef.current = true;

        void (async () => {
            await refreshCount();
            if (getInitialOnline()) {
                await flush();
            }
        })();

        return () => {
            mountedRef.current = false;
        };
        // Intentionally run once on mount.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // On offline -> online transition: flush pending drafts within the budget.
    useEffect(() => {
        const prev = prevStatusRef.current;
        prevStatusRef.current = status;

        if (prev === 'offline' && status === 'online') {
            void flush();
        } else if (status === 'offline') {
            // Keep the count accurate while offline (drafts may be added).
            void refreshCount();
        }
    }, [status, flush, refreshCount]);

    return { pendingCount, lastResult };
}

/** Read the current online state without touching the store; SSR-safe. */
function getInitialOnline(): boolean {
    if (typeof navigator === 'undefined') return false;
    return navigator.onLine;
}
