/**
 * Offline Support — client-side "requires internet" guard utilities.
 *
 * This module is the platform-neutral, SSR-safe core that powers the GLOBAL
 * "Please connect to the internet" popup. It contains NO React and NO Capacitor
 * / native imports — only standards-based DOM globals, always accessed behind a
 * `typeof` guard so it is safe to import from server components and unit tests.
 *
 * The pure classification helper {@link shouldPromptForRequest} reuses the
 * existing network-only allowlist ({@link isNetworkOnly}) so the popup fires for
 * exactly the same requests the Service Worker treats as online-only, and never
 * for cacheable GETs / RSC navigations.
 */

import { isNetworkOnly } from '@/lib/offline/sw-helpers';

/**
 * The DOM CustomEvent name broadcast on `window` whenever an online-only action
 * is attempted while offline. {@link OfflinePopup} listens for this event.
 */
export const NEEDS_INTERNET_EVENT = 'lssb:needs-internet';

/**
 * Current connectivity, standards-based and SSR-safe. In SSR or any environment
 * without a `navigator`, we optimistically assume online so nothing is blocked.
 */
export function isOnline(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}

/**
 * Broadcast the "needs internet" event so the global popup can surface. No-op on
 * the server (no `window`). An optional `reason` becomes the popup's message.
 */
export function notifyNeedsInternet(reason?: string): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(NEEDS_INTERNET_EVENT, { detail: { reason } }));
  }
}

/**
 * Gate a non-fetch online-only action. Returns `true` when online (proceed);
 * when offline it fires the popup and returns `false`. Call-sites use:
 *
 * ```ts
 * if (!requireOnline()) return;
 * ```
 */
export function requireOnline(reason?: string): boolean {
  if (isOnline()) {
    return true;
  }
  notifyNeedsInternet(reason);
  return false;
}

/**
 * Pure, unit-testable core: should we prompt the user to connect for this
 * request? Only when we are offline AND the request is one the allowlist marks
 * network-only (mutations + enumerated online-only endpoints). Cacheable GETs
 * and RSC navigations return `false`.
 */
export function shouldPromptForRequest(url: string, method: string, online: boolean): boolean {
  return !online && isNetworkOnly(url, method);
}
