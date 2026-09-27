import { NextResponse } from 'next/server';
import { getLiveEntitlement } from '@/lib/entitlement';
import { PRO_PLAN_AMOUNT_PAISE, fetchRazorpayOrder } from '@/lib/payment';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/payment/create-order
 * Creates (or reuses) a Razorpay order for the PRO plan.
 *
 * The amount is fixed here, server-side, and the client never gets to propose
 * one — that is what makes the price untamperable.
 */

/**
 * How long an unpaid order row stays reusable. Long enough to cover a customer
 * who clicks Pay, hesitates, and clicks again; short enough that a stale order
 * isn't resurrected days later.
 */
const ORDER_REUSE_WINDOW_MS = 15 * 60 * 1000;

export async function POST() {
    // Reads the live plan from the database, not the cookie claim.
    const entitlement = await getLiveEntitlement();
    if (!entitlement) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // PRO is a one-time lifetime grant, so charging an existing PRO user again
    // buys them nothing and earns us a refund request. /pricing and /checkout
    // hide the button, but this is the check that actually holds.
    if (entitlement.isPro) {
        return NextResponse.json(
            { error: 'You already have lifetime Pro access.', reason: 'already_pro' },
            { status: 409 },
        );
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 500 });
    }

    const amount = PRO_PLAN_AMOUNT_PAISE;
    const currency = 'INR';

    try {
        // Reuse a recent unpaid order instead of inserting a new row on every
        // click. Without this, an indecisive customer accumulated a PENDING row
        // per click and each one surfaced in their account history.
        const reusable = await findReusableOrder(entitlement.userId, amount);
        if (reusable) {
            return NextResponse.json({ orderId: reusable, amount, currency, key: keyId });
        }

        // Use Razorpay REST API directly — no SDK needed
        const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
        // Receipt must be <= 40 chars
        const receipt = `rcpt_${entitlement.userId.substring(0, 8)}_${Date.now()}`;

        const response = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ amount, currency, receipt }),
        });

        if (!response.ok) {
            const err = await response.json();
            console.error('[create-order] Razorpay error:', err);
            return NextResponse.json({ error: 'Failed to create order' }, { status: 502 });
        }

        const order = await response.json();

        // The order row must exist before the customer can pay, because both
        // /api/payment/verify and the webhook refuse to settle an order they
        // cannot find — it is the only record of who owes what.
        await prisma.payment.create({
            data: {
                userId: entitlement.userId,
                razorpayOrderId: order.id,
                amount,
                status: 'PENDING',
            },
        });

        return NextResponse.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key: keyId, // safe to expose — this is the publishable key
        });
    } catch (error) {
        console.error('[create-order] Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * The most recent still-unpaid order for this user, or null.
 *
 * Confirms with Razorpay that the order really is untouched before handing it
 * back. A row can sit at PENDING while the order was in fact paid (that is
 * exactly the lost-callback case the webhook now covers), and re-opening such an
 * order in checkout would show the customer a payment sheet for money they had
 * already sent.
 */
async function findReusableOrder(userId: string, amount: number): Promise<string | null> {
    const candidate = await prisma.payment.findFirst({
        where: {
            userId,
            status: 'PENDING',
            amount,
            createdAt: { gte: new Date(Date.now() - ORDER_REUSE_WINDOW_MS) },
        },
        orderBy: { createdAt: 'desc' },
        select: { razorpayOrderId: true },
    });
    if (!candidate) return null;

    const order = await fetchRazorpayOrder(candidate.razorpayOrderId);
    // null means we could not ask; create a fresh order rather than gamble.
    if (!order) return null;
    if (order.status !== 'created' || order.attempts > 0) return null;

    return candidate.razorpayOrderId;
}
