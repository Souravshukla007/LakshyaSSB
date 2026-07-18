# Requirements Document

## Introduction

This feature adds scoped offline support to the LakshyaSSB application so that a defined set of
static and read-only capabilities remain usable on Android when the device has no network
connectivity, while all capabilities that inherently require the internet degrade gracefully into a
friendly offline state instead of a WebView error.

The Capacitor Android application does not bundle web assets; it loads a remote server URL
(`https://lakshyassb.online`) into the System WebView. Because of this, offline support MUST be
delivered at the web layer through a Service Worker and a Web App Manifest served from the
production domain. The System WebView on Android supports Service Workers, so Android is fully
feasible. There is no iOS project in the repository yet, and iOS Service Worker execution in
WKWebView requires App-Bound Domains configuration built on macOS/Xcode; therefore iOS
implementation, build, and testing are explicitly deferred. The Service Worker layer, however, MUST
be built in a platform-neutral way so that iOS works once an iOS project is later added.

The guiding constraint from the user is: capabilities that are not feasible offline or that need the
internet MUST NOT be forced offline. They must show a clear offline state.

## Glossary

- **Web_App**: The Next.js 16 (App Router) application served from `https://lakshyassb.online`.
- **Service_Worker**: The browser/WebView-managed script registered by the Web_App that
  intercepts network requests and serves cached responses when offline.
- **App_Shell**: The minimal cached HTML, CSS, JavaScript, and layout assets required to render the
  Web_App user interface without a network connection.
- **Web_App_Manifest**: The manifest file that declares Web_App metadata (name, icons, start URL,
  display mode) required for installability and offline launch.
- **Cache_Store**: The Service_Worker-managed storage (Cache Storage API) holding cached responses.
- **Local_Draft_Store**: Client-side persistent storage (IndexedDB or localStorage) used to hold
  user-authored drafts and pending submissions while offline.
- **Android_Client**: The Capacitor Android application that loads the Web_App into the System
  WebView.
- **Connectivity_Detector**: The Web_App component that determines whether the device currently has
  network connectivity.
- **Offline_Fallback_UI**: A user-facing state that informs the user a capability is unavailable
  offline and requires connectivity.
- **Static_Study_Content**: The statically rendered study pages: landing page, footer, about,
  roadmap, SSB day guides (day-1 through day-5), and the PIQ form user interface.
- **Practice_Bank**: A set of practice questions stored as static JSON (OIR, SRT, WAT, and
  equivalent sets) used by the practice test flow.
- **Online_Only_Capability**: A capability that requires the internet: login/signup/Google
  authentication, payments (Razorpay), AI evaluation, AI chat mentor (Gemini), current affairs/news,
  leaderboards, notifications, and answer submission/scoring.
- **Cache_Version**: An identifier associated with a released set of cached assets, used to
  invalidate and replace stale caches.

## Requirements

### Requirement 1: Service Worker and Manifest Foundation

**User Story:** As an Android user with no connectivity, I want the app to load from a locally cached shell, so that I can open the app and use offline-available features without a network error.

#### Acceptance Criteria

1. WHEN the Web_App loads over an HTTPS origin, THE Web_App SHALL initiate Service_Worker registration within 5 seconds of the initial page load.
2. THE Web_App SHALL provide a Web_App_Manifest that declares the application name, at least one icon of 192x192 pixels and one of 512x512 pixels, a start URL, and a display mode.
3. WHEN the Service_Worker install event fires, THE Service_Worker SHALL cache the complete set of App_Shell resources (HTML document, CSS, JavaScript, and manifest-declared icons required to render the shell) into the Cache_Store.
4. IF one or more App_Shell resources fail to cache during the install event, THEN THE Service_Worker SHALL abort activation, retain any previously cached App_Shell version, and report the install as failed so no partial shell is served.
5. WHEN the device has no connectivity AND the App_Shell is cached, THE Service_Worker SHALL serve the cached App_Shell from the Cache_Store within 2 seconds without producing a network error.
6. WHEN the Service_Worker activates a new version, THE Service_Worker SHALL delete Cache_Store entries belonging to prior App_Shell versions and retain only the current version's entries.
7. IF Service_Worker registration fails, THEN THE Web_App SHALL continue to function using direct network requests and SHALL provide an indication that offline support is unavailable.
8. WHERE the runtime platform is the Android_Client System WebView, THE Service_Worker SHALL apply the same caching and serving logic defined in criteria 3 through 6 as when running in a standard browser.

### Requirement 2: Offline Landing Page and Footer

**User Story:** As a user offline, I want the landing page and footer to be available, so that I can still see the app's main entry content.

#### Acceptance Criteria

1. WHILE the device is offline, WHEN the landing page is requested AND the landing page was loaded at least once while online, THE Service_Worker SHALL serve the landing page from the Cache_Store within 3 seconds of the navigation request.
2. WHILE the device is offline, WHEN a cached page containing the footer section is requested, THE Service_Worker SHALL serve the complete footer content from the Cache_Store.
3. IF an external hero image referenced by the landing page fails to load or does not respond within 3 seconds while offline, THEN THE Web_App SHALL display a cached placeholder image occupying the same layout dimensions in its place.
4. IF a CDN-hosted font or icon asset fails to load or does not respond within 3 seconds while offline, THEN THE Web_App SHALL render the affected text using a cached or system fallback font while keeping the text visible.
5. WHEN the landing page requests authentication status while offline, THE Web_App SHALL render the landing page content within 3 seconds without waiting for the authentication status response.
6. IF the landing page is requested while offline and no cached copy of the landing page exists in the Cache_Store, THEN THE Service_Worker SHALL serve a cached offline fallback page containing an indication that the content is unavailable offline.

### Requirement 3: Offline Static Study Content

**User Story:** As a user offline, I want to read the study guides and roadmap, so that I can continue studying without connectivity.

#### Acceptance Criteria

1. WHEN a Static_Study_Content page has been loaded at least once while online and the same page is requested while offline, THE Service_Worker SHALL serve that page from the Cache_Store within 2 seconds of the request.
2. WHEN a Static_Study_Content page is loaded for the first time while online, THE Service_Worker SHALL store that page in the Cache_Store, where Static_Study_Content comprises the SSB day guides for day-1 through day-5, the roadmap page, and the PIQ form user interface (7 pages total).
3. WHILE the device is offline, THE Service_Worker SHALL serve each previously cached Static_Study_Content page from the Cache_Store when that page is requested.
4. WHEN a user navigates between previously cached Static_Study_Content pages while offline, THE Service_Worker SHALL serve each requested page from the Cache_Store within 2 seconds without requiring network connectivity.
5. IF a requested Static_Study_Content page has never been cached and the device is offline, THEN THE Web_App SHALL display the Offline_Fallback_UI containing a message indicating that the page is unavailable offline and a control to retry the request.
6. IF serving a requested Static_Study_Content page from the Cache_Store fails while offline, THEN THE Web_App SHALL display the Offline_Fallback_UI indicating that the cached content could not be retrieved, and SHALL retain any previously cached pages in the Cache_Store.

### Requirement 4: Offline Practice Question Banks

**User Story:** As a user offline, I want to practice with question banks, so that I can prepare without connectivity.

#### Acceptance Criteria

1. THE Web_App SHALL expose each Practice_Bank as a static asset retrievable via a stable, versioned URL without invoking the server-side generation API or any database-backed history request.
2. WHEN a Practice_Bank static asset is requested while the device is online and the asset is not already present in the Cache_Store, THE Service_Worker SHALL store that Practice_Bank asset in the Cache_Store.
3. WHILE the device is offline and a requested Practice_Bank asset is present in the Cache_Store, THE Service_Worker SHALL serve that Practice_Bank from the Cache_Store within 1000 milliseconds of the request.
4. WHILE the device is offline, THE Web_App SHALL select practice questions client-side from the cached Practice_Bank, selecting a count between 1 and the total number of questions available in that Practice_Bank.
5. WHILE the device is offline, THE Web_App SHALL run the complete practice test flow (question presentation, answer capture, and result display) without issuing any database-backed history request.
6. IF a requested Practice_Bank is not present in the Cache_Store, THEN THE Web_App SHALL display the Offline_Fallback_UI indicating that the practice set is unavailable offline, and SHALL retain any in-progress practice session without discarding captured answers.
7. IF the cached Practice_Bank asset cannot be parsed into a valid set of at least 1 question, THEN THE Web_App SHALL display the Offline_Fallback_UI indicating the practice set is unavailable offline and SHALL NOT start the practice test flow.

### Requirement 5: Offline Viewing of Previously Loaded Data

**User Story:** As a user offline, I want to view data I already loaded while online, so that I can review it without connectivity.

#### Acceptance Criteria

1. WHEN a GET data response has been retrieved and cached while online, AND the device is offline, THE Service_Worker SHALL serve the most recently cached version of that response within 2 seconds of the request.
2. WHILE the device is offline, THE Web_App SHALL present cached data as read-only by disabling all controls that create, edit, or delete that data.
3. IF requested data has never been cached, THEN THE Web_App SHALL display the Offline_Fallback_UI for that data, indicating that the data is unavailable offline.
4. IF a user attempts a create, edit, or delete action while the device is offline, THEN THE Web_App SHALL prevent the action, retain the existing cached data unchanged, and display an error indication that the operation is unavailable while offline.

### Requirement 6: Offline Drafting and Deferred Submission

**User Story:** As a user offline, I want to draft answers and have them submitted when I reconnect, so that I do not lose my work.

#### Acceptance Criteria

1. WHILE the device is offline, THE Web_App SHALL save each user-authored draft to the Local_Draft_Store within 2 seconds of the user pausing input, retaining the most recent draft content.
2. WHILE the device is offline AND a draft is stored in the Local_Draft_Store, THE Web_App SHALL display a persistent visual indicator showing that the draft is stored locally and not yet submitted.
3. WHEN connectivity is restored AND at least one pending draft exists in the Local_Draft_Store, THE Web_App SHALL submit each pending draft to the server within 10 seconds of connectivity being detected.
4. WHEN a pending draft receives a successful submission confirmation from the server, THE Web_App SHALL remove that draft from the Local_Draft_Store and display a visual indicator confirming successful submission.
5. IF submission of a pending draft fails, THEN THE Web_App SHALL retain the unmodified draft in the Local_Draft_Store and display a visual indicator informing the user that submission failed and will be retried.
6. IF submission of a pending draft fails, THEN THE Web_App SHALL retry submission up to 5 times using increasing intervals starting at 5 seconds, and after 5 failed attempts SHALL retain the draft and display a visual indicator that manual retry is required.
7. IF the Local_Draft_Store cannot store a draft because storage capacity is exceeded, THEN THE Web_App SHALL retain the previously saved draft version and display a visual indicator informing the user that the latest changes could not be saved locally.

### Requirement 7: Graceful Degradation of Online-Only Capabilities

**User Story:** As a user offline, I want internet-dependent features to tell me they need connectivity, so that I understand why they are unavailable instead of seeing an error page.

#### Acceptance Criteria

1. WHILE the device is offline, WHEN a user accesses an Online_Only_Capability, THE Web_App SHALL display the Offline_Fallback_UI within 2 seconds, where the Offline_Fallback_UI presents a message indicating that the capability requires an active internet connection.
2. WHILE the device is offline, WHEN a user attempts to submit answers that require server-side scoring, THE Web_App SHALL block the submission and retain the user's entered answers without loss.
3. IF a user attempts to submit answers requiring server-side scoring while the device is offline, THEN THE Web_App SHALL display an indication that the submission requires an active internet connection and was not sent.
4. THE Web_App SHALL treat login, signup, Google authentication, payments, AI evaluation, AI chat mentor, current affairs, leaderboards, and notifications as an Online_Only_Capability.
5. WHEN connectivity is restored, THE Web_App SHALL make each Online_Only_Capability available again within 5 seconds of detecting restored connectivity.
6. IF an Online_Only_Capability is accessed while the device is offline, THEN THE Web_App SHALL not display a WebView native network error page.

### Requirement 8: Connectivity Detection and Status Indication

**User Story:** As a user, I want the app to know and show whether I am online or offline, so that I understand which features are available.

#### Acceptance Criteria

1. THE Connectivity_Detector SHALL classify the current device connectivity state as either "online" or "offline", where "online" means the device has an active network connection and "offline" means the device has no active network connection.
2. WHEN the device network connection status changes, THE Connectivity_Detector SHALL update the current connectivity state within 3 seconds of the change.
3. WHEN the connectivity state changes from online to offline, THE Web_App SHALL display a visible offline status indicator to the user within 2 seconds of the state change.
4. WHEN the connectivity state changes from offline to online, THE Web_App SHALL replace the offline status indicator with a visible online status indicator within 2 seconds of the state change.
5. WHEN the Web_App is launched, THE Web_App SHALL display a status indicator reflecting the current connectivity state within 3 seconds of launch.

### Requirement 9: Cache Versioning and Update Strategy

**User Story:** As a user, I want the app to update its cached content after a new release, so that I am not stuck with a stale version indefinitely.

#### Acceptance Criteria

1. THE Service_Worker SHALL associate every cached asset in the Cache_Store with exactly one Cache_Version identifier.
2. WHEN a Service_Worker with a new Cache_Version activates, THE Service_Worker SHALL delete all Cache_Store entries associated with prior Cache_Versions before serving any request under the new Cache_Version.
3. IF deletion of prior Cache_Version entries fails during activation, THEN THE Service_Worker SHALL retain the current Cache_Version entries, continue serving from the current Cache_Version, and record an activation-failure indication for retry on the next activation.
4. WHEN a new Cache_Version is available AND the device has an active network connection, THE Service_Worker SHALL begin retrieving updated assets for the new Cache_Version within 5 seconds and complete retrieval within 60 seconds.
5. IF retrieval of updated assets for a new Cache_Version does not complete within 60 seconds or returns a non-successful response, THEN THE Service_Worker SHALL discard the partially retrieved new Cache_Version, retain the current Cache_Version, and retry retrieval after 60 seconds for a maximum of 3 attempts.
6. WHILE the device has an active network connection, THE Service_Worker SHALL serve content associated with the most recently fully retrieved Cache_Version.

### Requirement 10: Preservation of Existing Online Behavior

**User Story:** As an existing user, I want the app to behave exactly as before when I am online, so that offline support does not disrupt my normal usage.

#### Acceptance Criteria

1. WHILE the device is online, THE Web_App SHALL serve, for each capability, the same server-generated content and functionality it served prior to offline support, such that dynamic and Online_Only_Capability responses are obtained from the server and not substituted with cached responses.
2. WHILE the device is online, WHEN a user issues a dynamic or Online_Only_Capability request, THE Web_App SHALL route the request to the server and return the server response to the user.
3. WHILE the device is online, IF the Service_Worker intercepts a dynamic or Online_Only_Capability request, THEN THE Service_Worker SHALL forward the request to the network and SHALL NOT serve a cached response for that request.
4. WHILE the device is online, IF a dynamic or Online_Only_Capability request fails to complete against the server, THEN THE Web_App SHALL surface the same server or network error behavior it exhibited prior to offline support without substituting a cached response.

### Requirement 11: Platform Scope

**User Story:** As a product owner, I want offline support delivered for Android now while keeping the web layer portable, so that iOS can be enabled later without rework.

#### Acceptance Criteria

1. THE Service_Worker SHALL be implemented entirely within the Web_App layer and SHALL contain no direct calls to native platform code, native plugins, or platform-specific bridges.
2. WHERE the Web_App is loaded within the Android_Client System WebView, THE Service_Worker SHALL provide every offline capability defined in this document.
3. THE Web_App SHALL implement the Service_Worker using only standards-based web platform features that are not specific to the Android_Client, such that no Web_App layer code changes are required to enable a future iOS client.
4. THE Web_App SHALL implement the Web_App_Manifest using only standards-based web platform features that are not specific to the Android_Client, such that no Web_App layer code changes are required to enable a future iOS client.
5. IF the Service_Worker or Web_App_Manifest is found to reference Android-specific or native platform code, THEN THE Web_App SHALL be treated as non-compliant with this requirement and the offending references SHALL be reported for removal.
