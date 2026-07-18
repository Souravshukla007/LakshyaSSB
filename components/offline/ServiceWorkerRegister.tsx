'use client';

import { useEffect } from 'react';

/** Window event dispatched when offline support cannot be enabled. */
const SW_UNAVAILABLE_EVENT = 'lssb:sw-unavailable';

/**
 * ServiceWorkerRegister
 *
 * Registers the hand-authored Service Worker (`/sw.js`, scope `/`) that powers
 * scoped offline support. It renders nothing — it exists purely for its
 * registration side effect.
 *
 * Behavior:
 * - Guards on `'serviceWorker' in navigator` and `window.isSecureContext`, so
 *   registration is only attempted in a secure context that supports Service
 *   Workers (the Android System WebView loads the `https://` origin, so this
 *   holds there as well as in standard browsers).
 * - Registers on the `window` `load` event, which keeps registration well
 *   within 5 seconds of the initial page load (Requirement 1.1).
 * - On success, attaches an `updatefound` listener to surface that a new
 *   Service Worker version is being installed (logged via `console.info`; no
 *   UI is rendered from here).
 * - On failure — whether the guards are not met or `register` rejects — it
 *   dispatches a `window` CustomEvent named `lssb:sw-unavailable` and continues
 *   silently. The app keeps working against the direct network, and the
 *   connectivity indicator consumes this event to note that offline support is
 *   unavailable (Requirement 1.7).
 *
 * Standards-based only: no Capacitor imports, native plugins, or
 * platform-specific bridges are used (Requirement 11.1).
 *
 * Requirements: 1.1, 1.7
 */
export default function ServiceWorkerRegister(): null {
    useEffect(() => {
        // Guard: only register in a secure context that supports Service Workers.
        // If unsupported, surface that offline support is unavailable (Req 1.7).
        if (!('serviceWorker' in navigator) || !window.isSecureContext) {
            window.dispatchEvent(new CustomEvent(SW_UNAVAILABLE_EVENT));
            return;
        }

        /**
         * Perform the actual registration. Any rejection is caught so the app
         * continues on the direct network with a non-blocking indication that
         * offline support is unavailable (Req 1.7).
         */
        const register = async (): Promise<void> => {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/',
                });

                // Surface update availability. No UI is rendered from here; the
                // indicator/update flow is handled elsewhere.
                registration.addEventListener('updatefound', () => {
                    console.info('[offline] Service Worker update found; installing new version.');
                });
            } catch {
                window.dispatchEvent(new CustomEvent(SW_UNAVAILABLE_EVENT));
            }
        };

        /** Register on window `load` so registration stays within the 5s budget (Req 1.1). */
        const onLoad = (): void => {
            void register();
        };

        // If the page has already loaded by the time this effect runs, register
        // immediately; otherwise wait for the `load` event.
        if (document.readyState === 'complete') {
            void register();
        } else {
            window.addEventListener('load', onLoad);
        }

        // Clean up the `load` listener on unmount.
        return () => {
            window.removeEventListener('load', onLoad);
        };
    }, []);

    return null;
}
