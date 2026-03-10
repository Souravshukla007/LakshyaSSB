import { prisma } from '@/lib/prisma';

/**
 * Upgrade a user to PRO (lifetime).
 * Called after successful Razorpay payment verification.
 * 
 * Separated from lib/plan.ts to keep Prisma out of Edge Runtime.
 */
export async function activatePro(userId: string): Promise<void> {
    await prisma.user.update({
        where: { id: userId },
        data: { plan: 'PRO' },
    });
}
