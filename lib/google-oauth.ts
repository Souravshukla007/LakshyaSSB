import { NextRequest } from 'next/server';

/**
 * Where to send the browser during the Google OAuth dance.
 *
 * The `Host` header is attacker-controlled. Deriving the post-login redirect from
 * it meant a spoofed Host could bounce a freshly-authenticated user to another
 * origin. Google's registered-redirect-URI allowlist blocks abuse of
 * `redirect_uri` itself, but not the `${baseUrl}/...` redirects the callback
 * performs afterwards.
 *
 * So: configuration wins, the request origin is only a development convenience,
 * and in production a missing config is a hard error rather than a silent
 * fallback to whatever the client claimed.
 */

function isLocalHost(host: string | null): boolean {
    if (!host) return false;
    return (
        host.startsWith('localhost') ||
        host.startsWith('127.0.0.1') ||
        // LAN address, used by the Capacitor Android build against a dev server.
        /^\d+\.\d+\.\d+\.\d+(:\d+)?$/.test(host)
    );
}

/**
 * Origin derived from the request. ONLY safe for local development — see the
 * module comment. Returns null in production.
 */
function getDevRequestOrigin(request: NextRequest): string | null {
    if (process.env.NODE_ENV === 'production') return null;

    const host = request.headers.get('host');
    if (!host) return null;

    const protocol = isLocalHost(host) ? 'http' : 'https';
    return `${protocol}://${host}`;
}

/** Configured app origin, if it parses. */
function getConfiguredOrigin(): string | null {
    const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
    if (!configured) return null;
    try {
        return new URL(configured).origin;
    } catch {
        return null;
    }
}

export function getGoogleRedirectUri(request: NextRequest) {
    // 1. Explicit configuration always wins, in every environment.
    const configuredRedirectUri = process.env.GOOGLE_REDIRECT_URI?.trim();
    if (configuredRedirectUri) {
        return configuredRedirectUri;
    }

    // 2. Derive from the configured app URL.
    const configuredOrigin = getConfiguredOrigin();
    if (configuredOrigin) {
        return `${configuredOrigin}/api/auth/google/callback`;
    }

    // 3. Development convenience only.
    const devOrigin = getDevRequestOrigin(request);
    if (devOrigin) {
        return `${devOrigin}/api/auth/google/callback`;
    }

    // In production, refuse to guess.
    throw new Error(
        'Google OAuth is misconfigured: set GOOGLE_REDIRECT_URI or NEXT_PUBLIC_APP_URL.',
    );
}

export function getAppBaseUrl(request: NextRequest) {
    const configuredOrigin = getConfiguredOrigin();
    if (configuredOrigin) return configuredOrigin;

    const configuredRedirectUri = process.env.GOOGLE_REDIRECT_URI?.trim();
    if (configuredRedirectUri) {
        try {
            return new URL(configuredRedirectUri).origin;
        } catch {
            /* fall through */
        }
    }

    const devOrigin = getDevRequestOrigin(request);
    if (devOrigin) return devOrigin;

    throw new Error(
        'Application base URL is misconfigured: set NEXT_PUBLIC_APP_URL.',
    );
}
