import { prisma } from './lib/prisma';
import bcrypt from 'bcryptjs';

async function test() {
    const email = 'test@example.com';
    const initialPassword = 'OldPassword123!';
    const newPassword = 'NewPassword123!';

    console.log('--- Testing Forgot Password Flow ---');

    try {
        // 1. Setup: Ensure user exists
        const passwordHash = await bcrypt.hash(initialPassword, 12);
        const user = await prisma.user.upsert({
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

        // 2. Simulate requesting OTP (backend would do this)
        const otp = '123456';
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        await prisma.otp.create({
            data: { email, otp, expiresAt },
        });
        console.log('Step 2: OTP created');

        // 3. Call reset-password API (simulated here for logic check)
        const res = await fetch('http://localhost:3000/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp, newPassword }),
        });

        const data = await res.json();
        console.log('Step 3: API Response:', data);

        if (res.ok) {
            // 4. Verify password update
            const updatedUser = await prisma.user.findUnique({ where: { email } });
            const isValid = await bcrypt.compare(newPassword, updatedUser!.passwordHash!);
            console.log('Step 4: New password valid:', isValid);

            // 5. Verify OTP deletion
            const otpCheck = await prisma.otp.findFirst({ where: { email, otp } });
            console.log('Step 5: OTP deleted:', otpCheck === null);

            if (isValid && otpCheck === null) {
                console.log('✅ TEST PASSED');
            } else {
                console.log('❌ TEST FAILED');
            }
        } else {
            console.log('❌ API Call failed');
        }

    } catch (error) {
        console.error('Test error:', error);
    } finally {
        // Cleanup
        await prisma.otp.deleteMany({ where: { email } });
        // Keep the user or delete? Let's leave it for now or delete if it's purely for test.
        // await prisma.user.delete({ where: { email } });
    }
}

test();
