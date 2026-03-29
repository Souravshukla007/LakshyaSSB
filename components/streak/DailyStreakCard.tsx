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
    
    // Auth guard for guests seeing the preview
    if (displayStatus && !displayStatus.authenticated) {
      window.location.href = '/auth';
      return;
    }

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

  const displayStatus = status?.authenticated ? status : {
    authenticated: false,
    streakCount: 12,
    longestStreak: 21,
    totalPracticeSessions: 45,
    motivationMessage: "Join Academy to track your daily streak and earn SSB medals.",
    nextRewardInDays: 2,
    nextMilestone: { day: 14, remainingDays: 2, rewardLabel: 'Silver Badge' },
    progressPercent: 85,
    milestones: [7, 14, 30, 60],
    weekly: [
      { day: 'M', key: '1', completed: true },
      { day: 'T', key: '2', completed: true },
      { day: 'W', key: '3', completed: true },
      { day: 'T', key: '4', completed: true },
      { day: 'F', key: '5', completed: false },
      { day: 'S', key: '6', completed: false },
      { day: 'S', key: '7', completed: false },
    ],
    completedToday: false,
  };

  const todayMissionText = useMemo(() => {
    if (!displayStatus.authenticated) return 'Preview Mode — Login to Track';
    return displayStatus.completedToday
      ? 'Mission complete for today. Keep the momentum!'
      : 'Your LakshyaSSB daily mission is ready.';
  }, [displayStatus]);

  if (loading) {
    return <div className="w-full h-80 rounded-[2rem] bg-white/10 animate-pulse border border-white/5" />;
  }

  return (
    <div id="daily-practice" className={`bg-white rounded-3xl p-6 text-brand-dark shadow-2xl border border-gray-100 transition-all duration-500 ${animateGlow ? 'ring-2 ring-brand-orange/40 shadow-[0_0_30px_rgba(255,106,61,0.25)]' : ''}`}>
      <div className="flex items-start justify-between gap-4 mb-5 relative z-10">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Daily Streak</p>
          <h3 className="text-3xl font-hero font-bold flex items-center gap-2">
            <span className="inline-block flame-pulse">🔥</span> {displayStatus.streakCount} Day Streak
          </h3>
          <p className="text-sm text-gray-500 mt-1">Consistency builds Officer Like Qualities.</p>
          <p className="text-xs text-brand-orange font-bold mt-2">
            Next reward in {displayStatus.nextRewardInDays} day{displayStatus.nextRewardInDays === 1 ? '' : 's'}.
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Best</p>
          <p className="text-xl font-bold text-brand-orange">{displayStatus.longestStreak}d</p>
        </div>
      </div>

      <div className="mb-5 relative z-10">
        <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 mb-2">
          <span>Milestone Progress</span>
          <span>{displayStatus.progressPercent}%</span>
        </div>
        <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full bg-brand-orange transition-all duration-700" style={{ width: `${displayStatus.progressPercent}%` }} />
        </div>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {displayStatus.milestones.map((m) => (
            <div key={m} className={`text-[10px] font-bold px-2 py-1.5 rounded-lg border flex items-center justify-center text-center ${displayStatus.streakCount >= m ? 'bg-brand-orange/10 text-brand-orange border-brand-orange/30' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
              {m}d • {MILESTONE_LABELS[m]}
            </div>
          ))}
        </div>
      </div>

      <div className="mb-5 relative z-10">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Weekly Checkpoint</p>
        <div className="grid grid-cols-7 gap-2">
          {displayStatus.weekly.map((d) => (
            <div key={d.key} className="bg-brand-bg rounded-xl p-2 text-center border border-gray-100 shadow-sm">
              <p className="text-[10px] font-bold text-gray-500">{d.day}</p>
              <p className={`mt-1 text-sm font-bold ${d.completed ? 'text-brand-orange' : 'text-gray-300'}`}>
                {d.completed ? '✔' : '○'}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-brand-orange/20 bg-brand-orange/5 p-4 mb-4 relative z-10">
        <p className="text-xs font-bold text-brand-orange mb-1">{todayMissionText}</p>
        <p className="text-xs text-gray-600">{displayStatus.motivationMessage}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
        <button
          onClick={() => completeMission('NEWS')}
          disabled={isCompleting}
          className="py-3 px-2 rounded-xl bg-brand-dark text-white font-bold text-xs hover:bg-black transition-colors disabled:opacity-60"
        >
          {displayStatus.authenticated ? 'Complete News' : 'Sign in to Action'}
        </button>
        <button
          onClick={() => completeMission('FITNESS')}
          disabled={isCompleting}
          className="py-3 px-2 rounded-xl border border-gray-200 text-brand-dark bg-white font-bold text-xs hover:bg-gray-50 transition-colors disabled:opacity-60"
        >
          {displayStatus.authenticated ? 'Complete Fitness' : 'Sign in to Action'}
        </button>
      </div>

      {!displayStatus.authenticated && (
        <div className="absolute inset-0 z-0 bg-white/40 backdrop-blur-[1px] rounded-3xl" />
      )}

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
