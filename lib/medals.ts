/**
 * lib/medals.ts
 * Medal award logic for LakshyaSSB.
 *
 * Events:
 *  - "login"          → +1 medal (once per calendar day, IST)
 *  - "piq"            → floor(score / 10) medals
 *  - "daily_question" → +1 medal
 *  - "practice"       → +2 medals
 *
 * Also handles streak bookkeeping.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * SECURITY CONTRACT — read before adding a caller.
 *
 * Medals are a CURRENCY: 49 of them buy a permanent PRO plan via
 * /api/redeem-pro. `awardMedals` must therefore only ever be invoked from server
 * code that has just *observed* the qualifying work — e.g. inside a submit route
 * after the evaluation was persisted.
 *
 * It must NEVER be reachable from a request whose body chooses `type` or `score`.
 * A `POST /api/medals/award` endpoint used to do exactly that, which let any
 * logged-in free user mint 50 medals in five requests
 * (`{"type":"piq","score":100}` ×5 → floor(100/10) each) and redeem them for
 * PRO. That route has been deleted. Do not reintroduce it; derive the score from
 * a stored row instead.
 * ────────────────────────────────────────────────────────────────────────────
 */

import { prisma } from '@/lib/prisma';

// ─── helpers ─────────────────────────────────────────────────────────────────

// Day boundaries live in lib/ist.ts so every feature agrees on when "today" ends.
import { toISTDateString, startOfISTDay } from '@/lib/ist';

// ─── types ───────────────────────────────────────────────────────────────────

export type AwardType = 'login' | 'piq' | 'daily_question' | 'practice';

export interface AwardResult {
    awarded: number;
    medals_total: number;
    medals_weekly: number;
    current_streak: number;
    longest_streak: number;
    /** true when "login" was called but the day-medal was already issued today */
    alreadyAwarded?: boolean;
}

// ─── core function ───────────────────────────────────────────────────────────

export async function awardMedals(
    userId: string,
    type: AwardType,
    score?: number,
): Promise<AwardResult> {
    // Fetch current state
    const user = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: {
            medals_total: true,
            medals_weekly: true,
            current_streak: true,
            longest_streak: true,
            last_login: true,
        },
    });

    const now = new Date();
    const todayIST = toISTDateString(now);

    let awarded = 0;
    let alreadyAwarded = false;
    let newStreak = user.current_streak;
    let newLongest = user.longest_streak;
    let newLastLogin: Date | null = user.last_login;

    // ── Calculate medals earned ──────────────────────────────────────────────
    if (type === 'login') {
        const lastLoginIST = user.last_login ? toISTDateString(user.last_login) : null;

        if (lastLoginIST === todayIST) {
            // Already logged in today — idempotent, no medal
            alreadyAwarded = true;
        } else {
            awarded = 1;
            newLastLogin = startOfISTDay(now);

            // Streak logic
            if (lastLoginIST) {
                const yesterday = toISTDateString(new Date(now.getTime() - 86_400_000));
                if (lastLoginIST === yesterday) {
                    newStreak = user.current_streak + 1;
                } else {
                    newStreak = 1; // streak broken
                }
            } else {
                newStreak = 1; // first ever login
            }

            newLongest = Math.max(newStreak, user.longest_streak);
        }
    } else if (type === 'piq') {
        if (typeof score !== 'number' || score < 0) {
            throw new Error('score is required and must be a non-negative number for PIQ awards');
        }
        awarded = Math.floor(score / 10);
    } else if (type === 'daily_question') {
        awarded = 1;
    } else if (type === 'practice') {
        awarded = 2; // Fixed 2 medals for any psychological test completion
    }

    // ── Persist atomically ───────────────────────────────────────────────────
    const updated = await prisma.user.update({
        where: { id: userId },
        data: {
            medals_total: { increment: awarded },
            medals_weekly: { increment: awarded },
            current_streak: newStreak,
            longest_streak: newLongest,
            ...(newLastLogin !== user.last_login ? { last_login: newLastLogin } : {}),
        },
        select: {
            medals_total: true,
            medals_weekly: true,
            current_streak: true,
            longest_streak: true,
        },
    });

    // Create activity log for the award
    if (awarded > 0) {
        await prisma.activityLog.create({
            data: {
                userId,
                action: 'MEDAL_AWARD',
                details: `Earned ${awarded} medals via ${type}.`,
            }
        });

        // Create persistent notification for the user
        await prisma.userNotification.create({
            data: {
                userId,
                title: 'Medals Earned! 🎖️',
                message: `Congratulations! You've earned ${awarded} medals for your ${type === 'practice' ? 'practice session' : type.replace('_', ' ')}.`,
                type: 'medal',
                link: '/dashboard',
            }
        });
    }

    return {
        awarded,
        medals_total: updated.medals_total,
        medals_weekly: updated.medals_weekly,
        current_streak: updated.current_streak,
        longest_streak: updated.longest_streak,
        alreadyAwarded,
    };
}
