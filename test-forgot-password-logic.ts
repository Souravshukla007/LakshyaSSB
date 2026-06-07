import { prisma } from './lib/prisma';
import bcrypt from 'bcryptjs';

async function test() {
    const email = 'test@example.com';
    const initialPassword = 'OldPassword123!';
    const newPassword = 'NewPassword123!';
    const otp = '123456';

    console.log('--- Testing Forgot Password Logic ---');

    try {
        // 1. Setup: Ensure user exists
        const passwordHash = await bcrypt.hash(initialPassword, 12);
        await prisma.user.upsert({
            where: { email },
            update: { passwordHash },
            create: {
                email,
                fullName: 'Test User',
                passwordHash,
                plan: 'FREE',
            },
        });
        console.log('Step 1: User ready');

        // 2. Setup: Ensure OTP exists
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        await prisma.otp.create({
            data: { email, otp, expiresAt },
        });
        console.log('Step 2: OTP created');

        // 3. Simulate logic of app/api/auth/reset-password/route.ts
        console.log('Step 3: Simulating API logic...');
        
        // Find OTP
        const otpRecord = await prisma.otp.findFirst({
            where: { email },
            orderBy: { createdAt: 'desc' },
        });

        if (!otpRecord || otpRecord.otp !== otp || otpRecord.expiresAt < new Date()) {
            throw new Error('OTP Validation failed');
        }
        console.log('  - OTP validated');

        // Find User
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) throw new Error('User not found');
        console.log('  - User found');

        // Update Password
        const newHash = await bcrypt.hash(newPassword, 12);
        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: newHash },
        });
        console.log('  - Password updated');

        // Delete OTP
        await prisma.otp.delete({ where: { id: otpRecord.id } });
        console.log('  - OTP deleted');

        // 4. Verify Final State
        const updatedUser = await prisma.user.findUnique({ where: { email } });
        const isValid = await bcrypt.compare(newPassword, updatedUser!.passwordHash!);
        console.log('Step 4: New password valid:', isValid);

        const otpCheck = await prisma.otp.findFirst({ where: { email, otp } });
        console.log('Step 5: OTP confirmed deleted:', otpCheck === null);

        if (isValid && otpCheck === null) {
            console.log('✅ LOGIC TEST PASSED');
        } else {
            console.log('❌ LOGIC TEST FAILED');
        }

    } catch (error: any) {
        console.error('❌ Test error:', error.message);
    } finally {
        // Cleanup
        await prisma.otp.deleteMany({ where: { email } });
        await prisma.user.delete({ where: { email } }).catch(() => {});
        console.log('Cleanup complete');
    }
}

test();
