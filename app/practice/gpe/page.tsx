'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// ─── Types ───────────────────────────────────────────────────────────────────
type ViewState = 'intro' | 'test' | 'result';

interface GPEScenario {
    id: number;
    title: string;
    image?: string;
    situation: string;
    difficulty: string;
}

const TOTAL_TIME = 20 * 60; // 20 minutes

// ─── Main Component ───────────────────────────────────────────────────────────
export default function GPEPracticePage() {
    const router = useRouter();
    const [view, setView] = useState<ViewState>('intro');
    const [scenario, setScenario] = useState<GPEScenario | null>(null);
    const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
    const [identifyProblems, setIdentifyProblems] = useState('');
    const [actionPlan, setActionPlan] = useState('');
    const [timeManagement, setTimeManagement] = useState('');
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Timer logic
    useEffect(() => {
        if (view !== 'test') return;
        if (timeLeft <= 0) {
            setView('result');
            return;
        }
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [view, timeLeft]);

    const handleStart = async () => {
        // Access check
        const accessRes = await fetch('/api/practice/check-access?module=GPE');
        if (accessRes.status === 401) { router.push('/auth'); return; }
        const accessData = await accessRes.json();
        if (!accessData.allowed) { router.push('/pricing'); return; }

        // Consume attempt
        await fetch('/api/practice/check-access', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ module: 'GPE' }),
        });

        // Fetch random scenario
        const res = await fetch('/api/gpe/scenario');
        const data: GPEScenario = await res.json();
        setScenario(data);

        // Reset state
        setIdentifyProblems('');
        setActionPlan('');
        setTimeManagement('');
        setTimeLeft(TOTAL_TIME);
        setView('test');
    };

    const handleSubmit = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setView('result');
    };

    // Timer display
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const timeDisplay = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    const isLowTime = timeLeft <= 60;
    const progress = ((TOTAL_TIME - timeLeft) / TOTAL_TIME) * 100;

    const difficultyColor = (d: string) =>
        d === 'Hard' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-yellow-50 text-yellow-700 border-yellow-100';

    return (
        <div className="min-h-screen flex flex-col bg-[#FBF8F3] selection:bg-orange-200">
            {/* Grid Background */}
            <div className="fixed inset-0 pointer-events-none" style={{
                backgroundImage: 'linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)',
                backgroundSize: '40px 40px'
            }} />

            <main className="flex-1 max-w-5xl w-full mx-auto px-4 md:px-8 pt-28 pb-20 relative z-10 flex flex-col justify-center">

                {/* ── INTRO VIEW ── */}
                {view === 'intro' && (
                    <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 md:p-12 border border-gray-100 shadow-xl max-w-3xl mx-auto w-full">
                        <div className="text-center mb-10">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-50 text-orange-500 text-3xl mb-6">
                                <i className="fa-solid fa-people-group" />
                            </div>
                            <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
                                Group Planning <span className="text-orange-500">Exercise</span>
                            </h1>
                            <p className="text-gray-500 text-sm md:text-base max-w-xl mx-auto font-medium leading-relaxed">
                                Practice real SSB GTO planning scenarios and build structured solutions.
                            </p>
                        </div>

                        <div className="grid sm:grid-cols-3 gap-4 mb-10">
                            <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-100 text-center">
                                <div className="text-orange-500 text-2xl mb-2"><i className="fa-solid fa-map" /></div>
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Format</div>
                                <div className="text-xl font-bold text-gray-900">Situation Map</div>
                            </div>
                            <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-100 text-center">
                                <div className="text-orange-500 text-2xl mb-2"><i className="fa-solid fa-stopwatch" /></div>
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Time Limit</div>
                                <div className="text-xl font-bold text-gray-900">20 Minutes</div>
                            </div>
                            <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100 text-center">
                                <div className="text-orange-500 text-2xl mb-2"><i className="fa-solid fa-ranking-star" /></div>
                                <div className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-1">Assesses</div>
                                <div className="text-xl font-bold text-orange-600">OLQs</div>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-6 md:p-8 border border-gray-100 mb-10">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">Instructions</h3>
                            <ul className="space-y-3">
                                {[
                                    'Read the situation carefully and identify all problems.',
                                    'Prioritize problems by urgency and impact.',
                                    'Allocate available resources effectively across tasks.',
                                    'Present a clear, timed action plan covering all priorities.',
                                    'Think like a leader: justify every decision.'
                                ].map((item, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-gray-700 font-medium">
                                        <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0 text-xs mt-0.5">✓</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="text-center">
                            <button
                                onClick={handleStart}
                                className="inline-flex py-4 px-12 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-bold text-sm tracking-wide transition-all shadow-lg hover:shadow-orange-500/30 transform hover:-translate-y-0.5"
                            >
                                Start GPE
                            </button>
                        </div>
                    </div>
                )}

                {/* ── TEST VIEW ── */}
                {view === 'test' && scenario && (
                    <div className="w-full animate-fadeIn">

                        {/* Top Bar */}
                        <div className="flex flex-wrap items-center justify-between mb-6 bg-white/80 backdrop-blur-md px-6 py-4 rounded-2xl border border-gray-100 shadow-sm gap-4">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Scenario</p>
                                <p className="font-bold text-gray-900 text-lg">{scenario.title}</p>
                            </div>
                            <div className="flex flex-1 max-w-xs mx-4 items-center">
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <div className="h-full bg-orange-500 transition-all duration-1000" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Time Remaining</p>
                                <p className={`font-mono font-bold text-2xl tracking-tighter ${isLowTime ? 'text-red-500 animate-pulse' : 'text-gray-900'}`}>
                                    {timeDisplay}
                                </p>
                            </div>
                        </div>

                        <div className="grid lg:grid-cols-2 gap-6">
                            {/* Left: Scenario Card */}
                            <div className="space-y-5">
                                {/* Image Holder Placeholder */}
                                <div className="bg-gray-100 rounded-3xl border border-gray-200 shadow-sm overflow-hidden aspect-video flex items-center justify-center relative">
                                    {scenario.image ? (
                                        <img src={scenario.image} alt={scenario.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                            <i className="fa-solid fa-map text-4xl mb-3" />
                                            <span className="text-xs font-bold uppercase tracking-widest text-center px-4">Situation Map Placeholder<br/>(Image not assigned)</span>
                                        </div>
                                    )}
                                </div>

                                {/* Situation */}
                                <div className="bg-white/90 rounded-3xl p-6 border border-gray-100 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Situation</h3>
                                        <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${difficultyColor(scenario.difficulty)}`}>
                                            {scenario.difficulty}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 leading-relaxed font-medium">{scenario.situation}</p>
                                </div>

                                {/* How to solve */}
                                <div className="bg-orange-50 rounded-3xl p-6 border border-orange-100">
                                    <h3 className="text-sm font-bold text-orange-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <i className="fa-solid fa-lightbulb text-orange-500" /> How to solve
                                    </h3>
                                    <ul className="space-y-2 text-sm text-gray-700 font-medium">
                                        <li className="flex gap-2"><span className="text-orange-500 font-bold">•</span> Aim</li>
                                        <li className="flex gap-2"><span className="text-orange-500 font-bold">•</span> Identify problems (set priorities)</li>
                                        <li className="flex gap-2"><span className="text-orange-500 font-bold">•</span> Resources (visible, hidden)</li>
                                        <li className="flex gap-2"><span className="text-orange-500 font-bold">•</span> Time and space</li>
                                        <li className="flex gap-2"><span className="text-orange-500 font-bold">•</span> Solution</li>
                                    </ul>
                                </div>

                                {/* Speed of Advance */}
                                <div className="bg-blue-50/60 rounded-3xl p-6 border border-blue-100">
                                    <h3 className="text-sm font-bold text-blue-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <i className="fa-solid fa-gauge-high text-blue-500" /> Speed of Advance
                                    </h3>
                                    <ul className="space-y-2 text-sm text-gray-700 font-medium font-mono text-[11px] leading-tight flex flex-col gap-1">
                                        <li className="flex gap-2 items-center"><i className="fa-solid fa-car text-blue-400 w-4"/> MOTOR VEHICLE ON METAL ROAD - <span className="font-bold text-blue-900">40Kmph</span></li>
                                        <li className="flex gap-2 items-center"><i className="fa-solid fa-ship text-blue-400 w-4"/> MOTOR BOAT - <span className="font-bold text-blue-900">12Kmph</span></li>
                                        <li className="flex gap-2 items-center"><i className="fa-solid fa-person-walking text-blue-400 w-4"/> WALKING/RUNNING - <span className="font-bold text-blue-900">6-8Kmph</span></li>
                                        <li className="flex gap-2 items-center"><i className="fa-solid fa-bicycle text-blue-400 w-4"/> CYCLE - <span className="font-bold text-blue-900">15Kmph</span></li>
                                        <li className="flex gap-2 items-center"><i className="fa-solid fa-tractor text-blue-400 w-4"/> TRACTOR - <span className="font-bold text-blue-900">30Kmph</span></li>
                                    </ul>
                                </div>
                            </div>

                            {/* Right: Text Areas */}
                            <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-gray-100 shadow-lg flex flex-col gap-5">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                    <i className="fa-solid fa-pen-nib text-orange-500" /> Plan Your Solution
                                </h3>

                                {[
                                    { label: '1. Identify Problems', placeholder: 'List the key problems in order of priority. Explain why each is critical and what immediate risk it carries...', value: identifyProblems, setter: setIdentifyProblems },
                                    { label: '2. Action Plan', placeholder: 'Describe your step-by-step action plan. Assign team members to specific tasks, state the sequence and justify your resource allocation...', value: actionPlan, setter: setActionPlan },
                                    { label: '3. Time Management Strategy', placeholder: 'Break down your 20-minute window into phases. What happens in the first 5 minutes, next 10, and final phase?', value: timeManagement, setter: setTimeManagement },
                                ].map(({ label, placeholder, value, setter }) => (
                                    <div key={label}>
                                        <label className="block text-xs font-bold text-gray-700 mb-2">{label}</label>
                                        <textarea
                                            value={value}
                                            onChange={e => setter(e.target.value)}
                                            placeholder={placeholder}
                                            rows={4}
                                            className="w-full resize-none bg-gray-50/50 border border-gray-200 rounded-2xl p-4 text-gray-700 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                                            spellCheck={false}
                                        />
                                    </div>
                                ))}

                                <button
                                    onClick={handleSubmit}
                                    className="mt-auto px-6 py-3 bg-gray-900 hover:bg-black text-white text-sm font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                                >
                                    Submit Plan <i className="fa-solid fa-arrow-right text-xs" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── RESULT VIEW ── */}
                {view === 'result' && scenario && (
                    <div className="w-full max-w-4xl mx-auto">
                        <div className="text-center mb-10">
                            <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-2">Exercise Completed</p>
                            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">GPE Analysis</h2>
                            <p className="text-gray-500 text-sm md:text-base max-w-lg mx-auto">
                                Your plan for <strong>{scenario.title}</strong> has been recorded.
                            </p>
                        </div>

                        <div className="bg-white/90 backdrop-blur-md rounded-[2.5rem] p-6 md:p-10 border border-gray-100 shadow-xl space-y-8">
                            <div className="flex items-center justify-between pb-6 border-b border-gray-100">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Scenario Completed</p>
                                    <h3 className="text-xl font-bold text-gray-900">{scenario.title}</h3>
                                </div>
                                <span className={`text-sm font-bold px-4 py-2 rounded-full border ${difficultyColor(scenario.difficulty)}`}>
                                    {scenario.difficulty}
                                </span>
                            </div>

                            {[
                                { label: '1. Problem Identification', value: identifyProblems, icon: 'fa-list-check' },
                                { label: '2. Action Plan', value: actionPlan, icon: 'fa-route' },
                                { label: '3. Time Management Strategy', value: timeManagement, icon: 'fa-clock' },
                            ].map(({ label, value, icon }) => (
                                <div key={label} className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <i className={`fa-solid ${icon} text-orange-500`} /> {label}
                                    </h4>
                                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                        {value || <span className="italic text-gray-400">No answer provided.</span>}
                                    </p>
                                </div>
                            ))}

                            <div className="pt-4 flex flex-col sm:flex-row gap-3">
                                <Link href="/dashboard" className="flex-1 text-center py-3.5 bg-gray-900 hover:bg-black text-white text-sm font-bold rounded-xl transition-all shadow-md">
                                    View Dashboard
                                </Link>
                                <button onClick={handleStart} className="flex-1 text-center py-3.5 bg-orange-50 hover:bg-orange-100 text-orange-600 text-sm font-bold rounded-xl transition-all border border-orange-200 shadow-sm">
                                    Try Another Scenario
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}
