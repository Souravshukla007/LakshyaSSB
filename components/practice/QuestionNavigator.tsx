'use client';

import React, { useState } from 'react';

interface Question {
    id: number;
    [key: string]: any;
}

interface QuestionNavigatorProps {
    questions: Question[];
    currentIndex: number;
    answers: Record<number, string>;
    reviewStatus: Record<number, boolean>;
    onNavigate: (index: number) => void;
    onSubmit: () => void;
    isSubmitDisabled?: boolean;
}

// ─── Top-level sub-components (must be outside parent to prevent remount) ───

interface QuestionGridProps {
    questions: Question[];
    currentIndex: number;
    answers: Record<number, string>;
    reviewStatus: Record<number, boolean>;
    onQuestionClick: (idx: number) => void;
}
const QuestionGrid = ({ questions, currentIndex, answers, reviewStatus, onQuestionClick }: QuestionGridProps) => (
    <div className="grid grid-cols-5 gap-2 max-h-[30vh] lg:max-h-[40vh] overflow-y-auto mb-6 pr-1 custom-scrollbar">
        {questions.map((q, idx) => {
            const isCurrent = idx === currentIndex;
            const isAnswered = answers[q.id] && String(answers[q.id]).trim().length > 0;
            const isReview = reviewStatus[q.id];

            let bgClass = 'bg-gray-100 text-gray-600 hover:bg-gray-200';
            let borderClass = 'border-transparent';

            if (isCurrent) {
                bgClass = 'bg-black text-white hover:bg-gray-800';
            } else if (isAnswered) {
                bgClass = 'bg-[#10B981] text-white hover:bg-[#059669]';
            }

            if (isReview && !isCurrent) {
                borderClass = 'border-2 border-[#F97316]';
                if (!isAnswered) {
                    bgClass = 'bg-orange-50 text-orange-700 hover:bg-orange-100';
                }
            }

            return (
                <button
                    key={q.id}
                    onClick={() => onQuestionClick(idx)}
                    className={`w-full aspect-square flex items-center justify-center rounded-xl text-sm font-bold transition-all shadow-sm ${bgClass} ${borderClass}`}
                >
                    {idx + 1}
                </button>
            );
        })}
    </div>
);

interface SubmitConfirmModalProps {
    notAnswered: number;
    onCancel: () => void;
    onConfirm: () => void;
}
const SubmitConfirmModal = ({ notAnswered, onCancel, onConfirm }: SubmitConfirmModalProps) => (
    <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm rounded-[2rem] flex flex-col items-center justify-center p-6 text-center shadow-lg border border-gray-100 pointer-events-auto">
        <div className="w-16 h-16 bg-brand-orange/10 text-brand-orange rounded-full flex items-center justify-center text-2xl mb-4">
            <i className="fa-solid fa-paper-plane"></i>
        </div>
        <h3 className="text-xl font-bold text-brand-dark mb-2">Submit Test?</h3>
        <p className="text-sm text-gray-500 mb-6">
            Are you sure you want to submit? You have {notAnswered} unanswered questions.
        </p>
        <div className="flex gap-3 w-full">
            <button
                onClick={onCancel}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-colors"
            >
                Cancel
            </button>
            <button
                onClick={onConfirm}
                className="flex-1 py-3 bg-black hover:bg-gray-800 text-white rounded-xl font-bold text-sm shadow-md transition-colors"
            >
                Submit
            </button>
        </div>
    </div>
);

// ─── Main Component ───

export default function QuestionNavigator({
    questions,
    currentIndex,
    answers,
    reviewStatus,
    onNavigate,
    onSubmit,
    isSubmitDisabled = false,
}: QuestionNavigatorProps) {
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

    // Calculate stats
    let answered = 0;
    let review = 0;
    questions.forEach((q) => {
        if (answers[q.id] && String(answers[q.id]).trim().length > 0) answered++;
        if (reviewStatus[q.id]) review++;
    });
    const notAnswered = questions.length - answered;

    const handleQuestionClick = (index: number) => {
        onNavigate(index);
        if (window.innerWidth < 1024) setIsMobileOpen(false);
    };

    // Inlined content JSX — NOT a component, just a helper that returns JSX
    // This avoids React remounting on every render (which resets scroll)
    const renderContent = () => (
        <>
            <div className="mb-6">
                <h3 className="text-xl font-hero font-bold text-brand-dark">Question Navigator</h3>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mt-1">Track your progress</p>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 text-xs font-medium text-gray-600 mb-6 pb-6 border-b border-gray-100">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#10B981]"></span> Answered</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-gray-200"></span> Not Answered</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full border-2 border-[#F97316]"></span> Review</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-black"></span> Current</div>
            </div>

            {/* Progress */}
            <div className="flex flex-wrap gap-2 mb-6">
                <div className="bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-green-100 flex-1 text-center">
                    <div className="text-lg leading-none mb-1">{answered}</div>Answered
                </div>
                <div className="bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-100 flex-1 text-center">
                    <div className="text-lg leading-none mb-1">{notAnswered}</div>Not Ans
                </div>
                <div className="bg-orange-50 text-orange-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-orange-100 flex-1 text-center">
                    <div className="text-lg leading-none mb-1">{review}</div>Review
                </div>
            </div>

            {/* Question Grid — stable top-level component, scroll preserved */}
            <QuestionGrid
                questions={questions}
                currentIndex={currentIndex}
                answers={answers}
                reviewStatus={reviewStatus}
                onQuestionClick={handleQuestionClick}
            />

            <div className="mt-auto pt-4 border-t border-gray-100">
                <button
                    disabled={isSubmitDisabled}
                    onClick={() => setShowSubmitConfirm(true)}
                    className="w-full py-4 bg-brand-dark hover:bg-black text-white rounded-2xl font-bold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Submit Test
                </button>
            </div>

            {showSubmitConfirm && (
                <SubmitConfirmModal
                    notAnswered={notAnswered}
                    onCancel={() => setShowSubmitConfirm(false)}
                    onConfirm={() => { setShowSubmitConfirm(false); onSubmit(); }}
                />
            )}
        </>
    );

    return (
        <>
            {/* Desktop Layout */}
            <div className="hidden lg:flex flex-col bg-white rounded-[2.5rem] p-6 lg:p-8 border border-gray-100 shadow-xl h-full sticky top-32 max-h-[calc(100vh-160px)] relative overflow-hidden">
                {renderContent()}
            </div>

            {/* Mobile Layout */}
            <div className="lg:hidden">
                <button
                    onClick={() => setIsMobileOpen(true)}
                    className="fixed bottom-6 right-6 z-40 bg-brand-dark text-white px-5 py-3 rounded-full shadow-2xl font-bold flex items-center gap-2 hover:bg-black transition-all border border-gray-700"
                >
                    <i className="fa-solid fa-layer-group"></i> Navigator
                </button>

                {isMobileOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsMobileOpen(false)}
                    />
                )}

                <div className={`fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-[2.5rem] p-6 transition-transform duration-300 ease-out transform shadow-[0_-10px_40px_rgba(0,0,0,0.1)] ${isMobileOpen ? 'translate-y-0' : 'translate-y-full'}`}>
                    <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6"></div>
                    {renderContent()}
                </div>
            </div>
        </>
    );
}
