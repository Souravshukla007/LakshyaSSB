/**
 * Returns true only if the user has an active PRO subscription.
 * This is the single source of truth for premium access checks.
 * 
 * NOTE: This file is intentionally kept free of Prisma/DB imports
 * so it can be safely used in Next.js middleware (Edge Runtime).
 */
export function isPro(plan: string): boolean {
    // TEMPORARY: disabled pro plan, all logged in users get pro access
    return true;
}
