import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getGoogleRedirectUri } from '@/lib/google-oauth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/google
 * Redirects the user to Google's OAuth 2.0 consent screen.
 */
export async function GET(request: NextRequest) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = getGoogleRedirectUri(request);

    // 🔍 Debug: visible in Vercel logs — verify this matches your Google Cloud Console URI exactly
    console.log('[google-oauth] redirectUri sent to Google:', redirectUri);

    if (!clientId || !redirectUri) {
        return NextResponse.json(
            { error: 'Google OAuth is not configured' },
            { status: 500 }
        );
    }

    // Generate a random state for CSRF protection
    const state = crypto.randomUUID();

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
        state,
        prompt: 'select_account', // Always show account picker
    });

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    // Set state in a short-lived cookie for CSRF validation
    (await cookies()).set('google_oauth_state', state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 600, // 10 minutes
        path: '/',
    });

    return NextResponse.redirect(googleAuthUrl);
}
