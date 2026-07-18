'use client';

import { useEffect } from 'react';
import { notifyNeedsInternet, shouldPromptForRequest } from '@/lib/offline/online-guard';

/**
 * NetworkGuard
 *
 * Renders nothing. On mount it monkey-patches `window.fetch` ONCE so that any
 * online-only request attempted while offline ALSO surfaces the global themed
 * popup — without editing every call-site.
 *
 * Behaviour contract:
 *  - The wrapper only ADDS a popup notification. It ALWAYS delegates to the
 *    original `fetch` and returns its promise unchanged, so existing online
 *    behaviour and existing call-site `.catch(...)` handlers are untouched. The
 *    offline request still fails naturally.
 *  - Classification is wrapped in try/catch, so the guard can never break a
 *    request even if URL/method extraction throws.
 *  - Idempotent: guarded by `window.__lssbFetchGuard` so React StrictMode double
 *    mounts and HMR re-mounts never double-wrap. The original fetch reference is
 *    preserved for restoration on unmount.
 *
 * Note: RSC / navigation GET fetches are NOT online-only (isNetworkOnly=false),
 * so they never trigger the popup — only the enumerated online-only APIs and
 * mutations do.
 */
export default function NetworkGuard() {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.fetch !== 'function') {
      return;
    }

    // Idempotency: never double-wrap across StrictMode/HMR remounts.
    if ((window as any).__lssbFetchGuard) {
      return;
    }

    const originalFetch = window.fetch.bind(window);
    (window as any).__lssbFetchGuard = true;

    const guardedFetch: typeof window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      try {
        const url =
          typeof input === 'string'
            ? input
            : input instanceof URL
              ? input.href
              : input.url;
        const method = init?.method ?? (input instanceof Request ? input.method : 'GET');

        if (shouldPromptForRequest(url, method, navigator.onLine)) {
          notifyNeedsInternet();
        }
      } catch {
        // Never let classification break a request.
      }

      // Always delegate untouched.
      return originalFetch(input as any, init);
    };

    window.fetch = guardedFetch;

    return () => {
      // Only restore if our wrapper is still the active one.
      if (window.fetch === guardedFetch) {
        window.fetch = originalFetch;
      }
      delete (window as any).__lssbFetchGuard;
    };
  }, []);

  return null;
}
