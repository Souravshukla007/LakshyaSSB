/*
 * LakshyaSSB Service Worker — scoped offline support.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ MIRROR NOTICE                                                             │
 * │ This file is authored in plain browser ES (NO imports, NO TypeScript) so  │
 * │ it can be served verbatim from `public/sw.js` at the origin root without  │
 * │ passing through the Next.js / Turbopack build.                            │
 * │                                                                           │
 * │ The pure classifier + cache-naming logic below is MIRRORED VERBATIM from  │
 * │ `lib/offline/sw-helpers.ts`. If you change one, you MUST change the other │
 * │ to keep them in sync (cache names, OWNED set, isNetworkOnly allowlist,    │
 * │ read-only GET whitelist, network-only hosts, online-only path predicate). │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * Standards-based and platform-neutral: contains NO Capacitor / native / plugin
 * references (Req 11.1, 11.3). Runs identically in a browser tab and in the
 * Android System WebView (Req 1.8, 11.2).
 *
 * Requirements: 1.3, 1.4, 1.5, 1.6, 1.8, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3,
 * 3.4, 4.2, 4.3, 5.1, 7.6, 9.1, 9.2, 9.3, 9.4, 9.6, 10.3, 11.1.
 */

'use strict';

/* ==========================================================================
 * Cache_Store naming + versioning  (mirror of sw-helpers.ts; Req 9.1)
 * ======================================================================== */

// Bump per release so a new worker activates fresh caches and cleans up prior
// versions (Req 9.1, 9.2).
const CACHE_VERSION = 'v1';

// Fixed prefix identifying caches owned by this application.
const CACHE_PREFIX = 'lssb';

// Derive a versioned cache name of the form `lssb-{base}-{version}`.
function cacheName(base, version) {
  return CACHE_PREFIX + '-' + base + '-' + (version || CACHE_VERSION);
}

// Owned versioned cache names (mirror of CACHE_BASES in sw-helpers.ts).
const PRECACHE = cacheName('precache'); // offline page, manifest, icons, placeholder, LSSB_logo
const PAGES = cacheName('pages'); // navigations (landing + static study pages)
const NEXT_STATIC = cacheName('next-static'); // /_next/static/* (content-hashed, immutable)
const FONTS = cacheName('fonts'); // Google Fonts + Font Awesome CDN
const IMAGES = cacheName('images'); // external hero images
const API_GET = cacheName('api-get'); // whitelisted read-only GET responses
const BANKS = cacheName('banks'); // practice bank JSON

// Anything NOT in this set is deleted on activation (Req 1.6, 9.2).
const OWNED = new Set([PRECACHE, PAGES, NEXT_STATIC, FONTS, IMAGES, API_GET, BANKS]);

// Given the caches currently present and the OWNED set, return names to delete
// (those NOT owned). Survivors after deletion are exactly `existing ∩ OWNED`.
// (mirror of cachesToDelete in sw-helpers.ts; Correctness Property 3)
function cachesToDelete(existing, owned) {
  return existing.filter(function (name) {
    return !owned.has(name);
  });
}

/* ==========================================================================
 * Precache manifest (App_Shell — Req 1.3, 1.4)
 * ======================================================================== */

const PRECACHE_URLS = [
  '/offline', // offline fallback route
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/LSSB_logo.png',
  '/images/hero-placeholder.png', // shared placeholder for failed hero images (Req 2.3)
];

// Shared placeholder served when a hero image is missing while offline (Req 2.3).
const HERO_PLACEHOLDER_URL = '/images/hero-placeholder.png';

/* ==========================================================================
 * Request classification  (mirror of sw-helpers.ts; Correctness Property 5)
 * ======================================================================== */

// Read-only GET API endpoints explicitly whitelisted for caching so previously
// loaded data can be re-viewed offline. Must NOT be treated as network-only
// even though they may share a prefix with an online-only group.
const READ_ONLY_GET_WHITELIST = ['/api/auth/status'];

// Hosts whose requests are always online-only (payment gateways).
const NETWORK_ONLY_HOSTS = ['checkout.razorpay.com', 'api.razorpay.com'];

// Fallback origin used to resolve relative URLs into a parseable absolute URL.
const FALLBACK_ORIGIN = 'https://lakshyassb.online';

// Font CDN hosts — stale-while-revalidate (Req 2.4).
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdnjs.cloudflare.com'];

// External hero image hosts — cache-first + placeholder fallback (Req 2.3).
const IMAGE_HOSTS = ['images.unsplash.com', 'images.pexels.com', 'www.ssbcrack.com'];

// Robustly parse an absolute or relative URL into { pathname, host }.
// Never throws: on failure treats the raw string as a pathname.
function parseUrl(url) {
  try {
    const u = new URL(url, FALLBACK_ORIGIN);
    return { pathname: u.pathname, host: u.host.toLowerCase() };
  } catch (e) {
    const raw = typeof url === 'string' ? url : '';
    const pathname = raw.split('?')[0].split('#')[0];
    return { pathname: pathname.charAt(0) === '/' ? pathname : '/' + pathname, host: '' };
  }
}

// Path predicate for the enumerated online-only API endpoints.
// (mirror of isOnlineOnlyPath in sw-helpers.ts)
function isOnlineOnlyPath(pathname) {
  // Authentication: login/signup/Google auth (read-only status handled above).
  if (pathname === '/api/auth' || pathname.indexOf('/api/auth/') === 0) return true;

  // Payments (path-based; hosts handled separately).
  if (pathname.indexOf('/api/payment') === 0) return true;

  // AI evaluation.
  if (pathname === '/api/srt/submit') return true;
  if (pathname === '/api/wat/submit') return true;
  if (pathname.indexOf('/api/tat/') === 0) return true;
  if (pathname.indexOf('/api/piq/') === 0) return true;
  if (pathname.indexOf('/api/gpe/') === 0) return true;
  if (pathname === '/api/practice/lecturette/evaluate') return true;

  // AI chat mentor (Gemini).
  if (pathname.indexOf('/api/chat') === 0) return true;

  // Current affairs / news.
  if (pathname.indexOf('/api/current-affairs') === 0) return true;
  if (pathname.indexOf('/api/quiz/current-affairs') === 0) return true;

  // Leaderboards.
  if (pathname.indexOf('/api/leaderboard') === 0) return true;

  // Notifications.
  if (pathname.indexOf('/api/notifications') === 0) return true;
  if (pathname === '/api/account/notifications') return true;

  // Practice access gate.
  if (pathname === '/api/practice/check-access') return true;

  // Streak.
  if (pathname === '/api/streak' || pathname.indexOf('/api/streak/') === 0) return true;

  // OIR generation (server + DB backed).
  if (pathname === '/api/oir/generate') return true;

  return false;
}

// Decide whether a request must go straight to the network and never be served
// from cache. Returns true for every non-GET method and for every enumerated
// online-only endpoint; false for cacheable classes.
// (mirror of isNetworkOnly in sw-helpers.ts; Req 7.4, 10.1, 10.2, 10.3)
function isNetworkOnly(url, method) {
  // 1) Every non-GET method is a mutation -> always network-only (Req 10.3).
  const verb = (method || 'GET').toUpperCase();
  if (verb !== 'GET') {
    return true;
  }

  const parsed = parseUrl(url);
  const pathname = parsed.pathname;
  const host = parsed.host;

  // 2) Explicitly whitelisted read-only GET APIs are cacheable.
  if (READ_ONLY_GET_WHITELIST.indexOf(pathname) !== -1) {
    return false;
  }

  // 3) Payment gateway hosts are always online-only regardless of path.
  if (NETWORK_ONLY_HOSTS.indexOf(host) !== -1) {
    return true;
  }

  // 4) Enumerated online-only API paths.
  if (isOnlineOnlyPath(pathname)) {
    return true;
  }

  // 5) Everything else is a cacheable class.
  return false;
}

/* ==========================================================================
 * install — all-or-nothing precache of the App_Shell (Req 1.3, 1.4)
 * ======================================================================== */

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(PRECACHE).then(function (cache) {
      // cache.addAll is atomic: if ANY request fails, the returned promise
      // rejects, so the install fails, this worker does NOT activate, and the
      // previously cached shell is retained (Req 1.4). No partial shell served.
      return cache.addAll(PRECACHE_URLS);
    })
  );
  // Become the active worker as soon as install succeeds (Req 1.5, 9.4).
  self.skipWaiting();
});

/* ==========================================================================
 * activate — delete caches not in OWNED, keep serving on failure (Req 1.6, 9.2, 9.3)
 * ======================================================================== */

self.addEventListener('activate', function (event) {
  event.waitUntil(
    (async function () {
      try {
        const existing = await caches.keys();
        const toDelete = cachesToDelete(existing, OWNED);
        await Promise.all(
          toDelete.map(function (name) {
            return caches.delete(name);
          })
        );
      } catch (err) {
        // If deletion fails, retain the current caches and keep serving; the
        // stale entries are harmless and cleanup retries on the next activate
        // (Req 9.3). Never let cleanup failure break activation.
        // eslint-disable-next-line no-console
        console.warn('[sw] cache cleanup failed; retrying next activate', err);
      }
      // Take control of open clients immediately (Req 9.4, 9.6).
      await self.clients.claim();
    })()
  );
});

/* ==========================================================================
 * fetch — first-match-wins request routing (per design flowchart)
 * ======================================================================== */

self.addEventListener('fetch', function (event) {
  const request = event.request;
  const url = request.url;

  // 1) Non-GET OR network-only URL: do NOT call respondWith. The browser/WebView
  //    performs its normal network fetch so the server response (or the server/
  //    network error) reaches the app unchanged, preserving online behavior
  //    (Req 10.1, 10.2, 10.3).
  if (request.method !== 'GET' || isNetworkOnly(url, request.method)) {
    return;
  }

  const parsed = parseUrl(url);
  const pathname = parsed.pathname;
  const host = parsed.host;

  // 2) Navigations: network-first, cache fallback, then precached /offline
  //    (Req 2.1, 2.6, 3.1-3.5, 7.6).
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  // 3) /_next/static/** : content-hashed immutable assets -> cache-first.
  if (pathname.indexOf('/_next/static/') === 0) {
    event.respondWith(cacheFirst(request, NEXT_STATIC));
    return;
  }

  // 4) /practice-banks/** : Practice_Bank assets -> cache-first (Req 4.2, 4.3).
  if (pathname.indexOf('/practice-banks/') === 0) {
    event.respondWith(cacheFirst(request, BANKS));
    return;
  }

  // 5) Font CDNs -> stale-while-revalidate (Req 2.4).
  if (FONT_HOSTS.indexOf(host) !== -1) {
    event.respondWith(staleWhileRevalidate(request, FONTS));
    return;
  }

  // 6) Hero image hosts -> cache-first; on miss+offline serve cached placeholder
  //    (Req 2.3).
  if (IMAGE_HOSTS.indexOf(host) !== -1) {
    event.respondWith(imageWithPlaceholder(request));
    return;
  }

  // 7) Whitelisted read-only GET APIs -> network-first, cache fallback offline
  //    (Req 5.1).
  if (READ_ONLY_GET_WHITELIST.indexOf(pathname) !== -1) {
    event.respondWith(networkFirst(request, API_GET));
    return;
  }

  // Anything else: leave to the browser default (no respondWith).
});

/* ==========================================================================
 * Strategy helpers — all defensively wrapped so a cache failure never yields
 * an uncaught rejection that breaks navigation.
 * ======================================================================== */

// Network-first for navigations: try the network, cache a copy of successful
// responses into PAGES, and on failure serve the cached page or the precached
// /offline fallback so the WebView never shows a native error (Req 7.6).
async function handleNavigation(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      // Cache a copy for offline re-view (Req 2.1, 3.1-3.4). Best-effort.
      try {
        const copy = response.clone();
        const cache = await caches.open(PAGES);
        await cache.put(request, copy);
      } catch (e) {
        /* ignore cache write failures */
      }
    }
    return response;
  } catch (err) {
    // Offline (or network error): serve cached page, else the offline fallback.
    try {
      const cached = await caches.match(request, { ignoreSearch: true });
      if (cached) return cached;
    } catch (e) {
      /* fall through to offline page */
    }
    const offline = await caches.match('/offline');
    if (offline) return offline;
    // Last-resort: a minimal offline response so we never surface a native error.
    return new Response('<h1>Offline</h1>', {
      status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}

// Cache-first: serve the cached copy if present; otherwise fetch, cache a copy,
// and return it. Content-hashed static assets are inherently safe to cache-first
// because a new release changes the URL, so no stale-content risk (Req 9 update
// strategy for immutable assets).
async function cacheFirst(request, cacheKey) {
  try {
    const cached = await caches.match(request);
    if (cached) return cached;
  } catch (e) {
    /* fall through to network */
  }
  try {
    const response = await fetch(request);
    if (response && (response.ok || response.type === 'opaque')) {
      try {
        const copy = response.clone();
        const cache = await caches.open(cacheKey);
        await cache.put(request, copy);
      } catch (e) {
        /* ignore cache write failures */
      }
    }
    return response;
  } catch (err) {
    // Offline miss: return a cached match one more time if any, else 503.
    const cached = await safeMatch(request);
    if (cached) return cached;
    return new Response('', { status: 503, statusText: 'Offline' });
  }
}

// Network-first: try the network and cache a copy; on failure serve the cached
// response (Req 5.1). Keeps online responses always live.
async function networkFirst(request, cacheKey) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      try {
        const copy = response.clone();
        const cache = await caches.open(cacheKey);
        await cache.put(request, copy);
      } catch (e) {
        /* ignore cache write failures */
      }
    }
    return response;
  } catch (err) {
    const cached = await safeMatch(request);
    if (cached) return cached;
    return new Response('', { status: 503, statusText: 'Offline' });
  }
}

// Stale-while-revalidate: serve cached immediately if present while refreshing
// in the background; otherwise wait for the network. On total failure fall back
// to whatever is cached (Req 2.4 — cached/system font fallback keeps text visible).
async function staleWhileRevalidate(request, cacheKey) {
  const cached = await safeMatch(request);
  const network = fetch(request)
    .then(async function (response) {
      if (response && (response.ok || response.type === 'opaque')) {
        try {
          const copy = response.clone();
          const cache = await caches.open(cacheKey);
          await cache.put(request, copy);
        } catch (e) {
          /* ignore cache write failures */
        }
      }
      return response;
    })
    .catch(function () {
      return null;
    });

  if (cached) {
    // Kick off the revalidation but do not block on it.
    event_noop(network);
    return cached;
  }
  const response = await network;
  if (response) return response;
  return new Response('', { status: 503, statusText: 'Offline' });
}

// Hero images: cache-first; on a miss while offline return the cached shared
// placeholder occupying the same layout box (Req 2.3).
async function imageWithPlaceholder(request) {
  try {
    const cached = await caches.match(request);
    if (cached) return cached;
  } catch (e) {
    /* fall through to network */
  }
  try {
    const response = await fetch(request);
    if (response && (response.ok || response.type === 'opaque')) {
      try {
        const copy = response.clone();
        const cache = await caches.open(IMAGES);
        await cache.put(request, copy);
      } catch (e) {
        /* ignore cache write failures */
      }
    }
    return response;
  } catch (err) {
    // Offline + not cached: serve the precached placeholder (Req 2.3).
    const placeholder = await caches.match(HERO_PLACEHOLDER_URL);
    if (placeholder) return placeholder;
    return new Response('', { status: 503, statusText: 'Offline' });
  }
}

// Best-effort caches.match that never throws.
async function safeMatch(request) {
  try {
    return await caches.match(request);
  } catch (e) {
    return undefined;
  }
}

// Swallow a background promise without an unhandled rejection.
function event_noop(promise) {
  if (promise && typeof promise.then === 'function') {
    promise.then(
      function () {},
      function () {}
    );
  }
}
