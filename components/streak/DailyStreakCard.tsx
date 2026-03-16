'use client';

import { useEffect, useMemo, useState } from 'react';

type WeeklyDay = {
  day: string;
  key: string;
  completed: boolean;
};

type StreakStatus = {
  authenticated: boolean;
  streakCount: number;
  longestStreak: number;
  totalPracticeSessions: number;
  motivationMessage: string;
  nextRewardInDays: number;
  nextMilestone: { day: number; remainingDays: number; rewardLabel: string };
  progressPercent: number;
  milestones: number[];
  weekly: WeeklyDay[];
  completedToday: boolean;
};

const MILESTONE_LABELS: Record<number, string> = {
  7: 'Bronze Badge',
  14: 'Silver Badge',
  30: 'Medal of Honour',
  60: 'Elite Aspirant Badge',
};

export default function DailyStreakCard() {
  const [status, setStatus] = useState<StreakStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [celebration, setCelebration] = useState<{ title: string; reward: string } | null>(null);
  const [animateGlow, setAnimateGlow] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/streak/status', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) setStatus(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const completeMission = async (activityType: 'NEWS' | 'FITNESS') => {
    if (isCompleting) return;
    setIsCompleting(true);
    try {
      const res = await fetch('/api/streak/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityType }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data?.celebration) setCelebration(data.celebration);
        setAnimateGlow(true);
        setTimeout(() => setAnimateGlow(false), 1200);
        await fetchStatus();
      }
    } finally {
      setIsCompleting(false);
    }
  };

  const todayMissionText = useMemo(() => {
    if (!status) return 'Your LakshyaSSB daily mission is ready.';
    return status.completedToday
      ? 'Mission complete for today. Keep the momentum!'
      : 'Your LakshyaSSB daily mission is ready.';
  }, [status]);

  if (loading) {
    return <div className="w-full h-72 rounded-3xl bg-white/20 animate-pulse" />;
  }

  if (!status?.authenticated) {
    return null;
  }

  return (
    <div id="daily-practice" className={`bg-white rounded-3xl p-6 text-brand-dark shadow-2xl border border-gray-100 transition-all duration-500 ${animateGlow ? 'ring-2 ring-brand-orange/40 shadow-[0_0_30px_rgba(255,106,61,0.25)]' : ''}`}>
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Daily Streak</p>
          <h3 className="text-3xl font-hero font-bold text-brand-dark flex items-center gap-2">
            <span className="inline-block flame-pulse">🔥</span> {status.streakCount} Day Streak
          </h3>
          <p className="text-sm text-gray-500 mt-1">Consistency builds Officer Like Qualities.</p>
          <p className="text-xs text-brand-orange font-bold mt-2">
            Next reward in {status.nextRewardInDays} day{status.nextRewardInDays === 1 ? '' : 's'}.
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Best</p>
          <p className="text-xl font-bold text-brand-orange">{status.longestStreak}d</p>
        </div>
      </div>

      <div className="mb-5">
        <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 mb-2">
          <span>Milestone Progress</span>
          <span>{status.progressPercent}%</span>
        </div>
        <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full bg-brand-orange transition-all duration-700" style={{ width: `${status.progressPercent}%` }} />
        </div>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {status.milestones.map((m) => (
            <div key={m} className={`text-[10px] font-bold px-2 py-1.5 rounded-lg border ${status.streakCount >= m ? 'bg-brand-orange/10 text-brand-orange border-brand-orange/30' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
              {m}d • {MILESTONE_LABELS[m]}
            </div>
          ))}
        </div>
      </div>

      <div className="mb-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Weekly Checkpoint</p>
        <div className="grid grid-cols-7 gap-2">
          {status.weekly.map((d) => (
            <div key={d.key} className="bg-brand-bg rounded-xl p-2 text-center border border-gray-100">
              <p className="text-[10px] font-bold text-gray-500">{d.day}</p>
              <p className={`mt-1 text-sm font-bold ${d.completed ? 'text-brand-orange' : 'text-gray-300'}`}>
                {d.completed ? '✔' : '○'}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-brand-orange/20 bg-brand-orange/5 p-4 mb-4">
        <p className="text-xs font-bold text-brand-orange mb-1">{todayMissionText}</p>
        <p className="text-xs text-gray-600">{status.motivationMessage}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => completeMission('NEWS')}
          disabled={isCompleting}
          className="py-3 rounded-xl bg-brand-dark text-white font-bold text-xs hover:bg-black transition-colors disabled:opacity-60"
        >
          Complete News Analysis
        </button>
        <button
          onClick={() => completeMission('FITNESS')}
          disabled={isCompleting}
          className="py-3 rounded-xl border border-gray-200 text-brand-dark bg-white font-bold text-xs hover:bg-gray-50 transition-colors disabled:opacity-60"
        >
          Complete Fitness Tracker
        </button>
      </div>

      {celebration && (
        <div className="mt-4 rounded-2xl bg-green-50 border border-green-200 p-4 relative overflow-hidden">
          <div className="absolute inset-0 confetti-spark pointer-events-none" />
          <p className="text-sm font-bold text-green-800">{celebration.title}</p>
          <p className="text-xs text-green-700 mt-1">Reward: {celebration.reward}</p>
        </div>
      )}
    </div>
  );
}
