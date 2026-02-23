/**
 * lib/medals.ts
 * Medal award logic for LakshyaSSB.
 *
 * Events:
 *  - "login"          → +1 medal (once per calendar day, IST)
 *  - "piq"            → floor(score / 10) medals
 *  - "daily_question" → +1 medal
 *
 * Also handles streak bookkeeping.
 */

import { prisma } from '@/lib/prisma';

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Returns the IST date string "YYYY-MM-DD" for a given Date (or now). */
function toISTDateString(d: Date = new Date()): string {
    return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // "YYYY-MM-DD"
}

function startOfISTDay(d: Date = new Date()): Date {
    const [y, m, day] = toISTDateString(d).split('-').map(Number);
    // midnight IST = UTC-5:30 → subtract 5h30m
    return new Date(Date.UTC(y, m - 1, day, 0, 0, 0, 0) - (5 * 60 + 30) * 60 * 1000);
}

// ─── types ───────────────────────────────────────────────────────────────────

export type AwardType = 'login' | 'piq' | 'daily_question';

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

    return {
        awarded,
        medals_total: updated.medals_total,
        medals_weekly: updated.medals_weekly,
        current_streak: updated.current_streak,
        longest_streak: updated.longest_streak,
        alreadyAwarded,
    };
}
