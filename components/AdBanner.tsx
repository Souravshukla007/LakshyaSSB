'use client';

import { useEffect, useRef } from 'react';
import { useAds } from '@/hooks/useAds';

// ─── Ad Slot IDs — Replace these with real AdSense unit IDs ──────────────────
export const AD_SLOTS = {
    HOME_BETWEEN_SECTIONS:      '6463668934', // Landing page — between Features & Testimonials
    CURRENT_AFFAIRS_MID:        '5605882835', // Below news grid, above quiz
    QUIZ_RESULT_BOTTOM:         '2979719499', // Below quiz result card
    LEADERBOARD_MID:            '6444188335', // Between podium and full table
} as const;

type AdSlot = typeof AD_SLOTS[keyof typeof AD_SLOTS];

interface AdBannerProps {
    slot: AdSlot;
    format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
    className?: string;
}

// Extend Window type for adsbygoogle
declare global {
    interface Window {
        adsbygoogle: unknown[];
    }
}

/**
 * AdBanner — A smart, SSR-safe Google AdSense banner component.
 *
 * - Renders nothing for PRO users and Capacitor native app users
 * - Pushes to adsbygoogle only on the client, inside useEffect
 * - Uses a ref flag to avoid double-push in React Strict Mode
 */
export default function AdBanner({ slot, format = 'auto', className = '' }: AdBannerProps) {
    const showAds = useAds();
    const initialized = useRef(false);

    useEffect(() => {
        if (!showAds) return;
        if (initialized.current) return;
        initialized.current = true;

        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (err) {
            console.warn('[AdBanner] adsbygoogle push failed:', err);
        }
    }, [showAds]);

    // Render nothing for PRO users or native app users
    if (!showAds) return null;

    return (
        <div
            className={`ad-banner-wrapper w-full flex flex-col items-center my-6 ${className}`}
            aria-hidden="true"
        >
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-300 mb-2 select-none">
                Advertisement
            </p>
            <ins
                className="adsbygoogle"
                style={{ display: 'block', minHeight: '90px', width: '100%' }}
                data-ad-client="ca-pub-2268345575050436"
                data-ad-slot={slot}
                data-ad-format={format}
                data-full-width-responsive="true"
            />
        </div>
    );
}
