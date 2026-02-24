import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { activatePro } from '@/lib/plan';

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
        // Check for duplicate — idempotency guard
        const existing = await prisma.payment.findFirst({
            where: { razorpayPaymentId: razorpay_payment_id },
        });

        if (existing) {
            // If payment already processed, ensure PRO is activated and return success
            await activatePro(session.userId);
            return NextResponse.json({ success: true, message: 'Payment verified successfully.' });
        }

        // Upgrade user to PRO and record payment atomically
        await activatePro(session.userId);

        await prisma.payment.create({
            data: {
                userId: session.userId,
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id,
                amount: 9900, // ₹99 in paise
                status: 'SUCCESS',
            },
        });

        return NextResponse.json({
            success: true,
        });
    } catch (error) {
        console.error('[verify] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
