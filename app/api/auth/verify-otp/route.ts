import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signSession } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, otp } = body;

        if (!email || !otp) {
            return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // 1. Find OTP in database
        // Get the most recent OTP for this email
        const otpRecord = await prisma.otp.findFirst({
            where: {
                email: normalizedEmail,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        if (!otpRecord) {
            return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
        }

        // 2. Check if OTP matches and is not expired
        if (otpRecord.otp !== otp) {
            return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
        }

        if (otpRecord.expiresAt < new Date()) {
            return NextResponse.json({ error: 'OTP has expired' }, { status: 400 });
        }

        // 3. User exists check
        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 4. Delete the OTP (use it once)
        await prisma.otp.delete({
            where: { id: otpRecord.id },
        });

        // 5. Sign Session
        await signSession({
            userId: user.id,
            email: user.email,
            plan: user.plan as 'FREE' | 'PRO',
            planExpiry: user.planExpiry ? user.planExpiry.toISOString() : null,
        });

        return NextResponse.json({
            message: 'OTP verified successfully',
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                plan: user.plan,
                planExpiry: user.planExpiry,
            },
        });

    } catch (error) {
        console.error('[verify-otp]', error);
        return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
    }
}
