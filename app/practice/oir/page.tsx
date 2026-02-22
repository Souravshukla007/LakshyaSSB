'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const OPTIONS = [
    { value: '56', label: '56' },
    { value: '72', label: '72' },
    { value: '48', label: '48' },
    { value: '128', label: '128' },
];

export default function OIRTest() {
    const [selected, setSelected] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(24 * 60 + 18); // 24:18 in seconds

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

                        {/* Header Row */}
                        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
                            <div>
                                <h1 className="font-hero font-bold text-3xl text-brand-dark mb-2">
                                    OIR <span className="text-brand-orange">Intelligence Test</span>
                                </h1>
                                <p className="text-sm text-gray-500 font-noname">
                                    Intelligence and Reasoning (Verbal &amp; Non-Verbal)
                                </p>
                                <div className="mt-4">
                                    <span className="px-3 py-1 bg-white border border-gray-100 rounded-full text-[10px] font-bold text-brand-orange">
                                        Question 5 / 40
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
                            <div className="h-full bg-brand-orange w-[12%] rounded-full"></div>
                        </div>

                        {/* Question Card */}
                        <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-2xl">
                            <div className="mb-10 text-brand-dark">
                                <h4 className="text-lg font-bold mb-6 font-noname">
                                    Which number should replace the question mark in the series below?
                                </h4>
                                <p className="text-3xl font-hero font-bold tracking-widest bg-brand-bg p-8 rounded-2xl text-center border border-gray-50">
                                    14, 28, 20, 40, 32, 64, ?
                                </p>
                            </div>

                            {/* Options */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                                {OPTIONS.map(({ value, label }) => (
                                    <label
                                        key={value}
                                        onClick={() => setSelected(value)}
                                        className={`flex items-center gap-4 p-5 rounded-2xl border cursor-pointer transition-all ${selected === value
                                                ? 'border-brand-orange bg-brand-orange/5'
                                                : 'border-gray-100 hover:border-brand-orange bg-gray-50/30'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="oir-opt"
                                            value={value}
                                            checked={selected === value}
                                            onChange={() => setSelected(value)}
                                            className="w-5 h-5 accent-[#FF5E3A]"
                                        />
                                        <span className="text-sm font-bold text-brand-dark">{label}</span>
                                    </label>
                                ))}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-4">
                                <button className="px-8 py-4 rounded-full border border-gray-100 text-xs font-bold text-gray-500 hover:bg-gray-50 transition-all">
                                    Mark for Review
                                </button>
                                <button className="flex-1 py-4 bg-brand-dark text-white rounded-full font-bold text-sm shadow-xl hover:bg-brand-orange transition-all">
                                    Save &amp; Next
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </main>

            <Footer />
        </>
    );
}
