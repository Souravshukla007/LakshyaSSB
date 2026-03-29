import React, { useState, useEffect } from 'react';
import QuestionNavigator from '@/components/practice/QuestionNavigator';

type Question = {
    id: number;
    question: string;
    difficulty?: string;
    theme?: string;
};

type SrtTestInterfaceProps = {
    questions: Question[];
    onSubmit: (answers: Record<number, string>) => void;
};

export default function SrtTestInterface({ questions, onSubmit }: SrtTestInterfaceProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [reviewStatus, setReviewStatus] = useState<Record<number, boolean>>({});
    const [timeLeft, setTimeLeft] = useState(30 * 60);

    const handleMarkReview = () => {
        if (!questions[currentIndex]) return;
        setReviewStatus(prev => ({ ...prev, [questions[currentIndex].id]: !prev[questions[currentIndex].id] }));
    };

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    onSubmit(answers);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [answers, onSubmit]);

    const currentQuestion = questions[currentIndex];
    const currentAnswer = answers[currentQuestion.id] || '';
    const answeredCount = Object.values(answers).filter(a => a.trim().length > 0).length;
    // Enable submit if >= 40 answers or time is up
    const canSubmit = answeredCount >= 40 || timeLeft === 0;

    const handleNext = () => {
        if (currentIndex < questions.length - 1) setCurrentIndex(prev => prev + 1);
    };

    const handlePrev = () => {
        if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
    };

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setAnswers({ ...answers, [currentQuestion.id]: e.target.value });
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (!currentQuestion) return null;

    return (
        <div className="w-full max-w-7xl mx-auto flex flex-col lg:grid lg:grid-cols-[1fr_320px] gap-8 min-h-[70vh] animate-fadeIn">
            
            {/* Left Column: Test Interface */}
            <div className="flex flex-col">
                {/* Top Bar */}
                <div className="bg-white/90 backdrop-blur-md shadow-sm rounded-2xl mb-6 p-4 flex justify-between items-center border border-gray-100">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handlePrev}
                        disabled={currentIndex === 0}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 hover:border-[#F97316] hover:text-[#F97316] transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:text-gray-700"
                    >
                        <span aria-hidden="true">←</span>
                        Back
                    </button>
                    <div className="bg-black text-white px-4 py-1.5 rounded-full text-sm font-medium">
                        Question {currentIndex + 1} of {questions.length}
                    </div>
                    <div className="text-sm text-gray-500 hidden sm:block">
                        {answeredCount} / {questions.length} Answered
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm hidden sm:inline">Time Remaining:</span>
                    <span className={`font-mono font-bold text-lg px-3 py-1 rounded-lg ${timeLeft < 300 ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-[#F97316]'}`}>
                        {formatTime(timeLeft)}
                    </span>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col gap-6 min-h-0 items-stretch">

                {/* Question Area */}
                <div className="bg-white/90 backdrop-blur-md shadow-card rounded-2xl p-6 md:p-10 border border-gray-100 flex flex-col justify-between h-full relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-orange-50 rounded-bl-full -z-10 opacity-50 mix-blend-multiply"></div>
                    
                    <div>
                        <h2 className="text-gray-500 font-medium mb-4 text-sm uppercase tracking-wider">Situation {currentIndex + 1}</h2>
                        <p className="text-3xl md:text-4xl font-medium text-gray-900 leading-relaxed mb-10">
                            {currentQuestion.question}
                        </p>
                    </div>

                    <div className="mt-auto">
                        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between gap-4 flex-wrap">
                            <button
                                onClick={handleMarkReview}
                                className={`px-6 py-3 rounded-xl border font-medium transition-all ${reviewStatus[currentQuestion.id] ? 'border-yellow-200 bg-yellow-50 text-yellow-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                            >
                                {reviewStatus[currentQuestion.id] ? 'Unmark Review' : 'Mark Review'}
                            </button>
                            <div className="flex gap-4 flex-1 justify-end">
                                <button
                                    onClick={handlePrev}
                                    disabled={currentIndex === 0}
                                    className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Prev
                                </button>
                                <button
                                    onClick={handleNext}
                                    disabled={currentIndex === questions.length - 1}
                                    className="bg-[#F97316] hover:bg-[#E06512] text-white py-3 px-8 rounded-xl font-medium shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            </div>

            {/* Right Column: Navigator Panel */}
            <div className="hidden lg:block relative z-10">
                <QuestionNavigator
                    questions={questions}
                    currentIndex={currentIndex}
                    answers={answers}
                    reviewStatus={reviewStatus}
                    onNavigate={setCurrentIndex}
                    onSubmit={() => onSubmit(answers)}
                    isSubmitDisabled={!canSubmit}
                />
            </div>

            {/* Mobile Navigator Overlay */}
            <div className="lg:hidden">
                <QuestionNavigator
                    questions={questions}
                    currentIndex={currentIndex}
                    answers={answers}
                    reviewStatus={reviewStatus}
                    onNavigate={setCurrentIndex}
                    onSubmit={() => onSubmit(answers)}
                    isSubmitDisabled={!canSubmit}
                />
            </div>
        </div>
    );
}
