'use client';

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import QuizInterface from '@/components/current-affairs/QuizInterface';
import QuizResult from '@/components/current-affairs/QuizResult';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import OfflineFallback from '@/components/offline/OfflineFallback';

export default function CurrentAffairsQuizPage() {
    const connectivity = useOnlineStatus();
    const [status, setStatus] = useState<'intro' | 'playing' | 'result'>('intro');
    const [quizData, setQuizData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // Result states
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [timeTaken, setTimeTaken] = useState(0);

    const startQuiz = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/quiz/current-affairs');
            const data = await res.json();
            
            if (data.success && data.questions) {
                setQuizData(data.questions);
                setStatus('playing');
            } else {
                alert("Failed to load quiz. Please try again later.");
            }
        } catch (error) {
            console.error(error);
            alert("Error loading quiz.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuizSubmit = (answers: Record<number, string>, timeLeft: number) => {
        setUserAnswers(answers);
        setTimeTaken(600 - timeLeft); // 10 mins (600s) default
        setStatus('result');
    };

    // Online-only capability: the quiz is generated/scored server-side via AI. While offline,
    // render the friendly fallback instead of a failing loader. Re-enables automatically when
    // connectivity returns (Req 7.1, 7.5, 7.6).
    if (connectivity === 'offline') {
        return (
            <main className="antialiased font-sans bg-brand-bg relative min-h-screen pt-32 pb-20 px-6 flex items-start justify-center">
                <OfflineFallback
                    title="Quiz needs internet"
                    message="This feature needs an internet connection."
                />
            </main>
        );
    }

    return (
        <main className="antialiased font-sans bg-brand-bg relative min-h-screen pt-32 pb-20 px-6">
            <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>

            <div className="max-w-7xl mx-auto relative z-10">
                {status === 'intro' && (
                    <div className="max-w-3xl mx-auto text-center bg-white rounded-3xl p-10 md:p-16 shadow-soft border border-gray-100 animate-fadeIn">
                        <span className="inline-block px-4 py-1.5 bg-orange-100 text-brand-orange text-sm font-bold rounded-full mb-6 font-hero">
                            Daily Challenge
                        </span>
                        <h1 className="font-hero font-bold text-4xl md:text-5xl text-brand-dark mb-6">
                            Current Affairs Quiz
                        </h1>
                        <p className="text-gray-500 text-lg mb-10 font-noname leading-relaxed">
                            Test your knowledge of the latest defence, geopolitical, and national news. 
                            Generated fresh daily by AI to keep you SSB-ready.
                        </p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                            <div className="p-4 bg-brand-bg rounded-2xl border border-gray-100">
                                <div className="text-brand-orange font-bold text-2xl mb-1 font-hero">10</div>
                                <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Questions</div>
                            </div>
                            <div className="p-4 bg-brand-bg rounded-2xl border border-gray-100">
                                <div className="text-brand-orange font-bold text-2xl mb-1 font-hero">10m</div>
                                <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Time Limit</div>
                            </div>
                            <div className="p-4 bg-brand-bg rounded-2xl border border-gray-100">
                                <div className="text-brand-orange font-bold text-2xl mb-1 font-hero">+1</div>
                                <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Per Correct</div>
                            </div>
                            <div className="p-4 bg-brand-bg rounded-2xl border border-gray-100">
                                <div className="text-brand-orange font-bold text-2xl mb-1 font-hero">1</div>
                                <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Attempt/Day</div>
                            </div>
                        </div>

                        <button 
                            onClick={startQuiz}
                            disabled={isLoading}
                            className="bg-brand-dark text-white px-10 py-5 rounded-full font-bold text-lg hover:bg-brand-orange transition-all duration-300 hover:shadow-glow disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center gap-3 w-full sm:w-auto justify-center"
                        >
                            {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Fetching Intel...</> : 'Start Assessment'}
                        </button>
                    </div>
                )}

                {status === 'playing' && (
                    <QuizInterface 
                        questions={quizData} 
                        onSubmit={handleQuizSubmit} 
                    />
                )}

                {status === 'result' && (
                    <QuizResult 
                        questions={quizData} 
                        userAnswers={userAnswers} 
                        timeTaken={timeTaken} 
                    />
                )}
            </div>
        </main>
    );
}
