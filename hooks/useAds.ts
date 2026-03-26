'use client';

import { useState, useEffect } from 'react';

/**
 * useAds — determines whether Google AdSense ads should be rendered.
 *
 * Returns showAds = true  → Guest user or FREE plan user
 * Returns showAds = false → PRO user OR running inside Capacitor native app
 *
 * We reuse the existing /api/auth/status endpoint which already returns plan.
 */
export function useAds(): boolean {
    const [showAds, setShowAds] = useState(false);

    useEffect(() => {
        // Never show ads inside the Capacitor native Android/iOS app
        // @ts-ignore — Capacitor is injected at runtime on native builds
        if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()) {
            setShowAds(false);
            return;
        }

        // Fetch the user's live plan from the existing auth status endpoint
        fetch('/api/auth/status')
            .then(res => {
                if (!res.ok) {
                    // 401 = not logged in (guest) → show ads
                    setShowAds(true);
                    return null;
                }
                return res.json();
            })
            .then(data => {
                if (!data) return; // Already handled above (guest)
                // Show ads for FREE users, hide for PRO users
                setShowAds(data.plan !== 'PRO');
            })
            .catch(() => {
                // On any error, default to showing ads (guest assumption)
                setShowAds(true);
            });
    }, []);

    return showAds;
}
