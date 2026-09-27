import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signSession } from '@/lib/auth';
import { verifyOtp } from '@/lib/otp';

/**
 * POST /api/auth/verify-otp
 * Body: { email, otp }
 *
 * This is a full passwordless login, so the code is scoped to purpose LOGIN — a
 * PASSWORD_RESET code must not be redeemable here, and vice versa. Attempt
 * capping, expiry, hashing and constant-time comparison all live in lib/otp.ts.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, otp } = body;

        if (!email || !otp) {
            return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
        }

        const normalizedEmail = String(email).toLowerCase().trim();

        const result = await verifyOtp(normalizedEmail, 'LOGIN', String(otp));
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
            select: {
                id: true,
                email: true,
                fullName: true,
                plan: true,
                tokenVersion: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        await signSession({
            userId: user.id,
            email: user.email,
            plan: user.plan as 'FREE' | 'PRO',
            tokenVersion: user.tokenVersion,
        });

        await prisma.activityLog.create({
            data: {
                userId: user.id,
                action: 'LOGIN',
                details: 'Signed in via email OTP',
            },
        });

        return NextResponse.json({
            message: 'OTP verified successfully',
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                plan: user.plan,
            },
        });
    } catch (error) {
        console.error('[verify-otp]', error);
        return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
    }
}
