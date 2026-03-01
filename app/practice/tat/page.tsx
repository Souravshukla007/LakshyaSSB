'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// ─── Types and Constants ──────────────────────────────────────────────────────
type ViewState = 'intro' | 'test' | 'result';

const TAT_IMAGES = [
    'https://images.unsplash.com/photo-1456406644174-8ddd4cd52a06?q=80&w=800&auto=format&fit=crop&grayscale=1', // Discussion / Group
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop&grayscale=1', // Business / Discussion
    'https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?q=80&w=800&auto=format&fit=crop&grayscale=1', // Looking far away
    'https://images.unsplash.com/photo-1542810634-71277d95dcbb?q=80&w=800&auto=format&fit=crop&grayscale=1', // Helping / Reaching out
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=800&auto=format&fit=crop&grayscale=1', // Planning / Working
    'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=800&auto=format&fit=crop&grayscale=1', // Interaction
    'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=800&auto=format&fit=crop&grayscale=1', // Handshake / Deal
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=800&auto=format&fit=crop&grayscale=1', // Working together
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop&grayscale=1', // Team meeting
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800&auto=format&fit=crop&grayscale=1', // Solo studying
    'https://images.unsplash.com/photo-1529070538774-1843cb3265df?q=80&w=800&auto=format&fit=crop&grayscale=1', // Crisis / Intense interaction
    '', // Blank Slide
];

const TIME_PER_IMAGE = 4 * 60; // 4 minutes in seconds

// ─── SVG Radar Chart ──────────────────────────────────────────────────────────
function TATRadarChart() {
    const cx = 160, cy = 160, maxR = 100;
    const stats = [
        { label: 'Leadership', value: 8.5 },
        { label: 'Initiative', value: 8.0 },
        { label: 'Responsibility', value: 9.0 },
        { label: 'Emotional Stability', value: 7.5 },
        { label: 'Planning Ability', value: 8.2 },
    ];
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
            {/* Grid circles */}
            {gridCircles.map(v => (
                <circle key={v} cx={cx} cy={cy} r={maxR * v / 10}
                    fill="none" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="3,3" />
            ))}
            {/* Axes */}
            {stats.map((_, i) => (
                <line key={i}
                    x1={cx} y1={cy}
                    x2={cx + maxR * Math.cos(angles[i])}
                    y2={cy + maxR * Math.sin(angles[i])}
                    stroke="#d1d5db" strokeWidth="1" />
            ))}
            {/* Data area */}
            <path d={dataPath} fill="rgba(249, 115, 22, 0.2)" stroke="#F97316" strokeWidth="3" strokeLinejoin="round" />
            {/* Data dots */}
            {dataPoints.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="5" fill="#F97316" className="animate-pulse" />
            ))}
            {/* Labels */}
            {stats.map((s, i) => {
                const lx = cx + (maxR + 25) * Math.cos(angles[i]);
                const ly = cy + (maxR + 25) * Math.sin(angles[i]);
                return (
                    <text key={s.label} x={lx} y={ly + 4} textAnchor="middle" fill="#4b5563"
                        fontSize="10" fontWeight="700" className="uppercase tracking-wider">
                        {s.label}
                    </text>
                );
            })}
        </svg>
    );
}

// ─── Main Page Component ──────────────────────────────────────────────────────
export default function TATPracticePage() {
    const [view, setView] = useState<ViewState>('intro');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(TIME_PER_IMAGE);
    const [story, setStory] = useState('');
    const [stories, setStories] = useState<string[]>(Array(TAT_IMAGES.length).fill(''));

    // Timer logic
    useEffect(() => {
        if (view !== 'test') return;

        if (timeLeft <= 0) {
            handleNext();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [view, timeLeft]);

    const handleStart = () => {
        setCurrentIndex(0);
        setTimeLeft(TIME_PER_IMAGE);
        setStory('');
        setStories(Array(TAT_IMAGES.length).fill(''));
        setView('test');
    };

    const handleNext = () => {
        // Save current story
        const newStories = [...stories];
        newStories[currentIndex] = story;
        setStories(newStories);

        if (currentIndex < TAT_IMAGES.length - 1) {
            // Next image
            setCurrentIndex(prev => prev + 1);
            setStory(newStories[currentIndex + 1] || '');
            setTimeLeft(TIME_PER_IMAGE);
        } else {
            // Finish TAT
            setView('result');
        }
    };

    // Words counter
    const wordsCount = story.trim().split(/\s+/).filter(w => w.length > 0).length;

    // Formatting time
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const timeDisplay = `${mins}:${secs.toString().padStart(2, '0')}`;
    const isLowTime = timeLeft <= 30;

    return (
        <div className="min-h-screen flex flex-col bg-[#FBF8F3] selection:bg-orange-200">
            {/* Beige Grid Background */}
            <div className="fixed inset-0 pointer-events-none" style={{
                backgroundImage: 'linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)',
                backgroundSize: '40px 40px'
            }}></div>

            <Navbar />

            <main className="flex-1 max-w-5xl w-full mx-auto px-4 md:px-8 pt-28 pb-20 relative z-10 flex flex-col justify-center">

                {/* ════════════════════════════════════════════════════════════════════════
                     PAGE 1 — INTRO
                ════════════════════════════════════════════════════════════════════════ */}
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
                            <p className="text-gray-600 text-sm mb-4">Write a complete story for each image shown. Ensure your story covers the following points naturally:</p>
                            <ul className="space-y-3 mb-6">
                                {['What led to the situation shown in the picture?', 'What is currently happening?', 'What will happen next?', 'What is the final outcome?'].map((item, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-gray-700 font-medium">
                                        <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0 text-xs mt-0.5">✓</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="text-xs font-bold text-gray-400 uppercase">Focus on:</span>
                                <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-700 shadow-sm">Action</span>
                                <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-700 shadow-sm">Leadership</span>
                                <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-700 shadow-sm">Positive Outcome</span>
                            </div>
                        </div>

                        <div className="text-center">
                            <button
                                onClick={handleStart}
                                className="inline-flex py-4 px-12 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-bold text-sm tracking-wide transition-all shadow-lg hover:shadow-orange-500/30 transform hover:-translate-y-0.5"
                            >
                                Start TAT
                            </button>
                        </div>
                    </div>
                )}


                {/* ════════════════════════════════════════════════════════════════════════
                     PAGE 2 — STORY INTERFACE
                ════════════════════════════════════════════════════════════════════════ */}
                {view === 'test' && (
                    <div className="w-full max-w-4xl mx-auto animate-fadeIn">

                        {/* Top Bar: Progress & Timer */}
                        <div className="flex flex-wrap items-center justify-between mb-6 bg-white/80 backdrop-blur-md px-6 py-4 rounded-2xl border border-gray-100 shadow-sm gap-4">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Progress</p>
                                <p className="font-bold text-gray-900 text-lg">Image {currentIndex + 1} <span className="text-gray-400 text-sm">/ {TAT_IMAGES.length}</span></p>
                            </div>

                            <div className="flex flex-1 max-w-xs mx-4 items-center">
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-orange-500 transition-all duration-300"
                                        style={{ width: `${((currentIndex + 1) / TAT_IMAGES.length) * 100}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="text-right">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Time Remaining</p>
                                <p className={`font-mono font-bold text-2xl tracking-tighter ${isLowTime ? 'text-red-500 animate-pulse' : 'text-gray-900'}`}>
                                    {timeDisplay}
                                </p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 items-start">
                            {/* Left: Image Display */}
                            <div className="bg-white/80 backdrop-blur-md rounded-3xl p-4 border border-gray-100 shadow-lg flex flex-col h-full min-h-[300px]">
                                {TAT_IMAGES[currentIndex] ? (
                                    <div className="relative w-full h-full min-h-[300px] md:min-h-[400px] rounded-2xl overflow-hidden bg-gray-100 border border-gray-200">
                                        {/* Using img for testing, but in production we can use Next/Image */}
                                        <img
                                            src={TAT_IMAGES[currentIndex]}
                                            alt={`TAT Image ${currentIndex + 1}`}
                                            className="absolute inset-0 w-full h-full object-cover object-center grayscale opacity-90 contrast-125"
                                        />
                                    </div>
                                ) : (
                                    /* Blank Slide */
                                    <div className="relative w-full h-full min-h-[300px] md:min-h-[400px] rounded-2xl bg-white border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-8 text-center">
                                        <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center text-orange-500 text-2xl mb-4">
                                            <i className="fa-regular fa-image border-orange-500"></i>
                                        </div>
                                        <h3 className="font-bold text-gray-900 text-lg mb-2">Blank Slide</h3>
                                        <p className="text-gray-500 text-sm">Project your own imagination. Imagine a situation and write a story around it.</p>
                                    </div>
                                )}

                                {/* Theme Tag / Analysis Hook */}
                                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-400 text-xs"><i className="fa-solid fa-tag"></i></span>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Theme Detection Active</span>
                                    </div>
                                    <div className="text-[10px] font-bold text-orange-500 uppercase px-3 py-1 bg-orange-50 rounded-full">
                                        AI Evaluation
                                    </div>
                                </div>
                            </div>

                            {/* Right: Story Input */}
                            <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-gray-100 shadow-lg flex flex-col h-full mt-4 md:mt-0">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <i className="fa-solid fa-pen-nib text-orange-500"></i> Write Your Story
                                </h3>

                                <textarea
                                    value={story}
                                    onChange={(e) => setStory(e.target.value)}
                                    placeholder="Start writing here... Make sure you cover the past, present, and future of the situation with a logical outcome."
                                    className="w-full flex-1 min-h-[250px] resize-none bg-gray-50/50 border border-gray-200 rounded-2xl p-5 text-gray-700 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                                    spellCheck="false"
                                ></textarea>

                                <div className="mt-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${wordsCount >= 100 ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                            {wordsCount} Words
                                        </span>
                                        {wordsCount < 100 && (
                                            <span className="text-[10px] text-gray-400 font-medium">Aim for 100-150 words</span>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleNext}
                                        className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white text-sm font-bold rounded-xl transition-all shadow-md flex items-center gap-2"
                                    >
                                        {currentIndex === TAT_IMAGES.length - 1 ? 'Submit Test' : 'Next Image'} <i className="fa-solid fa-arrow-right text-xs"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                )}


                {/* ════════════════════════════════════════════════════════════════════════
                     PAGE 3 — RESULT SCREEN
                ════════════════════════════════════════════════════════════════════════ */}
                {view === 'result' && (
                    <div className="w-full max-w-4xl mx-auto animate-fadeIn">
                        <div className="text-center mb-10">
                            <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-2">Test Completed</p>
                            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">TAT Psychological Analysis</h2>
                            <p className="text-gray-500 text-sm md:text-base max-w-lg mx-auto">
                                Based on your 12 stories, our AI has extracted your core Officer Like Qualities and behavioral patterns.
                            </p>
                        </div>

                        <div className="bg-white/90 backdrop-blur-md rounded-[2.5rem] p-6 md:p-10 border border-gray-100 shadow-xl grid md:grid-cols-2 gap-10 items-center overflow-hidden relative">

                            {/* Background decoration */}
                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl"></div>

                            {/* Left: Score & Radar */}
                            <div className="flex flex-col items-center">
                                <div className="mb-6 text-center">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Overall TAT Score</h3>
                                    <div className="text-6xl font-black text-gray-900 drop-shadow-sm">
                                        82<span className="text-2xl text-gray-400">/100</span>
                                    </div>
                                    <span className="inline-block mt-3 px-4 py-1.5 bg-green-50 text-green-700 border border-green-200 text-xs font-bold uppercase rounded-full">
                                        🟢 Highly Recommended
                                    </span>
                                </div>

                                <div className="w-full relative">
                                    <TATRadarChart />
                                </div>
                            </div>

                            {/* Right: Insights & Actions */}
                            <div className="space-y-6 z-10">
                                <div>
                                    <h3 className="flex items-center gap-3 text-lg font-bold text-gray-900 mb-4 pb-4 border-b border-gray-100">
                                        <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center text-sm">
                                            <i className="fa-solid fa-brain"></i>
                                        </div>
                                        Behavior Pattern
                                    </h3>

                                    <ul className="space-y-4">
                                        {[
                                            { icon: 'fa-bolt', text: 'Strong proactive mindset', desc: 'Heroes in your stories consistently take immediate action instead of waiting for help.' },
                                            { icon: 'fa-scale-balanced', text: 'Balanced emotional control', desc: 'Crisis situations were handled logically without panic or irrational anger.' },
                                            { icon: 'fa-check-double', text: 'Positive outcome orientation', desc: 'Every story concluded with a constructive and realistic ending.' }
                                        ].map((item, idx) => (
                                            <li key={idx} className="flex gap-4 p-4 rounded-2xl bg-gray-50/80 border border-gray-100 hover:border-orange-200 transition-colors">
                                                <div className="text-orange-500 mt-0.5"><i className={`fa-solid ${item.icon}`}></i></div>
                                                <div>
                                                    <p className="font-bold text-sm text-gray-900">{item.text}</p>
                                                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.desc}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                                    <Link href="/dashboard" className="flex-1 text-center py-3.5 bg-gray-900 hover:bg-black text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-gray-900/20">
                                        View Dashboard
                                    </Link>
                                    <button onClick={handleStart} className="flex-1 text-center py-3.5 bg-orange-50 hover:bg-orange-100 text-orange-600 text-sm font-bold rounded-xl transition-all border border-orange-200 shadow-sm">
                                        Retake TAT
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                )}

            </main>

            <Footer />
        </div>
    );
}
