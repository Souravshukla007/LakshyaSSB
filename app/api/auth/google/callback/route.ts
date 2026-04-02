import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signSession } from '@/lib/auth';

interface GoogleTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    id_token?: string;
    scope: string;
}

interface GoogleUserInfo {
    sub: string;        // Google user ID
    email: string;
    email_verified: boolean;
    name: string;
    picture?: string;
    given_name?: string;
    family_name?: string;
}

/**
 * GET /api/auth/google/callback
 * Handles the redirect from Google after user grants consent.
 * Exchanges the authorization code for tokens, fetches user info,
 * and either logs in an existing user or creates a new one.
 */
export async function GET(request: NextRequest) {
    const host = request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const baseUrl = host ? `${protocol}://${host}` : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');

    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        // Handle user denying consent
        if (error) {
            return NextResponse.redirect(
                `${baseUrl}/auth?error=${encodeURIComponent('Google sign-in was cancelled')}`
            );
        }

        if (!code) {
            return NextResponse.redirect(
                `${baseUrl}/auth?error=${encodeURIComponent('No authorization code received')}`
            );
        }

        // Validate CSRF state
        const savedState = request.cookies.get('google_oauth_state')?.value;
        if (!savedState || savedState !== state) {
            return NextResponse.redirect(
                `${baseUrl}/auth?error=${encodeURIComponent('Invalid state parameter. Please try again.')}`
            );
        }

        // ── Exchange code for tokens ──────────────────────────────────────────
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                redirect_uri: host ? `${protocol}://${host}/api/auth/google/callback` : process.env.GOOGLE_REDIRECT_URI!,
                grant_type: 'authorization_code',
            }),
        });

        if (!tokenResponse.ok) {
            const errBody = await tokenResponse.text();
            console.error('[google-callback] Token exchange failed:', errBody);
            return NextResponse.redirect(
                `${baseUrl}/auth?error=${encodeURIComponent('Failed to authenticate with Google')}`
            );
        }

        const tokens: GoogleTokenResponse = await tokenResponse.json();

        // ── Fetch user info ───────────────────────────────────────────────────
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        if (!userInfoResponse.ok) {
            console.error('[google-callback] Failed to fetch user info');
            return NextResponse.redirect(
                `${baseUrl}/auth?error=${encodeURIComponent('Failed to get Google profile')}`
            );
        }

        const googleUser: GoogleUserInfo = await userInfoResponse.json();

        if (!googleUser.email) {
            return NextResponse.redirect(
                `${baseUrl}/auth?error=${encodeURIComponent('No email address found in Google account')}`
            );
        }

        // ── Find or create user ───────────────────────────────────────────────
        const email = googleUser.email.toLowerCase().trim();

        // Check if user exists by googleId first, then by email
        let user = await prisma.user.findFirst({
            where: {
                OR: [
                    { googleId: googleUser.sub },
                    { email },
                ],
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                plan: true,
                googleId: true,
            },
        });

        if (user) {
            // Existing user — link Google account if not already linked
            if (!user.googleId) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        googleId: googleUser.sub,
                        profileImageUrl: googleUser.picture || null,
                    },
                });
            }
        } else {
            // New user — create account via Google
            user = await prisma.user.create({
                data: {
                    fullName: googleUser.name || googleUser.email.split('@')[0],
                    email,
                    googleId: googleUser.sub,
                    profileImageUrl: googleUser.picture || null,
                    passwordHash: null,
                    plan: 'FREE',
                },
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    plan: true,
                    googleId: true,
                },
            });
        }

        // ── Create session ────────────────────────────────────────────────────
        await signSession({
            userId: user.id,
            email: user.email,
            plan: user.plan as 'FREE' | 'PRO',
        });

        // Clear the CSRF state cookie and redirect to home
        const response = NextResponse.redirect(`${baseUrl}/`);
        response.cookies.set('google_oauth_state', '', {
            expires: new Date(0),
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('[google-callback]', error);
        return NextResponse.redirect(
            `${baseUrl}/auth?error=${encodeURIComponent('An unexpected error occurred')}`
        );
    }
}
