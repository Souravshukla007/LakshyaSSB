import React, { useState, useEffect } from 'react';

export interface QuizQuestion {
    question: string;
    options: string[];
    answer: string;
    explanation: string;
}

interface QuizInterfaceProps {
    questions: QuizQuestion[];
    onSubmit: (answers: Record<number, string>, timeElapsed: number) => void;
}

export default function QuizInterface({ questions, onSubmit }: QuizInterfaceProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [reviewStatus, setReviewStatus] = useState<Record<number, boolean>>({});
    const [timeLeft, setTimeLeft] = useState(10 * 60); // 10 minutes

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    onSubmit(answers, 0); // 0 timeLeft passed
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [answers, onSubmit]);

    const handleMarkReview = () => {
        setReviewStatus(prev => ({ ...prev, [currentIndex]: !prev[currentIndex] }));
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) setCurrentIndex(prev => prev + 1);
    };

    const handlePrev = () => {
        if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
    };

    const handleOptionSelect = (option: string) => {
        setAnswers(prev => ({ ...prev, [currentIndex]: option }));
    };
    
    const handleClear = () => {
        const newAnswers = { ...answers };
        delete newAnswers[currentIndex];
        setAnswers(newAnswers);
    };

    const handleFinalSubmit = () => {
        if (confirm("Are you sure you want to submit the quiz? You cannot change your answers after submitting.")) {
            onSubmit(answers, timeLeft);
        }
    }

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) return null;

    const answeredCount = Object.keys(answers).length;

    return (
        <div className="w-full mx-auto flex flex-col lg:grid lg:grid-cols-[1fr_320px] gap-8 min-h-[70vh] animate-fadeIn">
            {/* Left Column: Test Interface */}
            <div className="flex flex-col">
                {/* Top Bar */}
                <div className="bg-white/90 backdrop-blur-md shadow-sm rounded-2xl mb-6 p-4 flex justify-between items-center border border-gray-100">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handlePrev}
                            disabled={currentIndex === 0}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 hover:border-brand-orange hover:text-brand-orange transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span aria-hidden="true">←</span> Back
                        </button>
                        <div className="bg-brand-dark text-white px-4 py-1.5 rounded-full text-sm font-bold font-hero tracking-wide">
                            Q {currentIndex + 1} / {questions.length}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-sm hidden sm:inline font-bold">Time:</span>
                        <span className={`font-mono font-bold text-lg px-3 py-1 rounded-lg ${timeLeft < 60 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-orange-50 text-brand-orange'}`}>
                            {formatTime(timeLeft)}
                        </span>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 grid md:grid-cols-2 gap-6 items-stretch">
                    {/* Left side: Question Text */}
                    <div className="bg-white/90 backdrop-blur-md shadow-card rounded-2xl p-6 md:p-8 border border-gray-100 flex flex-col justify-start">
                        <h2 className="text-gray-400 font-bold mb-4 text-xs uppercase tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-brand-orange"></span>
                            Current Affairs MCQ
                        </h2>
                        <p className="text-xl md:text-2xl font-bold text-gray-900 leading-tight mb-6 font-hero">
                            {currentQuestion.question}
                        </p>
                    </div>

                    {/* Right side: Options */}
                    <div className="bg-white/90 backdrop-blur-md shadow-card rounded-2xl p-6 md:p-8 border border-gray-100 flex flex-col relative">
                        <div className="space-y-3 flex-1 mb-8">
                            {currentQuestion.options.map((option, idx) => {
                                const isSelected = answers[currentIndex] === option;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleOptionSelect(option)}
                                        className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 ${
                                            isSelected 
                                                ? 'border-brand-orange bg-orange-50/50 shadow-sm' 
                                                : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                            isSelected ? 'border-brand-orange' : 'border-gray-300'
                                        }`}>
                                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-brand-orange" />}
                                        </div>
                                        <span className={`text-sm md:text-base font-noname ${isSelected ? 'font-bold text-brand-dark' : 'text-gray-600'}`}>
                                            {option}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        
                        <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-100">
                            <button
                                onClick={handleClear}
                                disabled={!answers[currentIndex]}
                                className="text-sm font-bold text-gray-400 hover:text-brand-orange disabled:opacity-30 transition-colors"
                            >
                                Clear Response
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                    <button
                        onClick={handleMarkReview}
                        className={`px-6 py-3 rounded-xl border-2 font-bold transition-all text-sm ${reviewStatus[currentIndex] ? 'border-yellow-400 bg-yellow-50 text-yellow-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                    >
                        {reviewStatus[currentIndex] ? '★ Marked for Review' : '☆ Mark Review'}
                    </button>
                    
                    <button
                        onClick={currentIndex === questions.length - 1 ? handleFinalSubmit : handleNext}
                        className="bg-brand-dark hover:bg-brand-orange text-white py-3 px-8 rounded-xl font-bold text-sm transition-all duration-300 shadow-glow"
                    >
                        {currentIndex === questions.length - 1 ? 'Submit Quiz' : 'Save & Next'}
                    </button>
                </div>
            </div>

            {/* Right Column: Question Navigator */}
            <div className="bg-white/90 backdrop-blur-md border border-gray-100 rounded-2xl p-6 shadow-soft h-fit sticky top-24">
                <h3 className="font-hero font-bold text-lg text-brand-dark mb-6">Quiz Overview</h3>
                
                <div className="grid grid-cols-5 gap-2 mb-8">
                    {questions.map((_, idx) => {
                        const isAnswered = !!answers[idx];
                        const isReview = reviewStatus[idx];
                        const isCurrent = currentIndex === idx;
                        
                        let baseClasses = "w-10 h-10 rounded-lg text-xs font-bold transition-all flex items-center justify-center border-2 ";
                        if (isCurrent) baseClasses += "border-brand-dark ring-2 ring-brand-dark/20 ";
                        else if (isReview) baseClasses += "border-yellow-400 bg-yellow-50 text-yellow-700 ";
                        else if (isAnswered) baseClasses += "border-brand-orange bg-brand-orange text-white ";
                        else baseClasses += "border-gray-100 bg-gray-50 text-gray-400 hover:bg-gray-100 ";

                        return (
                            <button key={idx} onClick={() => setCurrentIndex(idx)} className={baseClasses}>
                                {idx + 1}
                            </button>
                        );
                    })}
                </div>

                <div className="space-y-3 text-sm font-noname text-gray-600 mb-8 border-t border-gray-100 pt-6">
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded bg-brand-orange"></div>
                        <span>Answered ({answeredCount})</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded bg-yellow-400"></div>
                        <span>Marked for Review</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded bg-gray-100 border border-gray-200"></div>
                        <span>Unanswered ({questions.length - answeredCount})</span>
                    </div>
                </div>

                <button
                    onClick={handleFinalSubmit}
                    className="w-full bg-brand-dark hover:bg-brand-orange text-white font-bold rounded-xl py-4 transition-all"
                >
                    Submit Final Test
                </button>
            </div>
        </div>
    );
}
