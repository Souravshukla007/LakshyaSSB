'use client';

import React from 'react';
import { Target, PlayCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function QuizSection() {
    const router = useRouter();

    return (
        <div className="bg-brand-dark rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden my-12 group">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-brand-orange/20 rounded-full blur-3xl z-0"></div>
            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-brand-orange/10 rounded-full blur-3xl z-0"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex-1">
                    <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold font-hero mb-6">
                        <Target className="w-4 h-4 mr-2 text-brand-orange" /> Weekly Challenge
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-white font-hero mb-4 leading-tight">
                        Current Affairs <span className="text-brand-orange">Quiz</span>
                    </h2>
                    <p className="text-gray-400 font-noname text-lg mb-8 max-w-xl">
                        Test your defence and geopolitical awareness with our weekly 10-question MCQ test. Designed specifically for SSB aspirants.
                    </p>
                    
                    <button
                        onClick={() => router.push('/current-affairs/quiz')}
                        className="inline-flex items-center px-8 py-4 bg-brand-orange text-white rounded-full font-bold text-lg hover:shadow-[0_0_30px_rgba(255,106,61,0.3)] transition-all hover:-translate-y-1"
                    >
                        <PlayCircle className="w-6 h-6 mr-2" /> Start Quiz
                    </button>
                </div>
                
                {/* Preview Card — improved contrast */}
                <div className="relative w-full max-w-sm hidden md:block">
                    <div className="absolute inset-0 bg-gradient-to-tr from-brand-orange to-orange-400 rounded-3xl transform rotate-6 opacity-20"></div>
                    <div className="bg-white/10 backdrop-blur-sm p-6 rounded-3xl border border-white/20 relative z-10 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-white font-bold font-hero">10 Questions</span>
                            <span className="bg-brand-orange/80 text-white text-xs font-bold px-3 py-1 rounded-full">10 Mins</span>
                        </div>
                        <div className="space-y-3">
                            {['Identify the correct missile system...', 'Which country recently joined...', 'The Agni-V missile has a range of...'].map((label, i) => (
                                <div key={i} className="h-12 bg-white/15 rounded-xl border border-white/20 flex items-center px-4">
                                    <span className="w-5 h-5 rounded-full border-2 border-white/40 mr-3 flex-shrink-0"></span>
                                    <span className="text-white/60 text-xs truncate">{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

