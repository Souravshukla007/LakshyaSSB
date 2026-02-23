'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// ─── Types ───────────────────────────────────────────────────────────────────
type Tab = 'overall' | 'weekly' | 'streak';

interface LeaderboardEntry {
    rank: number;
    username: string;
    medals: number;
    weeklyMedals?: number;
    currentStreak: number;
    longestStreak?: number;
    weeklyStreak?: number;
    badge: string;
    isCurrentUser?: boolean;
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const overallData: LeaderboardEntry[] = [
    { rank: 1, username: 'CaptainArjun_IMA', medals: 234, currentStreak: 42, badge: '🎯 Elite Cadet', isCurrentUser: false },
    { rank: 2, username: 'VikrantSingh_NDA', medals: 198, currentStreak: 37, badge: '⚔️ War Veteran', isCurrentUser: false },
    { rank: 3, username: 'ShouriyaRana_OTA', medals: 176, currentStreak: 31, badge: '🛡️ Shield Bearer', isCurrentUser: false },
    { rank: 4, username: 'AkashDeep_INA', medals: 155, currentStreak: 28, badge: '🌟 Rising Star', isCurrentUser: true },
    { rank: 5, username: 'PranaySharma', medals: 143, currentStreak: 24, badge: '🔥 Streak Master', isCurrentUser: false },
    { rank: 6, username: 'DevKumar_SSB', medals: 129, currentStreak: 21, badge: '💪 Dedicated', isCurrentUser: false },
    { rank: 7, username: 'ManavJoshi', medals: 118, currentStreak: 19, badge: '📚 Scholar', isCurrentUser: false },
    { rank: 8, username: 'RahulVerma_NDA', medals: 107, currentStreak: 16, badge: '🎖️ Achiever', isCurrentUser: false },
    { rank: 9, username: 'SiddharthMalik', medals: 96, currentStreak: 14, badge: '⭐ Consistent', isCurrentUser: false },
    { rank: 10, username: 'AnkitRajput', medals: 88, currentStreak: 12, badge: '🚀 Launching', isCurrentUser: false },
    { rank: 11, username: 'RohanGupta', medals: 79, currentStreak: 10, badge: '🎯 Aspirant', isCurrentUser: false },
    { rank: 12, username: 'VijayMehta', medals: 71, currentStreak: 9, badge: '💡 Sharp Mind', isCurrentUser: false },
];

const weeklyData: LeaderboardEntry[] = [
    { rank: 1, username: 'VikrantSingh_NDA', medals: 28, weeklyMedals: 28, currentStreak: 7, weeklyStreak: 7, badge: '⚔️ War Veteran', isCurrentUser: false },
    { rank: 2, username: 'CaptainArjun_IMA', medals: 25, weeklyMedals: 25, currentStreak: 7, weeklyStreak: 7, badge: '🎯 Elite Cadet', isCurrentUser: false },
    { rank: 3, username: 'AkashDeep_INA', medals: 22, weeklyMedals: 22, currentStreak: 6, weeklyStreak: 6, badge: '🌟 Rising Star', isCurrentUser: true },
    { rank: 4, username: 'PranaySharma', medals: 18, weeklyMedals: 18, currentStreak: 5, weeklyStreak: 5, badge: '🔥 Streak Master', isCurrentUser: false },
    { rank: 5, username: 'ShouriyaRana_OTA', medals: 16, weeklyMedals: 16, currentStreak: 4, weeklyStreak: 4, badge: '🛡️ Shield Bearer', isCurrentUser: false },
    { rank: 6, username: 'DevKumar_SSB', medals: 14, weeklyMedals: 14, currentStreak: 4, weeklyStreak: 4, badge: '💪 Dedicated', isCurrentUser: false },
    { rank: 7, username: 'ManavJoshi', medals: 12, weeklyMedals: 12, currentStreak: 3, weeklyStreak: 3, badge: '📚 Scholar', isCurrentUser: false },
    { rank: 8, username: 'SiddharthMalik', medals: 10, weeklyMedals: 10, currentStreak: 3, weeklyStreak: 3, badge: '⭐ Consistent', isCurrentUser: false },
    { rank: 9, username: 'RahulVerma_NDA', medals: 9, weeklyMedals: 9, currentStreak: 2, weeklyStreak: 2, badge: '🎖️ Achiever', isCurrentUser: false },
    { rank: 10, username: 'AnkitRajput', medals: 7, weeklyMedals: 7, currentStreak: 2, weeklyStreak: 2, badge: '🚀 Launching', isCurrentUser: false },
    { rank: 11, username: 'RohanGupta', medals: 5, weeklyMedals: 5, currentStreak: 1, weeklyStreak: 1, badge: '🎯 Aspirant', isCurrentUser: false },
    { rank: 12, username: 'VijayMehta', medals: 4, weeklyMedals: 4, currentStreak: 1, weeklyStreak: 1, badge: '💡 Sharp Mind', isCurrentUser: false },
];

const streakData: LeaderboardEntry[] = [
    { rank: 1, username: 'CaptainArjun_IMA', medals: 234, currentStreak: 42, longestStreak: 58, badge: '🎯 Elite Cadet', isCurrentUser: false },
    { rank: 2, username: 'VikrantSingh_NDA', medals: 198, currentStreak: 37, longestStreak: 51, badge: '⚔️ War Veteran', isCurrentUser: false },
    { rank: 3, username: 'ShouriyaRana_OTA', medals: 176, currentStreak: 31, longestStreak: 44, badge: '🛡️ Shield Bearer', isCurrentUser: false },
    { rank: 4, username: 'AkashDeep_INA', medals: 155, currentStreak: 28, longestStreak: 35, badge: '🌟 Rising Star', isCurrentUser: true },
    { rank: 5, username: 'PranaySharma', medals: 143, currentStreak: 24, longestStreak: 30, badge: '🔥 Streak Master', isCurrentUser: false },
    { rank: 6, username: 'DevKumar_SSB', medals: 129, currentStreak: 21, longestStreak: 28, badge: '💪 Dedicated', isCurrentUser: false },
    { rank: 7, username: 'ManavJoshi', medals: 118, currentStreak: 19, longestStreak: 25, badge: '📚 Scholar', isCurrentUser: false },
    { rank: 8, username: 'RahulVerma_NDA', medals: 107, currentStreak: 16, longestStreak: 22, badge: '🎖️ Achiever', isCurrentUser: false },
    { rank: 9, username: 'SiddharthMalik', medals: 96, currentStreak: 14, longestStreak: 19, badge: '⭐ Consistent', isCurrentUser: false },
    { rank: 10, username: 'AnkitRajput', medals: 88, currentStreak: 12, longestStreak: 16, badge: '🚀 Launching', isCurrentUser: false },
    { rank: 11, username: 'RohanGupta', medals: 79, currentStreak: 10, longestStreak: 14, badge: '🎯 Aspirant', isCurrentUser: false },
    { rank: 12, username: 'VijayMehta', medals: 71, currentStreak: 9, longestStreak: 12, badge: '💡 Sharp Mind', isCurrentUser: false },
];

// ─── Sub-components ───────────────────────────────────────────────────────────
const podiumConfig = [
    { rankIndex: 1, medal: '🥇', title: 'Param Vir Chakra', order: 'order-2 md:order-2', height: 'pt-0', ring: 'ring-yellow-400 bg-gradient-to-b from-yellow-50 to-white', textColor: 'text-yellow-600', scale: 'scale-105 md:scale-110' },
    { rankIndex: 2, medal: '🥈', title: 'Maha Vir Chakra', order: 'order-1 md:order-1', height: 'pt-6', ring: 'ring-gray-300 bg-gradient-to-b from-gray-50 to-white', textColor: 'text-gray-500', scale: 'scale-100' },
    { rankIndex: 3, medal: '🥉', title: 'Vir Chakra', order: 'order-3 md:order-3', height: 'pt-10', ring: 'ring-orange-300 bg-gradient-to-b from-orange-50 to-white', textColor: 'text-orange-600', scale: 'scale-100' },
];

function PodiumCard({ entry, config }: { entry: LeaderboardEntry; config: typeof podiumConfig[0] }) {
    return (
        <div className={`flex flex-col items-center ${config.order} ${config.height} ${config.scale} transition-transform duration-300`}>
            {/* Medal badge */}
            <div className="text-5xl mb-2 drop-shadow-sm">{config.medal}</div>

            {/* Card */}
            <div className={`ring-2 ${config.ring} rounded-2xl shadow-lg p-5 text-center w-full max-w-[200px] backdrop-blur-sm`}>
                {/* Title */}
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${config.textColor}`}>
                    {config.title}
                </p>

                {/* Avatar initial */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-3 ${config.rankIndex === 1 ? 'bg-yellow-500' : config.rankIndex === 2 ? 'bg-gray-400' : 'bg-orange-400'}`}>
                    {entry.username.charAt(0).toUpperCase()}
                </div>

                <p className="text-sm font-bold text-gray-900 truncate">{entry.username}</p>
                <p className="text-xs text-gray-500 mt-0.5">{entry.badge}</p>

                <div className="mt-3 flex justify-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-orange-500 font-semibold">
                        <i className="fa-solid fa-medal text-[10px]" /> {entry.medals}
                    </span>
                    <span className="flex items-center gap-1 text-indigo-500 font-semibold">
                        <i className="fa-solid fa-fire text-[10px]" /> {entry.currentStreak}d
                    </span>
                </div>
            </div>
        </div>
    );
}

// Reusable rank pill
function RankPill({ rank }: { rank: number }) {
    if (rank === 1) return <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-700 font-bold text-sm">🥇</span>;
    if (rank === 2) return <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 font-bold text-sm">🥈</span>;
    if (rank === 3) return <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-bold text-sm">🥉</span>;
    return <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-500 font-bold text-xs">#{rank}</span>;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LeaderboardPage() {
    const [tab, setTab] = useState<Tab>('overall');
    const isPro = false; // swap with real auth when backend is wired

    const tabs: { key: Tab; label: string; icon: string }[] = [
        { key: 'overall', label: 'Overall', icon: 'fa-trophy' },
        { key: 'weekly', label: 'Weekly', icon: 'fa-calendar-week' },
        { key: 'streak', label: 'Streak', icon: 'fa-fire' },
    ];

    const activeData =
        tab === 'overall' ? overallData :
            tab === 'weekly' ? weeklyData :
                streakData;

    const visibleRows = isPro ? activeData : activeData.slice(0, 10);
    const hiddenCount = activeData.length - 10;

    return (
        <>
            <Navbar />

            {/* ── Grid background canvas ── */}
            <main
                className="min-h-screen pt-24 pb-20 px-4 md:px-8"
                style={{
                    background: '#FBF8F3',
                    backgroundImage: `
            linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)
          `,
                    backgroundSize: '40px 40px',
                }}
            >
                <div className="max-w-5xl mx-auto space-y-12">

                    {/* ════════════════════════════════════
              HERO
          ════════════════════════════════════ */}
                    <section className="text-center space-y-3 pt-6">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-100 text-orange-600 rounded-full text-xs font-bold uppercase tracking-widest mb-2">
                            <i className="fa-solid fa-trophy text-[10px]" />
                            Hall of Honour
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
                            LakshyaSSB <span className="text-orange-500">Leaderboard</span>
                        </h1>
                        <p className="text-gray-500 text-base md:text-lg max-w-xl mx-auto">
                            See where you stand among serious SSB aspirants. Earn medals. Climb ranks. Unlock Pro.
                        </p>
                    </section>

                    {/* ════════════════════════════════════
              SEGMENT TABS
          ════════════════════════════════════ */}
                    <div className="flex justify-center">
                        <div className="inline-flex items-center gap-1 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-1.5 shadow-sm">
                            {tabs.map(t => (
                                <button
                                    key={t.key}
                                    onClick={() => setTab(t.key)}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${tab === t.key
                                            ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                                            : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                                        }`}
                                >
                                    <i className={`fa-solid ${t.icon} text-xs`} />
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ════════════════════════════════════
              TOP 3 PODIUM
          ════════════════════════════════════ */}
                    <section className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-md p-8 md:p-10">
                        <h2 className="text-center text-xs font-bold uppercase tracking-widest text-gray-400 mb-8">
                            {tab === 'overall' ? '🏆 Top Commanders' : tab === 'weekly' ? '📅 This Week\'s Champions' : '🔥 Streak Legends'}
                        </h2>
                        <div className="flex items-end justify-center gap-4 md:gap-8">
                            {[podiumConfig[1], podiumConfig[0], podiumConfig[2]].map(cfg => {
                                const entry = activeData.find(e => e.rank === cfg.rankIndex);
                                return entry ? <PodiumCard key={cfg.rankIndex} entry={entry} config={cfg} /> : null;
                            })}
                        </div>
                    </section>

                    {/* ════════════════════════════════════
              FULL TABLE
          ════════════════════════════════════ */}
                    <section className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-md overflow-hidden">
                        {/* Table header */}
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">
                                    {tab === 'overall' ? 'Full Rankings' : tab === 'weekly' ? 'Weekly Top Performers' : 'Top Streak Holders'}
                                </h2>
                                {tab === 'weekly' && (
                                    <p className="text-xs text-gray-400 mt-0.5">Resets every Sunday at 11:59 PM</p>
                                )}
                            </div>
                            <span className="text-xs font-semibold text-orange-500 bg-orange-50 px-3 py-1 rounded-full">
                                {isPro ? 'PRO · Full Access' : 'FREE · Top 10 shown'}
                            </span>
                        </div>

                        {/* Scrollable table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
                                        <th className="px-6 py-3 text-left">Rank</th>
                                        <th className="px-4 py-3 text-left">Username</th>
                                        {tab === 'overall' && <><th className="px-4 py-3 text-center">Medals of Honour</th><th className="px-4 py-3 text-center">Streak</th><th className="px-4 py-3 text-left">Badge</th></>}
                                        {tab === 'weekly' && <><th className="px-4 py-3 text-center">Weekly Medals</th><th className="px-4 py-3 text-center">Weekly Streak</th><th className="px-4 py-3 text-left">Badge</th></>}
                                        {tab === 'streak' && <><th className="px-4 py-3 text-center">Current Streak</th><th className="px-4 py-3 text-center">Longest Streak</th></>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {visibleRows.map(row => (
                                        <tr
                                            key={row.rank}
                                            className={`transition-colors ${row.isCurrentUser
                                                    ? 'bg-orange-50 border-l-4 border-l-orange-500'
                                                    : 'hover:bg-gray-50/80'
                                                }`}
                                        >
                                            <td className="px-6 py-4"><RankPill rank={row.rank} /></td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                                                        {row.username.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{row.username}</p>
                                                        {row.isCurrentUser && (
                                                            <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">You</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            {tab === 'overall' && (
                                                <>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="inline-flex items-center gap-1.5 font-bold text-orange-600">
                                                            <i className="fa-solid fa-medal text-orange-400 text-xs" />
                                                            {row.medals}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="inline-flex items-center gap-1.5 text-indigo-600 font-semibold">
                                                            <i className="fa-solid fa-fire text-indigo-400 text-xs" />
                                                            {row.currentStreak}d
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-gray-600 text-xs">{row.badge}</td>
                                                </>
                                            )}
                                            {tab === 'weekly' && (
                                                <>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="inline-flex items-center gap-1.5 font-bold text-orange-600">
                                                            <i className="fa-solid fa-medal text-orange-400 text-xs" />
                                                            {row.weeklyMedals ?? row.medals}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="inline-flex items-center gap-1.5 text-indigo-600 font-semibold">
                                                            <i className="fa-solid fa-fire text-indigo-400 text-xs" />
                                                            {row.weeklyStreak ?? row.currentStreak}d
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-gray-600 text-xs">{row.badge}</td>
                                                </>
                                            )}
                                            {tab === 'streak' && (
                                                <>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="inline-flex items-center gap-1.5 font-bold text-indigo-600">
                                                            <i className="fa-solid fa-fire text-indigo-400 text-xs" />
                                                            {row.currentStreak}d
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="text-gray-500 font-semibold">{row.longestStreak}d</span>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* ── Blur paywall (free users) ── */}
                        {!isPro && hiddenCount > 0 && (
                            <div className="relative">
                                {/* Blurred preview rows */}
                                <div className="overflow-hidden select-none pointer-events-none" style={{ filter: 'blur(6px)', opacity: 0.4 }}>
                                    {activeData.slice(10, 13).map(row => (
                                        <div key={row.rank} className="px-6 py-4 border-t border-gray-50 flex items-center gap-4">
                                            <span className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-400">#{row.rank}</span>
                                            <span className="font-semibold text-gray-700">{row.username}</span>
                                            <span className="ml-auto text-orange-500 font-bold">{row.medals} medals</span>
                                        </div>
                                    ))}
                                </div>
                                {/* Upgrade overlay */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-white via-white/80 to-transparent px-6 py-8 text-center">
                                    <i className="fa-solid fa-lock text-2xl text-orange-400 mb-3" />
                                    <p className="font-bold text-gray-900 text-base mb-1">
                                        {hiddenCount} more cadets ranked below
                                    </p>
                                    <p className="text-gray-500 text-sm mb-4">
                                        Upgrade to Pro to view full rankings and see your exact position.
                                    </p>
                                    <Link
                                        href="/pricing"
                                        className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition shadow-md"
                                    >
                                        <i className="fa-solid fa-crown text-orange-400 text-xs" />
                                        Upgrade to Pro
                                    </Link>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* ════════════════════════════════════
              MEDAL SYSTEM CARD
          ════════════════════════════════════ */}
                    <section className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-md p-8">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-500 text-xl shrink-0">
                                <i className="fa-solid fa-medal" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">How to Earn Medals of Honour</h2>
                                <p className="text-gray-500 text-sm mt-0.5">Earn medals through daily discipline and performance</p>
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-3 gap-4 mb-6">
                            {[
                                { icon: 'fa-right-to-bracket', color: 'bg-green-100 text-green-600', label: 'Daily Login', desc: '+1 Medal per day', note: 'Maintains your streak' },
                                { icon: 'fa-clipboard-list', color: 'bg-blue-100 text-blue-600', label: 'PIQ Score', desc: 'score ÷ 10 Medals', note: 'Max +10 per attempt' },
                                { icon: 'fa-circle-check', color: 'bg-purple-100 text-purple-600', label: 'Daily Question', desc: '+1 Medal', note: 'Complete daily challenge' },
                            ].map(item => (
                                <div key={item.label} className="flex items-start gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm shrink-0 ${item.color}`}>
                                        <i className={`fa-solid ${item.icon}`} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">{item.label}</p>
                                        <p className="text-orange-600 font-semibold text-sm">{item.desc}</p>
                                        <p className="text-gray-400 text-xs mt-0.5">{item.note}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-100">
                            <i className="fa-solid fa-circle-info text-orange-400" />
                            <span>Medals reset <strong className="text-gray-600">weekly</strong> for the Weekly Leaderboard only. Overall medals are permanent.</span>
                        </div>

                        {/* 99-medal progress teaser */}
                        <div className="mt-5 p-4 rounded-2xl bg-orange-50 border border-orange-100 flex items-center gap-4">
                            <div className="flex-1">
                                <p className="text-sm font-bold text-gray-900">🏅 99 Medals = Unlock Pro Access</p>
                                <p className="text-xs text-gray-500 mt-0.5">Compete harder. Rank higher. Access full insights.</p>
                                <div className="mt-2 w-full bg-orange-100 rounded-full h-2">
                                    <div className="bg-orange-500 h-2 rounded-full transition-all duration-500" style={{ width: '28%' }} />
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">28 / 99 medals earned (example)</p>
                            </div>
                            <i className="fa-solid fa-crown text-3xl text-orange-400 shrink-0" />
                        </div>
                    </section>

                    {/* ════════════════════════════════════
              MONETISATION CTA
          ════════════════════════════════════ */}
                    <section className="relative overflow-hidden rounded-3xl bg-gray-900 shadow-2xl px-8 py-12 text-center">
                        {/* Decorative orange glow circles */}
                        <div className="absolute -top-10 -left-10 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />

                        <div className="relative z-10 space-y-5">
                            <div className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-400 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
                                <i className="fa-solid fa-crown text-[10px]" />
                                Pro Access
                            </div>
                            <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
                                Unlock Pro Access<br />
                                <span className="text-orange-500">with 99 Medals</span>
                            </h2>
                            <p className="text-gray-400 text-base max-w-md mx-auto">
                                Compete harder. Rank higher. Access the full leaderboard, detailed OLQ reports, and exclusive training materials.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
                                <Link
                                    href="/pricing"
                                    className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white px-8 py-3.5 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-orange-900/30 hover:shadow-orange-900/50"
                                >
                                    <i className="fa-solid fa-crown text-xs" />
                                    Upgrade to Pro
                                </Link>
                                <Link
                                    href="/practice"
                                    className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-8 py-3.5 rounded-2xl font-semibold text-sm transition-all"
                                >
                                    <i className="fa-solid fa-dumbbell text-xs" />
                                    Start Earning Medals
                                </Link>
                            </div>

                            <p className="text-gray-500 text-xs mt-4">
                                Already at 99 medals? <Link href="/auth" className="text-orange-400 underline font-semibold">Sign in to redeem →</Link>
                            </p>
                        </div>
                    </section>

                </div>
            </main>

            <Footer />
        </>
    );
}
