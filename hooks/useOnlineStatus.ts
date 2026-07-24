'use client';

import { useState, useEffect } from 'react';

/**
 * useOnlineStatus — Connectivity_Detector hook (Requirement 8).
 *
 * Returns the current device connectivity state as either 'online' or 'offline',
 * derived from the standards-based `navigator.onLine` property and kept in sync by
 * subscribing to the `window` `online`/`offline` events.
 *
 * The state is initialized synchronously from `navigator.onLine`, so the very first
 * render already reflects the connectivity state at launch (Req 8.5). In SSR or any
 * environment where `navigator` is unavailable, it defaults to 'online'.
 *
 * Standards-based only: this hook does NOT reference Capacitor or any native plugin
 * (Req 11.1), so it works identically in a browser tab and in the Android System WebView.
 */
export type ConnectivityState = 'online' | 'offline';

function getCurrentState(): ConnectivityState {
    if (typeof navigator === 'undefined') {
        // SSR / no-navigator environment: assume online.
        return 'online';
    }
    return navigator.onLine ? 'online' : 'offline';
}

export function useOnlineStatus(): ConnectivityState {
    // IMPORTANT (hydration safety): the first client render MUST match the server
    // render, which has no `navigator` and therefore resolves to 'online'. If we
    // initialized from `navigator.onLine` here, an offline device would render
    // 'offline' on the client while the server rendered 'online', causing a React
    // hydration mismatch. So we start from a stable 'online' and correct to the
    // real connectivity in the effect below (runs immediately after mount, well
    // within the Req 8.5 launch-time budget).
    const [state, setState] = useState<ConnectivityState>('online');

    useEffect(() => {
        // Reflect the real connectivity as soon as we're on the client.
        setState(getCurrentState());

        const handleOnline = () => setState('online');
        const handleOffline = () => setState('offline');

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return state;
}
