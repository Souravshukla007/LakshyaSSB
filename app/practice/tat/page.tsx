'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// ─── Types and Constants ──────────────────────────────────────────────────────
type ViewState = 'intro' | 'test' | 'result';

const TIME_PER_IMAGE = 4 * 60; // 4 minutes in seconds

// ─── Camera Shutter Sound ──────────────────────────────────────────────────────
function playShutter() {
    if (typeof window === 'undefined') return;
    try {
        const audio = new Audio('/sound/audio.mp3');
        audio.volume = 0.8;
        audio.play().catch(() => null);
    } catch { /* silently ignore */ }
}

// ─── Dynamic Radar Chart ────────────────────────────────────────────────────────
function DynamicRadarChart({ scores }: { scores: any }) {
    const cx = 160, cy = 160, maxR = 100;
    
    const stats = Object.entries(scores || {}).map(([label, data]: [string, any]) => ({
        label: label.replace('_', ' '),
        value: data.percentage / 10
    })).slice(0, 5);

    if (stats.length === 0) return <div className="text-gray-400 text-xs text-center py-20 font-bold uppercase tracking-widest">No evaluation data</div>;

    const n = stats.length;
    const angles = stats.map((_, i) => (2 * Math.PI * i) / n - Math.PI / 2);
    const gridCircles = [2, 4, 6, 8, 10];
    const dataPoints = stats.map((s, i) => {
        const v = s.value / 10;
        return {
            x: cx + maxR * v * Math.cos(angles[i]),
            y: cy + maxR * v * Math.sin(angles[i]),
        };
    });

    const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';

    return (
        <svg viewBox="0 0 320 320" className="w-full h-full max-w-[280px] sm:max-w-[320px] mx-auto drop-shadow-md">
            {gridCircles.map(v => (
                <circle key={v} cx={cx} cy={cy} r={maxR * v / 10} fill="none" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="3,3" />
            ))}
            {stats.map((_, i) => (
                <line key={i} x1={cx} y1={cy} x2={cx + maxR * Math.cos(angles[i])} y2={cy + maxR * Math.sin(angles[i])} stroke="#d1d5db" strokeWidth="1" />
            ))}
            <path d={dataPath} fill="rgba(249, 115, 22, 0.2)" stroke="#F97316" strokeWidth="3" strokeLinejoin="round" />
            {dataPoints.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="5" fill="#F97316" className="animate-pulse" />
            ))}
            {stats.map((s, i) => {
                const lx = cx + (maxR + 25) * Math.cos(angles[i]);
                const ly = cy + (maxR + 25) * Math.sin(angles[i]);
                return (
                    <text key={s.label} x={lx} y={ly + 4} textAnchor="middle" fill="#4b5563" fontSize="10" fontWeight="700" className="uppercase tracking-wider">
                        {s.label}
                    </text>
                );
            })}
        </svg>
    );
}

function getBehaviorInsights(result: any) {
    const insights = [];
    if (result.percentage >= 80) {
        insights.push({ icon: 'fa-bolt', text: 'Strong proactive mindset', desc: 'Heroes in your stories consistently take immediate action instead of waiting for help.' });
        insights.push({ icon: 'fa-scale-balanced', text: 'Balanced emotional control', desc: 'Crisis situations were handled logically without panic or irrational anger.' });
        insights.push({ icon: 'fa-check-double', text: 'Positive outcome orientation', desc: 'Every story concluded with a constructive and realistic ending.' });
    } else if (result.percentage >= 60) {
        insights.push({ icon: 'fa-bolt', text: 'Developing initiative', desc: 'Most stories show the hero taking charge, but some rely on external help.' });
        insights.push({ icon: 'fa-scale-balanced', text: 'Moderate emotional control', desc: 'Some stories show minor signs of panic or over-emotional responses.' });
        insights.push({ icon: 'fa-check-double', text: 'Growth potential', desc: 'Consistent practice will help in refining your problem-solving approach.' });
    } else {
        insights.push({ icon: 'fa-triangle-exclamation', text: 'Action required', desc: 'Work on making your stories more action-oriented and positive.' });
        insights.push({ icon: 'fa-brain', text: 'Reframing needed', desc: 'Focus on identified problems and their logical solutions in each story.' });
    }
    return insights;
}

// ─── Main Page Component ──────────────────────────────────────────────────────
export default function TATPracticePage() {
    const router = useRouter();
    const [view, setView] = useState<ViewState>('intro');
    const [tatImages, setTatImages] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(TIME_PER_IMAGE);
    const [story, setStory] = useState('');
    const [stories, setStories] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [evaluationResult, setEvaluationResult] = useState<any>(null);
    const [medalsEarned, setMedalsEarned] = useState<number | null>(null);

    // Timer logic
    useEffect(() => {
        if (view !== 'test') return;
        if (timeLeft <= 0) {
            handleNext();
            return;
        }
        const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [view, timeLeft]);

    useEffect(() => {
        if (view === 'test') playShutter();
    }, [currentIndex, view]);

    const handleStart = async () => {
        const accessRes = await fetch('/api/practice/check-access?module=TAT');
        if (accessRes.status === 401) return router.push('/auth');
        const accessData = await accessRes.json();
        if (!accessData.allowed) return router.push('/pricing');

        await fetch('/api/practice/check-access', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ module: 'TAT' })
        });

        const imgRes = await fetch('/api/tat/images');
        const imgData = await imgRes.json();
        const sessionImages: string[] = imgData.images ?? [];

        setTatImages(sessionImages);
        setCurrentIndex(0);
        setTimeLeft(TIME_PER_IMAGE);
        setStory('');
        setStories(Array(sessionImages.length).fill(''));
        setEvaluationResult(null);
        setMedalsEarned(null);
        setView('test');
    };

    const submitTAT = async (finalStories: string[]) => {
        setIsSubmitting(true);
        try {
            const storiesToSubmit = tatImages.map((img, idx) => ({
                image_id: img,
                story_text: finalStories[idx] || '',
                theme: 'General',
                difficulty: 'medium'
            }));

            const res = await fetch('/api/tat/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stories: storiesToSubmit })
            });

            if (res.ok) {
                const data = await res.json();
                setEvaluationResult(data.evaluation);
                if (data.medals?.awarded) setMedalsEarned(data.medals.awarded);
            }
        } catch (error) {
            console.error('Failed to submit TAT:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNext = () => {
        const newStories = [...stories];
        newStories[currentIndex] = story;
        setStories(newStories);

        if (currentIndex < tatImages.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setStory(newStories[currentIndex + 1] || '');
            setTimeLeft(TIME_PER_IMAGE);
        } else {
            setView('result');
            submitTAT(newStories);
        }
    };

    const wordsCount = story.trim().split(/\s+/).filter(w => w.length > 0).length;
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const timeDisplay = `${mins}:${secs.toString().padStart(2, '0')}`;
    const isLowTime = timeLeft <= 30;

    return (
        <div className="min-h-screen flex flex-col bg-[#FBF8F3] selection:bg-orange-200">
            <div className="fixed inset-0 pointer-events-none" style={{
                backgroundImage: 'linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)',
                backgroundSize: '40px 40px'
            }}></div>

            <main className="flex-1 max-w-5xl w-full mx-auto px-4 md:px-8 pt-28 pb-20 relative z-10 flex flex-col justify-center">

                {view === 'intro' && (
                    <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 md:p-12 border border-gray-100 shadow-xl shadow-orange-900/5 max-w-3xl mx-auto w-full animate-fadeIn">
                        <div className="text-center mb-10">
                            <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
                                Thematic Apperception Test <span className="text-orange-500">(TAT)</span>
                            </h1>
                            <p className="text-gray-500 text-sm md:text-base max-w-xl mx-auto font-medium leading-relaxed">
                                Reveal your leadership, initiative and problem-solving mindset through storytelling.
                            </p>
                        </div>

                        <div className="grid sm:grid-cols-3 gap-4 mb-10">
                            <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-100 text-center">
                                <div className="text-orange-500 text-2xl mb-2"><i className="fa-solid fa-images"></i></div>
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Images</div>
                                <div className="text-xl font-bold text-gray-900">12 (11 + 1 Blank)</div>
                            </div>
                            <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-100 text-center">
                                <div className="text-orange-500 text-2xl mb-2"><i className="fa-solid fa-stopwatch"></i></div>
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Time per Image</div>
                                <div className="text-xl font-bold text-gray-900">4 Minutes</div>
                            </div>
                            <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100 text-center">
                                <div className="text-orange-500 text-2xl mb-2"><i className="fa-solid fa-brain"></i></div>
                                <div className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-1">Last Image</div>
                                <div className="text-xl font-bold text-orange-600">Blank Slide</div>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-6 md:p-8 border border-gray-100 mb-10">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">Instructions</h3>
                            <p className="text-gray-600 text-sm mb-4">Write a complete story for each image shown naturally covering background, present, and outcome.</p>
                            <ul className="space-y-3 mb-6">
                                {['Leadership', 'Initiative', 'Action Orientation', 'Positive Outcome'].map((item, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-gray-700 font-medium">
                                        <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0 text-xs mt-0.5">✓</span>
                                        Focus on {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="text-center">
                            <button onClick={handleStart} className="inline-flex py-4 px-12 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-bold text-sm tracking-wide transition-all shadow-lg transform hover:-translate-y-0.5">
                                Start TAT Practice
                            </button>
                        </div>
                    </div>
                )}

                {view === 'test' && (
                    <div className="w-full max-w-4xl mx-auto animate-fadeIn">
                        <div className="flex flex-wrap items-center justify-between mb-6 bg-white/80 backdrop-blur-md px-6 py-4 rounded-2xl border border-gray-100 shadow-sm gap-4">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Progress</p>
                                <p className="font-bold text-gray-900 text-lg">Image {currentIndex + 1} <span className="text-gray-400 text-sm">/ {tatImages.length}</span></p>
                            </div>
                            <div className="flex flex-1 max-w-xs mx-4 items-center">
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <div className="h-full bg-orange-500 transition-all duration-300" style={{ width: `${((currentIndex + 1) / tatImages.length) * 100}%` }}></div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Time Remaining</p>
                                <p className={`font-mono font-bold text-2xl tracking-tighter ${isLowTime ? 'text-red-500 animate-pulse' : 'text-gray-900'}`}>{timeDisplay}</p>
                            </div>
                        </div>

                        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-4 border border-gray-100 shadow-lg flex flex-col mb-8">
                            {tatImages[currentIndex] ? (
                                <div className="relative w-full min-h-[420px] md:min-h-[520px] rounded-2xl overflow-hidden bg-gray-100">
                                    <img src={tatImages[currentIndex]} alt={`TAT Image ${currentIndex + 1}`} className="absolute inset-0 w-full h-full object-cover grayscale opacity-90 contrast-125" />
                                </div>
                            ) : (
                                <div className="relative w-full min-h-[420px] md:min-h-[520px] rounded-2xl bg-white border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-8 text-center">
                                    <h3 className="font-bold text-gray-900 text-lg mb-2">Blank Slide</h3>
                                    <p className="text-gray-500 text-sm">Imagine a situation and write a story around it.</p>
                                </div>
                            )}
                        </div>

                        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-gray-100 shadow-xl">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-gray-900 text-lg">Your Story</h3>
                                <span className={`text-xs font-bold px-3 py-1 rounded-full ${wordsCount < 30 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>{wordsCount} words</span>
                            </div>
                            <textarea value={story} onChange={(e) => setStory(e.target.value)} placeholder="Start writing your story here..." className="w-full h-64 bg-gray-50/50 border border-gray-100 rounded-2xl p-6 text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all resize-none text-lg leading-relaxed" />
                            <div className="mt-8 flex justify-end">
                                <button onClick={handleNext} className="py-4 px-12 bg-gray-900 hover:bg-orange-600 text-white rounded-full font-bold text-sm tracking-wide transition-all shadow-lg transform hover:-translate-y-0.5 flex items-center gap-3">
                                    {currentIndex < tatImages.length - 1 ? 'Save & Next Image' : 'Finish & Evaluate'}
                                    <i className="fa-solid fa-arrow-right text-xs"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {view === 'result' && (
                    <div className="w-full max-w-4xl mx-auto animate-fadeIn">
                        {isSubmitting || !evaluationResult ? (
                            <div className="bg-white/90 backdrop-blur-md rounded-[2.5rem] p-12 md:p-20 border border-gray-100 shadow-xl text-center">
                                <div className="w-16 h-16 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-8"></div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Analyzing Your Stories</h2>
                                <p className="text-gray-500 font-medium">Our AI is evaluating your behavioral patterns...</p>
                            </div>
                        ) : (
                            <div className="bg-white/90 backdrop-blur-md rounded-[2.5rem] p-6 md:p-10 border border-gray-100 shadow-xl grid md:grid-cols-2 gap-10 items-center overflow-hidden relative">
                                <div className="absolute -top-24 -right-24 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl"></div>
                                <div className="flex flex-col items-center">
                                    {medalsEarned && (
                                        <div className="mb-8 px-6 py-3 bg-brand-orange text-white rounded-full font-bold text-sm animate-bounce shadow-lg flex items-center gap-2">
                                            <i className="fa-solid fa-medal"></i>
                                            +{medalsEarned} Medals Earned!
                                        </div>
                                    )}
                                    <div className="mb-6 text-center">
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Overall TAT Score</h3>
                                        <div className="text-6xl font-black text-gray-900">{evaluationResult.percentage}<span className="text-2xl text-gray-400">/100</span></div>
                                        <span className={`inline-block mt-3 px-4 py-1.5 border text-xs font-bold uppercase rounded-full ${evaluationResult.riskLevel === 'LOW' ? 'bg-green-50 text-green-700 border-green-200' : evaluationResult.riskLevel === 'MODERATE' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                            {evaluationResult.riskLevel === 'LOW' ? '🟢 Highly Recommended' : evaluationResult.riskLevel === 'MODERATE' ? '🟡 Recommended' : '🔴 Needs Improvement'}
                                        </span>
                                    </div>
                                    <div className="w-full relative">
                                        <DynamicRadarChart scores={evaluationResult.themeScores} />
                                    </div>
                                </div>
                                <div className="space-y-6 z-10">
                                    <h3 className="flex items-center gap-3 text-lg font-bold text-gray-900 mb-4 pb-4 border-b border-gray-100">Behavior Pattern</h3>
                                    <ul className="space-y-4">
                                        {getBehaviorInsights(evaluationResult).map((item, idx) => (
                                            <li key={idx} className="flex gap-4 p-4 rounded-2xl bg-gray-50/80 border border-gray-100 hover:border-orange-200 transition-colors">
                                                <div className="text-orange-500 mt-0.5"><i className={`fa-solid ${item.icon}`}></i></div>
                                                <div>
                                                    <p className="font-bold text-sm text-gray-900">{item.text}</p>
                                                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.desc}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-4 justify-center">
                                        <button onClick={handleStart} className="px-10 py-4 rounded-full border-2 border-gray-900 text-gray-900 font-bold text-sm hover:bg-gray-900 hover:text-white transition-all text-center">Retake Test</button>
                                        <Link href="/practice" className="px-10 py-4 rounded-full bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 transition-all text-center shadow-xl">Go to Practice</Link>
                                        <Link href="/dashboard" className="px-10 py-4 rounded-full bg-gray-50 border-2 border-gray-200 text-gray-900 font-bold text-sm hover:border-gray-900 transition-all text-center">Dashboard</Link>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
