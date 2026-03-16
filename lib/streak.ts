import { prisma } from '@/lib/prisma';

export type PracticeActivityType = 'WAT' | 'SRT' | 'OIR' | 'LECTURETTE' | 'NEWS' | 'FITNESS';

const MILESTONE_BONUS: Record<number, number> = {
  7: 5,
  14: 8,
  30: 15,
  60: 25,
};

function toISTDateString(d: Date = new Date()) {
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

function toDateParts(key: string) {
  const [y, m, d] = key.split('-').map(Number);
  return { y, m, d };
}

function dayDiff(a: string, b: string) {
  const pa = toDateParts(a);
  const pb = toDateParts(b);
  const da = Date.UTC(pa.y, pa.m - 1, pa.d);
  const db = Date.UTC(pb.y, pb.m - 1, pb.d);
  return Math.round((da - db) / 86_400_000);
}

function calcCurrentStreak(sortedDesc: string[]) {
  if (!sortedDesc.length) return 0;
  const today = toISTDateString();
  const first = sortedDesc[0];
  if (dayDiff(today, first) > 1) return 0;

  let streak = 1;
  for (let i = 1; i < sortedDesc.length; i++) {
    if (dayDiff(sortedDesc[i - 1], sortedDesc[i]) === 1) streak += 1;
    else break;
  }
  return streak;
}

function calcLongestStreak(sortedDesc: string[]) {
  if (!sortedDesc.length) return 0;
  let longest = 1;
  let cur = 1;
  for (let i = 1; i < sortedDesc.length; i++) {
    if (dayDiff(sortedDesc[i - 1], sortedDesc[i]) === 1) {
      cur += 1;
      longest = Math.max(longest, cur);
    } else {
      cur = 1;
    }
  }
  return longest;
}

export async function completePracticeForUser(userId: string, activityType: PracticeActivityType) {
  const todayKey = toISTDateString();
  const completionAction = `PRACTICE_COMPLETE_${todayKey}`;

  return prisma.$transaction(async (tx) => {
    await tx.activityLog.create({
      data: {
        userId,
        action: `PRACTICE_SESSION_${activityType}`,
        details: `Completed ${activityType} practice session`,
      },
    });

    const alreadyCompleted = await tx.activityLog.findFirst({
      where: { userId, action: completionAction },
      select: { id: true },
    });

    if (!alreadyCompleted) {
      await tx.activityLog.create({
        data: {
          userId,
          action: completionAction,
          details: `Daily practice checkpoint completed via ${activityType}`,
        },
      });
    }

    const logs = await tx.activityLog.findMany({
      where: { userId, action: { startsWith: 'PRACTICE_COMPLETE_' } },
      orderBy: { createdAt: 'desc' },
      select: { action: true },
    });

    const uniqueDays = Array.from(
      new Set(
        logs
          .map((l) => l.action.replace('PRACTICE_COMPLETE_', ''))
          .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
      )
    ).sort((a, b) => (a > b ? -1 : 1));

    const currentStreak = calcCurrentStreak(uniqueDays);
    const longestStreak = calcLongestStreak(uniqueDays);

    let awarded = 0;
    let milestoneBonus = 0;
    let milestoneHit: number | null = null;

    if (!alreadyCompleted) {
      awarded += 1; // 1 streak day = +1 medal
      milestoneBonus = MILESTONE_BONUS[currentStreak] ?? 0;
      if (milestoneBonus > 0) {
        awarded += milestoneBonus;
        milestoneHit = currentStreak;
      }
    }

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        current_streak: currentStreak,
        longest_streak: Math.max(longestStreak, currentStreak),
        ...(awarded > 0
          ? {
              medals_total: { increment: awarded },
              medals_weekly: { increment: awarded },
            }
          : {}),
      },
      select: {
        current_streak: true,
        longest_streak: true,
        medals_total: true,
        medals_weekly: true,
      },
    });

    return {
      alreadyCompletedToday: Boolean(alreadyCompleted),
      awarded,
      milestoneBonus,
      milestoneHit,
      ...updatedUser,
    };
  });
}
