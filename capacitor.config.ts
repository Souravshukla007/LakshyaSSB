import { CapacitorConfig } from '@capacitor/cli';

// Release origin the WebView loads by default. This MUST be the HTTPS origin: it
// is a secure context, so the SERVED `/sw.js` service worker registers and takes
// control of the WebView. In Capacitor `server.url` mode the WebView loads this
// remote origin and the bundled assets under android/.../assets/public are inert,
// so the served worker is the one that actually controls the app.
const RELEASE_SERVER_URL = 'https://www.lakshyassb.online';

// Local-device testing override. Set CAP_DEV_SERVER_URL (e.g. http://localhost:3000)
// before running `npx cap sync` / `npx cap copy` to point the app at your PC's dev
// server via `adb reverse tcp:3000 tcp:3000`. localhost is treated as a secure
// context, so the service worker still registers over http during dev.
// Leave this UNSET for release builds so the app uses RELEASE_SERVER_URL.
const devServerUrl = process.env.CAP_DEV_SERVER_URL;
const isDevServer = Boolean(devServerUrl);
const serverUrl = devServerUrl ?? RELEASE_SERVER_URL;

const config: CapacitorConfig = {
  appId: 'in.lakshyassb.app',
  appName: 'Lakshya SSB',
  // Web asset dir is ignored when server.url is set, but required by type
  webDir: 'public',
  server: {
    // Defaults to the HTTPS release origin; overridden only when
    // CAP_DEV_SERVER_URL is set for local device testing (see above).
    url: serverUrl,
    // Only permit cleartext (http) for the local dev override; release stays HTTPS-only.
    cleartext: isDevServer,
    allowNavigation: [
      "localhost",
      "lakshyassb.online",
      "www.lakshyassb.online",
      "checkout.razorpay.com",
      "api.razorpay.com"
    ]
  },
  android: {
    allowMixedContent: true,
    // Fix for "Error 403: disallowed_useragent" when using Google Auth in a WebView
    overrideUserAgent: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36'
  },
  plugins: {
    GoogleAuth: {
      scopes: ["profile", "email"],
      serverClientId: "822781441102-hssrs7efk670i9o8m9nes0b3gp16b8br.apps.googleusercontent.com",
      forceCodeForRefreshToken: true,
    },
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#1c1c1c", // Match your brand-dark
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#FF5E3A", // Match your brand-orange
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
