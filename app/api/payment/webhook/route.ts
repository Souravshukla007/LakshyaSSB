import { NextRequest, NextResponse } from 'next/server';
import {
    hmacHex,
    markPaymentFailed,
    settleCapturedPayment,
    timingSafeEqualStrings,
} from '@/lib/payment';

/**
 * POST /api/payment/webhook
 *
 * Razorpay's server-to-server notification, and the reason a paid user can no
 * longer be left on FREE. The browser callback (/api/payment/verify) only runs if
 * the customer's tab survives the payment — it does not survive a closed tab, a
 * dropped connection, or the Android UPI app-switch failing to return. Razorpay
 * still captured the money in all three cases, and this endpoint is what notices.
 *
 * Setup (both required, or this route stays inert):
 *   1. RAZORPAY_WEBHOOK_SECRET in the environment.
 *   2. Dashboard -> Settings -> Webhooks -> add {APP_URL}/api/payment/webhook
 *      subscribed to `payment.captured` and `payment.failed`.
 *
 * Deliberately unauthenticated: the caller is Razorpay, not a logged-in user. The
 * HMAC over the raw body is the authentication.
 */

/**
 * Razorpay retries on any non-2xx, so only signal failure when a retry can help.
 *
 * Deliberately a function, not a shared constant. A Response body is a one-shot
 * stream: a module-level `NextResponse.json(...)` was consumed by the first
 * request each server instance handled, and every later delivery on that warm
 * instance got a 200 with an EMPTY body (observed in production, 29 Sep 2026).
 * Razorpay only reads the status, so deliveries still counted — but any path
 * that re-wraps the body (Next.js does, when a handler sets cookies) throws on a
 * consumed stream, which would turn every warm delivery into a 500.
 */
const ack = () => NextResponse.json({ received: true });

export async function POST(request: NextRequest) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
        console.error('[webhook] RAZORPAY_WEBHOOK_SECRET is not set — rejecting delivery');
        // 500 so Razorpay retries once the secret is configured, instead of
        // silently discarding a real capture.
        return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    const signature = request.headers.get('x-razorpay-signature');
    if (!signature) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // MUST be the raw body. Parsing to JSON and re-stringifying changes key order
    // and whitespace, and the HMAC would never match.
    const rawBody = await request.text();

    if (!timingSafeEqualStrings(signature, hmacHex(rawBody, secret))) {
        console.error('[webhook] signature mismatch — delivery rejected');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    let event: {
        event?: string;
        payload?: { payment?: { entity?: { id?: string; order_id?: string; amount?: number } } };
    };
    try {
        event = JSON.parse(rawBody);
    } catch {
        return NextResponse.json({ error: 'Malformed payload' }, { status: 400 });
    }

    const entity = event.payload?.payment?.entity;
    const paymentId = entity?.id;
    const orderId = entity?.order_id;
    const amount = entity?.amount;

    try {
        switch (event.event) {
            case 'payment.captured': {
                if (!paymentId || !orderId || typeof amount !== 'number') {
                    console.error('[webhook] payment.captured missing fields', event.event);
                    return ack();
                }

                const outcome = await settleCapturedPayment({ orderId, paymentId, amountPaid: amount });

                if (outcome.status === 'unknown_order') {
                    // An order this server never created. Nothing to grant — but log
                    // it, because it means either a stray webhook from another app
                    // sharing the key, or create-order lost its database write.
                    console.error('[webhook] captured payment for unknown order', orderId, paymentId);
                    return ack();
                }
                if (outcome.status === 'amount_mismatch') {
                    console.error(
                        '[webhook] captured amount does not match the order',
                        orderId,
                        outcome.expected,
                        outcome.received,
                    );
                    return ack();
                }

                console.log(
                    `[webhook] payment.captured settled order=${orderId} payment=${paymentId} ` +
                    `user=${outcome.userId} alreadySettled=${outcome.alreadySettled}`,
                );
                return ack();
            }

            case 'payment.failed': {
                if (orderId) await markPaymentFailed(orderId, paymentId);
                return ack();
            }

            default:
                // Unsubscribed or future event types: acknowledge so Razorpay stops
                // retrying. Retrying an event we will never handle is pure noise.
                return ack();
        }
    } catch (error) {
        // A 500 makes Razorpay retry with backoff, which is what we want for a
        // transient database failure — the capture must not be dropped.
        console.error('[webhook] handler failed', event.event, orderId, error);
        return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
    }
}
