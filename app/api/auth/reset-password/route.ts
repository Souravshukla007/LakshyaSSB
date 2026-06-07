import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, otp, newPassword } = body;

        if (!email || !otp || !newPassword) {
            return NextResponse.json({ error: 'Email, OTP, and new password are required' }, { status: 400 });
        }

        const normalizedEmail = email.toLowerCase().trim();

        if (typeof newPassword !== 'string' || newPassword.length < 8) {
            return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
        }

        // 1. Find OTP in database
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

        // 4. Update password
        const passwordHash = await bcrypt.hash(newPassword, 12);
        
        await prisma.user.update({
            where: { id: user.id },
            data: { 
                passwordHash,
                // If it was a google-only user, they now have a password
            },
        });

        // 5. Delete the OTP (use it once)
        await prisma.otp.delete({
            where: { id: otpRecord.id },
        });

        // 6. Log activity
        await prisma.activityLog.create({
            data: {
                userId: user.id,
                action: 'PASSWORD_RESET',
                details: 'Password reset via OTP successfully',
            },
        });

        return NextResponse.json({
            message: 'Password reset successful. You can now login with your new password.',
        });

    } catch (error) {
        console.error('[reset-password]', error);
        return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
    }
}
