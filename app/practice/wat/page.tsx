'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import watData from '../../../wat01.json';

type GameState = 'start' | 'test' | 'result';

export default function WATModule() {
    const [gameState, setGameState] = useState<GameState>('start');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(15);
    const [response, setResponse] = useState('');
    const [answers, setAnswers] = useState<{ word_id: number, word: string, difficulty: 'easy' | 'medium' | 'hard', theme: string, user_sentence: string }[]>([]);

    // Evaluation state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [evaluationResult, setEvaluationResult] = useState<any>(null);

    const totalWords = 60; // Usually 60 words in WAT
    const wordsList = watData.slice(0, totalWords); // taking first 60 just in case

    // Timer Effect for Test Page
    useEffect(() => {
        if (gameState !== 'test') return;

        if (timeLeft === 0) {
            handleNextWord();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeLeft, gameState]);

    const handleStart = () => {
        setGameState('test');
        setCurrentIndex(0);
        setTimeLeft(15);
        setAnswers([]);
        setResponse('');
    };

    const handleNextWord = async () => {
        const currentWord = wordsList[currentIndex];

        const newAnswers = [...answers, {
            word_id: currentWord.id,
            word: currentWord.word,
            difficulty: currentWord.difficulty as 'easy' | 'medium' | 'hard',
            theme: currentWord.theme,
            user_sentence: response
        }];
        setAnswers(newAnswers);

        if (currentIndex < totalWords - 1) {
            setCurrentIndex(prev => prev + 1);
            setTimeLeft(15);
            setResponse('');
        } else {
            setGameState('result');
            await submitTest(newAnswers);
        }
    };

    const submitTest = async (finalAnswers: typeof answers) => {
        setIsSubmitting(true);
        try {
            // We use a mock user-id since authentication context isn't fully integrated into this specific component yet
            const userId = 'placeholder-user-id'; // Ideally this comes from useSession() or similar auth hook

            const res = await fetch('/api/wat/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': userId // simulating auth header 
                },
                body: JSON.stringify({ responses: finalAnswers })
            });

            if (res.ok) {
                const data = await res.json();
                setEvaluationResult(data.evaluation);
            } else {
                console.error("Failed to submit test:", await res.text());
            }
        } catch (error) {
            console.error("Error submitting test:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const RadarChart = ({ themeScores }: { themeScores?: Record<string, any> }) => {
        if (!themeScores) return null;

        const themes = Object.entries(themeScores).map(([theme, data]) => ({
            label: theme.replace('_', ' '),
            score: data.percentage
        }));

        return (
            <div className="w-full flex flex-col gap-5 mt-8">
                <h3 className="font-hero font-bold text-xl text-brand-dark mb-4">Theme Radar Chart</h3>

                {themes.map(item => (
                    <div key={item.label} className="flex flex-col gap-2">
                        <div className="flex justify-between text-sm font-bold font-noname text-gray-700">
                            <span>{item.label}</span>
                            <span>{item.score}%</span>
                        </div>
                        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-brand-orange rounded-full transition-all duration-1000"
                                style={{ width: `${item.score}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <main className="antialiased selection:bg-brand-orange selection:text-white font-sans bg-[#faf9f6]">
            <Navbar />

            {/* Background pattern */}
            <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] relative z-0">

                <div className="max-w-3xl mx-auto relative z-10">

                    {/* PAGE 1 - START */}
                    {gameState === 'start' && (
                        <div className="bg-white/95 backdrop-blur-md p-8 sm:p-14 rounded-[2.5rem] border border-white shadow-xl">
                            <div className="text-center mb-10">
                                <h1 className="font-hero font-bold text-4xl sm:text-5xl text-brand-dark mb-4 drop-shadow-sm">
                                    Word Association <span className="text-brand-orange">Test</span> (WAT)
                                </h1>
                                <p className="text-gray-500 font-noname text-lg">
                                    Reveal your subconscious officer-like qualities.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                                <div className="bg-brand-bg rounded-2xl p-6 text-center border border-gray-100 transition-transform hover:-translate-y-1">
                                    <div className="text-3xl font-bold text-brand-dark mb-1">60</div>
                                    <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Words</div>
                                </div>
                                <div className="bg-brand-bg rounded-2xl p-6 text-center border border-gray-100 transition-transform hover:-translate-y-1">
                                    <div className="text-3xl font-bold text-brand-dark mb-1">15m</div>
                                    <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Time Limit</div>
                                </div>
                                <div className="bg-brand-bg rounded-2xl p-6 text-center border border-gray-100 transition-transform hover:-translate-y-1">
                                    <div className="text-3xl font-bold text-brand-dark mb-1">15s</div>
                                    <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Per Word</div>
                                </div>
                            </div>

                            <div className="mb-12 bg-gray-50 rounded-2xl p-8 border border-gray-100 text-brand-dark font-noname">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <i className="fa-solid fa-clipboard-list text-brand-orange"></i> Instructions:
                                </h3>
                                <ul className="list-disc pl-5 space-y-3 text-gray-600 marker:text-brand-orange">
                                    <li>Write the <span className="font-bold text-brand-dark">first meaningful sentence</span> that comes to mind.</li>
                                    <li>Keep it <span className="font-bold text-brand-dark">positive and action-oriented</span>.</li>
                                    <li>Avoid philosophical explanations.</li>
                                    <li>Write a <span className="font-bold text-brand-dark">complete sentence</span>.</li>
                                </ul>
                            </div>

                            <div className="flex justify-center">
                                <button
                                    onClick={handleStart}
                                    className="w-full sm:w-auto px-16 py-5 rounded-full bg-brand-dark text-white font-bold text-lg hover:bg-brand-orange transition-all shadow-xl hover:shadow-brand-orange/30 hover:-translate-y-1"
                                >
                                    Start WAT
                                </button>
                            </div>
                        </div>
                    )}

                    {/* PAGE 2 - TEST MODE */}
                    {gameState === 'test' && (
                        <div className="space-y-8">
                            {/* Top Info Bar */}
                            <div className="flex justify-between items-center px-2">
                                <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full border border-gray-200 shadow-sm flex items-center gap-2">
                                    <i className="fa-solid fa-list-ol text-gray-400 text-sm"></i>
                                    <span className="text-sm font-bold text-brand-dark">
                                        Word <span className="text-brand-orange text-lg ml-1">{currentIndex + 1}</span> / {totalWords}
                                    </span>
                                </div>

                                <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full border border-gray-200 shadow-sm flex items-center gap-3">
                                    <i className={`fa-regular fa-clock ${timeLeft <= 3 ? 'text-red-500 animate-spin-slow' : 'text-gray-400'}`}></i>
                                    <span className={`text-xl font-bold tabular-nums ${timeLeft <= 3 ? 'text-red-500 animate-pulse' : 'text-brand-dark'}`}>
                                        00:{timeLeft.toString().padStart(2, '0')}
                                    </span>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                                <div
                                    className="h-full bg-brand-orange rounded-full transition-all duration-300 relative"
                                    style={{ width: `${((currentIndex) / totalWords) * 100}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                </div>
                            </div>

                            {/* Main Card */}
                            <div className="bg-white/95 backdrop-blur-md p-8 sm:p-14 rounded-[3rem] border border-white shadow-2xl text-center relative overflow-hidden transition-all duration-500">

                                <div className="absolute top-8 right-8">
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-sm ${wordsList[currentIndex]?.difficulty === 'easy' ? 'bg-green-100 text-green-700 border border-green-200' :
                                        wordsList[currentIndex]?.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                                            'bg-red-100 text-red-700 border border-red-200'
                                        }`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${wordsList[currentIndex]?.difficulty === 'easy' ? 'bg-green-500' :
                                            wordsList[currentIndex]?.difficulty === 'medium' ? 'bg-yellow-500' :
                                                'bg-red-500'
                                            }`}></div>
                                        {wordsList[currentIndex]?.difficulty || 'Medium'}
                                    </span>
                                </div>

                                {/* Word Display */}
                                <div className="py-20 min-h-[300px] flex flex-col justify-center items-center">
                                    <h2 className="text-5xl sm:text-7xl md:text-8xl font-hero font-bold text-brand-dark tracking-tighter uppercase mb-6 animate-fade-in">
                                        {wordsList[currentIndex]?.word || 'Loading...'}
                                    </h2>
                                    <div className="inline-block mt-4">
                                        <span className="px-5 py-2.5 bg-brand-bg border border-gray-200 rounded-full text-xs font-bold text-gray-500 shadow-sm">
                                            <i className="fa-solid fa-tag mr-2 opacity-50"></i>
                                            Theme: <span className="text-brand-orange">{wordsList[currentIndex]?.theme?.replace('_', ' ') || 'General'}</span>
                                        </span>
                                    </div>
                                </div>

                                {/* Input Area */}
                                <div className="max-w-xl mx-auto mt-4">
                                    <textarea
                                        value={response}
                                        onChange={(e) => setResponse(e.target.value)}
                                        placeholder="Write one complete sentence..."
                                        className="w-full h-36 bg-brand-bg border-2 border-gray-100 rounded-2xl p-6 text-xl text-brand-dark focus:outline-none focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/10 transition-all font-noname resize-none shadow-inner"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleNextWord();
                                            }
                                        }}
                                    />

                                    <div className="flex justify-between items-center mt-6">
                                        <div className="text-xs text-gray-400 font-bold tracking-wider uppercase">
                                            Press <kbd className="px-2 py-1 bg-gray-100 border border-gray-200 rounded-md shadow-sm mx-1">Enter ↵</kbd> to submit
                                        </div>
                                        <button
                                            onClick={handleNextWord}
                                            className="px-8 py-3.5 rounded-full bg-brand-dark text-white font-bold hover:bg-brand-orange transition-all shadow-lg hover:shadow-brand-orange/40 group flex items-center gap-2"
                                        >
                                            Next <i className="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PAGE 3 - RESULT */}
                    {gameState === 'result' && (
                        <div className="bg-white/95 backdrop-blur-md p-8 sm:p-16 rounded-[3rem] border border-white shadow-2xl">

                            {isSubmitting || !evaluationResult ? (
                                <div className="py-20 flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 border-4 border-gray-200 border-t-brand-orange rounded-full animate-spin mb-6"></div>
                                    <h2 className="text-2xl font-hero font-bold text-brand-dark mb-2">Analyzing Responses...</h2>
                                    <p className="text-gray-500 font-noname">Our AI engine is processing your word associations.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="text-center mb-12 border-b border-gray-100 pb-12">
                                        <h1 className="font-hero font-bold text-4xl sm:text-5xl text-brand-dark mb-6">
                                            WAT Psychological <span className="text-brand-orange">Evaluation</span>
                                        </h1>

                                        <div className="mt-10 flex justify-center">
                                            <div className="bg-brand-bg rounded-[2.5rem] p-10 border border-gray-100 shadow-sm relative">
                                                <div className="absolute -top-4 -right-4 text-4xl transform rotate-12 drop-shadow-md">🏆</div>
                                                <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Overall WAT Score</div>
                                                <div className="text-7xl font-hero font-bold text-brand-dark mb-6 drop-shadow-sm">
                                                    {evaluationResult.percentage_score}<span className="text-4xl text-gray-400 font-medium">/100</span>
                                                </div>
                                                <div className={`inline-flex items-center gap-2 px-5 py-2.5 border rounded-full text-sm font-bold shadow-sm ${evaluationResult.risk_level === 'LOW' ? 'bg-green-100 text-green-700 border-green-200' :
                                                        evaluationResult.risk_level === 'MODERATE' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                                            'bg-red-100 text-red-700 border-red-200'
                                                    }`}>
                                                    <div className={`w-2 h-2 rounded-full animate-pulse ${evaluationResult.risk_level === 'LOW' ? 'bg-green-500' :
                                                            evaluationResult.risk_level === 'MODERATE' ? 'bg-yellow-500' :
                                                                'bg-red-500'
                                                        }`}></div>
                                                    {evaluationResult.risk_level === 'LOW' ? 'Strong Officer Thinking' :
                                                        evaluationResult.risk_level === 'MODERATE' ? 'Moderate Development' :
                                                            'Weak Patterns'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-12 lg:gap-16 mb-16">
                                        <div>
                                            <RadarChart themeScores={evaluationResult.theme_scores} />
                                        </div>
                                        <div className="bg-brand-dark text-white p-10 rounded-[2.5rem] shadow-xl flex flex-col justify-center relative overflow-hidden group">
                                            <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-10 transition-opacity">
                                                <i className="fa-solid fa-brain text-9xl"></i>
                                            </div>
                                            <h3 className="font-hero font-bold text-2xl text-brand-orange mb-8 flex items-center gap-3">
                                                <i className="fa-solid fa-microscope"></i> Behavior Pattern Summary
                                            </h3>
                                            <ul className="space-y-5 font-noname text-gray-300 relative z-10 text-lg">
                                                <li className="flex items-start gap-4">
                                                    <div className="mt-1 bg-green-500/20 p-1.5 rounded-full">
                                                        <i className="fa-solid fa-check text-green-400 text-sm"></i>
                                                    </div>
                                                    Action-oriented mindset
                                                </li>
                                                <li className="flex items-start gap-4">
                                                    <div className="mt-1 bg-green-500/20 p-1.5 rounded-full">
                                                        <i className="fa-solid fa-check text-green-400 text-sm"></i>
                                                    </div>
                                                    Positive framing of challenges
                                                </li>
                                                <li className="flex items-start gap-4">
                                                    <div className="mt-1 bg-green-500/20 p-1.5 rounded-full">
                                                        <i className="fa-solid fa-check text-green-400 text-sm"></i>
                                                    </div>
                                                    Strong achievement drive
                                                </li>
                                                <li className="flex items-start gap-4">
                                                    <div className="mt-1 bg-yellow-500/20 p-1.5 rounded-full">
                                                        <i className="fa-solid fa-triangle-exclamation text-yellow-500 text-sm"></i>
                                                    </div>
                                                    <span className="text-gray-400">Needs improvement in emotional balance</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-6 justify-center pt-10 border-t border-gray-100">
                                        <button
                                            onClick={() => setGameState('start')}
                                            className="px-12 py-5 rounded-full border-2 border-brand-dark text-brand-dark font-bold text-lg hover:bg-brand-dark hover:text-white transition-all text-center"
                                        >
                                            <i className="fa-solid fa-rotate-right mr-2"></i> Retake WAT
                                        </button>
                                        <Link
                                            href="/practice"
                                            className="px-12 py-5 rounded-full bg-brand-orange text-white font-bold text-lg hover:bg-[#e06512] transition-all text-center shadow-xl hover:shadow-brand-orange/40 hover:-translate-y-1"
                                        >
                                            Go to Dashboard <i className="fa-solid fa-arrow-right ml-2"></i>
                                        </Link>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <Footer />
        </main>
    );
}
