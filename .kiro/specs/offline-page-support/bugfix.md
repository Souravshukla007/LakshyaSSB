# Bugfix Requirements Document

## Introduction

The LakshyaSSB app (Next.js App Router, also packaged as an Android app via Capacitor) is intended to make a specific allowlist of pages usable while the device is offline. Those pages are:

- Practice — `/practice`
- Pricing — `/pricing`
- Legal — `/privacy`, `/terms`, `/refund-policy`
- Informational — `/about`, `/contact`, `/roadmap`
- SSB study days — `/ssb/day-1`, `/ssb/day-2`, `/ssb/day-3`, `/ssb/day-4`, `/ssb/day-5`

An offline service worker (`public/sw.js`, with a bundled copy at `android/app/src/main/assets/public/sw.js`) and an offline fallback page (`app/offline/page.tsx`) already exist. However, offline behavior does not work correctly for the pages listed above: when the device is offline, these pages fail to load and render instead of serving their real content. This defeats the purpose of the offline allowlist for exactly the pages that are supposed to support offline use.

This bugfix is scoped **only** to making the listed pages load and function while offline. It must not extend offline support to any other route, and it must not change the app's existing online behavior or the offline behavior of non-listed routes.

## Bug Analysis

### Current Behavior (Defect)

The bug is triggered when the device is offline and the user opens, reloads, relaunches into, or navigates within the app to one of the allowlisted pages listed in the Introduction.

1.1 WHEN the device is offline and the user navigates (hard load or app relaunch) to one of the listed allowlisted pages THEN the system fails to render that page's content and instead shows a broken/blank page or the generic offline fallback.

1.2 WHEN the device is offline and the user performs an in-app (soft) navigation to one of the listed allowlisted pages THEN the system does not display that page's content.

1.3 WHEN the device is offline and one of the listed pages has not been fully cached with the assets it depends on (page document plus the scripts/data required to render it) THEN the system cannot display the page even though the route is on the offline allowlist.

1.4 WHEN the offline behavior is exercised inside the Android (Capacitor) WebView THEN the listed pages fail to load offline, consistent with the divergence between the served service worker and the bundled copy under `android/app/src/main/assets/public/`.

### Expected Behavior (Correct)

2.1 WHEN the device is offline and the user navigates (hard load or app relaunch) to one of the listed allowlisted pages THEN the system SHALL render that page's actual content from cache.

2.2 WHEN the device is offline and the user performs an in-app (soft) navigation to one of the listed allowlisted pages THEN the system SHALL display that page's actual content from cache.

2.3 WHEN one of the listed pages is intended to work offline THEN the system SHALL cache the page together with all assets it needs to render (page document plus required scripts and data) so that it can be shown offline.

2.4 WHEN the offline behavior is exercised inside the Android (Capacitor) WebView THEN the listed pages SHALL load and function offline identically to the browser.

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the device is online THEN the system SHALL CONTINUE TO load and render every page (both the listed pages and all other pages) using live network responses.

3.2 WHEN the device is offline and the user navigates to a route that is NOT on the offline allowlist THEN the system SHALL CONTINUE TO show the existing offline popup/fallback behavior rather than that route's content.

3.3 WHEN a request targets a network-only API or any non-GET/mutation request THEN the system SHALL CONTINUE TO go straight to the network without being served from cache.

3.4 WHEN the device is offline and the user navigates to the existing `/offline` fallback route or the root `/` landing route THEN the system SHALL CONTINUE TO behave as it does today (these routes are outside the scope of this fix).

3.5 WHEN a new service worker version activates THEN the system SHALL CONTINUE TO clean up caches it does not own, as it does today.

## Bug Condition and Properties

The following pseudocode captures the bug condition and the properties the fix must satisfy. `F` is the current (unfixed) behavior; `F'` is the fixed behavior.

```pascal
// Set of routes that are supposed to work offline (scope of this fix).
CONSTANT OFFLINE_PAGES = {
  '/practice', '/pricing',
  '/privacy', '/terms', '/refund-policy',
  '/about', '/contact', '/roadmap',
  '/ssb/day-1', '/ssb/day-2', '/ssb/day-3', '/ssb/day-4', '/ssb/day-5'
}

FUNCTION isBugCondition(X)
  INPUT: X = { pathname, isOffline, mode }   // navigation to a page
  OUTPUT: boolean

  // The bug applies to offline navigations targeting an allowlisted page.
  RETURN X.isOffline = true
     AND normalize(X.pathname) IN OFFLINE_PAGES
END FUNCTION
```

```pascal
// Property: Fix Checking — allowlisted pages render offline.
FOR ALL X WHERE isBugCondition(X) DO
  result <- navigate'(X)          // F' = fixed navigation handling
  ASSERT renders_actual_page_content(result)
     AND NOT is_offline_fallback(result)
     AND NOT is_blank_or_broken(result)
END FOR
```

```pascal
// Property: Preservation Checking — everything else is unchanged.
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT navigate(X) = navigate'(X)   // F(X) = F'(X)
END FOR
```

This means:
- For every offline visit to a listed page, the fixed system serves the real page content (not the fallback, not a blank/broken page).
- For every other input — online visits to any page, offline visits to non-listed routes, `/` and `/offline`, and network-only/mutation requests — the fixed system behaves exactly as the current system does.
