'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface Question {
    id: number;
    question: string;
    options: string[];
    answer: string;
    difficulty: string;
    topic: string;
    explanation: string;
}

export default function OIRTestEngine() {
    const router = useRouter();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [reviewStatus, setReviewStatus] = useState<Record<number, boolean>>({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadQuestions() {
            try {
                // 1. Verify Access
                const accessRes = await fetch('/api/practice/check-access?module=OIR');
                if (accessRes.status === 401) {
                    router.push('/auth');
                    return;
                }
                const accessData = await accessRes.json();
                if (!accessData.allowed) {
                    router.push('/pricing');
                    return;
                }

                // 2. Consume Attempt (POST)
                await fetch('/api/practice/check-access', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ module: 'OIR' })
                });

                // 3. Load Questions
                const res = await fetch('/api/oir/generate');
                const data = await res.json();

                if (data.success && data.data) {
                    setQuestions(data.data);
                    // Timing rule: 3 questions per minute => (count / 3) * 60 seconds
                    const count = data.data.length;
                    setTimeLeft((count / 3) * 60);
                } else {
                    console.error("Failed to load questions");
                }
            } catch (err) {
                console.error("Error fetching OIR questions", err);
            } finally {
                setIsLoading(false);
            }
        }
        loadQuestions();
    }, [router]);

    // Timer Effect
    useEffect(() => {
        if (isLoading || questions.length === 0) return;

        if (timeLeft <= 0) {
            submitTest();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, isLoading, questions]);

    const submitTest = () => {
        // Generate evaluation payload
        const results = questions.map((q) => {
            const selectedOption = answers[q.id] || null;
            return {
                questionId: q.id,
                selectedOption,
                correctOption: q.answer,
                category: q.topic,
                difficulty: q.difficulty,
                questionText: q.question,
                explanation: q.explanation,
                options: q.options,
                isCorrect: selectedOption === q.answer
            };
        });

        const payload = {
            results,
            totalQuestions: questions.length,
            timeTaken: ((questions.length / 3) * 60) - timeLeft
        };

        // Store in session storage to pass to Result Page
        sessionStorage.setItem('oir_test_result', JSON.stringify(payload));
        router.push('/practice/oir/result');
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (Math.floor(seconds) % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const handleSelect = (val: string) => {
        if (!questions[currentIndex]) return;
        const qId = questions[currentIndex].id;
        setAnswers(prev => ({ ...prev, [qId]: val }));
    };

    const handleMarkReview = () => {
        if (!questions[currentIndex]) return;
        const qId = questions[currentIndex].id;
        setReviewStatus(prev => ({ ...prev, [qId]: !prev[qId] }));
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            submitTest();
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-brand-bg flex items-center justify-center font-hero text-2xl font-bold text-brand-dark">
                Generating your randomized OIR Test...
            </div>
        );
    }

    if (questions.length === 0) return null;

    const currentQ = questions[currentIndex];
    const qId = currentQ.id;
    const isReviewed = reviewStatus[qId];
    const selected = answers[qId] || null;

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
                                    Intelligence and Reasoning (Verbal & Non-Verbal)
                                </p>
                                <div className="mt-4 flex gap-4 items-center">
                                    <span className="px-3 py-1 bg-white border border-gray-100 rounded-full text-xs font-bold text-brand-orange">
                                        Question {currentIndex + 1} / {questions.length}
                                    </span>
                                    {isReviewed && (
                                        <span className="px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-full text-xs font-bold text-yellow-700">
                                            Marked for Review
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`text-[10px] font-bold uppercase mb-1 ${timeLeft < 60 ? 'text-red-500' : 'text-gray-400'}`}>
                                    Time Remaining
                                </div>
                                <div className={`text-4xl font-hero font-bold ${timeLeft < 60 ? 'text-red-500' : 'text-brand-dark'}`}>
                                    {formatTime(timeLeft)}
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-2 bg-gray-200 rounded-full mb-12 overflow-hidden shadow-inner flex">
                            {questions.map((q, idx) => {
                                const ans = answers[q.id];
                                const rev = reviewStatus[q.id];
                                let bg = 'bg-gray-200';
                                if (idx === currentIndex) bg = 'bg-brand-orange';
                                else if (rev) bg = 'bg-yellow-400';
                                else if (ans) bg = 'bg-green-500';

                                return (
                                    <div
                                        key={q.id}
                                        className={`h-full flex-1 ${bg} ${idx !== questions.length - 1 ? 'border-r border-white/20' : ''}`}
                                    ></div>
                                );
                            })}
                        </div>

                        {/* Question Card */}
                        <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-gray-100 shadow-2xl">
                            <div className="mb-10 text-brand-dark">
                                <div className="inline-block px-3 py-1 mb-6 text-xs font-bold text-brand-orange bg-brand-orange/10 rounded-lg uppercase tracking-wider">
                                    {currentQ.topic}
                                </div>
                                <h4 className="text-xl md:text-2xl font-hero font-bold mb-6 leading-relaxed">
                                    {currentQ.question}
                                </h4>
                            </div>

                            {/* Options */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                                {currentQ.options?.map((opt, i) => (
                                    <label
                                        key={i}
                                        onClick={() => handleSelect(opt)}
                                        className={`flex items-center gap-4 p-5 rounded-2xl border cursor-pointer transition-all ${selected === opt
                                            ? 'border-brand-orange bg-brand-orange/5'
                                            : 'border-gray-100 hover:border-brand-orange bg-gray-50/30'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name={`oir-opt-${currentQ.id}`}
                                            value={opt}
                                            checked={selected === opt}
                                            onChange={() => handleSelect(opt)}
                                            className="w-5 h-5 accent-[#FF5E3A]"
                                        />
                                        <span className="text-sm font-bold text-brand-dark">{opt}</span>
                                    </label>
                                ))}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-4">
                                <button
                                    onClick={handleMarkReview}
                                    className={`px-8 py-4 rounded-full border text-sm font-bold transition-all
                    ${isReviewed
                                            ? 'border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                                            : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                                        }`}
                                >
                                    {isReviewed ? 'Unmark Review' : 'Mark for Review'}
                                </button>
                                <button
                                    onClick={handleNext}
                                    className="flex-1 py-4 bg-brand-dark text-white rounded-full font-bold text-lg shadow-xl hover:bg-brand-orange transition-all"
                                >
                                    {currentIndex === questions.length - 1 ? 'Submit Test' : 'Save & Next'}
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
