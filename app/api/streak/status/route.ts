import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const MILESTONES = [7, 14, 30, 60];

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

function getMotivation(streak: number) {
  if (streak >= 30) return 'Elite preparation level.';
  if (streak >= 7) return 'You are building officer habits.';
  return 'Great start. Discipline begins today.';
}

function nextMilestone(streak: number) {
  const next = MILESTONES.find((m) => m > streak) ?? 60;
  return {
    day: next,
    remainingDays: Math.max(0, next - streak),
    rewardLabel:
      next === 7 ? 'Bronze Badge' : next === 14 ? 'Silver Badge' : next === 30 ? 'Medal of Honour' : 'Elite Aspirant Badge',
  };
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    const [dailyLogs, totalSessions] = await Promise.all([
      prisma.activityLog.findMany({
        where: {
          userId: session.userId,
          action: { startsWith: 'PRACTICE_COMPLETE_' },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.activityLog.count({
        where: {
          userId: session.userId,
          action: { startsWith: 'PRACTICE_SESSION_' },
        },
      }),
    ]);

    const uniqueDays = Array.from(
      new Set(
        dailyLogs
          .map((l) => l.action.replace('PRACTICE_COMPLETE_', ''))
          .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
      )
    ).sort((a, b) => (a > b ? -1 : 1));

    const currentStreak = calcCurrentStreak(uniqueDays);
    const longestStreak = calcLongestStreak(uniqueDays);
    const next = nextMilestone(currentStreak);

    const now = new Date();
    const day = now.getDay(); // 0 Sun
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);

    const weekly = Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const key = toISTDateString(d);
      return {
        day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx],
        key,
        completed: uniqueDays.includes(key),
      };
    });

    return NextResponse.json({
      authenticated: true,
      streakCount: currentStreak,
      longestStreak,
      totalPracticeSessions: totalSessions,
      motivationMessage: getMotivation(currentStreak),
      nextRewardInDays: next.remainingDays,
      nextMilestone: next,
      progressPercent: Math.min(100, Math.round((currentStreak / next.day) * 100)),
      milestones: MILESTONES,
      weekly,
      completedToday: uniqueDays[0] === toISTDateString(),
    });
  } catch (error) {
    console.error('[streak/status]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
