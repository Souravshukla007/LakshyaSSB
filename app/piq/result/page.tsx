'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';



export default function PIQResult() {
    const [isPro, setIsPro] = useState(false);

    useEffect(() => {
        fetch('/api/auth/status')
            .then(res => res.ok ? res.json() : null)
            .then(data => { if (data?.plan === 'PRO') setIsPro(true); })
            .catch(() => null);
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('active');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.15 }
        );

        document
            .querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale')
            .forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    }, []);

    // Live PIQ scores, replacing the hardcoded literals that used to sit here and
    // render as if they were this user's assessment.
    const [olqScores, setOlqScores] = useState<Record<string, number> | null>(null);
    const [scoresState, setScoresState] = useState<'loading' | 'ready' | 'none'>('loading');

    useEffect(() => {
        let cancelled = false;

        fetch('/api/piq/latest')
            .then(async (res) => {
                if (!res.ok) return null;
                return res.json();
            })
            .then((data) => {
                if (cancelled) return;
                if (!data || data.status === 'NO_PIQ' || !data.leadership) {
                    setScoresState('none');
                    return;
                }
                setOlqScores({
                    Leadership: Number(data.leadership) || 0,
                    Initiative: Number(data.initiative) || 0,
                    Responsibility: Number(data.responsibility) || 0,
                    'Social Adaptability': Number(data.socialAdaptability) || 0,
                    Consistency: Number(data.consistency) || 0,
                });
                setScoresState('ready');
            })
            .catch(() => {
                if (!cancelled) setScoresState('none');
            });

        return () => { cancelled = true; };
    }, []);

    const olqBars = Object.entries(olqScores ?? {}).map(([label, score]) => {
        const clamped = Math.max(0, Math.min(10, score));
        return { label, score: clamped, pct: `${clamped * 10}%` };
    });

    return (
        <>
            

            <main>
                <section className="min-h-screen bg-brand-bg pt-32 pb-20 px-6">
                    <div className="max-w-6xl mx-auto">

                        {/* Page Header */}
                        <div className="text-center mb-12 reveal">
                            <h1 className="font-hero font-bold text-4xl text-brand-dark mb-2">
                                Your PIQ <span className="text-brand-orange">Readiness Report</span>
                            </h1>
                            <p className="text-gray-500 font-noname">
                                Based on AI evaluation of 15 Officer Like Qualities (OLQs).
                            </p>
                        </div>

                        {/* Hero Score Card */}
                        <div className="bg-white rounded-[3rem] p-12 border border-gray-100 shadow-xl mb-12 reveal-scale text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-30 pointer-events-none"></div>
                            <div className="relative z-10">
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mb-4">
                                    Overall Readiness
                                </div>
                                <div className="text-7xl lg:text-9xl font-hero font-bold text-brand-orange mb-6 tracking-tighter">
                                    74<span className="text-3xl text-gray-300">/100</span>
                                </div>
                                <div className="flex justify-center gap-2">
                                    <span className="px-4 py-1.5 rounded-full bg-green-50 text-brand-green text-[10px] font-bold uppercase tracking-widest border border-brand-green/10">
                                        Likely Recommended
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid lg:grid-cols-12 gap-8">

                            {/* ── LEFT COLUMN ── */}
                            <div className="lg:col-span-7 space-y-8">

                                {/* OLQ Breakdown */}
                                <div className="bg-white p-8 lg:p-10 rounded-[3rem] border border-gray-100 shadow-sm">
                                    <h3 className="font-hero font-bold text-xl text-brand-dark mb-8">OLQ Breakdown</h3>

                                    {scoresState === 'loading' && (
                                        <div className="space-y-6" aria-hidden="true">
                                            {[0, 1, 2, 3, 4].map((i) => (
                                                <div key={i}>
                                                    <div className="h-3 w-32 bg-gray-100 rounded mb-2 animate-pulse"></div>
                                                    <div className="h-2 w-full bg-gray-100 rounded-full animate-pulse"></div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {scoresState === 'none' && (
                                        <div className="text-center py-8">
                                            <p className="text-gray-500 font-noname mb-6">
                                                You haven&apos;t completed your PIQ yet, so there are no OLQ
                                                scores to show.
                                            </p>
                                            <Link
                                                href="/piq/form"
                                                className="inline-block px-8 py-3.5 rounded-full bg-brand-dark text-white font-bold hover:bg-brand-orange transition-all shadow-lg"
                                            >
                                                Fill your PIQ
                                            </Link>
                                        </div>
                                    )}

                                    {scoresState === 'ready' && (
                                        <div className="space-y-6">
                                            {olqBars.map(({ label, score, pct }) => (
                                                <div key={label}>
                                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-2">
                                                        <span className="text-gray-400">{label}</span>
                                                        <span className="text-brand-dark">{score} / 10</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-brand-orange" style={{ width: pct }}></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Red Flags */}
                                <div className="bg-red-50/50 p-8 rounded-[3rem] border border-red-100">
                                    <h3 className="font-hero font-bold text-xl text-red-900 mb-6 flex items-center gap-3">
                                        <i className="fa-solid fa-triangle-exclamation"></i> Critical Red Flags
                                    </h3>
                                    <ul className="space-y-4">
                                        <li className="flex items-start gap-4">
                                            <div className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-[10px] mt-0.5 shrink-0">
                                                <i className="fa-solid fa-xmark"></i>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-red-900">Limited Leadership Exposure</h4>
                                                <p className="text-xs text-red-700 mt-1 font-noname">No official positions of responsibility (Captain/Monitor) found in academic records.</p>
                                            </div>
                                        </li>
                                        <li className="flex items-start gap-4">
                                            <div className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-[10px] mt-0.5 shrink-0">
                                                <i className="fa-solid fa-xmark"></i>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-red-900">Low Competitive Sports Participation</h4>
                                                <p className="text-xs text-red-700 mt-1 font-noname">Participation in sports is individual and sporadic; lacks team-based competitive play.</p>
                                            </div>
                                        </li>
                                    </ul>
                                </div>

                                {/* Improvement Plan */}
                                <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
                                    <h3 className="font-hero font-bold text-xl text-brand-dark mb-6">Improvement Plan</h3>
                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div className="p-4 rounded-2xl bg-brand-bg text-center">
                                            <i className="fa-solid fa-users text-brand-orange mb-2 block"></i>
                                            <p className="text-[10px] text-gray-600 font-bold uppercase">Leadership</p>
                                            <p className="text-[10px] text-gray-400 mt-1">Take up structured leadership roles</p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-brand-bg text-center">
                                            <i className="fa-solid fa-trophy text-brand-orange mb-2 block"></i>
                                            <p className="text-[10px] text-gray-600 font-bold uppercase">Achievements</p>
                                            <p className="text-[10px] text-gray-400 mt-1">Add measurable achievements</p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-brand-bg text-center">
                                            <i className="fa-solid fa-people-group text-brand-orange mb-2 block"></i>
                                            <p className="text-[10px] text-gray-600 font-bold uppercase">Social</p>
                                            <p className="text-[10px] text-gray-400 mt-1">Participate in team activities</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ── RIGHT COLUMN ── */}
                            <div className="lg:col-span-5 space-y-8">

                                {/* Predicted Interview Questions */}
                                <div className="bg-brand-dark p-8 lg:p-10 rounded-[3rem] text-white shadow-2xl">
                                    <h3 className="font-hero font-bold text-xl mb-8 text-brand-orange">
                                        Predicted Interview Qs
                                    </h3>
                                    <div className="space-y-6">
                                        {[
                                            `"You haven't held any formal leadership positions. Do you think you can lead men in battle?"`,
                                            `"Describe a time you handled a crisis situation despite having no authority."`,
                                            `"What motivates you to join the Armed Forces despite your high academic score in private sector subjects?"`,
                                        ].map((q, i) => (
                                            <div key={i} className="p-5 rounded-2xl bg-white/5 border border-white/10 relative">
                                                <span className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-brand-orange text-white flex items-center justify-center text-[10px] font-bold">
                                                    {i + 1}
                                                </span>
                                                <p className="text-sm leading-relaxed font-noname">{q}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Upgrade Card — hidden for PRO users */}
                                {!isPro && (
                                <div className="bg-white p-8 lg:p-10 rounded-[3rem] border-4 border-brand-orange shadow-2xl relative overflow-hidden">
                                    <div className="absolute -top-5 right-10 bg-brand-orange text-white text-[10px] font-bold px-4 py-2 rounded-full">
                                        PRO
                                    </div>
                                    <h3 className="font-hero font-bold text-xl text-brand-dark mb-4">Unlock Full Report</h3>
                                    <div className="text-3xl font-hero font-bold text-brand-dark mb-6">₹49</div>
                                    <ul className="space-y-3 mb-8">
                                        <li className="flex items-center gap-3 text-xs text-gray-500 font-bold">
                                            <i className="fa-solid fa-check text-brand-orange"></i> Detailed 15 OLQ Scoring
                                        </li>
                                        <li className="flex items-center gap-3 text-xs text-gray-500 font-bold">
                                            <i className="fa-solid fa-check text-brand-orange"></i> Custom PIQ Rewrite Suggestions
                                        </li>
                                        <li className="flex items-center gap-3 text-xs text-gray-500 font-bold">
                                            <i className="fa-solid fa-check text-brand-orange"></i> Advanced Interview Simulation
                                        </li>
                                    </ul>
                                    <Link
                                        href="/checkout"
                                        className="block w-full py-4 bg-brand-dark text-white rounded-full font-bold text-center hover:bg-brand-orange transition-all shadow-xl"
                                    >
                                        Upgrade to Pro
                                    </Link>
                                </div>
                                )}
                            </div>

                        </div>
                    </div>
                </section>
            </main>

            
        </>
    );
}
