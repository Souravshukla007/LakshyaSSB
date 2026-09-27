/**
 * lib/otp.ts
 *
 * One-time passcode issuing and verification.
 *
 * The previous inline implementation had five problems, and a 6-digit code with
 * a 5-minute window is only ~10^6 guesses — parallelised, that is a practical
 * account takeover, because `verify-otp` is a full passwordless login and
 * `reset-password` sets an arbitrary password:
 *
 *   1. `Math.random()` — not a CSPRNG. V8's generator state is recoverable from
 *      observed output, so codes were predictable in principle.
 *   2. No attempt cap and no rate limit anywhere in the repo.
 *   3. No purpose scoping: both routes took `findFirst({ where: { email } })`,
 *      so a code mailed for LOGIN was equally valid to RESET the password.
 *   4. `otpRecord.otp !== otp` — not constant time.
 *   5. Codes were stored in plaintext, so a database snapshot handed out working
 *      credentials.
 */

import { createHash, randomInt, timingSafeEqual } from 'crypto';
import { prisma } from '@/lib/prisma';
import type { OtpPurpose } from '@prisma/client';

/** Code lifetime. */
const TTL_MS = 5 * 60 * 1000;

/** Max failed verifications for a single code before it is burned. */
const MAX_ATTEMPTS = 5;

/** Throttle: at most this many codes per email per window. */
const SEND_WINDOW_MS = 15 * 60 * 1000;
const MAX_SENDS_PER_WINDOW = 3;

/** Minimum gap between two sends to the same address. */
const MIN_RESEND_GAP_MS = 60 * 1000;

export const OTP_TTL_MINUTES = TTL_MS / 60_000;

/**
 * Codes are stored as a SHA-256 digest. A plain hash (not bcrypt) is correct
 * here: the input is high-entropy-per-attempt only in combination with the
 * attempt cap, and verification must stay fast enough to run inline. The cap in
 * {@link verifyOtp} is what makes brute force infeasible, not the hash cost.
 */
function hashOtp(code: string): string {
    return createHash('sha256').update(code, 'utf8').digest('hex');
}

function constantTimeEquals(a: string, b: string): boolean {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
}

/** Cryptographically secure 6-digit code. */
export function generateOtp(): string {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

export type SendGate =
    | { allowed: true }
    | { allowed: false; retryAfterSeconds: number; reason: 'too_soon' | 'too_many' };

/**
 * Should we issue another code for this email/purpose right now?
 *
 * Also stops the endpoint being used to mail-bomb an arbitrary address.
 */
export async function checkSendAllowed(
    email: string,
    purpose: OtpPurpose,
): Promise<SendGate> {
    const since = new Date(Date.now() - SEND_WINDOW_MS);

    const recent = await prisma.otp.findMany({
        where: { email, purpose, createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
    });

    if (recent.length >= MAX_SENDS_PER_WINDOW) {
        const oldest = recent[recent.length - 1].createdAt.getTime();
        const retryAfterSeconds = Math.max(
            1,
            Math.ceil((oldest + SEND_WINDOW_MS - Date.now()) / 1000),
        );
        return { allowed: false, retryAfterSeconds, reason: 'too_many' };
    }

    if (recent.length > 0) {
        const elapsed = Date.now() - recent[0].createdAt.getTime();
        if (elapsed < MIN_RESEND_GAP_MS) {
            return {
                allowed: false,
                retryAfterSeconds: Math.ceil((MIN_RESEND_GAP_MS - elapsed) / 1000),
                reason: 'too_soon',
            };
        }
    }

    return { allowed: true };
}

/**
 * Issue a code for a specific purpose and return the plaintext to mail.
 * Only the digest is persisted. Any outstanding codes for the same
 * email+purpose are invalidated so exactly one is live at a time.
 */
export async function issueOtp(email: string, purpose: OtpPurpose): Promise<string> {
    const code = generateOtp();

    await prisma.$transaction([
        prisma.otp.deleteMany({ where: { email, purpose } }),
        prisma.otp.create({
            data: {
                email,
                purpose,
                otp: hashOtp(code),
                expiresAt: new Date(Date.now() + TTL_MS),
            },
        }),
    ]);

    return code;
}

export type VerifyResult =
    | { ok: true }
    | { ok: false; reason: 'invalid' | 'expired' | 'too_many_attempts' };

/**
 * Verify a code for a specific purpose. Single-use: consumed on success, and
 * burned once {@link MAX_ATTEMPTS} failures accumulate.
 *
 * Deliberately returns the same `invalid` reason for "no such code" and "wrong
 * code" so the endpoint can't be used to probe which addresses have a code
 * outstanding.
 */
export async function verifyOtp(
    email: string,
    purpose: OtpPurpose,
    code: string,
): Promise<VerifyResult> {
    if (typeof code !== 'string' || !/^\d{6}$/.test(code.trim())) {
        return { ok: false, reason: 'invalid' };
    }

    const record = await prisma.otp.findFirst({
        where: { email, purpose },
        orderBy: { createdAt: 'desc' },
    });

    if (!record) return { ok: false, reason: 'invalid' };

    if (record.expiresAt < new Date()) {
        await prisma.otp.deleteMany({ where: { id: record.id } });
        return { ok: false, reason: 'expired' };
    }

    if (record.attempts >= MAX_ATTEMPTS) {
        await prisma.otp.deleteMany({ where: { id: record.id } });
        return { ok: false, reason: 'too_many_attempts' };
    }

    if (!constantTimeEquals(record.otp, hashOtp(code.trim()))) {
        await prisma.otp.update({
            where: { id: record.id },
            data: { attempts: { increment: 1 } },
        });
        return { ok: false, reason: 'invalid' };
    }

    // Success — consume it.
    await prisma.otp.deleteMany({ where: { id: record.id } });
    return { ok: true };
}

/** Housekeeping: drop expired rows. Safe to call from a cron. */
export async function purgeExpiredOtps(): Promise<number> {
    const { count } = await prisma.otp.deleteMany({
        where: { expiresAt: { lt: new Date() } },
    });
    return count;
}
