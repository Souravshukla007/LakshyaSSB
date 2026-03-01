"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import SrtIntro from '@/components/srt/SrtIntro';
import SrtTestInterface from '@/components/srt/SrtTestInterface';
import SrtResult from '@/components/srt/SrtResult';
import srt01 from '@/srt01.json';
import srt02 from '@/srt02.json';

const allQuestionsRaw = [...srt01, ...srt02];
const allQuestions = allQuestionsRaw.map((q, idx) => ({ ...q, id: idx + 1 })).slice(0, 60);

type AppState = 'intro' | 'test' | 'result';

export default function SrtTestPage() {
    const router = useRouter();
    const [state, setState] = useState<AppState>('intro');
    const [answers, setAnswers] = useState<Record<number, string>>({});

    const handleStart = () => {
        setState('test');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = (submittedAnswers: Record<number, string>) => {
        setAnswers(submittedAnswers);
        setState('result');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleRetake = () => {
        setAnswers({});
        setState('intro');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDashboard = () => {
        router.push('/dashboard');
    };

    return (
        <div className="min-h-screen bg-[#FFFBF6] bg-grid-pattern overflow-x-hidden font-sans">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#FFFBF6]/80 pointer-events-none -z-10"></div>

            {/* Top Navigation */}
            <div className="w-full py-4 px-6 md:px-12 flex justify-between items-center z-10 relative bg-white/50 backdrop-blur-sm border-b border-gray-100">
                <div className="text-2xl font-logo font-bold text-gray-900 tracking-tight flex items-center gap-2 cursor-pointer" onClick={handleDashboard}>
                    Lakshya<span className="text-[#F97316]">SSB</span>
                </div>
                {state !== 'test' && (
                    <button onClick={handleDashboard} className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                        Exit to Dashboard
                    </button>
                )}
            </div>

            <div className="px-4 py-8 md:py-12 sm:px-6 lg:px-8 max-w-7xl mx-auto flex items-center justify-center min-h-[calc(100vh-80px)]">
                <div className="w-full">
                    {state === 'intro' && <SrtIntro onStart={handleStart} />}
                    {state === 'test' && <SrtTestInterface questions={allQuestions} onSubmit={handleSubmit} />}
                    {state === 'result' && <SrtResult onRetake={handleRetake} onDashboard={handleDashboard} />}
                </div>
            </div>
        </div>
    );
}
