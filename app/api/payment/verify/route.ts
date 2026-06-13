import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/payment/verify
 * Verifies the Razorpay payment signature, upgrades the user to PRO (lifetime),
 * and records the payment.
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

    // Verify HMAC-SHA256 signature using a timing-safe comparison
    const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

    const sigBuf = Buffer.from(razorpay_signature);
    const expBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    // Ensure the order was created by THIS user (prevents claiming another user's order)
    const existingOrder = await prisma.payment.findUnique({
        where: { razorpayOrderId: razorpay_order_id },
        select: { userId: true },
    });
    if (existingOrder && existingOrder.userId !== session.userId) {
        return NextResponse.json({ error: 'Order does not belong to this user' }, { status: 403 });
    }

    try {
        // Atomic transaction to update user and payment record
        await prisma.$transaction(async (tx) => {
            // 1. Update User to PRO
            await tx.user.update({
                where: { id: session.userId },
                data: {
                    plan: 'PRO'
                },
            });

            // 2. Update or Create Payment record
            await tx.payment.upsert({
                where: { razorpayOrderId: razorpay_order_id },
                update: {
                    razorpayPaymentId: razorpay_payment_id,
                    status: 'SUCCESS',
                },
                create: {
                    userId: session.userId,
                    razorpayOrderId: razorpay_order_id,
                    razorpayPaymentId: razorpay_payment_id,
                    amount: 900,
                    status: 'SUCCESS',
                },
            });
        });

        return NextResponse.json({
            success: true,
        });
    } catch (error) {
        console.error('[verify] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
