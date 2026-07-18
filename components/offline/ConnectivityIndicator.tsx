'use client';

import { useEffect, useRef, useState } from 'react';
import { WifiOff, Wifi, CloudOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

/** Window event dispatched by ServiceWorkerRegister when offline support can't be enabled. */
const SW_UNAVAILABLE_EVENT = 'lssb:sw-unavailable';

/** How long the "Back online" pill stays visible after reconnecting (ms). */
const BACK_ONLINE_DURATION_MS = 3000;

/**
 * ConnectivityIndicator — visible connectivity status indication (Requirement 8).
 *
 * A small, non-intrusive fixed badge pinned to the bottom-left corner. It is
 * deliberately placed opposite the AI mentor launcher (which sits bottom-right at
 * `z-[80]`) and uses a lower stacking context (`z-[70]`) so the two never overlap.
 *
 * Behavior:
 * - Offline: shows a persistent "Offline" pill with a WifiOff icon (Req 8.3).
 * - offline -> online transition: briefly shows a "Back online" pill with a Wifi
 *   icon for ~3s, then auto-hides (Req 8.4).
 * - Online steady-state: renders nothing (non-intrusive).
 * - Transitions are event-driven via `useOnlineStatus`, so they reflect well within
 *   the 2s budget (Req 8.3, 8.4). The hook initializes synchronously from
 *   `navigator.onLine`, so the indicator reflects launch-time state (Req 8.5).
 * - On the `lssb:sw-unavailable` window event, renders a subtle one-time
 *   "Offline support unavailable" note (Req 1.7).
 *
 * Accessible: the badge container is a polite live region (`role="status"`,
 * `aria-live="polite"`) so screen readers announce state changes without
 * interrupting the user.
 *
 * Standards-based only: no Capacitor imports or native plugins (Req 11.1).
 *
 * Requirements: 8.3, 8.4, 8.5, 1.7
 */
export default function ConnectivityIndicator() {
    const status = useOnlineStatus();

    // Whether to show the transient "Back online" pill.
    const [showBackOnline, setShowBackOnline] = useState(false);
    // One-time "offline support unavailable" note, triggered by the SW event.
    const [swUnavailable, setSwUnavailable] = useState(false);

    // Track the previous status to detect an offline -> online transition.
    const prevStatusRef = useRef(status);

    useEffect(() => {
        const prev = prevStatusRef.current;
        prevStatusRef.current = status;

        // Only surface "Back online" on a genuine offline -> online transition,
        // not on the initial mount when already online.
        if (prev === 'offline' && status === 'online') {
            setShowBackOnline(true);
            const timer = window.setTimeout(() => setShowBackOnline(false), BACK_ONLINE_DURATION_MS);
            return () => window.clearTimeout(timer);
        }

        // While offline, ensure any lingering "Back online" pill is cleared.
        if (status === 'offline') {
            setShowBackOnline(false);
        }
    }, [status]);

    useEffect(() => {
        const onUnavailable = () => setSwUnavailable(true);
        window.addEventListener(SW_UNAVAILABLE_EVENT, onUnavailable);
        return () => window.removeEventListener(SW_UNAVAILABLE_EVENT, onUnavailable);
    }, []);

    const isOffline = status === 'offline';

    // Nothing to show in the online steady-state (unless a transient/one-time note applies).
    if (!isOffline && !showBackOnline && !swUnavailable) {
        return null;
    }

    return (
        <div
            role="status"
            aria-live="polite"
            className="fixed bottom-6 left-6 z-[70] flex flex-col items-start gap-2 font-noname pointer-events-none"
        >
            {isOffline && (
                <span className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-brand-dark text-white text-xs font-semibold px-3 py-1.5 shadow-lg ring-1 ring-white/10">
                    <WifiOff className="w-3.5 h-3.5 text-brand-orange" aria-hidden="true" />
                    Offline
                </span>
            )}

            {!isOffline && showBackOnline && (
                <span className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-brand-green text-white text-xs font-semibold px-3 py-1.5 shadow-lg ring-1 ring-white/10">
                    <Wifi className="w-3.5 h-3.5" aria-hidden="true" />
                    Back online
                </span>
            )}

            {swUnavailable && (
                <span className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-brand-dark/90 text-white/90 text-[11px] font-medium px-3 py-1.5 shadow-md ring-1 ring-white/10">
                    <CloudOff className="w-3.5 h-3.5 text-brand-orange" aria-hidden="true" />
                    Offline support unavailable
                </span>
            )}
        </div>
    );
}
