'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import QuestionNavigator from '@/components/practice/QuestionNavigator';



interface Question {
    id: number;
    originalId?: number | string;
    question: string;
    options: string[];
    answer: string;
    difficulty: string;
    topic: string;
    highlightWord?: string;
    explanation: string;
}

function escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function inferSynonymWord(questionText: string) {
    const words = questionText.match(/[A-Za-z]+/g) || [];
    if (words.length === 0) return '';
    return words[words.length - 1];
}

export default function OIRTestEngine() {
    const router = useRouter();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [reviewStatus, setReviewStatus] = useState<Record<number, boolean>>({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    // submitTest is reachable from the timer expiry, the last "Next" press and the
    // explicit submit button. Without a guard, StrictMode's double effect run fired
    // it twice — two sessionStorage writes and two router.push calls.
    const hasSubmitted = useRef(false);

    useEffect(() => {
        let cancelled = false;

        async function loadQuestions() {
            try {
                // /api/oir/generate now requires auth AND consumes the free OIR
                // attempt server-side, so there is no separate "consume" POST for
                // the client to skip. Generating the paper IS the gate.
                // POST, not GET: this call consumes the free OIR attempt and writes
                // history, so it must not be a safe method a prefetch can trigger.
                const res = await fetch('/api/oir/generate', { method: 'POST' });

                if (res.status === 401) {
                    router.push('/auth');
                    return;
                }
                if (res.status === 403) {
                    router.push('/pricing');
                    return;
                }

                const data = await res.json().catch(() => null);

                if (cancelled) return;

                if (res.ok && data?.success && Array.isArray(data.data) && data.data.length > 0) {
                    setQuestions(data.data);
                    // Timing rule: 3 questions per minute => (count / 3) * 60 seconds
                    setTimeLeft((data.data.length / 3) * 60);
                } else {
                    // Used to fall through to `questions.length === 0` and render
                    // `null` — a blank white page with no message and no retry.
                    setLoadError(
                        data?.error ?? 'We could not generate your OIR test. Please try again.',
                    );
                }
            } catch (err) {
                console.error('Error fetching OIR questions', err);
                if (!cancelled) {
                    setLoadError('We could not reach the server. Check your connection and try again.');
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        loadQuestions();
        return () => { cancelled = true; };
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

    const submitTest = async () => {
        if (hasSubmitted.current) return;
        hasSubmitted.current = true;

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

        // Mark daily practice completion for the streak system.
        //
        // This used to be fire-and-forget immediately before `router.push`, so the
        // request was routinely aborted mid-flight and OIR silently never counted
        // toward the user's streak. `keepalive` lets it survive the navigation, and
        // awaiting it (with a short cap) means we normally see the result.
        try {
            await Promise.race([
                fetch('/api/streak/complete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ activityType: 'OIR' }),
                    keepalive: true,
                }),
                new Promise((resolve) => setTimeout(resolve, 2000)),
            ]);
        } catch (err) {
            console.error('[oir] streak completion failed', err);
        }

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

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-brand-bg flex items-center justify-center font-hero text-2xl font-bold text-brand-dark">
                Generating your randomized OIR Test...
            </div>
        );
    }

    if (loadError || questions.length === 0) {
        return (
            <main className="min-h-screen bg-brand-bg flex items-center justify-center px-6 py-20">
                <div className="max-w-lg w-full bg-white rounded-[2rem] border border-gray-100 shadow-xl p-10 text-center">
                    <div className="w-16 h-16 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-6">
                        <i className="fa-solid fa-circle-exclamation text-2xl text-red-500" aria-hidden="true"></i>
                    </div>
                    <h1 className="font-hero font-bold text-2xl text-brand-dark mb-3">
                        Could not start your OIR test
                    </h1>
                    <p className="text-gray-500 font-noname mb-8">
                        {loadError ?? 'No questions were returned. Please try again.'}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={() => window.location.reload()}
                            className="px-8 py-3.5 rounded-full bg-brand-dark text-white font-bold hover:bg-brand-orange transition-all shadow-lg"
                        >
                            Try again
                        </button>
                        <Link
                            href="/practice"
                            className="px-8 py-3.5 rounded-full bg-white border-2 border-gray-100 text-brand-dark font-bold hover:border-gray-200 hover:bg-gray-50 transition-all"
                        >
                            Back to practice
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    const currentQ = questions[currentIndex];
    const qId = currentQ.id;
    const isReviewed = reviewStatus[qId];
    const selected = answers[qId] || null;
    const synonymHighlight = currentQ.topic?.toLowerCase() === 'synonym'
        ? (currentQ.highlightWord?.trim() || inferSynonymWord(currentQ.question))
        : '';

    return (
        <>
            

            <main>
                <div className="min-h-screen bg-brand-bg pt-32 pb-20 px-6">
                    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
                        
                        {/* Left Column: Test Interface */}
                        <div className="flex flex-col">
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
                                    {synonymHighlight
                                        ? currentQ.question.split(new RegExp(`(${escapeRegex(synonymHighlight)})`, 'i')).map((part, idx) => {
                                            if (part.toLowerCase() === synonymHighlight.toLowerCase()) {
                                                return (
                                                    <u key={idx} className="decoration-2 decoration-brand-orange underline-offset-4">
                                                        {part}
                                                    </u>
                                                );
                                            }
                                            return <span key={idx}>{part}</span>;
                                        })
                                        : currentQ.question}
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
                                    onClick={handlePrev}
                                    disabled={currentIndex === 0}
                                    className="px-8 py-4 rounded-full border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Back
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

                        {/* Right Column: Navigator Panel */}
                        <div className="hidden lg:block">
                            <QuestionNavigator
                                questions={questions}
                                currentIndex={currentIndex}
                                answers={answers}
                                reviewStatus={reviewStatus}
                                onNavigate={setCurrentIndex}
                                onSubmit={submitTest}
                            />
                        </div>
                    </div>
                </div>

                {/* Mobile Navigator Overlay */}
                <div className="lg:hidden">
                    <QuestionNavigator
                        questions={questions}
                        currentIndex={currentIndex}
                        answers={answers}
                        reviewStatus={reviewStatus}
                        onNavigate={setCurrentIndex}
                        onSubmit={submitTest}
                    />
                </div>
            </main>

            
        </>
    );
}
