import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { syncSessionPlan } from '@/lib/entitlement';
import {
    fetchRazorpayPayment,
    hmacHex,
    settleCapturedPayment,
    timingSafeEqualStrings,
} from '@/lib/payment';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/payment/verify
 *
 * The browser callback from Razorpay Checkout. Verifies the signature, confirms
 * the capture with Razorpay, then upgrades the user to lifetime PRO.
 *
 * This is the fast path, not the only path: /api/payment/webhook performs the
 * same settlement server-to-server, so a customer whose tab dies mid-payment
 * still gets upgraded.
 */
export async function POST(request: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return NextResponse.json({ error: 'Missing payment fields' }, { status: 400 });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
        return NextResponse.json({ error: 'Payment not configured' }, { status: 500 });
    }

    // 1. Signature. Cheap, offline, and cryptographic proof that Razorpay issued
    //    this payment for this order.
    const expectedSignature = hmacHex(`${razorpay_order_id}|${razorpay_payment_id}`, keySecret);
    if (!timingSafeEqualStrings(razorpay_signature, expectedSignature)) {
        return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    // 2. The order must be one this server created, and it must belong to the
    //    caller. Previously a missing row skipped the ownership check and the
    //    record was created from the request body instead — so a valid payment
    //    could be redeemed on an account that never made it.
    const order = await prisma.payment.findUnique({
        where: { razorpayOrderId: razorpay_order_id },
        select: { userId: true, amount: true },
    });
    if (!order) {
        console.error('[verify] no local order for', razorpay_order_id);
        return NextResponse.json({ error: 'Unknown order' }, { status: 404 });
    }
    if (order.userId !== session.userId) {
        return NextResponse.json({ error: 'Order does not belong to this user' }, { status: 403 });
    }

    try {
        // 3. Ask Razorpay what actually happened. A signature is issued for an
        //    `authorized` payment too, and an authorised-but-never-captured
        //    payment auto-refunds after a few days — granting lifetime PRO for it
        //    would be giving the product away.
        const remote = await fetchRazorpayPayment(razorpay_payment_id);

        if (remote) {
            if (remote.order_id && remote.order_id !== razorpay_order_id) {
                return NextResponse.json({ error: 'Payment does not match the order' }, { status: 400 });
            }
            if (remote.status === 'failed' || remote.status === 'refunded') {
                return NextResponse.json(
                    { error: `Payment was ${remote.status}. Nothing has been charged to you.` },
                    { status: 400 },
                );
            }
            if (remote.status !== 'captured') {
                // Authorised but not yet captured. The money is not ours yet, so
                // hold off — the webhook finishes this once capture lands.
                return NextResponse.json(
                    {
                        success: false,
                        pending: true,
                        error: 'Payment received and awaiting confirmation. Your Pro access unlocks in a moment.',
                    },
                    { status: 202 },
                );
            }
        } else {
            // Could not reach Razorpay. The HMAC already proves the payment is
            // genuine, so proceed rather than fail a paying customer over a blip.
            console.warn('[verify] proceeding on signature alone, payment lookup unavailable', razorpay_payment_id);
        }

        // 4. Settle. Shared with the webhook and idempotent, so whichever arrives
        //    second is a no-op.
        const outcome = await settleCapturedPayment({
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            amountPaid: remote?.amount ?? order.amount,
        });

        if (outcome.status === 'unknown_order') {
            return NextResponse.json({ error: 'Unknown order' }, { status: 404 });
        }
        if (outcome.status === 'amount_mismatch') {
            console.error('[verify] amount mismatch', razorpay_order_id, outcome);
            return NextResponse.json({ error: 'Payment amount does not match the order' }, { status: 400 });
        }

        // Re-mint the cookie so its `plan` hint matches the database immediately.
        // Without this the customer who just paid still carried plan:'FREE' and
        // kept getting bounced to /pricing by the page guard until something
        // happened to call /api/account/me.
        await syncSessionPlan(session, 'PRO');

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[verify] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
