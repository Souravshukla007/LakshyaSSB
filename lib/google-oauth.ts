import { NextRequest } from 'next/server';

function getRequestOrigin(request: NextRequest) {
    const host = request.headers.get('host');
    const isLocalhost =
        host?.includes('localhost') ||
        host?.includes('127.0.0.1') ||
        !!host?.match(/^\d+\.\d+\.\d+\.\d+/);
    const protocol = request.headers.get('x-forwarded-proto') || (isLocalhost ? 'http' : 'https');

    return host ? `${protocol}://${host}` : null;
}

export function getGoogleRedirectUri(request: NextRequest) {
    const configuredRedirectUri = process.env.GOOGLE_REDIRECT_URI?.trim();
    const requestOrigin = getRequestOrigin(request);

    // Always trust the explicitly configured URI if set (works in both dev and prod).
    // In local dev, set GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
    // in your .env.local to override the production URI.
    if (configuredRedirectUri) {
        return configuredRedirectUri;
    }

    if (requestOrigin) {
        return `${requestOrigin}/api/auth/google/callback`;
    }

    return 'http://localhost:3000/api/auth/google/callback';
}

export function getAppBaseUrl(request: NextRequest) {
    const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
    const redirectUri = getGoogleRedirectUri(request);

    try {
        return new URL(redirectUri).origin;
    } catch {
        return configuredAppUrl || getRequestOrigin(request) || 'http://localhost:3000';
    }
}
