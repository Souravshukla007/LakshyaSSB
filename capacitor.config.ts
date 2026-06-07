import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.lakshyassb.app',
  appName: 'Lakshya SSB',
  // Web asset dir is ignored when server.url is set, but required by type
  webDir: 'public',
  server: {
    // This is the MOST IMPORTANT setting — MUST match your production domain
    url: 'https://lakshyassb.online',
    cleartext: true,
    allowNavigation: [
      "checkout.razorpay.com",
      "api.razorpay.com",
      "*"
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
