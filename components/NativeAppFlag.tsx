'use client';

import { useLayoutEffect } from 'react';

/**
 * Keeps `data-native-app` on <html> inside the Capacitor Android app.
 *
 * The inline script at the top of <body> in app/layout.tsx sets it before first
 * paint. This re-applies it after React mounts, because if React ever has to
 * client-render the root (a hydration failure outside a Suspense boundary), it
 * rebuilds <html> from its own props and drops every attribute it did not render.
 * Without the flag the header slides back under the status bar.
 *
 * Layout effect so the re-applied styles land before the browser paints.
 */
export default function NativeAppFlag() {
    useLayoutEffect(() => {
        if (window.Capacitor?.isNativePlatform?.()) {
            document.documentElement.setAttribute('data-native-app', '');
        }
    }, []);

    return null;
}
