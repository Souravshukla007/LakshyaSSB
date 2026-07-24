/**
 * Feature: offline-support — the allowlist of routes that work OFFLINE.
 *
 * Only these exact pathnames are cached and served while offline. Navigating to
 * anything else offline shows the "You're offline" popup / offline page.
 *
 * IMPORTANT: this list is MIRRORED verbatim inside `public/sw.js` (which cannot
 * import modules). If you change it here, update the OFFLINE_ROUTES array in
 * public/sw.js to match.
 */
export const OFFLINE_ROUTES: readonly string[] = [
  '/',
  '/practice',
  '/pricing',
  '/privacy',
  '/terms',
  '/refund-policy',
  '/about',
  '/contact',
  '/roadmap',
  '/ssb/day-1',
  '/ssb/day-2',
  '/ssb/day-3',
  '/ssb/day-4',
  '/ssb/day-5',
];

/** Normalize a pathname (strip a trailing slash except for root) then test membership. */
export function isOfflineRoute(pathname: string): boolean {
  if (typeof pathname !== 'string') return false;
  const normalized =
    pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  return OFFLINE_ROUTES.includes(normalized);
}
