/**
 * Offline Support — shared pure Service Worker helpers.
 *
 * This module is intentionally PURE and FRAMEWORK-FREE: it uses no React, no
 * Next.js imports, and no DOM globals beyond the standards-based `URL` type.
 * It is imported directly by unit/property tests and is MIRRORED VERBATIM into
 * `public/sw.js` (authored as plain browser ES, no build step). Keep every
 * function here self-contained so the mirror stays trivial.
 *
 * Covers the pure logic behind:
 *  - Cache_Store naming + versioning (Correctness Property 4; Req 9.1)
 *  - Activation cache cleanup            (Correctness Property 3; Req 1.6, 9.2)
 *  - Request classification (network-only allowlist)
 *                                        (Correctness Property 5; Req 7.4, 10.1-10.3)
 *
 * _Design: Data Models -> Cache_Store naming; Network-only allowlist;
 *          Correctness Properties 3, 4, 5_
 */

/**
 * The current cache version. Bump this per release so a new Service Worker
 * activates fresh caches and cleans up prior versions (Req 9.1, 9.2).
 *
 * SINGLE SOURCE OF TRUTH: this value is kept IN SYNC with `CACHE_VERSION` in the
 * served worker `public/sw.js` (the authoritative worker for the Capacitor
 * Android WebView in `server.url` mode). If you bump one, bump the other.
 */
export const CACHE_VERSION = 'v4';

/**
 * Fixed prefix that identifies caches owned by this application. Used both to
 * build owned cache names and to recognise our names when parsing.
 */
export const CACHE_PREFIX = 'lssb';

/**
 * The owned Cache_Store base names. Each becomes a versioned cache via
 * {@link cacheName}. Order is stable so the mirrored `sw.js` and tests agree.
 *
 * _Design: Data Models -> Cache_Store naming_
 */
export const CACHE_BASES = {
  /** offline page, manifest, icons, placeholder, LSSB_logo */
  PRECACHE: 'precache',
  /** navigations (landing + static study pages) */
  PAGES: 'pages',
  /** /_next/static/* (content-hashed, immutable) */
  NEXT_STATIC: 'next-static',
  /** Google Fonts + Font Awesome CDN */
  FONTS: 'fonts',
  /** external hero images */
  IMAGES: 'images',
  /** whitelisted read-only GET responses */
  API_GET: 'api-get',
  /** practice bank JSON */
  BANKS: 'banks',
  /** RSC / soft-navigation data payloads for allowlisted routes (text/x-component) */
  DATA: 'data',
} as const;

/** Union of the owned base-name string literals. */
export type CacheBase = (typeof CACHE_BASES)[keyof typeof CACHE_BASES];

/** All owned base names as an ordered array. */
export const CACHE_BASE_NAMES: readonly CacheBase[] = Object.values(CACHE_BASES);

/**
 * Derive a versioned cache name of the form `lssb-{base}-{version}`.
 *
 * @param base    the cache base name (e.g. `'pages'`, `'next-static'`)
 * @param version cache version, defaults to {@link CACHE_VERSION}
 * @returns the full cache name, e.g. `'lssb-pages-v1'`
 *
 * Round-trips with {@link parseVersion}: `parseVersion(cacheName(base, v)) === v`
 * for any base and any version that does not itself contain a `-` separator
 * (version identifiers such as `v1`, `v2`, or a build hash).
 */
export function cacheName(base: string, version: string = CACHE_VERSION): string {
  return `${CACHE_PREFIX}-${base}-${version}`;
}

/**
 * Parse the version segment back out of a cache name produced by
 * {@link cacheName}. Returns `null` for names that are not owned by this
 * application (missing the `lssb-` prefix or lacking a base + version).
 *
 * The version is the final `-`-delimited segment, so the base name is free to
 * contain hyphens (e.g. `lssb-next-static-v1` -> `'v1'`).
 *
 * **Validates: Requirements 9.1 (Correctness Property 4)**
 */
export function parseVersion(name: string): string | null {
  const prefix = `${CACHE_PREFIX}-`;
  if (typeof name !== 'string' || !name.startsWith(prefix)) {
    return null;
  }
  // Strip the `lssb-` prefix, leaving `{base}-{version}`.
  const rest = name.slice(prefix.length);
  const lastDash = rest.lastIndexOf('-');
  // Need at least a non-empty base and a non-empty version segment.
  if (lastDash <= 0 || lastDash === rest.length - 1) {
    return null;
  }
  return rest.slice(lastDash + 1);
}

/**
 * Build the complete set of cache names owned by this app for a given version.
 * Anything NOT in this set is deleted on activation (see {@link cachesToDelete}).
 *
 * **Validates: Requirements 9.1 (Correctness Property 4)** — every name shares
 * the same version.
 */
export function ownedCacheNames(version: string = CACHE_VERSION): Set<string> {
  return new Set(CACHE_BASE_NAMES.map((base) => cacheName(base, version)));
}

/**
 * Given the cache names currently present in the Cache_Store and the set of
 * owned cache names, return the names that must be deleted (those NOT owned).
 *
 * After deletion the survivors are exactly `existing ∩ owned`.
 *
 * **Validates: Requirements 1.6, 9.2 (Correctness Property 3)**
 */
export function cachesToDelete(existing: string[], owned: Set<string>): string[] {
  return existing.filter((name) => !owned.has(name));
}

/**
 * Read-only GET API endpoints that are explicitly whitelisted for caching so
 * previously loaded data can be re-viewed offline. These must NOT be treated as
 * network-only even though they share a prefix with online-only endpoints.
 *
 * _Design: Whitelisted read-only GET API_
 */
const READ_ONLY_GET_WHITELIST: readonly string[] = ['/api/auth/status'];

/**
 * Hosts whose requests are always online-only (payment gateways).
 * _Design: Network-only allowlist -> payments (Razorpay)_
 */
const NETWORK_ONLY_HOSTS: readonly string[] = ['checkout.razorpay.com', 'api.razorpay.com'];

/** Fallback origin used to resolve relative URLs into a parseable absolute URL. */
const FALLBACK_ORIGIN = 'https://lakshyassb.online';

interface ParsedUrl {
  pathname: string;
  host: string;
}

/**
 * Robustly parse an absolute or relative URL into `{ pathname, host }`.
 * Never throws: on failure it treats the raw string as a pathname.
 */
function parseUrl(url: string): ParsedUrl {
  try {
    const u = new URL(url, FALLBACK_ORIGIN);
    return { pathname: u.pathname, host: u.host.toLowerCase() };
  } catch {
    // Best-effort fallback for malformed input: use the path portion only.
    const raw = typeof url === 'string' ? url : '';
    const pathname = raw.split('?')[0].split('#')[0];
    return { pathname: pathname.startsWith('/') ? pathname : `/${pathname}`, host: '' };
  }
}

/**
 * Decide whether a request must go straight to the network and never be served
 * from cache. Returns `true` for:
 *   - every non-GET method (all mutations), and
 *   - every enumerated online-only endpoint (auth, payments, AI evaluation,
 *     AI chat mentor, current affairs/news, leaderboards, notifications,
 *     access-check, streak, and OIR generation).
 *
 * Returns `false` for cacheable classes: navigations, `/_next/static`, font
 * CDNs, hero image hosts, `/practice-banks/*`, and whitelisted read-only GET
 * APIs (e.g. `/api/auth/status`).
 *
 * **Validates: Requirements 7.4, 10.1, 10.2, 10.3 (Correctness Property 5)**
 */
export function isNetworkOnly(url: string, method: string): boolean {
  // 1) Every non-GET method is a mutation -> always network-only (Req 10.3).
  const verb = (method || 'GET').toUpperCase();
  if (verb !== 'GET') {
    return true;
  }

  const { pathname, host } = parseUrl(url);

  // 2) Explicitly whitelisted read-only GET APIs are cacheable, even though
  //    they may share a prefix with an online-only group (e.g. /api/auth/*).
  if (READ_ONLY_GET_WHITELIST.includes(pathname)) {
    return false;
  }

  // 3) Payment gateway hosts are always online-only regardless of path.
  if (NETWORK_ONLY_HOSTS.includes(host)) {
    return true;
  }

  // 4) Enumerated online-only API paths.
  if (isOnlineOnlyPath(pathname)) {
    return true;
  }

  // 5) Everything else is a cacheable class.
  return false;
}

/**
 * Path predicate for the enumerated online-only API endpoints.
 * _Design: Network-only allowlist_
 */
function isOnlineOnlyPath(pathname: string): boolean {
  // Authentication: login/signup/Google auth (read-only status handled above).
  if (pathname === '/api/auth' || pathname.startsWith('/api/auth/')) return true;

  // Payments (path-based; hosts handled separately).
  if (pathname.startsWith('/api/payment')) return true;

  // AI evaluation.
  if (pathname === '/api/srt/submit') return true;
  if (pathname === '/api/wat/submit') return true;
  if (pathname.startsWith('/api/tat/')) return true;
  if (pathname.startsWith('/api/piq/')) return true;
  if (pathname.startsWith('/api/gpe/')) return true;
  if (pathname === '/api/practice/lecturette/evaluate') return true;

  // AI chat mentor (Gemini).
  if (pathname.startsWith('/api/chat')) return true;

  // Current affairs / news.
  if (pathname.startsWith('/api/current-affairs')) return true;
  if (pathname.startsWith('/api/quiz/current-affairs')) return true;

  // Leaderboards.
  if (pathname.startsWith('/api/leaderboard')) return true;

  // Notifications.
  if (pathname.startsWith('/api/notifications')) return true;
  if (pathname === '/api/account/notifications') return true;

  // Practice access gate.
  if (pathname === '/api/practice/check-access') return true;

  // Streak.
  if (pathname === '/api/streak' || pathname.startsWith('/api/streak/')) return true;

  // OIR generation (server + DB backed).
  if (pathname === '/api/oir/generate') return true;

  return false;
}
