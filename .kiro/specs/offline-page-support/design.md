# offline-page-support Bugfix Design

## Overview

The LakshyaSSB app is a Next.js 16 App Router web app that is also shipped as an Android app through Capacitor. A hand-authored Service Worker is supposed to let a fixed allowlist of pages work offline: `/practice`, `/pricing`, `/privacy`, `/terms`, `/refund-policy`, `/about`, `/contact`, `/roadmap`, and `/ssb/day-1..day-5`. Today those pages fail offline — they render blank/broken or fall back to `/offline` instead of showing their real content — and the failure is most visible inside the installed Android app.

This design centers the fix on the **Capacitor Android WebView**, because that is the critical target environment. Two facts drive the whole design:

1. **The Android app runs in Capacitor `server.url` mode.** `capacitor.config.ts` sets `server.url` (temporarily `http://localhost:3000`, intended `https://www.lakshyassb.online` for release). When `server.url` is set, the WebView loads the **remote origin over the network** and the bundled web assets under `android/app/src/main/assets/public/` are effectively ignored at runtime. This means the Service Worker that actually controls the WebView is the one **served from the remote origin** (`/sw.js` produced from `public/sw.js`, currently `v3`), **not** the bundled copy at `android/app/src/main/assets/public/sw.js` (currently `v1`). The two files have diverged, and the divergence has hidden which worker is authoritative.

2. **App Router pages need more than their HTML to render offline.** An allowlisted route is not renderable from its cached HTML document alone. It also needs its content-hashed JS chunks under `/_next/static/`, the shared layout/runtime chunks, and — for in-app (soft) navigations — the React Server Component (RSC) data payload for that route. The current workers cache the navigation **document** best-effort but never guarantee the **chunks** and never cache the **RSC payload** at all, so pages that were never individually visited online (or that are reached by soft navigation) cannot render offline.

The fix has three coordinated parts: (a) reconcile the diverged workers behind a single source of truth and make explicit which worker controls the WebView; (b) precache each allowlisted route's **complete render-dependency set** (document + JS chunks + RSC payload) using a build-time manifest; and (c) add RSC/data-request handling so soft navigations render offline. All of this is scoped strictly to the allowlisted pages, preserving every other behavior.

## Glossary

- **Bug_Condition (C)**: An offline navigation (hard load, relaunch, or in-app soft navigation) targeting a route on the offline allowlist. Formally `isBugCondition(X)` below.
- **Property (P)**: The desired behavior for a Bug_Condition input — the WebView renders the page's actual cached content, never the `/offline` fallback and never a blank/broken page.
- **Preservation**: The behaviors that must remain byte-for-byte unchanged by this fix — online navigations, offline navigations to non-allowlisted routes, network-only/mutation requests, the `/` and `/offline` routes, and activation-time cache cleanup.
- **Allowlist (`OFFLINE_ROUTES`)**: The exact set of pathnames intended to work offline, defined in `lib/offline/offline-routes.ts` and mirrored into the Service Worker.
- **Served worker**: `public/sw.js`, served by Next.js from the origin root as `/sw.js`. In Capacitor `server.url` mode this is the worker that registers and controls the WebView.
- **Bundled worker**: `android/app/src/main/assets/public/sw.js`, the copy shipped inside the APK. Inert while `server.url` points at a remote origin; only used if the app is switched to bundled-asset (`webDir`) mode.
- **`server.url` mode**: The Capacitor configuration (`capacitor.config.ts` → `server.url`) that makes the WebView load a remote origin instead of bundled assets.
- **RSC payload**: The React Server Component data response the App Router client fetches during a soft navigation (request carrying an `RSC` header and/or an `?_rsc=` query, resolving to a `text/x-component` response for the target route).
- **Render-dependency set**: For one allowlisted route, everything needed to display it offline — the HTML document, the `/_next/static/` JS/CSS chunks it loads (including shared layout/runtime chunks), and its RSC payload.
- **Precache manifest**: A build-time-generated list mapping each allowlisted route to its render-dependency set of content-hashed URLs, injected into the Service Worker so `install` can cache everything needed up front.
- **`handleNavigate` / `handleNavigation`**: The Service Worker function that resolves navigation requests network-first with a cache/`/offline` fallback.
- **`ServiceWorkerRegister`**: `components/offline/ServiceWorkerRegister.tsx`, the React component that registers `/sw.js` at scope `/`.

## Bug Details

### Bug Condition

The bug manifests when the device is offline and the user reaches an allowlisted page. There are two failure surfaces:

- **Hard load / relaunch**: the WebView issues a `navigate` request for the route. The Service Worker may return a cached HTML document, but the document references content-hashed `/_next/static/` chunks that were never cached (the page was never individually visited online, or `install` precached only the document), so hydration fails and the page renders blank/broken — or no cached document exists and the worker serves `/offline`.
- **Soft navigation**: the App Router client fetches the route's RSC payload. That request is neither `mode: 'navigate'` nor a `/_next/static/` asset, so the worker passes it through to the network; offline, the fetch fails and the page's content never appears.

Because the Android app runs in `server.url` mode, the worker in play is the **served** `public/sw.js`, while the **bundled** copy is diverged and inert — obscuring which worker's behavior actually matters and leaving the served worker without the chunk-precache and RSC handling it needs.

**Formal Specification:**
```
FUNCTION isBugCondition(X)
  INPUT: X = { pathname, isOffline, mode }
         // pathname: requested route
         // isOffline: true when the device has no network
         // mode: 'hard' (navigate/relaunch) | 'soft' (in-app RSC navigation)
  OUTPUT: boolean

  RETURN X.isOffline = true
         AND normalize(X.pathname) IN OFFLINE_ROUTES
         // and the fixed rendering behavior (full content from cache) is
         // NOT produced today: fallback, blank, or broken page appears instead
END FUNCTION

WHERE OFFLINE_ROUTES = {
  '/practice', '/pricing',
  '/privacy', '/terms', '/refund-policy',
  '/about', '/contact', '/roadmap',
  '/ssb/day-1', '/ssb/day-2', '/ssb/day-3', '/ssb/day-4', '/ssb/day-5'
}
// normalize(p): strip a trailing slash except for root '/'
```

### Examples

- **Hard load, never-visited page (Android app, offline)**: User installs the app, opens it once online on `/practice`, goes offline, relaunches, and navigates to `/about`. Expected: `/about` renders its real content. Actual: blank/broken page or `/offline`, because `/about`'s JS chunks were never cached.
- **Soft navigation (Android app, offline)**: Offline on `/pricing`, user taps an in-app link to `/roadmap`. Expected: `/roadmap` content appears. Actual: nothing renders because the RSC payload fetch fails and is not cached.
- **Reload of a visited page (offline)**: User viewed `/terms` online, goes offline, reloads. Expected: `/terms` renders from cache. Actual: document may be cached but referenced chunks are missing → broken render.
- **Edge case — deep SSB day route (offline)**: Offline hard load of `/ssb/day-5` (allowlisted, on-scope) should render fully from cache; today it fails like the others.
- **Non-bug (preservation) reference**: Offline navigation to `/account` (not allowlisted) should keep showing the existing offline popup/fallback — this must not change.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- **Online rendering (Req 3.1)**: When online, every page (allowlisted or not) SHALL continue to load and render from live network responses exactly as today.
- **Offline non-allowlisted routes (Req 3.2)**: When offline, navigating to a route NOT on the allowlist SHALL continue to show the existing offline popup (`OfflineNavGuard`) / `/offline` fallback, not that route's content.
- **Network-only and mutation requests (Req 3.3)**: Non-GET requests and network-only APIs (auth, payments, AI evaluation/chat, current affairs, leaderboards, notifications, streak, OIR, etc.) SHALL continue to go straight to the network with no cache involvement.
- **`/` and `/offline` routes (Req 3.4)**: The root landing route and the `/offline` fallback route SHALL behave exactly as they do today; they are out of scope for this fix.
- **Activation cache cleanup (Req 3.5)**: On activation of a new worker version, caches not owned by the current version SHALL continue to be deleted as today.

**Scope:**
All inputs where `isBugCondition(X)` is false SHALL be completely unaffected by this fix. This includes:
- Any online navigation (`isOffline = false`), to any route.
- Any offline navigation to a route outside `OFFLINE_ROUTES` (including `/` and `/offline`).
- Any non-GET request, and any request to a network-only host/path.
- Sub-resource requests (fonts, images, static assets, whitelisted GET APIs) continue to use their existing strategies for non-allowlisted contexts.

_The desired correct behavior for Bug_Condition inputs is specified in the Correctness Properties section (Property 1); this section defines only what must NOT change._

## Hypothesized Root Cause

Based on the code and the Capacitor configuration, the most likely causes are:

1. **Worker divergence hides the authoritative worker**: `capacitor.config.ts` uses `server.url`, so the WebView loads the remote origin and is controlled by the **served** `public/sw.js` (`v3`). The **bundled** `android/app/src/main/assets/public/sw.js` (`v1`) is a different, richer file that is inert in this mode. `lib/offline/sw-helpers.ts` also declares `v1` and claims to be mirrored into `public/sw.js`, but the served worker does not actually use it. This three-way divergence (`public/sw.js` v3 vs bundled v1 vs `sw-helpers.ts` v1) means fixes can land in the wrong file and appear to do nothing in the app.

2. **Per-page JS chunks are not precached**: `install` in the served worker precaches only the app shell and the allowlisted **HTML documents** (`EXTRA_PAGE_URLS`), plus `/_next/static/` is cache-first (cached only when fetched). A page never individually visited online has no cached chunks, so its cached HTML cannot hydrate offline → blank/broken (bug 1.1, 1.3).

3. **RSC / soft-navigation data requests are not handled**: The App Router soft navigation fetches an RSC payload (request with `RSC` header / `?_rsc=`). The worker treats it as "everything else → passthrough," so it is never cached and fails offline → soft navigation shows no content (bug 1.2).

4. **No build-time sync of the bundled worker**: Nothing regenerates `android/app/src/main/assets/public/sw.js` from `public/sw.js` (e.g. via `npx cap copy`), so the copies drift. Even if the team later removes `server.url` (bundled-asset mode), the stale `v1` copy would ship (bug 1.4).

5. **WebView Service Worker preconditions under `server.url`**: In `server.url` mode the SW must have been registered and activated during a prior **online** session for the Android System WebView to serve navigations from cache while offline. If registration/activation or navigation interception does not occur in the WebView, no cached content is served regardless of what is cached (bug 1.4).

## Correctness Properties

Property 1: Bug Condition - Allowlisted Pages Render Offline In The WebView

_For any_ input `X` where the bug condition holds (`isBugCondition(X)` returns true) — an offline navigation, whether a hard load/relaunch or an in-app soft navigation, targeting a route in `OFFLINE_ROUTES`, evaluated in the Capacitor Android WebView — the fixed system SHALL render that route's actual content from cache (serving the cached HTML document, all required `/_next/static/` chunks, and the route's RSC payload), and SHALL NOT show the `/offline` fallback, a blank page, or a broken (unhydrated) page.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Property 2: Preservation - All Non-Bug Inputs Unchanged

_For any_ input `X` where the bug condition does NOT hold (`isBugCondition(X)` returns false) — online navigations to any route, offline navigations to non-allowlisted routes (including `/` and `/offline`), and network-only/mutation requests — the fixed system SHALL produce the same result as the original system, preserving live online rendering, the existing offline popup/fallback for non-allowlisted routes, network-only passthrough, and activation-time cache cleanup.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Assuming the root cause analysis is correct, the fix spans the Service Worker, a build-time precache manifest, the worker-sync build step, and the Capacitor/WebView configuration. The **served** `public/sw.js` is the authoritative worker for the Android app (because of `server.url` mode); the bundled copy is regenerated from it.

**1. Establish a single source of truth for the worker**

- **File**: `public/sw.js` (authoritative), `android/app/src/main/assets/public/sw.js` (generated), `lib/offline/sw-helpers.ts` (shared pure logic), `lib/offline/offline-routes.ts` (allowlist).
- Pick one `CACHE_VERSION` and one classification/allowlist implementation. Reconcile `public/sw.js` so its allowlist and cache-naming match `offline-routes.ts` / `sw-helpers.ts`, and bump `CACHE_VERSION` so a fresh worker activates and cleans up old caches.
- Add a build step (npm script, e.g. `cap:copy` running `npx cap copy android`, and/or a small sync script) so `android/app/src/main/assets/public/sw.js` is **always regenerated from `public/sw.js`** and can never diverge again. Document that under `server.url` the served copy is the one that runs.

**2. Generate a precache manifest for the render-dependency set**

- **File**: new build script (e.g. `scripts/gen-offline-manifest.mjs`) run after `next build`, emitting a manifest (e.g. `public/offline-manifest.json` or an inlined constant in `public/sw.js`).
- For each route in `OFFLINE_ROUTES`, resolve from the Next.js build output (`.next/`) the exact content-hashed URLs it needs: the route document, its page/layout/runtime JS chunks under `/_next/static/`, associated CSS, and the route's RSC payload URL.
- Inject this manifest into the worker so `install` precaches each allowlisted route's complete render-dependency set (all-or-nothing per critical shell, best-effort per page as appropriate).

**3. Precache full page dependencies at install**

- **File**: `public/sw.js` (`install` handler).
- Extend precache to add, for every allowlisted route, its document + all manifest-listed chunks/CSS + its RSC payload into the owned caches (`PAGES` for documents, `STATIC` for `/_next/static/`, and a new data cache for RSC). Keep the critical app shell all-or-nothing; make per-page precache resilient (a single failure must not abort install).

**4. Add RSC / soft-navigation data handling**

- **File**: `public/sw.js` (`fetch` handler + a new strategy helper).
- Detect RSC/data requests for allowlisted routes (request has `RSC` header, or URL has `?_rsc=`, or response `text/x-component`). Serve them **network-first with cache fallback** into a dedicated data cache, so offline soft navigations render. Non-allowlisted RSC requests keep today's passthrough behavior (preservation).

**5. Keep `/_next/static/` cache-first and guarantee coverage**

- **File**: `public/sw.js` (`fetch` handler).
- Retain cache-first for `/_next/static/`, and ensure the precache manifest (step 2) guarantees the chunks for allowlisted routes are present even if the page was never individually visited online.

**6. Ensure the Service Worker actually controls the WebView under `server.url`**

- **File**: `capacitor.config.ts`, `components/offline/ServiceWorkerRegister.tsx`, `next.config.ts`.
- Confirm the release config points `server.url` at the HTTPS origin (`https://www.lakshyassb.online`) — a secure context so the SW registers — and that `allowNavigation` permits it. Verify registration/activation happens during an online session and that the Android System WebView serves navigations from the SW cache while offline. Keep the `/sw.js` `no-cache` + `Service-Worker-Allowed: /` headers so new worker versions are picked up. Note the operational precondition: offline rendering requires at least one prior online launch that registers and activates the worker.

## Testing Strategy

### Validation Approach

The strategy is two-phase: first surface counterexamples that demonstrate the bug on the **unfixed** served worker (confirming or refuting the root-cause analysis), then verify the fix renders allowlisted pages offline in the WebView while preserving every non-bug behavior. Because the authoritative worker in the Android app is the served `public/sw.js`, tests target its pure logic (via `lib/offline/sw-helpers.ts` and the allowlist) plus WebView-level integration checks.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix, and confirm/refute the hypothesized root causes. If refuted, re-hypothesize.

**Test Plan**: Simulate offline navigations to allowlisted routes against the current served worker behavior — both hard loads and soft (RSC) navigations — and assert the real page content renders. Run against the UNFIXED worker to observe the failures and pinpoint the missing pieces (chunks, RSC handling, worker divergence).

**Test Cases**:
1. **Never-visited hard load**: Offline hard load of `/about` after only the shell was cached — assert full content renders (will fail on unfixed code: missing JS chunks).
2. **Soft navigation RSC**: Offline soft navigation to `/roadmap` — assert content renders (will fail on unfixed code: RSC request passed through, not cached).
3. **Visited-then-reload**: View `/terms` online, go offline, reload — assert hydrated content (will fail on unfixed code if referenced chunks weren't all cached).
4. **Worker identity check**: In the Android app under `server.url`, assert the controlling worker is the served `public/sw.js` version, not the bundled `v1` (will reveal the divergence).
5. **Edge case — deep route**: Offline hard load of `/ssb/day-5` (may fail on unfixed code like the others).

**Expected Counterexamples**:
- Cached HTML present but page blank/broken because `/_next/static/` chunks are absent.
- Soft-navigation RSC fetch fails offline and content never appears.
- Possible causes: missing chunk precache, no RSC handling, diverged/inert bundled worker.

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed worker produces the expected behavior (full page content from cache, no fallback/blank/broken), including inside the Android WebView.

**Pseudocode:**
```
FOR ALL X WHERE isBugCondition(X) DO
  result := navigate_fixed(X)   // hard or soft, offline, allowlisted route
  ASSERT renders_actual_page_content(result)
     AND NOT is_offline_fallback(result)
     AND NOT is_blank_or_broken(result)
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed worker produces the same result as the original worker.

**Pseudocode:**
```
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT navigate_original(X) = navigate_fixed(X)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many inputs automatically across the request domain (methods, hosts, paths, online/offline, allowlisted vs not).
- It catches edge cases manual tests miss (e.g. an RSC request to a non-allowlisted route must stay passthrough).
- It gives strong assurance that classification and routing are unchanged for every non-bug input.

**Test Plan**: Capture behavior on the UNFIXED worker for online navigations, offline non-allowlisted navigations, `/` and `/offline`, and network-only/mutation requests; then write property-based tests over `isNetworkOnly`, the allowlist (`isOfflineRoute`), cache naming, and `cachesToDelete` asserting identical decisions after the fix.

**Test Cases**:
1. **Online passthrough preserved**: Observe online navigations render live on unfixed code; assert unchanged after fix.
2. **Offline non-allowlisted preserved**: Observe `/account` offline shows popup/fallback on unfixed code; assert unchanged after fix.
3. **Network-only/mutation preserved**: Observe auth/payment and non-GET requests bypass cache on unfixed code; assert unchanged after fix.
4. **`/` and `/offline` preserved**: Observe current behavior on unfixed code; assert unchanged after fix.
5. **Activation cleanup preserved**: Observe non-owned caches deleted on activation; assert unchanged (aside from the intended `CACHE_VERSION` bump) after fix.

### Unit Tests

- `isNetworkOnly(url, method)` classification unchanged for GET/non-GET, whitelisted GET APIs, payment hosts, and enumerated online-only paths.
- `isOfflineRoute` / allowlist normalization (trailing slash) for each of the 13 allowlisted routes and representative non-allowlisted routes.
- RSC-request detection helper: correctly identifies `RSC` header / `?_rsc=` requests and only treats allowlisted-route RSC as cacheable.
- Precache-manifest consumption: `install` attempts to cache each allowlisted route's document, chunks, and RSC entry; per-page failures do not abort install.
- Cache naming + `cachesToDelete` after the `CACHE_VERSION` bump: old caches deleted, new owned caches retained.

### Property-Based Tests

- Over randomized `X = {pathname, isOffline, mode}`: whenever `isBugCondition(X)` holds, the fixed routing selects a cache-serving path (document + chunks + RSC), never the fallback.
- Over randomized requests where `isBugCondition(X)` is false: fixed and original routing decisions are identical (preservation).
- Over randomized cache-name sets: `cachesToDelete` retains exactly the owned set and deletes everything else.

### Integration Tests

- **Android WebView end-to-end**: In the Capacitor Android app under `server.url`, load online once (register + activate the served worker), go offline, then hard-load and soft-navigate each allowlisted route and assert real content renders (Req 2.4).
- **Worker sync**: After `next build` + the sync/`cap copy` step, assert `android/app/src/main/assets/public/sw.js` is identical to `public/sw.js` (no divergence).
- **Context switching**: Offline, navigate between allowlisted routes (soft) and confirm each renders; then attempt a non-allowlisted route and confirm the offline popup still appears.
- **Update flow**: Activate a new `CACHE_VERSION`, confirm old caches are cleaned up and allowlisted pages still render offline afterward.
