import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lakshyassb.app',
  appName: 'Lakshya SSB',
  // Web asset dir is ignored when server.url is set, but required by type
  webDir: 'public',
  server: {
    // This is the MOST IMPORTANT setting
    url: 'https://lakshya-ssb.vercel.app',
    cleartext: true,
    allowNavigation: [
      "checkout.razorpay.com",
      "api.razorpay.com",
      "*"
    ]
  },
  android: {
    allowMixedContent: true
  },
  plugins: {
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
