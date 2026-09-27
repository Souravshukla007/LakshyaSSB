package in.lakshyassb.app;

import android.os.Bundle;
import android.webkit.CookieManager;

import com.getcapacitor.BridgeActivity;

/**
 * The app loads the remote HTTPS origin (see capacitor.config.ts), so the login
 * session lives in the WebView's own CookieManager as a persistent cookie.
 *
 * Android only guarantees that persistent cookies are written to disk when the
 * cookie store is flushed. Without an explicit flush, a process kill (low memory,
 * swipe-away, force stop) can discard cookies that were set since the last
 * automatic flush — which shows up as being randomly logged out on mobile even
 * though the cookie's 7-day Max-Age has not passed.
 */
public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);

        // Needed for the Google sign-in redirect flow inside the WebView.
        if (getBridge() != null && getBridge().getWebView() != null) {
            cookieManager.setAcceptThirdPartyCookies(getBridge().getWebView(), true);
        }
    }

    @Override
    public void onPause() {
        // Persist the session cookie before the app can be killed in the background.
        CookieManager.getInstance().flush();
        super.onPause();
    }

    @Override
    public void onStop() {
        CookieManager.getInstance().flush();
        super.onStop();
    }
}
