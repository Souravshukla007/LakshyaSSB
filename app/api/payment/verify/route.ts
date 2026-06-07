import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { activatePro } from '@/lib/plan-actions';

/**
 * POST /api/payment/verify
 * Verifies Razorpay payment signature, upgrades user to PRO for 30 days,
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

    // Verify HMAC-SHA256 signature
    const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

    if (expectedSignature !== razorpay_signature) {
        return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    try {
        // Atomic transaction to update user and payment record
        await prisma.$transaction(async (tx) => {
            // 1. Update User to PRO
            await tx.user.update({
                where: { id: session.userId },
                data: { 
                    plan: 'PRO',
                    is_pro: true
                },
            });

            // 2. Update or Create Payment record
            // Since we now create it in /create-order, we should update it.
            // But we use upsert to be safe and handle cases where create-order DB call might have failed.
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
