'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Clock, Trophy, Target } from 'lucide-react';
import { QuizQuestion } from './QuizInterface';

interface QuizResultProps {
    questions: QuizQuestion[];
    userAnswers: Record<number, string>;
    timeTaken: number; // in seconds
}

export default function QuizResult({ questions, userAnswers, timeTaken }: QuizResultProps) {
    const [isSubmitting, setIsSubmitting] = useState(true);
    
    // Calculate Score
    const score = questions.reduce((acc, q, idx) => {
        return acc + (userAnswers[idx] === q.answer ? 1 : 0);
    }, 0);
    const accuracy = Math.round((score / questions.length) * 100) || 0;

    useEffect(() => {
        // Submit Result to Database to update medals and streak
        const submitScore = async () => {
            try {
                await fetch('/api/quiz/current-affairs/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ score, totalQuestions: questions.length, timeTaken })
                });
            } catch (error) {
                console.error("Failed to submit score", error);
            } finally {
                setIsSubmitting(false);
            }
        };
        submitScore();
    }, [score, questions.length, timeTaken]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}m ${s}s`;
    };

    return (
        <div className="max-w-4xl mx-auto animate-fadeIn">
            {/* Top Stats Dashboard */}
            <div className="bg-white rounded-3xl p-8 mb-8 shadow-soft border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                    <h2 className="font-hero font-bold text-3xl text-brand-dark mb-2">Quiz Assessment Complete</h2>
                    <p className="text-gray-500 font-noname text-sm">
                        {isSubmitting ? "Syncing results with Leaderboard..." : "Results synced successfully! +10 Medals!"}
                    </p>
                </div>
                
                <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex-shrink-0 min-w-[120px] text-center">
                        <Trophy className="w-6 h-6 text-brand-orange mx-auto mb-2" />
                        <div className="text-xl font-bold text-brand-dark font-hero">{score}/{questions.length}</div>
                        <div className="text-xs text-gray-500 font-bold uppercase mt-1">Score</div>
                    </div>
                    <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex-shrink-0 min-w-[120px] text-center">
                        <Target className="w-6 h-6 text-green-600 mx-auto mb-2" />
                        <div className="text-xl font-bold text-brand-dark font-hero">{accuracy}%</div>
                        <div className="text-xs text-gray-500 font-bold uppercase mt-1">Accuracy</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex-shrink-0 min-w-[120px] text-center">
                        <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                        <div className="text-xl font-bold text-brand-dark font-hero">{formatTime(timeTaken)}</div>
                        <div className="text-xs text-gray-500 font-bold uppercase mt-1">Time Taken</div>
                    </div>
                </div>
            </div>

            {/* AI Review Section */}
            <div className="space-y-6">
                <h3 className="font-hero font-bold text-2xl text-brand-dark mb-6 flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-brand-orange"></span>
                    Detailed Review & Explanations
                </h3>

                {questions.map((q, idx) => {
                    const chosen = userAnswers[idx];
                    const isCorrect = chosen === q.answer;
                    const isUnanswered = !chosen;

                    return (
                        <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
                            <div className={`absolute top-0 left-0 w-1.5 h-full ${isCorrect ? 'bg-green-500' : isUnanswered ? 'bg-gray-300' : 'bg-red-500'}`}></div>
                            
                            <div className="flex items-start gap-4 mb-4">
                                <div className="mt-1">
                                    {isCorrect ? (
                                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                                    ) : (
                                        <XCircle className="w-6 h-6 text-red-500" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-bold text-gray-400 mb-2 font-hero tracking-widest uppercase">Question {idx + 1}</div>
                                    <h4 className="text-lg font-bold text-gray-900 leading-tight">{q.question}</h4>
                                </div>
                            </div>

                            <div className="pl-10 mb-6">
                                <ul className="space-y-2">
                                    {q.options.map((opt, oIdx) => {
                                        const isThisTheCorrectAnswer = opt === q.answer;
                                        const isThisWhatUserChose = opt === chosen;
                                        
                                        let optionClass = "p-3 rounded-xl border text-sm font-noname ";
                                        if (isThisTheCorrectAnswer) {
                                            optionClass += "border-green-200 bg-green-50 text-green-800 font-bold";
                                        } else if (isThisWhatUserChose) {
                                            optionClass += "border-red-200 bg-red-50 text-red-800 line-through opacity-80";
                                        } else {
                                            optionClass += "border-gray-100 bg-gray-50 text-gray-500";
                                        }

                                        return (
                                            <li key={oIdx} className={optionClass}>
                                                {opt} {isThisTheCorrectAnswer && " ✓"} {isThisWhatUserChose && !isThisTheCorrectAnswer && " ✗"}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>

                            <div className="pl-10">
                                <div className="bg-brand-bg rounded-xl p-4 border border-orange-100/50">
                                    <div className="text-xs font-bold text-brand-orange uppercase tracking-wider mb-2 font-hero">
                                        Why it's correct
                                    </div>
                                    <p className="text-sm text-gray-600 leading-relaxed font-noname">
                                        {q.explanation}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <div className="mt-12 text-center">
                <a href="/dashboard" className="inline-flex items-center justify-center bg-brand-dark text-white px-8 py-4 rounded-xl font-bold shadow-glow hover:bg-brand-orange transition-all duration-300">
                    Return to Dashboard
                </a>
            </div>
        </div>
    );
}
