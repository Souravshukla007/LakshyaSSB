'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { NEEDS_INTERNET_EVENT } from '@/lib/offline/online-guard';

const DEFAULT_MESSAGE = 'Please connect to the internet to continue.';
const AUTO_DISMISS_MS = 4000;
/** Treat repeat triggers within this window as the SAME popup (debounce). */
const DEBOUNCE_MS = 1500;

/**
 * OfflinePopup
 *
 * Global, themed "You're offline" popup. Mounted once (in LayoutWrapper). It
 * listens on `window` for {@link NEEDS_INTERNET_EVENT} and shows a single
 * centered modal styled to match ApkDownloadModal / OfflineFallback (white
 * rounded-3xl card on a brand-dark/60 backdrop-blur backdrop, glow banner with a
 * brand-orange WifiOff icon).
 *
 * Behaviour:
 *  - Debounced: if the popup is already visible, or was shown < 1.5s ago, the
 *    timer resets instead of stacking, so several online-only fetches from one
 *    user action produce a single popup.
 *  - Auto-dismisses after ~4s; also dismissable via the "Got it" button, a
 *    backdrop click, or the Escape key.
 *  - Accessible: role="dialog", aria-modal, an aria-live="assertive" message.
 *  - Locks body scroll while open and restores it on close.
 */
export default function OfflinePopup() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string>(DEFAULT_MESSAGE);

  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastShownAt = useRef<number>(0);

  const clearTimer = useCallback(() => {
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }
  }, []);

  const close = useCallback(() => {
    clearTimer();
    setOpen(false);
  }, [clearTimer]);

  const armAutoDismiss = useCallback(() => {
    clearTimer();
    dismissTimer.current = setTimeout(() => setOpen(false), AUTO_DISMISS_MS);
  }, [clearTimer]);

  // Subscribe to the global "needs internet" event.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ reason?: string }>).detail;
      const now = Date.now();
      const alreadyVisible = open || now - lastShownAt.current < DEBOUNCE_MS;

      // Only update the message on a fresh (non-debounced) trigger so a burst of
      // fetches from one action doesn't rewrite the message under the user.
      if (!alreadyVisible) {
        setMessage(detail?.reason || DEFAULT_MESSAGE);
      }

      lastShownAt.current = now;
      setOpen(true);
      armAutoDismiss();
    };

    window.addEventListener(NEEDS_INTERNET_EVENT, handler as EventListener);
    return () => window.removeEventListener(NEEDS_INTERNET_EVENT, handler as EventListener);
  }, [open, armAutoDismiss]);

  // Escape-to-close + body scroll lock while open.
  useEffect(() => {
    if (!open) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', handleEsc);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, close]);

  // Clean up any pending timer on unmount.
  useEffect(() => () => clearTimer(), [clearTimer]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="offline-popup-title"
    >
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm transition-opacity"
        onClick={close}
        aria-hidden="true"
      />

      {/* Card */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-up border border-gray-100 text-center">
        {/* Decorative banner */}
        <div className="relative w-full h-32 bg-brand-bg flex items-center justify-center overflow-hidden">
          {/* Glow */}
          <div className="absolute top-[-50%] left-[-20%] w-[140%] h-[140%] bg-brand-orange/20 blur-3xl rounded-full mix-blend-multiply opacity-50" />
          {/* Icon */}
          <div className="relative z-10 w-16 h-16 rounded-2xl bg-white shadow-lg border border-gray-100 flex items-center justify-center text-brand-orange">
            <WifiOff className="w-8 h-8" aria-hidden="true" />
          </div>
        </div>

        {/* Body */}
        <div className="p-6 md:p-8 pt-8">
          <h3
            id="offline-popup-title"
            className="text-2xl font-hero font-bold tracking-tight text-brand-dark mb-2"
          >
            You&apos;re offline
          </h3>
          <p
            aria-live="assertive"
            className="text-gray-500 font-noname text-sm mb-8 max-w-[280px] mx-auto leading-relaxed"
          >
            {message}
          </p>

          <button
            type="button"
            onClick={close}
            className="w-full relative group bg-brand-dark text-white h-14 rounded-2xl font-bold flex items-center justify-center gap-3 overflow-hidden shadow-lg hover:shadow-xl hover:bg-brand-orange transition-all duration-300"
          >
            {/* Shiny sweep */}
            <div className="absolute top-0 -inset-full h-full w-1/2 z-0 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
            <span className="relative z-10 tracking-wide">Got it</span>
          </button>
        </div>
      </div>
    </div>
  );
}
