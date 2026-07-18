# Implementation Plan: Offline Support

## Overview

This plan implements scoped offline support for LakshyaSSB entirely at the web layer via a
hand-authored Service Worker (`public/sw.js`), a Web App Manifest, connectivity detection, offline
practice selection, an IndexedDB draft store with deferred submission, and offline fallback UI. It is
platform-neutral and standards-based (no Capacitor/native code). `capacitor.config.ts` `server.url`
is NOT changed.

Tasks are ordered to build incrementally: pure testable helpers and the test runner first, then the
Service Worker that mirrors those helpers, then manifest/registration/wiring, then the client
features that consume them, and finally smoke/compliance checks and a full `npm run build`
verification. Each task creates or edits ONLY the files enumerated in the design's "Decisions
Requiring Confirmation" section.

Implementation language: **TypeScript** for app/lib/hooks/components, **plain browser JavaScript**
for `public/sw.js`, and **`.mjs`** for the build script (as specified by the design).

Dependency constraint (hard): dev-only additions must NOT force TypeScript >= 6 or ESLint >= 10.
Keep TypeScript pinned at 5.9.x and ESLint at 9.x.

## Tasks

- [x] 1. Set up test tooling and runner (foundational)
  - [x] 1.1 Add dev-only test tooling and Vitest config
    - Add `vitest`, `fast-check`, and `fake-indexeddb` as **devDependencies** with pinned versions that do NOT force TypeScript >= 6 or ESLint >= 10 (per design "Dependency-compatibility constraint" and Decision 1)
    - Create `vitest.config.ts` configured for an ESM/TS-native, Node-based test environment that does not touch the Next production build
    - Add test scripts to `package.json` (e.g. `"test": "vitest run"`, `"test:watch": "vitest"`) — use `vitest run` (single execution) for CI/build-time runs
    - Confirm zero runtime dependencies are added; Serwist/next-pwa are NOT added
    - _Requirements: testing infrastructure for Properties 1–7 (Testing Strategy → Property-based tests)_

- [x] 2. Implement pure shared helpers and practice-bank module with property tests
  - [x] 2.1 Implement `lib/offline/sw-helpers.ts` (shared pure classifiers, mirrored into `sw.js`)
    - Implement the cache-name/version helper (derive `lssb-{base}-{CACHE_VERSION}` names and build the `OWNED` set), the activation cache-cleanup helper (given existing cache names + OWNED, return the set to delete/retain), and the `isNetworkOnly(url, method)` request classifier per the design's network-only allowlist and cacheable classes
    - Keep the module pure and framework-free so it can be imported directly by tests and mirrored verbatim into `public/sw.js`
    - _Requirements: 1.6, 7.4, 9.1, 9.2, 10.1, 10.2, 10.3, 11.1, 11.3_
    - _Design: Data Models → Cache_Store naming; Network-only allowlist; Correctness Properties 3, 4, 5_

  - [x]* 2.2 Write property test for the cache-name/version helper
    - **Property 4: Cache names encode exactly one version (round-trip)** — "For any cache base name and any CACHE_VERSION string, the derived cache name produced by the naming helper encodes that version such that parsing the version back out of the name yields the original version, and all names in a single OWNED set share one and the same version."
    - **Validates: Requirements 9.1**
    - Use fast-check with >= 100 iterations; tag with `// Feature: offline-support, Property 4: {property text}`

  - [x]* 2.3 Write property test for the cache cleanup helper
    - **Property 3: Cache cleanup retains exactly the owned caches** — "For any set of existing cache names present in the Cache_Store, the activation cleanup routine deletes every cache name that is not in the current OWNED set and retains every cache name that is in OWNED, so that after cleanup the surviving names are exactly existing ∩ OWNED."
    - **Validates: Requirements 1.6, 9.2**
    - Use fast-check with >= 100 iterations; tag with `// Feature: offline-support, Property 3: {property text}`

  - [x]* 2.4 Write property test for the `isNetworkOnly` request classifier
    - **Property 5: Dynamic and online-only requests are never served from cache** — "For any request, isNetworkOnly(url, method) returns true for every non-GET method and for every enumerated online-only endpoint (login/signup/Google auth, payments/Razorpay, AI evaluation, AI chat mentor, current affairs, leaderboards, notifications, access-check, streak, and OIR generation), and returns false for cacheable classes (app shell, static study pages, /_next/static, fonts, hero images, practice banks, whitelisted read-only GET APIs); whenever isNetworkOnly is true the Service Worker does not substitute a cached response (it passes the request through to the network)."
    - **Validates: Requirements 7.4, 10.1, 10.2, 10.3**
    - Use fast-check with >= 100 iterations; tag with `// Feature: offline-support, Property 5: {property text}`

  - [x] 2.5 Implement `lib/offline/practice-bank.ts` (offline selection + validation)
    - Implement `validateBank(parsed)` (accept only arrays with >= 1 well-formed question, else `{ ok:false, reason }`), `selectQuestions(pool, count, rng?)` (deterministic/seedable; length === clamp(count, 1, pool.length), every element a member of pool, no duplicate references), and `loadBankFromCache(bankId)` (fetch from `/practice-banks/*` + validateBank)
    - _Requirements: 4.4, 4.7_
    - _Design: Components → Offline practice selection module; Correctness Properties 1, 2_

  - [x]* 2.6 Write property test for `selectQuestions`
    - **Property 1: Offline question selection is bounded and faithful** — "For any non-empty practice-bank pool and any requested count, selectQuestions(pool, count) returns a list whose length equals clamp(count, 1, pool.length), where every returned element is a member of pool and no element reference appears more than once."
    - **Validates: Requirements 4.4**
    - Use fast-check with >= 100 iterations; tag with `// Feature: offline-support, Property 1: {property text}`

  - [x]* 2.7 Write property test for `validateBank`
    - **Property 2: Bank validation accepts exactly valid banks** — "For any parsed JSON value, validateBank(value) returns ok: true with a non-empty question list if and only if the value is an array containing at least one well-formed question (having the fields the flow requires); for every other value (non-array, empty array, or malformed entries) it returns ok: false, and in that case the practice flow does not start."
    - **Validates: Requirements 4.7**
    - Use fast-check with >= 100 iterations; tag with `// Feature: offline-support, Property 2: {property text}`

- [x] 3. Implement the Service Worker `public/sw.js`
  - [x] 3.1 Author `public/sw.js` (plain browser ES, no build step, no imports)
    - Define `CACHE_VERSION` and the versioned cache names / `OWNED` set, mirroring the pure helpers from `lib/offline/sw-helpers.ts` (cache naming, cleanup, `isNetworkOnly`)
    - `install`: all-or-nothing precache of `PRECACHE_URLS` (`/offline`, manifest, icons, `/LSSB_logo.png`, hero placeholder); reject install on any failure so the prior shell is retained; call `skipWaiting()`
    - `activate`: delete every cache not in `OWNED` (record failure flag for retry on next activate); call `clients.claim()`
    - `fetch`: first-match strategy — pass through (no `respondWith`) for non-GET and network-only URLs; navigation network-first with cache fallback then precached `/offline`; cache-first for `/_next/static/**` and `/practice-banks/**`; stale-while-revalidate for font CDNs; cache-first + placeholder for hero image hosts; network-first for whitelisted read-only GET APIs
    - Implement the versioned-update retrieval/retry policy (begin within 5s, complete within 60s, discard partial + retry after 60s up to 3 attempts; serve most recently fully retrieved version)
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 1.8, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 4.2, 4.3, 5.1, 7.6, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 10.3, 11.1_
    - _Design: Architecture → Request-flow decision; Data Models → Precache manifest, classification tables_

  - [x]* 3.2 Write unit test for install-time precache all-or-nothing
    - Inject a failing precache URL and assert the install promise rejects, the new worker does not activate, and previously cached shell is retained
    - _Requirements: 1.4_

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all property and unit tests written so far pass, ask the user if questions arise.

- [x] 5. Web App Manifest, icons, registration, headers, and layout wiring
  - [x] 5.1 Create the manifest and static shell assets
    - Create `public/manifest.webmanifest` with `name`, `short_name`, `start_url: "/"`, `display: "standalone"`, `background_color: "#1c1c1c"`, `theme_color: "#FF5E3A"`, and `icons`
    - Generate `public/icons/icon-192.png`, `public/icons/icon-512.png` (plus a 512 `purpose: "maskable"` entry) from `public/LSSB_logo.png`, and create `public/images/hero-placeholder.png`
    - Use only standard W3C manifest members (no Android-only keys)
    - _Requirements: 1.2, 2.3, 11.4_

  - [x] 5.2 Create `components/offline/ServiceWorkerRegister.tsx`
    - `'use client'` component that registers `/sw.js` with scope `/` on `window.load`, guarding on `'serviceWorker' in navigator` and `window.isSecureContext`
    - On success listen for `updatefound`; on failure catch and dispatch `window` event `lssb:sw-unavailable` and continue on direct network
    - _Requirements: 1.1, 1.7_

  - [x] 5.3 Add `/sw.js` response headers in `next.config.ts`
    - Add a `headers()` entry serving `/sw.js` with `Cache-Control: no-cache` and `Service-Worker-Allowed: /` (only functional change to `next.config.ts`)
    - _Requirements: 1.1, 9.6_

  - [x] 5.4 Wire manifest link and registration into `app/layout.tsx`
    - Add `<link rel="manifest" href="/manifest.webmanifest" />` to `<head>` and mount `ServiceWorkerRegister` once inside `<body>`
    - _Requirements: 1.1, 1.2_

  - [x]* 5.5 Write unit tests for manifest and registration fallback
    - Assert manifest declares required fields and 192/512 icons (1.2); assert registration failure dispatches `lssb:sw-unavailable` and app continues (1.7)
    - _Requirements: 1.2, 1.7_

- [x] 6. Connectivity detection and status indication
  - [x] 6.1 Create `hooks/useOnlineStatus.ts`
    - Return `'online' | 'offline'` derived from `navigator.onLine`, initialized synchronously (state correct at first render) and updated via `window` `online`/`offline` events; standards-based, no native plugin
    - _Requirements: 8.1, 8.2, 8.5, 11.1_

  - [x] 6.2 Create `components/offline/ConnectivityIndicator.tsx` and mount in `LayoutWrapper`
    - Non-intrusive badge that shows an offline pill offline and a brief "back online" pill on transition, driven by the hook (within 2s budget); also renders an "offline support unavailable" state on `lssb:sw-unavailable`
    - Mount once in `components/LayoutWrapper.tsx`
    - _Requirements: 8.3, 8.4, 8.5, 1.7_

  - [x]* 6.3 Write unit tests for connectivity hook transitions and initial state
    - Test online→offline and offline→online transitions and launch-time initial state
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 7. Offline fallback UI and precached offline route
  - [x] 7.1 Create `components/offline/OfflineFallback.tsx`
    - Reusable branded panel with props `{ title?, message?, onRetry? }` and optional retry control
    - _Requirements: 2.6, 3.5, 4.6, 4.7, 7.1_

  - [x] 7.2 Create `app/offline/page.tsx`
    - Static page (rendering `OfflineFallback`) that is precached at SW install and served for any uncached navigation while offline, so the WebView never shows a native error
    - _Requirements: 2.6, 3.5, 7.6_

- [x] 8. Practice-bank static asset generation and npm wiring
  - [x] 8.1 Create `scripts/generate-practice-banks.mjs`
    - Copy `data/practice/*.json` into `public/practice-banks/` and emit `public/practice-banks/index.json` describing each bank with a stable, versioned URL and count (`version`, `banks[]`)
    - _Requirements: 4.1, 4.2_

  - [x] 8.2 Wire the generator into `package.json` scripts
    - Add `predev` and `prebuild` scripts that run `scripts/generate-practice-banks.mjs` so banks are always regenerated before dev/build
    - _Requirements: 4.1, 4.2_

- [x] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass and generated bank assets exist, ask the user if questions arise.

- [x] 10. Offline branches for OIR / SRT / WAT practice flows
  - [x] 10.1 Add offline branch to the OIR test client (`app/practice/oir/test/page.tsx`)
    - When `useOnlineStatus()` is offline: skip `/api/practice/check-access` (GET gate + POST consume) and `/api/oir/generate`; load bank(s) via `loadBankFromCache` and `selectQuestions(pool, randomCount)` with `randomCount` in `[1, pool.length]`; on missing/invalid bank render `OfflineFallback` and do not start the flow while preserving in-progress answers; on submit skip DB history/streak and show results locally. Online path unchanged.
    - _Requirements: 4.4, 4.5, 4.6, 4.7, 7.1, 10.1_

  - [x] 10.2 Add offline-aware `handleStart` to SRT (`app/practice/srt/page.tsx`)
    - When offline, skip `/api/practice/check-access` and proceed against the already-bundled questions; treat `/api/srt/submit` AI evaluation as online-only (draft-and-defer wiring added in task 11)
    - _Requirements: 4.5, 7.1, 7.4_

  - [x] 10.3 Add offline-aware `handleStart` to WAT (`app/practice/wat/page.tsx`)
    - When offline, skip `/api/practice/check-access` and proceed against the already-bundled questions; treat `/api/wat/submit` AI evaluation as online-only (draft-and-defer wiring added in task 11)
    - _Requirements: 4.5, 7.1, 7.4_

- [x] 11. Local draft store, deferred submission, and draft wiring
  - [x] 11.1 Create `lib/offline/idb.ts`
    - Minimal promise wrapper over IndexedDB (`open`, `get`, `put`, `delete`, `getAll`) for database `lssb-offline`, object store `drafts` (keyPath `id`), index on `status`; no dependency
    - _Requirements: 6.1_
    - _Design: Data Models → Local_Draft_Store schema_

  - [x] 11.2 Create `lib/offline/draftStore.ts`
    - Implement `saveDraft` (autosave-overwrite latest content; catch `QuotaExceededError`, keep prior version, return `'quota-exceeded'`), `listPending`, and `removeDraft` over the `Draft` record shape
    - _Requirements: 6.1, 6.4, 6.5, 6.7, 7.2_

  - [x]* 11.3 Write property test for the draft store save/retrieve/retention
    - **Property 6: Saved drafts are never silently lost (data integrity / retention)** — "For any draft saved to the Local_Draft_Store, the draft remains retrievable with a byte-identical payload until it is explicitly acknowledged by a successful server submission; a failed submission leaves the draft present and unmodified (status failed), and a blocked offline scoring submission leaves the user's entered answers fully recoverable."
    - **Validates: Requirements 6.5, 7.2**
    - Use fast-check with >= 100 iterations and `fake-indexeddb`; tag with `// Feature: offline-support, Property 6: {property text}`

  - [x] 11.4 Create `lib/offline/syncManager.ts`
    - Implement `computeBackoffSchedule()` returning `[5000,10000,20000,40000,80000]`, `nextDelay(attempts)` (defined for 0..4, `null` for >= 5), and `flushPending()` that POSTs each pending draft to `draft.endpoint` on reconnect (start within 10s), removes on success, retains + reschedules on failure, and marks manual-retry after 5 attempts
    - _Requirements: 6.3, 6.4, 6.5, 6.6_

  - [x]* 11.5 Write property test for the retry backoff schedule
    - **Property 7: Retry backoff schedule is bounded and strictly increasing** — "For any attempt count, computeBackoffSchedule() yields exactly 5 intervals that are strictly increasing with a first interval of 5000 ms, and nextDelay(attempts) returns a defined interval for attempts in 0..4 and null for attempts >= 5 (signalling manual retry required). A draft that receives a successful submission is subsequently absent from the store (save → acknowledge → absent round-trip)."
    - **Validates: Requirements 6.4, 6.6**
    - Use fast-check with >= 100 iterations (round-trip portion with `fake-indexeddb`); tag with `// Feature: offline-support, Property 7: {property text}`

  - [x] 11.6 Create `hooks/useDraftSync.ts` and draft indicators
    - Expose `{ pendingCount, lastResult }`; trigger `flushPending()` when `useOnlineStatus` transitions to online; render a persistent "Saved locally — not yet submitted" badge plus success/failed/manual-retry indicators
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 11.7 Wire autosave and draft-and-defer into drafting flows
    - Add debounced autosave (`saveDraft` within 2s of pause) and offline draft-and-defer submission to the PIQ form and the SRT/WAT/TAT/GPE/lecturette answer-drafting flows; surface the quota-exceeded warning; keep online submission behavior unchanged
    - _Requirements: 6.1, 6.2, 6.7, 7.2_

  - [x]* 11.8 Write unit tests for draft autosave, indicators, reconnect flush, and quota
    - Autosave timing + pending indicator (6.1, 6.2); reconnect flush begins within budget (6.3); quota-exceeded warning (6.7); offline scoring "not sent" message (7.3)
    - _Requirements: 6.1, 6.2, 6.3, 6.7, 7.3_

- [x] 12. Read-only data gating and online-only route guards
  - [x] 12.1 Guard online-only feature routes with `OfflineFallback`
    - In online-only pages (login/signup/Google auth, payments, AI evaluation, AI chat mentor, current affairs, leaderboards, notifications, account mutations), use `useOnlineStatus` to render `OfflineFallback` within 2s while offline and re-enable automatically when connectivity returns; block offline scoring submissions and show "requires an active internet connection / not sent" while retaining entered answers
    - _Requirements: 7.1, 7.2, 7.3, 7.5, 7.6_

  - [x] 12.2 Gate read-only cached data views
    - Views rendering whitelisted GET data check `useOnlineStatus`; while offline, disable create/edit/delete controls, block attempted mutations client-side (cached data unchanged, error shown), and render `OfflineFallback` for a datum that was never cached
    - _Requirements: 5.2, 5.3, 5.4_

  - [x]* 12.3 Write unit tests for read-only gating and offline scoring message
    - Read-only control disabling and blocked-mutation error offline (5.2, 5.4); offline scoring "not sent" indication (7.3)
    - _Requirements: 5.2, 5.4, 7.3_

- [x] 13. Smoke and platform-compliance checks
  - [x] 13.1 Add post-build smoke assertions for required artifacts
    - Assert `public/manifest.webmanifest`, `public/icons/icon-192.png`, `public/icons/icon-512.png`, and `public/practice-banks/index.json` + bank files exist
    - _Requirements: 1.2, 4.1_

  - [x] 13.2 Add platform-neutrality compliance guard
    - Add a lint/grep guard asserting the offline layer (`public/sw.js`, `lib/offline/*`) contains no Capacitor/native references; fail the check if any are found
    - _Requirements: 11.1, 11.3, 11.5_

- [x] 14. Final checkpoint - Ensure all tests pass
  - Ensure all property, unit, smoke, and compliance tests pass, ask the user if questions arise. Manual integration verification (Chrome DevTools "Offline" throttling per the design's Integration tests checklist, and Android WebView parity via `chrome://inspect`) is performed by the user outside this coding workflow.

- [x] 15. Build verification
  - [x] 15.1 Run `npm run build` and fix any breakage
    - Run `npm run build` and resolve any errors introduced by the offline layer. Honor the dependency constraint: do NOT upgrade to TypeScript 7 / ESLint 10 (keep 5.9.x / 9.x). Do NOT modify `capacitor.config.ts` `server.url`. Only the files enumerated in the design's "Decisions Requiring Confirmation" may be created/edited.
    - _Requirements: 10.1, 11.1_

## Notes

- Tasks marked with `*` are optional test tasks and can be skipped for a faster MVP; core
  implementation tasks are never optional.
- Each task references specific requirement sub-clauses and the design element(s) it implements for
  traceability.
- Property-based tests (Properties 1–7) use Vitest + fast-check (+ fake-indexeddb for IndexedDB
  logic), run >= 100 iterations each, and carry the `// Feature: offline-support, Property {n}: ...`
  tag. The Service Worker's runtime behavior, timing, and UI are verified by unit/integration/smoke
  tests, not property tests.
- Checkpoints provide incremental validation; end-to-end offline behavior is validated manually by
  the user via Chrome DevTools offline throttling and Android WebView remote debugging.
- No runtime dependencies are added; only dev-only test tooling. `capacitor.config.ts` is untouched.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "2.5", "5.1", "5.2", "5.3", "6.1", "7.1", "8.1", "11.1"] },
    { "id": 1, "tasks": ["2.2", "2.3", "2.4", "2.6", "2.7", "3.1", "5.4", "6.2", "7.2", "8.2", "11.2"] },
    { "id": 2, "tasks": ["3.2", "5.5", "6.3", "10.1", "10.2", "10.3", "11.3", "11.4", "13.1"] },
    { "id": 3, "tasks": ["11.5", "11.6", "12.1", "12.2", "13.2"] },
    { "id": 4, "tasks": ["11.7", "12.3"] },
    { "id": 5, "tasks": ["11.8"] },
    { "id": 6, "tasks": ["15.1"] }
  ]
}
```
