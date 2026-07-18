'use client';

import React from 'react';
import OfflineFallback from '@/components/offline/OfflineFallback';

/**
 * /offline route
 *
 * A static page precached by the Service Worker at install time. The SW serves
 * this route for any uncached navigation while offline, guaranteeing the WebView
 * never shows a native network error. It renders the branded {@link OfflineFallback}
 * panel with a whole-page offline message and a retry control that reloads the
 * current page once connectivity returns.
 *
 * Requirements: 2.6, 3.5, 7.6
 */
export default function OfflinePage() {
    const handleRetry = React.useCallback(() => {
        if (typeof window !== 'undefined') {
            window.location.reload();
        }
    }, []);

    return (
        <main className="antialiased min-h-[60vh] flex items-center justify-center font-sans bg-brand-bg selection:bg-brand-orange selection:text-white">
            <OfflineFallback
                title="You're offline"
                message="This page isn't available right now. Reconnect to the internet and try again to pick up where you left off."
                onRetry={handleRetry}
            />
        </main>
    );
}
