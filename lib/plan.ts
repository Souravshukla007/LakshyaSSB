import { prisma } from '@/lib/prisma';

/**
 * Returns true only if the user has an active PRO subscription.
 * This is the single source of truth for premium access checks.
 */
export function isPro(plan: string): boolean {
    if (plan !== 'PRO') return false;
    return true;
}



/**
 * Upgrade a user to PRO (lifetime).
 * Called after successful Razorpay payment verification.
 */
export async function activatePro(userId: string): Promise<void> {
    await prisma.user.update({
        where: { id: userId },
        data: { plan: 'PRO' },
    });
}

