import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import { checkSendAllowed, issueOtp, OTP_TTL_MINUTES } from '@/lib/otp';
import type { OtpPurpose } from '@prisma/client';

/**
 * POST /api/auth/send-otp
 * Body: { email, purpose?: 'LOGIN' | 'PASSWORD_RESET' }
 *
 * Always answers with the same generic message so the endpoint cannot be used to
 * enumerate registered addresses.
 */

const GENERIC_OK = { message: 'If the email exists, an OTP has been sent.' };

function resolvePurpose(raw: unknown): OtpPurpose {
    return raw === 'PASSWORD_RESET' ? 'PASSWORD_RESET' : 'LOGIN';
}

function subjectFor(purpose: OtpPurpose): string {
    return purpose === 'PASSWORD_RESET'
        ? 'Your LakshyaSSB password reset code'
        : 'Your LakshyaSSB Login OTP';
}

function bodyFor(purpose: OtpPurpose, otp: string): string {
    const intent =
        purpose === 'PASSWORD_RESET'
            ? 'Your password reset code is:'
            : 'Your One-Time Password (OTP) for login is:';
    return `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #f97316;">LakshyaSSB</h2>
            <p>${intent}</p>
            <h1 style="font-size: 32px; letter-spacing: 5px; color: #111827; background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center;">${otp}</h1>
            <p style="color: #6b7280; font-size: 14px;">
                This code is valid for ${OTP_TTL_MINUTES} minutes and can only be used to
                ${purpose === 'PASSWORD_RESET' ? 'reset your password' : 'sign in'}. Do not share it with anyone.
            </p>
        </div>
    `;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email } = body;
        const purpose = resolvePurpose(body.purpose);

        if (!email || typeof email !== 'string') {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: { id: true, passwordHash: true, googleId: true },
        });

        // Same response whether or not the account exists.
        if (!user) {
            return NextResponse.json(GENERIC_OK);
        }

        // Don't let a reset code turn a Google-only account into a
        // password-authenticated one (see reset-password for the enforcement).
        if (purpose === 'PASSWORD_RESET' && !user.passwordHash && user.googleId) {
            return NextResponse.json(GENERIC_OK);
        }

        // Throttle before issuing anything: unlimited sends is both a brute-force
        // enabler and a way to mail-bomb an arbitrary address.
        const gate = await checkSendAllowed(normalizedEmail, purpose);
        if (!gate.allowed) {
            return NextResponse.json(
                {
                    error: 'Too many requests. Please wait before requesting another code.',
                    reason: gate.reason,
                    retryAfterSeconds: gate.retryAfterSeconds,
                },
                { status: 429, headers: { 'Retry-After': String(gate.retryAfterSeconds) } },
            );
        }

        const otp = await issueOtp(normalizedEmail, purpose);

        const apiKey = process.env.RESEND_API_KEY;
        if (apiKey) {
            // Constructed per request rather than at module scope, so a missing key
            // is a clear config error instead of a placeholder that silently fails.
            const resend = new Resend(apiKey);
            await resend.emails.send({
                from: 'LakshyaSSB <onboarding@resend.dev>',
                to: normalizedEmail,
                subject: subjectFor(purpose),
                html: bodyFor(purpose, otp),
            });
        } else if (process.env.NODE_ENV !== 'production') {
            // Local development only. Never log a live credential in production —
            // this used to print on any deployment whose RESEND_API_KEY was unset,
            // putting working login codes into the platform log stream.
            console.warn(
                `[send-otp] RESEND_API_KEY unset — ${purpose} code for ${normalizedEmail}: ${otp}`,
            );
        } else {
            console.error('[send-otp] RESEND_API_KEY is not configured; cannot deliver OTP');
            return NextResponse.json(
                { error: 'Unable to send the code right now. Please try again later.' },
                { status: 503 },
            );
        }

        return NextResponse.json(GENERIC_OK);
    } catch (error) {
        console.error('[send-otp]', error);
        return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
    }
}
