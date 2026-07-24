'use client';

import { useEffect } from 'react';
import { notifyNeedsInternet } from '@/lib/offline/online-guard';
import { isOfflineRoute } from '@/lib/offline/offline-routes';

/**
 * OfflineNavGuard — while offline, intercept clicks on internal links that would
 * navigate AWAY to a route that is NOT in the offline allowlist, prevent the
 * navigation, and surface the global "connect to the internet" popup instead.
 *
 * Links to allowlisted routes (see lib/offline/offline-routes.ts) are allowed
 * through because those pages are served from cache offline. External links
 * (target="_blank" or a different origin) also behave normally. Renders nothing.
 */
export default function OfflineNavGuard() {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const handleClick = (e: MouseEvent) => {
      // Only care when we are offline.
      if (navigator.onLine !== false) return;

      const target = e.target as Element | null;
      if (!target || typeof target.closest !== 'function') return;

      const anchor = target.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      // Let new-tab / download links behave normally.
      if (anchor.target && anchor.target !== '_self') return;

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      // External links behave normally.
      if (url.origin !== window.location.origin) return;

      // Allowlisted routes work offline — allow the navigation.
      if (isOfflineRoute(url.pathname)) return;

      // Same-origin navigation to a NON-allowlisted route while offline → block it
      // and show the popup instead of a broken page.
      e.preventDefault();
      e.stopPropagation();
      notifyNeedsInternet();
    };

    // Capture phase so we intercept before Next.js's Link handler runs.
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  return null;
}
