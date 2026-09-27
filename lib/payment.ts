/**
 * lib/payment.ts
 *
 * Shared Razorpay plumbing for the two routes that can grant PRO:
 *   - /api/payment/verify  (browser callback, runs in the customer's tab)
 *   - /api/payment/webhook (server-to-server, runs even if the tab died)
 *
 * Both must reach the identical end state, so the settle logic lives here once.
 * Previously only the browser path existed, which meant a captured payment was
 * lost whenever the tab closed before the callback fired.
 */

import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

/** ₹9 in paise. The order amount is always set server-side, never by the client. */
export const PRO_PLAN_AMOUNT_PAISE = 900;

const RAZORPAY_API = 'https://api.razorpay.com/v1';

/** Basic-auth header value, or null when the gateway is not configured. */
function razorpayCredentials(): string | null {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) return null;
    return Buffer.from(`${keyId}:${keySecret}`).toString('base64');
}

/**
 * Constant-time string compare that tolerates differing lengths.
 *
 * `crypto.timingSafeEqual` throws on a length mismatch, so the length has to be
 * checked first — and that check must not be the thing that leaks, hence the
 * explicit early return rather than letting the throw escape.
 */
export function timingSafeEqualStrings(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
}

/** HMAC-SHA256 hex digest, the format Razorpay uses for both signatures. */
export function hmacHex(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

// ─── Razorpay reads ───────────────────────────────────────────────────────────

export interface RazorpayPayment {
    id: string;
    order_id: string | null;
    /** 'captured' is the only state that means the money is actually ours. */
    status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
    amount: number;
    method?: string;
}

export interface RazorpayOrder {
    id: string;
    status: 'created' | 'attempted' | 'paid';
    amount: number;
    amount_paid: number;
    attempts: number;
}

/**
 * Fetch a payment from Razorpay.
 *
 * Returns null for "could not ask" (gateway unconfigured, non-2xx, network
 * failure) so callers can distinguish that from a definite bad status. Callers
 * must NOT treat null as a refusal: the HMAC signature is already cryptographic
 * proof that Razorpay processed the payment, so failing a paying customer over a
 * transient API blip would be worse than the edge case this check guards.
 */
export async function fetchRazorpayPayment(paymentId: string): Promise<RazorpayPayment | null> {
    const credentials = razorpayCredentials();
    if (!credentials) return null;

    try {
        const response = await fetch(`${RAZORPAY_API}/payments/${encodeURIComponent(paymentId)}`, {
            headers: { Authorization: `Basic ${credentials}` },
            cache: 'no-store',
        });
        if (!response.ok) {
            console.error('[payment] payment lookup failed', paymentId, response.status);
            return null;
        }
        return (await response.json()) as RazorpayPayment;
    } catch (error) {
        console.error('[payment] payment lookup threw', paymentId, error);
        return null;
    }
}

/** Fetch an order. Same null semantics as {@link fetchRazorpayPayment}. */
export async function fetchRazorpayOrder(orderId: string): Promise<RazorpayOrder | null> {
    const credentials = razorpayCredentials();
    if (!credentials) return null;

    try {
        const response = await fetch(`${RAZORPAY_API}/orders/${encodeURIComponent(orderId)}`, {
            headers: { Authorization: `Basic ${credentials}` },
            cache: 'no-store',
        });
        if (!response.ok) return null;
        return (await response.json()) as RazorpayOrder;
    } catch {
        return null;
    }
}

// ─── Settlement ───────────────────────────────────────────────────────────────

export type SettleOutcome =
    | { status: 'settled'; userId: string; alreadySettled: boolean }
    /** No order row — the order was not created by this server. Fail closed. */
    | { status: 'unknown_order' }
    | { status: 'amount_mismatch'; expected: number; received: number };

/**
 * Mark an order paid and put its owner on PRO.
 *
 * Idempotent: a row already SUCCESS is returned untouched, so the webhook and the
 * browser callback can both land for the same payment without double-writing.
 *
 * The order row is the authority on who gets upgraded and how much was owed —
 * never the request body — which is what stops a caller aiming a valid payment at
 * somebody else's account or at a different price.
 */
export async function settleCapturedPayment(params: {
    orderId: string;
    paymentId: string;
    amountPaid: number;
}): Promise<SettleOutcome> {
    const order = await prisma.payment.findUnique({
        where: { razorpayOrderId: params.orderId },
        select: { userId: true, amount: true, status: true, razorpayPaymentId: true },
    });

    if (!order) return { status: 'unknown_order' };

    if (params.amountPaid !== order.amount) {
        return { status: 'amount_mismatch', expected: order.amount, received: params.amountPaid };
    }

    if (order.status === 'SUCCESS') {
        if (order.razorpayPaymentId && order.razorpayPaymentId !== params.paymentId) {
            // Razorpay will not let a paid order be paid twice, so this means
            // something upstream is wrong. Keep the first payment id, log loudly.
            console.error(
                '[payment] order already settled by a different payment',
                params.orderId,
                order.razorpayPaymentId,
                params.paymentId,
            );
        }
        return { status: 'settled', userId: order.userId, alreadySettled: true };
    }

    await prisma.$transaction(async (tx) => {
        // planExpiry stays null = lifetime, matching the one-time ₹9 product.
        await tx.user.update({
            where: { id: order.userId },
            data: { plan: 'PRO', planExpiry: null },
        });
        await tx.payment.update({
            where: { razorpayOrderId: params.orderId },
            data: { razorpayPaymentId: params.paymentId, status: 'SUCCESS' },
        });
    });

    return { status: 'settled', userId: order.userId, alreadySettled: false };
}

/** Record a failed attempt without touching the user's plan. */
export async function markPaymentFailed(orderId: string, paymentId?: string): Promise<void> {
    const order = await prisma.payment.findUnique({
        where: { razorpayOrderId: orderId },
        select: { status: true },
    });
    // Never walk a settled payment backwards — a later `payment.failed` for a
    // retried attempt on an already-paid order would otherwise revoke the record.
    if (!order || order.status === 'SUCCESS') return;

    await prisma.payment.update({
        where: { razorpayOrderId: orderId },
        data: { status: 'FAILED', ...(paymentId ? { razorpayPaymentId: paymentId } : {}) },
    });
}
