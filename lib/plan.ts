import { prisma } from '@/lib/prisma';

/**
 * Returns true only if the user has an active PRO subscription.
 * This is the single source of truth for premium access checks.
 */
export function isPro(plan: string, planExpiry: Date | string | null): boolean {
    if (plan !== 'PRO') return false;
    if (!planExpiry) return false;
    return new Date(planExpiry) > new Date();
}

/**
 * Auto-downgrade: if a PRO user's subscription has expired, flip them to FREE.
 * Call this in middleware or server components for PRO-protected routes.
 */
export async function checkAndDowngrade(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { plan: true, planExpiry: true },
    });

    if (!user) return;

    if (user.plan === 'PRO' && user.planExpiry && user.planExpiry < new Date()) {
        await prisma.user.update({
            where: { id: userId },
            data: { plan: 'FREE', planExpiry: null },
        });
    }
}

/**
 * Upgrade a user to PRO for 30 days from now.
 * Called after successful Razorpay payment verification.
 */
export async function activatePro(userId: string): Promise<Date> {
    const planExpiry = new Date();
    planExpiry.setDate(planExpiry.getDate() + 30);

    await prisma.user.update({
        where: { id: userId },
        data: { plan: 'PRO', planExpiry },
    });

    return planExpiry;
}

/**
 * Calculate days remaining on PRO plan. Returns 0 if expired or FREE.
 */
export function daysRemaining(planExpiry: Date | string | null): number {
    if (!planExpiry) return 0;
    const diff = new Date(planExpiry).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
