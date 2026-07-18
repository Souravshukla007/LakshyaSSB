'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QuestionNavigator from '@/components/practice/QuestionNavigator';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import {
    loadBankFromCache,
    selectQuestions,
    type RawQuestion,
} from '@/lib/offline/practice-bank';
import OfflineFallback from '@/components/offline/OfflineFallback';



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
    const connectivity = useOnlineStatus();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [reviewStatus, setReviewStatus] = useState<Record<number, boolean>>({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    // Offline: practice bank unavailable / invalid -> render fallback, do not start flow (Req 4.6, 4.7)
    const [offlineUnavailable, setOfflineUnavailable] = useState(false);

    useEffect(() => {
        // Capture connectivity at test-start time. Offline flag drives the branch below.
        const startedOffline = connectivity === 'offline';

        // OFFLINE branch (Req 4.4-4.7, 7.1, 10.1): skip access checks and /api/oir/generate,
        // build the question pool from cached oir_* banks, and select client-side.
        async function loadOfflineQuestions() {
            // Discover available banks from the practice-bank index.
            let index: unknown;
            try {
                const idxRes = await fetch('/practice-banks/index.json');
                if (!idxRes.ok) throw new Error(`index status ${idxRes.status}`);
                index = await idxRes.json();
            } catch {
                // Index missing / unreachable -> practice unavailable offline.
                setOfflineUnavailable(true);
                return;
            }

            const banks = (index as { banks?: Array<{ id?: unknown }> } | null)?.banks;
            const oirBankIds = Array.isArray(banks)
                ? banks
                    .map((b) => b?.id)
                    .filter((id): id is string => typeof id === 'string' && id.startsWith('oir_'))
                : [];

            if (oirBankIds.length === 0) {
                setOfflineUnavailable(true);
                return;
            }

            // Merge all OIR category banks into a single pool (mirrors /api/oir/generate).
            const pool: RawQuestion[] = [];
            for (const bankId of oirBankIds) {
                try {
                    const bankQuestions = await loadBankFromCache(bankId);
                    pool.push(...bankQuestions);
                } catch {
                    // A single missing/invalid bank is skipped; other cached banks still count.
                }
            }

            if (pool.length === 0) {
                setOfflineUnavailable(true);
                return;
            }

            // Random count in [35, 50], clamped to the pool size (mirrors the online 35-50 rule).
            const randomCount = Math.min(
                Math.floor(Math.random() * (50 - 35 + 1)) + 35,
                pool.length
            );
            const selected = selectQuestions(pool, randomCount);

            // Normalize to the response shape the flow expects (id per paper + originalId).
            const mapped: Question[] = selected.map((q, idx) => {
                const raw = q as RawQuestion & { id?: number | string };
                return {
                    ...raw,
                    originalId: raw.id,
                    id: idx + 1,
                } as unknown as Question;
            });

            setQuestions(mapped);
            // Timing rule: 3 questions per minute => (count / 3) * 60 seconds
            setTimeLeft((mapped.length / 3) * 60);
        }

        async function loadQuestions() {
            try {
                if (startedOffline) {
                    await loadOfflineQuestions();
                    return;
                }

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

        // Store in session storage to pass to Result Page.
        // The OIR test is auto-scored client-side (isCorrect above), so results render
        // locally without any server round-trip — valid both online and offline (Req 4.5).
        sessionStorage.setItem('oir_test_result', JSON.stringify(payload));

        // Mark daily practice completion for streak system (non-blocking UX-safe).
        // Skipped while offline: the DB-backed streak call is online-only (Req 4.5, 10.1).
        if (connectivity === 'online') {
            fetch('/api/streak/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ activityType: 'OIR' }),
            }).catch(() => null);
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

    // Offline and no usable practice bank: show the fallback and do not start the flow.
    // In-progress answers state is preserved (component stays mounted) (Req 4.6, 4.7, 7.1).
    if (offlineUnavailable) {
        return (
            <main>
                <div className="min-h-screen bg-brand-bg pt-32 pb-20 px-6 flex items-start justify-center">
                    <OfflineFallback
                        title="Practice unavailable offline"
                        message="This OIR practice set hasn't been saved for offline use yet. Reconnect once to download it, then you can practice without a connection."
                        onRetry={() => window.location.reload()}
                    />
                </div>
            </main>
        );
    }

    if (questions.length === 0) return null;

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
