import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSession } from '@/lib/auth';

/**
 * POST /api/payment/create-order
 * Creates a Razorpay order for the PRO plan.
 * Amount is hardcoded to ₹49 (4900 paise).
 */
export async function POST() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 500 });
    }

    const amount = 4900; // ₹49 in paise
    const currency = 'INR';
    // Receipt must be <= 40 chars
    const receipt = `rcpt_${session.userId.substring(0, 8)}_${Date.now()}`;

    try {
        // Use Razorpay REST API directly — no SDK needed
        const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

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

        return NextResponse.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key: keyId, // safe to expose — this is the public key
        });
    } catch (error) {
        console.error('[create-order] Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
