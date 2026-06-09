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

    const [isEvaluating, setIsEvaluating] = useState(false);
    const [evaluationResult, setEvaluationResult] = useState<any>(null);

    const handleStart = async () => {
        // ... access checks ...
        const accessRes = await fetch('/api/practice/check-access?module=GPE');
        if (accessRes.status === 401) { router.push('/auth'); return; }
        const accessData = await accessRes.json();
        if (!accessData.allowed) { router.push('/pricing'); return; }

        await fetch('/api/practice/check-access', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ module: 'GPE' }),
        });

        const res = await fetch('/api/gpe/scenario');
        const data: GPEScenario = await res.json();
        setScenario(data);

        setIdentifyProblems('');
        setActionPlan('');
        setTimeManagement('');
        setTimeLeft(TOTAL_TIME);
        setEvaluationResult(null);
        setView('test');
    };

    const submitGPE = async () => {
        if (!scenario) return;
        setIsEvaluating(true);
        setView('result');
        try {
            const res = await fetch('/api/gpe/evaluate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    situation: scenario.situation,
                    identifyProblems,
                    actionPlan,
                    timeManagement
                })
            });

            if (res.ok) {
                const data = await res.json();
                setEvaluationResult(data);
            }
        } catch (error) {
            console.error('GPE Submission Error:', error);
        } finally {
            setIsEvaluating(false);
        }
    };

    const handleSubmit = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        submitGPE();
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

                        <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
                            {/* Scenario Grid */}
                            <div className="grid md:grid-cols-2 gap-5 md:gap-6">
                                {/* Image Holder */}
                                <div className="bg-gray-50 rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex items-center justify-center relative md:min-h-[400px]">
                                    {scenario.image ? (
                                        <img src={scenario.image} alt={scenario.title} className="w-full h-full object-contain rounded-3xl p-2" />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-gray-400 py-16">
                                            <i className="fa-solid fa-map text-4xl mb-3" />
                                            <span className="text-xs font-bold uppercase tracking-widest text-center px-4">Situation Map Placeholder<br/>(Image not assigned)</span>
                                        </div>
                                    )}
                                </div>

                                {/* Situation */}
                                <div className="bg-white/90 rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm flex flex-col">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Situation</h3>
                                        <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${difficultyColor(scenario.difficulty)}`}>
                                            {scenario.difficulty}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 leading-relaxed font-medium whitespace-pre-wrap">{scenario.situation}</p>
                                </div>

                                {/* How to solve */}
                                <div className="bg-orange-50 rounded-3xl p-6 md:p-8 border border-orange-100 flex flex-col">
                                    <h3 className="text-sm font-bold text-orange-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <i className="fa-solid fa-lightbulb text-orange-500" /> How to solve
                                    </h3>
                                    <ul className="space-y-4 text-sm text-gray-700 font-medium">
                                        <li className="flex gap-3 items-center"><span className="text-orange-500 font-bold">•</span> Aim</li>
                                        <li className="flex gap-3 items-center"><span className="text-orange-500 font-bold">•</span> Identify problems (set priorities)</li>
                                        <li className="flex gap-3 items-center"><span className="text-orange-500 font-bold">•</span> Resources (visible, hidden)</li>
                                        <li className="flex gap-3 items-center"><span className="text-orange-500 font-bold">•</span> Time and space</li>
                                        <li className="flex gap-3 items-center"><span className="text-orange-500 font-bold">•</span> Solution</li>
                                    </ul>
                                </div>

                                {/* Speed of Advance */}
                                <div className="bg-blue-50/60 rounded-3xl p-6 md:p-8 border border-blue-100 flex flex-col">
                                    <h3 className="text-sm font-bold text-blue-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <i className="fa-solid fa-gauge-high text-blue-500" /> Speed of Advance
                                    </h3>
                                    <ul className="space-y-4 text-sm text-gray-700 font-medium font-mono text-[12px] leading-tight flex flex-col justify-center flex-1">
                                        <li className="flex gap-3 items-center"><i className="fa-solid fa-car text-blue-400 w-5 text-center"/> MOTOR VEHICLE ON METAL ROAD - <span className="font-bold text-blue-900 ml-auto">40Kmph</span></li>
                                        <li className="flex gap-3 items-center"><i className="fa-solid fa-ship text-blue-400 w-5 text-center"/> MOTOR BOAT - <span className="font-bold text-blue-900 ml-auto">12Kmph</span></li>
                                        <li className="flex gap-3 items-center"><i className="fa-solid fa-person-walking text-blue-400 w-5 text-center"/> WALKING/RUNNING - <span className="font-bold text-blue-900 ml-auto">6-8Kmph</span></li>
                                        <li className="flex gap-3 items-center"><i className="fa-solid fa-bicycle text-blue-400 w-5 text-center"/> CYCLE - <span className="font-bold text-blue-900 ml-auto">15Kmph</span></li>
                                        <li className="flex gap-3 items-center"><i className="fa-solid fa-tractor text-blue-400 w-5 text-center"/> TRACTOR - <span className="font-bold text-blue-900 ml-auto">30Kmph</span></li>
                                    </ul>
                                </div>
                                
                                {/* Solution Inputs */}
                                <div className="md:col-span-2 space-y-6">
                                    <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm">
                                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <i className="fa-solid fa-list-check text-orange-500" /> 1. Identify Problems (Prioritized)
                                        </h3>
                                        <textarea
                                            value={identifyProblems}
                                            onChange={(e) => setIdentifyProblems(e.target.value)}
                                            placeholder="List the problems in order of priority (e.g. 1. Saving a life, 2. Stopping a theft...)"
                                            className="w-full h-32 bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                        />
                                    </div>

                                    <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm">
                                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <i className="fa-solid fa-person-running text-orange-500" /> 2. Action Plan & Solution
                                        </h3>
                                        <textarea
                                            value={actionPlan}
                                            onChange={(e) => setActionPlan(e.target.value)}
                                            placeholder="Write your detailed plan: who goes where, using what resource, and what they do."
                                            className="w-full h-48 bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-2 pt-4 flex justify-end">
                                    <button
                                        onClick={handleSubmit}
                                        disabled={!actionPlan}
                                        className="px-8 py-4 bg-gray-900 hover:bg-black text-white text-sm font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        Submit Solution for AI Evaluation <i className="fa-solid fa-brain text-xs" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── RESULT VIEW ── */}
                {view === 'result' && scenario && (
                    <div className="w-full max-w-4xl mx-auto">
                        <div className="bg-white/90 backdrop-blur-md rounded-[2.5rem] p-6 md:p-10 border border-gray-100 shadow-xl space-y-8">
                            <div className="flex items-center justify-between pb-6 border-b border-gray-100">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">GPE Solution Evaluated</p>
                                    <h3 className="text-xl font-bold text-gray-900">{scenario.title}</h3>
                                </div>
                                <span className={`text-sm font-bold px-4 py-2 rounded-full border ${difficultyColor(scenario.difficulty)}`}>
                                    {scenario.difficulty}
                                </span>
                            </div>

                            {isEvaluating ? (
                                <div className="py-12 flex flex-col items-center justify-center text-center">
                                    <div className="w-12 h-12 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin mb-4" />
                                    <h3 className="text-lg font-bold text-gray-900">Officer is reviewing your plan...</h3>
                                    <p className="text-sm text-gray-500">Evaluating your reasoning ability and organizing skills.</p>
                                </div>
                            ) : evaluationResult ? (
                                <div className="animate-fadeIn space-y-8">
                                    {/* Overall Score */}
                                    <div className="flex items-center gap-8 p-6 bg-orange-50 rounded-3xl border border-orange-100">
                                        <div className="text-center">
                                            <div className="text-4xl font-black text-orange-600">{evaluationResult.score}%</div>
                                            <div className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Match Score</div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                {[
                                                    { label: 'Reasoning', val: evaluationResult.reasoningScore },
                                                    { label: 'Organizing', val: evaluationResult.organizingScore },
                                                    { label: 'Initiative', val: evaluationResult.initiativeScore },
                                                    { label: 'Social', val: evaluationResult.socialScore },
                                                ].map(s => (
                                                    <div key={s.label}>
                                                        <div className="text-xs font-bold text-gray-500 uppercase mb-1">{s.label}</div>
                                                        <div className="h-1.5 w-full bg-orange-200 rounded-full overflow-hidden">
                                                            <div className="h-full bg-orange-600" style={{ width: `${s.val * 10}%` }} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Detailed Feedback */}
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="p-6 bg-green-50 rounded-2xl border border-green-100">
                                            <h4 className="text-xs font-bold text-green-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <i className="fa-solid fa-circle-check" /> Strengths
                                            </h4>
                                            <p className="text-sm text-green-800 leading-relaxed">{evaluationResult.feedback.strengths}</p>
                                        </div>
                                        <div className="p-6 bg-red-50 rounded-2xl border border-red-100">
                                            <h4 className="text-xs font-bold text-red-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <i className="fa-solid fa-circle-exclamation" /> Improvements
                                            </h4>
                                            <p className="text-sm text-red-800 leading-relaxed">{evaluationResult.feedback.weaknesses}</p>
                                        </div>
                                    </div>

                                    {/* Problems Analysis */}
                                    <div className="space-y-4">
                                        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-3">Resource Usage Analysis</h4>
                                            <p className="text-sm text-gray-600 leading-relaxed">{evaluationResult.feedback.resourceUsage}</p>
                                        </div>

                                        {evaluationResult.feedback.missedProblems?.length > 0 && (
                                            <div className="p-6 bg-yellow-50 rounded-2xl border border-yellow-100">
                                                <h4 className="text-xs font-bold text-yellow-700 uppercase tracking-widest mb-3">You Missed These Problems:</h4>
                                                <ul className="space-y-2">
                                                    {evaluationResult.feedback.missedProblems.map((p: string, i: number) => (
                                                        <li key={i} className="text-sm text-yellow-800 flex gap-2">
                                                            <span className="font-bold">•</span> {p}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-10 text-gray-400">Failed to load evaluation.</div>
                            )}

                            <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-4 justify-center">
                                <button
                                    onClick={handleStart}
                                    className="px-10 py-4 rounded-full border-2 border-gray-900 text-gray-900 font-bold text-sm hover:bg-gray-900 hover:text-white transition-all hover:-translate-y-0.5 text-center"
                                >
                                    <i className="fa-solid fa-rotate-right mr-2"></i> Try Another Scenario
                                </button>
                                <Link
                                    href="/practice"
                                    className="px-10 py-4 rounded-full bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 transition-all hover:-translate-y-0.5 text-center shadow-xl hover:shadow-orange-500/40"
                                >
                                    <i className="fa-solid fa-dumbbell mr-2"></i> Go to Practice
                                </Link>
                                <Link
                                    href="/dashboard"
                                    className="px-10 py-4 rounded-full bg-gray-50 border-2 border-gray-200 text-gray-900 font-bold text-sm hover:border-gray-900 transition-all hover:-translate-y-0.5 text-center"
                                >
                                    <i className="fa-solid fa-house mr-2"></i> Go to Dashboard
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}
