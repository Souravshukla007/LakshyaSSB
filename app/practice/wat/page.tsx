'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const OLQ_TAGS = ['Responsibility', 'Integrity', 'Self-Awareness'];

export default function WATTest() {
    const [response, setResponse] = useState('');
    const [timeLeft, setTimeLeft] = useState(14 * 60 + 59); // 14:59
    const [showSummary, setShowSummary] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <>
            <Navbar />

            <main>
                <div className="min-h-screen bg-brand-bg pt-32 pb-20 px-6">
                    <div className="max-w-4xl mx-auto">

                        {/* Top Section */}
                        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
                            <div>
                                <h1 className="font-hero font-bold text-3xl text-brand-dark mb-2">
                                    Word Association <span className="text-brand-orange">Test</span>
                                </h1>
                                <p className="text-sm text-gray-500 font-noname">
                                    Rapidly write your first thought for the word shown.
                                </p>
                                <div className="mt-4 flex items-center gap-4">
                                    <span className="px-3 py-1 bg-white border border-gray-100 rounded-full text-[10px] font-bold text-brand-orange">
                                        Word 12 / 60
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Time Remaining</div>
                                <div className="text-3xl font-hero font-bold text-brand-dark">
                                    {formatTime(timeLeft)}
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-2 bg-gray-200 rounded-full mb-12 overflow-hidden shadow-inner">
                            <div className="h-full bg-brand-orange w-[20%] rounded-full transition-all duration-300"></div>
                        </div>

                        {/* Main Question Card */}
                        <div className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-2xl text-center">
                            {/* Word */}
                            <div className="py-16">
                                <h2 className="text-6xl font-hero font-bold text-brand-dark tracking-tight">
                                    HONESTY
                                </h2>
                            </div>

                            {/* Response Input */}
                            <div className="max-w-md mx-auto">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                                    Your Response
                                </label>
                                <input
                                    type="text"
                                    value={response}
                                    onChange={(e) => setResponse(e.target.value)}
                                    placeholder="Type your first thought..."
                                    className="w-full text-center h-16 bg-brand-bg border-2 border-gray-50 rounded-2xl px-6 text-xl focus:outline-none focus:border-brand-orange transition-all font-noname"
                                />
                            </div>

                            {/* Navigation */}
                            <div className="flex gap-4 justify-center mt-12">
                                <button className="px-8 py-3 rounded-full border border-gray-100 text-xs font-bold text-gray-400 cursor-not-allowed">
                                    Previous
                                </button>
                                <button
                                    onClick={() => { setResponse(''); setShowSummary(true); }}
                                    className="px-10 py-3 rounded-full bg-brand-dark text-white text-xs font-bold hover:bg-brand-orange transition-all shadow-lg"
                                >
                                    Next Word
                                </button>
                            </div>
                        </div>

                        {/* Result Summary — reveals after clicking Next Word */}
                        {showSummary && (
                            <div className="mt-12 bg-brand-dark rounded-[3rem] p-10 text-white">
                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <h3 className="font-hero font-bold text-2xl text-brand-orange">Test Summary</h3>
                                        <p className="text-xs text-gray-400 mt-1">AI Evaluated Profile</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-4xl font-bold">7.2s</div>
                                        <div className="text-[10px] font-bold uppercase text-gray-500">Avg Reaction Time</div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 mb-8">
                                    {OLQ_TAGS.map((tag, i) => (
                                        <span
                                            key={tag}
                                            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${i === 1
                                                    ? 'bg-white/5 border-white/10 text-brand-orange'
                                                    : 'bg-white/5 border-white/10'
                                                }`}
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => { setShowSummary(false); setResponse(''); }}
                                        className="flex-1 py-4 border border-white/20 rounded-full text-xs font-bold hover:bg-white/5 transition-all"
                                    >
                                        Retry Test
                                    </button>
                                    <Link
                                        href="/olq-report"
                                        className="flex-1 py-4 bg-brand-orange text-white rounded-full text-xs font-bold text-center hover:bg-white hover:text-brand-dark transition-all"
                                    >
                                        View Full OLQ Analysis
                                    </Link>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </main>

            <Footer />
        </>
    );
}
