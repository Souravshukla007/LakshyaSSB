'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { BrainCircuit, CheckCircle2, XCircle, Clock, Target, ArrowRight, Expand, Shrink, ChevronDown } from 'lucide-react';

interface QuestionResult {
    questionId: number;
    selectedOption: string | null;
    correctOption: string;
    category: string;
    difficulty: string;
    questionText: string;
    explanation: string;
    options: string[];
    isCorrect: boolean;
}

interface TestPayload {
    results: QuestionResult[];
    totalQuestions: number;
    timeTaken: number;
}

export default function OIRResultPage() {
    const router = useRouter();
    const [data, setData] = useState<TestPayload | null>(null);
    const [expandedQs, setExpandedQs] = useState<Record<number, boolean>>({});

    useEffect(() => {
        const raw = sessionStorage.getItem('oir_test_result');
        if (raw) {
            setData(JSON.parse(raw));
        } else {
            router.push('/practice/oir');
        }
    }, [router]);

    if (!data) return null;

    const correctAnswers = data.results.filter(r => r.isCorrect).length;
    const wrongAnswers = data.totalQuestions - correctAnswers;
    const accuracy = Math.round((correctAnswers / data.totalQuestions) * 100) || 0;

    // Performance classification
    let performanceLabel = 'Needs Improvement';
    let performanceColor = 'text-red-600 bg-red-100 border-red-200';
    if (accuracy >= 80) {
        performanceLabel = 'Excellent';
        performanceColor = 'text-green-700 bg-green-100 border-green-200';
    } else if (accuracy >= 60) {
        performanceLabel = 'Good';
        performanceColor = 'text-blue-700 bg-blue-100 border-blue-200';
    } else if (accuracy >= 40) {
        performanceLabel = 'Average';
        performanceColor = 'text-yellow-700 bg-yellow-100 border-yellow-200';
    }

    // Category wise performance
    const categoryStats = data.results.reduce((acc, curr) => {
        if (!acc[curr.category]) {
            acc[curr.category] = { total: 0, correct: 0 };
        }
        acc[curr.category].total += 1;
        if (curr.isCorrect) acc[curr.category].correct += 1;
        return acc;
    }, {} as Record<string, { total: number; correct: number }>);

    // Difficulty wise performance
    const difficultyStats = data.results.reduce((acc, curr) => {
        if (!acc[curr.difficulty]) {
            acc[curr.difficulty] = { total: 0, correct: 0 };
        }
        acc[curr.difficulty].total += 1;
        if (curr.isCorrect) acc[curr.difficulty].correct += 1;
        return acc;
    }, {} as Record<string, { total: number; correct: number }>);

    const toggleExpand = (id: number) => {
        setExpandedQs(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}m ${s}s`;
    };

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-[#fafaf9] pt-32 pb-24">
                <div className="max-w-5xl mx-auto px-6">

                    {/* Hero Result Card */}
                    <div className="bg-white rounded-[3rem] p-10 md:p-14 shadow-2xl border border-gray-100 text-center mb-12 relative overflow-hidden">
                        <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-brand-orange/5 rounded-full blur-3xl -z-0"></div>
                        <div className="absolute bottom-[-50px] left-[-50px] w-48 h-48 bg-blue-500/5 rounded-full blur-3xl -z-0"></div>

                        <div className="relative z-10 flex flex-col items-center">
                            <h1 className="font-hero font-bold text-3xl md:text-5xl text-brand-dark mb-4 drop-shadow-sm">
                                OIR Practice <span className="text-brand-orange">Result</span>
                            </h1>

                            <div className={`mt-6 mb-8 px-6 py-2 rounded-full border text-sm font-black uppercase tracking-widest ${performanceColor}`}>
                                {performanceLabel}
                            </div>

                            <div className="flex items-baseline justify-center gap-2 mb-8">
                                <span className="text-7xl md:text-8xl font-hero font-black text-brand-dark tracking-tighter">
                                    {correctAnswers}
                                </span>
                                <span className="text-3xl md:text-4xl font-bold text-gray-300">
                                    / {data.totalQuestions}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">

                        {/* Analytics Section */}
                        <div className="lg:col-span-2 space-y-8">

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                                    <Target className="w-6 h-6 text-blue-500 mb-2" />
                                    <span className="text-3xl font-hero font-bold text-brand-dark">{accuracy}%</span>
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Accuracy</span>
                                </div>
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                                    <CheckCircle2 className="w-6 h-6 text-green-500 mb-2" />
                                    <span className="text-3xl font-hero font-bold text-brand-dark">{correctAnswers}</span>
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Correct</span>
                                </div>
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                                    <XCircle className="w-6 h-6 text-red-500 mb-2" />
                                    <span className="text-3xl font-hero font-bold text-brand-dark">{wrongAnswers}</span>
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Wrong</span>
                                </div>
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                                    <Clock className="w-6 h-6 text-purple-500 mb-2" />
                                    <span className="text-2xl font-hero font-bold text-brand-dark">{formatTime(data.timeTaken)}</span>
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Time</span>
                                </div>
                            </div>

                            {/* Category Breakdown */}
                            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                                <h3 className="text-xl font-hero font-bold text-brand-dark mb-6 flex items-center gap-3">
                                    <BrainCircuit className="w-6 h-6 text-brand-orange" />
                                    Category Performance
                                </h3>
                                <div className="space-y-5">
                                    {Object.entries(categoryStats).map(([cat, stats]) => {
                                        const pct = Math.round((stats.correct / stats.total) * 100);
                                        return (
                                            <div key={cat}>
                                                <div className="flex justify-between items-end mb-2">
                                                    <span className="font-bold text-sm text-gray-700 uppercase tracking-wider">{cat}</span>
                                                    <span className="text-sm font-bold text-gray-500">{stats.correct} / {stats.total}</span>
                                                </div>
                                                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-400' : 'bg-red-500'
                                                            }`}
                                                        style={{ width: `${pct}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                        </div>

                        {/* AI Insights & Actions */}
                        <div className="space-y-8">
                            <div className="bg-brand-dark p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/20 rounded-bl-full blur-2xl"></div>
                                <h3 className="text-xl font-hero font-bold mb-6 flex items-center gap-2">
                                    <BrainCircuit className="w-5 h-5 text-brand-orange" />
                                    AI Insights
                                </h3>

                                <div className="space-y-6 relative z-10">
                                    <div>
                                        <div className="text-xs font-bold text-brand-orange uppercase tracking-wider mb-2">Top Strength</div>
                                        <div className="bg-white/10 px-4 py-3 rounded-xl border border-white/5 font-medium text-sm">
                                            {Object.entries(categoryStats).sort((a, b) => (b[1].correct / b[1].total) - (a[1].correct / a[1].total))[0]?.[0] || 'N/A'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Needs Polish</div>
                                        <div className="bg-white/10 px-4 py-3 rounded-xl border border-white/5 font-medium text-sm">
                                            {Object.entries(categoryStats).sort((a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total))[0]?.[0] || 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Difficulty Stats */}
                            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-hero font-bold text-brand-dark mb-4">Difficulty Analysis</h3>
                                <div className="space-y-4">
                                    {['easy', 'medium', 'hard'].map((diff) => {
                                        const stats = difficultyStats[diff];
                                        if (!stats) return null;
                                        return (
                                            <div key={diff} className="flex justify-between items-center p-3 rounded-xl bg-gray-50 border border-gray-100">
                                                <span className="font-bold text-sm text-gray-600 capitalize">{diff}</span>
                                                <span className="font-bold text-brand-dark">{stats.correct} <span className="text-gray-400">/ {stats.total}</span></span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <Link href="/practice/oir/test">
                                    <button className="w-full py-4 bg-brand-orange text-white rounded-full font-bold shadow-lg hover:bg-orange-600 transition-colors">
                                        Practice Again
                                    </button>
                                </Link>
                                <Link href="/dashboard">
                                    <button className="w-full py-4 bg-white border-2 border-gray-200 text-gray-600 rounded-full font-bold hover:bg-gray-50 transition-colors">
                                        Back to Dashboard
                                    </button>
                                </Link>
                            </div>

                        </div>

                    </div>

                    {/* Question Review Section */}
                    <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-sm border border-gray-100">
                        <h3 className="text-2xl font-hero font-bold text-brand-dark mb-8">Question Review</h3>

                        <div className="space-y-4">
                            {data.results.map((q, idx) => {
                                const isExpanded = expandedQs[q.questionId];
                                return (
                                    <div key={q.questionId} className={`border rounded-2xl transition-colors ${q.isCorrect ? 'border-green-100 bg-green-50/30' : 'border-red-100 bg-red-50/30'}`}>
                                        <button
                                            onClick={() => toggleExpand(q.questionId)}
                                            className="w-full text-left p-6 flex items-start gap-4"
                                        >
                                            <div className="mt-1">
                                                {q.isCorrect ? (
                                                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                                                ) : (
                                                    <XCircle className="w-6 h-6 text-red-500" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 flex gap-2">
                                                    <span>Q{idx + 1}</span>
                                                    <span>•</span>
                                                    <span>{q.category}</span>
                                                </div>
                                                <p className="font-bold text-brand-dark">{q.questionText}</p>
                                            </div>
                                            <div>
                                                {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400 rotate-180 transition-transform" /> : <ChevronDown className="w-5 h-5 text-gray-400 transition-transform" />}
                                            </div>
                                        </button>

                                        {isExpanded && (
                                            <div className="p-6 pt-0 border-t border-gray-100/50">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                                    <div className="p-4 rounded-xl bg-white border border-gray-200">
                                                        <span className="text-xs font-bold text-gray-400 uppercase block mb-1">Your Answer</span>
                                                        <span className={`font-bold ${q.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                                            {q.selectedOption || 'Skipped'}
                                                        </span>
                                                    </div>
                                                    <div className="p-4 rounded-xl bg-white border border-gray-200">
                                                        <span className="text-xs font-bold text-gray-400 uppercase block mb-1">Correct Answer</span>
                                                        <span className="font-bold text-green-600">{q.correctOption}</span>
                                                    </div>
                                                </div>
                                                {q.explanation && (
                                                    <div className="mt-4 p-5 rounded-xl bg-brand-orange/5 border border-brand-orange/10">
                                                        <span className="text-xs font-bold text-brand-orange uppercase block mb-2 tracking-widest">Explanation</span>
                                                        <p className="text-sm text-brand-dark font-noname leading-relaxed">{q.explanation}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>
            </div>
            <Footer />
        </>
    );
}
