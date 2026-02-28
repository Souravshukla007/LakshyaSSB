import React, { useState, useEffect } from 'react';

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
    const [timeLeft, setTimeLeft] = useState(30 * 60);

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
        <div className="w-full max-w-6xl mx-auto flex flex-col min-h-[70vh] animate-fadeIn">
            {/* Top Bar */}
            <div className="bg-white/90 backdrop-blur-md shadow-sm rounded-2xl mb-6 p-4 flex justify-between items-center border border-gray-100">
                <div className="flex items-center gap-4">
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
            <div className="flex-1 grid md:grid-cols-2 gap-6 min-h-0 items-stretch">

                {/* Left Column: Question */}
                <div className="bg-white/90 backdrop-blur-md shadow-card rounded-2xl p-6 md:p-8 border border-gray-100 flex flex-col justify-start">
                    <h2 className="text-gray-500 font-medium mb-4 text-sm uppercase tracking-wider">Situation {currentIndex + 1}</h2>
                    <p className="text-2xl md:text-3xl font-medium text-gray-900 leading-relaxed mb-6">
                        {currentQuestion.question}
                    </p>

                    <div className="mt-auto hidden md:block opacity-70">
                        <div className="bg-orange-50 rounded-xl p-4 border border-orange-100/50 mt-8">
                            <p className="text-sm text-[#F97316] font-medium mb-1">Tips:</p>
                            <ul className="text-xs text-gray-600 space-y-1">
                                <li>• Write short, action-oriented points.</li>
                                <li>• Maximize practical outcomes.</li>
                                <li>• Don't assume non-existent resources.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Right Column: Interaction */}
                <div className="bg-white/90 backdrop-blur-md shadow-card rounded-2xl p-6 md:p-8 border border-gray-100 flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -z-10 opacity-50 mix-blend-multiply"></div>

                    <label className="block text-gray-700 font-medium mb-3" htmlFor="response">
                        Your Response
                    </label>
                    <textarea
                        id="response"
                        value={currentAnswer}
                        onChange={handleTextareaChange}
                        placeholder="Write your response in 2–3 lines..."
                        className="w-full flex-1 bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-800 resize-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none transition-all shadow-inner text-lg leading-relaxed min-h-[200px]"
                        maxLength={300}
                    />

                    <div className="flex justify-between items-center mt-3 text-sm">
                        <span className={`text-gray-400 ${currentAnswer.length >= 280 ? 'text-orange-500' : ''}`}>
                            {currentAnswer.length} / 300 characters
                        </span>
                        {currentAnswer.length > 0 && <span className="text-[#10B981] flex items-center gap-1"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Saved</span>}
                    </div>

                    <div className="mt-8 flex items-center justify-between gap-4">
                        <button
                            onClick={handlePrev}
                            disabled={currentIndex === 0}
                            className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={currentIndex === questions.length - 1}
                            className="flex-1 bg-[#F97316] hover:bg-[#E06512] text-white py-3 px-6 rounded-xl font-medium shadow-md shadow-orange-500/20 hover:shadow-orange-500/40 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next Situation
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer Submit */}
            <div className="mt-8 flex justify-center md:justify-end">
                <div className="relative group w-full md:w-auto">
                    <button
                        onClick={() => onSubmit(answers)}
                        disabled={!canSubmit}
                        className="bg-black hover:bg-gray-800 text-white py-4 px-10 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
                    >
                        Submit Test
                    </button>
                    {!canSubmit && (
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-gray-900 text-white text-xs py-2 px-3 rounded-lg text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            Answer at least 40 questions to submit early.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
