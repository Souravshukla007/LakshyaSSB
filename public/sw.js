// ─────────────────────────────────────────────────────────────────────────────
// LakshyaSSB — allowlist offline Service Worker.
//
// Only an explicit allowlist of routes works offline (see OFFLINE_ROUTES below,
// MIRRORED from lib/offline/offline-routes.ts — keep in sync). Those pages are
// cached (network-first + precached best-effort at install) and served from cache
// while offline. Navigating to ANY other route while offline is served the cached
// "/offline" page; soft in-app navigations to non-allowlisted routes are
// intercepted by OfflineNavGuard which shows a popup instead. This worker does NOT
// cache APIs or other pages. Plain browser ES only: no imports, no native refs.
// ─────────────────────────────────────────────────────────────────────────────

// SINGLE SOURCE OF TRUTH: this SERVED worker is authoritative for the Capacitor
// Android WebView in `server.url` mode. Its allowlist MIRRORS
// lib/offline/offline-routes.ts and this CACHE_VERSION is kept IN SYNC with
// lib/offline/sw-helpers.ts (the shared pure logic used by the tests). The
// bundled copy at android/app/src/main/assets/public/sw.js is regenerated from
// this file (see the cap copy / sync build step) and must never diverge again.
// Bump per release so a fresh worker activates and old caches are cleaned up.
const CACHE_VERSION = 'v4';

const PRECACHE = `lssb-precache-${CACHE_VERSION}`; // shell: '/', '/offline', manifest, icons, placeholder
const PAGES = `lssb-pages-${CACHE_VERSION}`;       // allowlisted pages (except '/')
const STATIC = `lssb-static-${CACHE_VERSION}`;     // /_next/static, fonts, remote images
const DATA = `lssb-data-${CACHE_VERSION}`;         // RSC / soft-navigation data payloads (allowlisted routes)

const OWNED = new Set([PRECACHE, PAGES, STATIC, DATA]);

// Routes that are allowed to work offline. MIRROR of lib/offline/offline-routes.ts.
const OFFLINE_ROUTES = [
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

function isOfflineRoute(pathname) {
  const normalized =
    pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  return OFFLINE_ROUTES.indexOf(normalized) !== -1;
}

// Critical app shell — install is all-or-nothing over this list.
const PRECACHE_URLS = [
  '/',
  '/offline',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/images/hero-placeholder.png',
];

// Allowlisted pages other than '/' — best-effort precache at install (non-fatal).
const EXTRA_PAGE_URLS = OFFLINE_ROUTES.filter((r) => r !== '/');

const SWR_HOSTS = new Set(['fonts.googleapis.com', 'fonts.gstatic.com', 'cdnjs.cloudflare.com']);
const IMAGE_HOSTS = new Set(['images.unsplash.com', 'images.pexels.com', 'www.ssbcrack.com']);
const HERO_PLACEHOLDER = '/images/hero-placeholder.png';

// Build-time precache manifest (produced by scripts/gen-offline-manifest.mjs and
// served at /offline-manifest.json). Shape:
//   { cacheVersion, buildId, generatedAt,
//     shared: [ '/_next/static/...' , ... ],
//     routes: [ { route, document, rsc, css: [...], js: [...] }, ... ] }
const OFFLINE_MANIFEST_URL = '/offline-manifest.json';

// ── install ─────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      // 1) Critical app shell — all-or-nothing. Install REJECTS (and the new
      //    worker never activates) if any of these fail. This behavior is
      //    unchanged: '/' and '/offline' remain in this shell list.
      const precache = await caches.open(PRECACHE);
      await precache.addAll(PRECACHE_URLS);

      // 2) Best-effort precache of the other allowlisted page DOCUMENTS
      //    (never fails install).
      try {
        const pages = await caches.open(PAGES);
        await pages.addAll(EXTRA_PAGE_URLS);
      } catch (err) {
        // Non-fatal: any missing page will simply be cached on first online visit.
        console.warn('[sw] extra page precache failed (non-fatal)', err);
      }

      // 3) Best-effort precache of every allowlisted route's FULL
      //    render-dependency set from the build-time manifest: document +
      //    /_next/static/ JS chunks + CSS (into STATIC) + the route's RSC
      //    payload (into DATA). A single page/chunk/RSC failure must NOT abort
      //    install, so the whole step is wrapped and each unit is independent.
      try {
        await precacheFromManifest();
      } catch (err) {
        // Non-fatal: pages fall back to on-demand caching on first online visit.
        console.warn('[sw] offline manifest precache failed (non-fatal)', err);
      }
    })()
  );
  self.skipWaiting();
});

// Load the build-time offline manifest and precache each allowlisted route's
// render-dependency set. Entirely best-effort: any failure (missing manifest,
// unreachable asset, RSC fetch error) is swallowed so install still succeeds.
async function precacheFromManifest() {
  let manifest;
  try {
    const res = await fetch(OFFLINE_MANIFEST_URL, { cache: 'no-cache' });
    if (!res || !res.ok) return;
    manifest = await res.json();
  } catch (err) {
    // No manifest available (e.g. dev / not yet generated) — nothing to do.
    return;
  }
  if (!manifest || typeof manifest !== 'object') return;

  const pages = await caches.open(PAGES);
  const staticCache = await caches.open(STATIC);
  const dataCache = await caches.open(DATA);
  const precache = await caches.open(PRECACHE);

  // Shared runtime/layout chunks used across routes → STATIC (each independent).
  const shared = Array.isArray(manifest.shared) ? manifest.shared : [];
  await cacheAllBestEffort(staticCache, shared);

  const routes = Array.isArray(manifest.routes) ? manifest.routes : [];
  for (const entry of routes) {
    // Per-route try/catch: one bad route never aborts the rest (or install).
    try {
      await precacheRoute(entry, { pages, staticCache, dataCache, precache });
    } catch (err) {
      console.warn('[sw] per-route precache failed (non-fatal)', entry && entry.route, err);
    }
  }
}

// Precache a single manifest route entry: its document, its /_next/static/
// JS + CSS, and its RSC payload. Every unit is best-effort.
async function precacheRoute(entry, stores) {
  if (!entry || typeof entry !== 'object') return;
  const { pages, staticCache, dataCache, precache } = stores;

  // Document: '/' goes into PRECACHE (shell convention, matching handleNavigate);
  // every other allowlisted document goes into PAGES.
  if (entry.document) {
    const docCache = entry.route === '/' ? precache : pages;
    await putBestEffort(docCache, entry.document);
  }

  // JS chunks + CSS → STATIC (served cache-first by the fetch handler).
  const assets = []
    .concat(Array.isArray(entry.js) ? entry.js : [])
    .concat(Array.isArray(entry.css) ? entry.css : []);
  await cacheAllBestEffort(staticCache, assets);

  // RSC payload → DATA cache. Fetch the route with an `RSC: 1` header so the
  // server returns the text/x-component payload, and cache it keyed by a request
  // that mirrors a soft navigation (RSC header set). The fetch handler's
  // networkFirstData lookup uses ignoreSearch:true, so the changing `?_rsc=`
  // token between visits does not prevent a match.
  if (entry.rsc) {
    try {
      const rscRequest = new Request(entry.rsc, { headers: { RSC: '1' } });
      const rscResponse = await fetch(rscRequest);
      if (rscResponse && rscResponse.ok) {
        await dataCache.put(rscRequest, rscResponse.clone());
      }
    } catch (err) {
      /* best-effort — a failed RSC precache must not abort install */
    }
  }
}

// Fetch and cache every URL independently; a single failure is swallowed so it
// cannot abort the surrounding precache (or install).
async function cacheAllBestEffort(cache, urls) {
  await Promise.all((urls || []).map((url) => putBestEffort(cache, url)));
}

async function putBestEffort(cache, url) {
  try {
    const response = await fetch(url, { cache: 'no-cache' });
    if (response && (response.ok || response.type === 'opaque')) {
      await cache.put(url, response.clone());
    }
  } catch (err) {
    /* best-effort — a single asset failure must not abort install */
  }
}

// ── activate ────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => (OWNED.has(key) ? undefined : caches.delete(key))));
      } catch (err) {
        console.warn('[sw] cache cleanup failed', err);
      }
      try {
        await self.clients.claim();
      } catch (err) {
        console.warn('[sw] clients.claim failed', err);
      }
    })()
  );
});

// ── fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return; // passthrough for non-GET

  let url;
  try {
    url = new URL(request.url);
  } catch (err) {
    return;
  }
  const pathname = url.pathname;
  const host = url.hostname;

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigate(request, pathname));
    return;
  }
  if (pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC));
    return;
  }
  if (SWR_HOSTS.has(host)) {
    event.respondWith(staleWhileRevalidate(request, STATIC));
    return;
  }
  if (IMAGE_HOSTS.has(host)) {
    event.respondWith(imageCacheFirst(request, STATIC));
    return;
  }
  // RSC / soft-navigation data requests for ALLOWLISTED routes only: serve
  // network-first with cache fallback into the dedicated DATA cache so offline
  // in-app (soft) navigations render. Non-allowlisted RSC requests are NOT
  // intercepted here and keep today's passthrough behavior (preservation).
  if (isRscRequest(request, url) && isOfflineRoute(pathname)) {
    event.respondWith(networkFirstData(request, DATA));
    return;
  }
  // Everything else → passthrough (no caching of other pages/APIs).
});

// Detect an App Router RSC / soft-navigation data request. Signals (any one):
//   - the request carries an `RSC` header (App Router sets it on soft navs), or
//   - the URL has an `?_rsc=` query token.
// The response content-type (`text/x-component`) is the third signal; it is only
// observable after fetching, so it is used in networkFirstData to gate caching.
function isRscRequest(request, url) {
  try {
    if (request && request.headers && typeof request.headers.get === 'function') {
      if (request.headers.get('RSC')) return true;
    }
  } catch (err) {
    /* header access can throw in some engines — fall through to URL check */
  }
  try {
    if (url && url.searchParams && url.searchParams.has('_rsc')) return true;
  } catch (err) {
    /* ignore */
  }
  return false;
}

// True when a fetched response looks like an RSC/data payload.
function isRscResponse(response) {
  try {
    const type = response && response.headers && response.headers.get('Content-Type');
    return typeof type === 'string' && type.indexOf('text/x-component') !== -1;
  } catch (err) {
    return false;
  }
}

// ── navigation: network-first for allowlisted routes; offline → cache or /offline ──
async function handleNavigate(request, pathname) {
  const allowed = isOfflineRoute(pathname);
  try {
    const response = await fetch(request);
    if (allowed && response && response.ok) {
      try {
        const cacheName = pathname === '/' ? PRECACHE : PAGES;
        const cache = await caches.open(cacheName);
        await cache.put(request, response.clone());
      } catch (err) {
        /* best-effort */
      }
    }
    return response;
  } catch (err) {
    // Offline.
    if (allowed) {
      const cached =
        (await safeMatch(PAGES, request)) ||
        (await safeMatch(PRECACHE, request)) ||
        (pathname === '/' ? await safeMatchUrl(PRECACHE, '/') : undefined);
      if (cached) return cached;
    }
    const offline = await safeMatchUrl(PRECACHE, '/offline');
    if (offline) return offline;
    return new Response(
      '<!doctype html><meta charset="utf-8"><title>Offline</title>' +
        '<body style="font-family:system-ui;background:#0b1220;color:#e2e8f0;' +
        'display:flex;align-items:center;justify-content:center;height:100vh;margin:0">' +
        "<p>You're offline — connect to the internet.</p></body>",
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}

// ── strategy helpers ──────────────────────────────────────────────────────────

// Network-first with cache fallback for RSC / soft-navigation data payloads of
// allowlisted routes. Online, the live network response is returned unchanged
// (preserving online rendering) and cached for later offline use; offline, the
// cached payload for the route is served so the soft navigation renders. If
// nothing is cached, the failed fetch is surfaced to the client exactly as
// today's passthrough would (no fabricated response).
async function networkFirstData(request, cacheName) {
  try {
    const response = await fetch(request);
    // Cache successful RSC/data responses (best-effort). Accept the response
    // when it is ok — for an allowlisted-route RSC request this is the payload
    // we need offline; prefer the text/x-component signal but do not require it,
    // since some engines omit/normalize the header.
    if (response && response.ok && (isRscResponse(response) || request.mode !== 'navigate')) {
      try {
        const cache = await caches.open(cacheName);
        await cache.put(request, response.clone());
      } catch (err) {
        /* best-effort */
      }
    }
    return response;
  } catch (err) {
    // Offline — serve the cached RSC payload for this route. ignoreSearch:true
    // (via safeMatch) tolerates a changed `?_rsc=` token between visits.
    const cached = await safeMatch(cacheName, request);
    if (cached) return cached;
    // Nothing cached: surface the network failure, matching prior passthrough.
    return Response.error();
  }
}

async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    try {
      await cache.put(request, response.clone());
    } catch (err) {
      /* best-effort */
    }
    return response;
  } catch (err) {
    const fallback = await safeMatch(cacheName, request);
    if (fallback) return fallback;
    return Response.error();
  }
}

async function staleWhileRevalidate(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    const networkPromise = fetch(request)
      .then((response) => {
        cache.put(request, response.clone()).catch(() => {});
        return response;
      })
      .catch(() => undefined);
    return cached || (await networkPromise) || Response.error();
  } catch (err) {
    return Response.error();
  }
}

async function imageCacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    try {
      await cache.put(request, response.clone());
    } catch (err) {
      /* best-effort */
    }
    return response;
  } catch (err) {
    try {
      const precache = await caches.open(PRECACHE);
      const placeholder = await precache.match(HERO_PLACEHOLDER);
      if (placeholder) return placeholder;
    } catch (cacheErr) {
      /* fall through */
    }
    return Response.error();
  }
}

async function safeMatch(cacheName, request) {
  try {
    const cache = await caches.open(cacheName);
    return await cache.match(request, { ignoreSearch: true });
  } catch (err) {
    return undefined;
  }
}

async function safeMatchUrl(cacheName, urlPath) {
  try {
    const cache = await caches.open(cacheName);
    return await cache.match(urlPath);
  } catch (err) {
    return undefined;
  }
}
