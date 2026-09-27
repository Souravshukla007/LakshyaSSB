import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { verifyOtp } from '@/lib/otp';
import { bumpTokenVersion } from '@/lib/auth';

/**
 * POST /api/auth/reset-password
 * Body: { email, otp, newPassword }
 *
 * Anonymous, so it is the highest-value target in the app. Three things changed:
 *
 *  - The code must have been issued for PASSWORD_RESET. Previously any newest
 *    code for the address worked, so a LOGIN code could reset a password.
 *  - A Google-only account can no longer have a password grafted onto it, which
 *    turned mailbox access into permanent password access.
 *  - Every existing session is invalidated on success. A reset is the standard
 *    response to a compromise, and it previously left the attacker's session
 *    fully working for up to 7 days.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, otp, newPassword } = body;

        if (!email || !otp || !newPassword) {
            return NextResponse.json(
                { error: 'Email, OTP, and new password are required' },
                { status: 400 },
            );
        }

        const normalizedEmail = String(email).toLowerCase().trim();

        if (typeof newPassword !== 'string' || newPassword.length < 8) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters' },
                { status: 400 },
            );
        }

        const result = await verifyOtp(normalizedEmail, 'PASSWORD_RESET', String(otp));
        if (!result.ok) {
            if (result.reason === 'too_many_attempts') {
                return NextResponse.json(
                    {
                        error: 'Too many incorrect attempts. Request a new code.',
                        reason: 'too_many_attempts',
                    },
                    { status: 429 },
                );
            }
            if (result.reason === 'expired') {
                return NextResponse.json(
                    { error: 'That code has expired. Request a new one.', reason: 'expired' },
                    { status: 400 },
                );
            }
            return NextResponse.json(
                { error: 'Invalid or expired OTP', reason: 'invalid' },
                { status: 400 },
            );
        }

        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: { id: true, passwordHash: true, googleId: true },
        });

        if (!user) {
            // Generic: don't confirm which addresses exist.
            return NextResponse.json(
                { error: 'Invalid or expired OTP', reason: 'invalid' },
                { status: 400 },
            );
        }

        // Google-only account: refuse rather than silently creating a password.
        if (!user.passwordHash && user.googleId) {
            return NextResponse.json(
                {
                    error: 'This account uses Google sign-in. Continue with Google instead.',
                    reason: 'google_only_account',
                },
                { status: 400 },
            );
        }

        const passwordHash = await bcrypt.hash(newPassword, 12);

        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash },
        });

        // Kill every outstanding session for this account.
        await bumpTokenVersion(user.id);

        await prisma.activityLog.create({
            data: {
                userId: user.id,
                action: 'PASSWORD_RESET',
                details: 'Password reset via OTP; all sessions signed out',
            },
        });

        return NextResponse.json({
            message:
                'Password reset successful. You have been signed out everywhere — log in with your new password.',
        });
    } catch (error) {
        console.error('[reset-password]', error);
        return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
    }
}
