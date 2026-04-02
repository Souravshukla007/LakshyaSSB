import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signSession } from '@/lib/auth';

interface GoogleTokenPayload {
    sub: string;          // Google user ID
    email: string;
    email_verified: boolean;
    name: string;
    picture?: string;
    given_name?: string;
    family_name?: string;
    aud: string;          // Should match our Client ID
    iss: string;          // Should be accounts.google.com
    exp: number;
}

/**
 * POST /api/auth/google/native
 * Called by the Android/iOS app after the native Google Sign-In succeeds.
 * Accepts the idToken from @codetrix-studio/capacitor-google-auth,
 * verifies it with Google, finds-or-creates the user, and sets a session cookie.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { idToken } = body;

        if (!idToken || typeof idToken !== 'string') {
            return NextResponse.json(
                { error: 'idToken is required' },
                { status: 400 }
            );
        }

        // ── Verify the idToken with Google ─────────────────────────────────────
        // Google's tokeninfo endpoint validates the token signature + expiry for us.
        const verifyResponse = await fetch(
            `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
        );

        if (!verifyResponse.ok) {
            console.error('[google-native] Token verification failed');
            return NextResponse.json(
                { error: 'Invalid Google token. Please try again.' },
                { status: 401 }
            );
        }

        const payload: GoogleTokenPayload = await verifyResponse.json();

        // Make sure the token was issued for OUR app (prevents token injection attacks)
        const validClientIds = [
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_ANDROID_CLIENT_ID, // Android OAuth client ID (if different)
        ].filter(Boolean);

        if (!validClientIds.includes(payload.aud)) {
            console.error('[google-native] Token audience mismatch:', payload.aud);
            return NextResponse.json(
                { error: 'Token was not issued for this application.' },
                { status: 401 }
            );
        }

        if (!payload.email) {
            return NextResponse.json(
                { error: 'No email address found in Google account.' },
                { status: 400 }
            );
        }

        // ── Find or create user ────────────────────────────────────────────────
        const email = payload.email.toLowerCase().trim();

        let user = await prisma.user.findFirst({
            where: {
                OR: [
                    { googleId: payload.sub },
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
                        googleId: payload.sub,
                        profileImageUrl: payload.picture || null,
                    },
                });
            }
        } else {
            // New user — create account via Google
            user = await prisma.user.create({
                data: {
                    fullName: payload.name || email.split('@')[0],
                    email,
                    googleId: payload.sub,
                    profileImageUrl: payload.picture || null,
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

        // ── Create session (sets the auth cookie) ──────────────────────────────
        await signSession({
            userId: user.id,
            email: user.email,
            plan: user.plan as 'FREE' | 'PRO',
        });

        // Log login activity
        await prisma.activityLog.create({
            data: {
                userId: user.id,
                action: 'LOGIN',
                details: 'Signed in via Google (Native Android/iOS)',
            },
        });

        return NextResponse.json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                plan: user.plan,
            },
        });
    } catch (error) {
        console.error('[google-native]', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred. Please try again.' },
            { status: 500 }
        );
    }
}
