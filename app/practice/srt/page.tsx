"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import SrtIntro from '@/components/srt/SrtIntro';
import SrtTestInterface from '@/components/srt/SrtTestInterface';
import SrtResult from '@/components/srt/SrtResult';
import srt01 from '@/data/practice/srt01.json';
import srt02 from '@/data/practice/srt02.json';
import {
    EvaluationError,
    toEvaluationFailure,
    type EvaluationFailure,
} from '@/components/practice/EvaluationState';

const allQuestionsRaw = [...srt01, ...srt02];
const allQuestions = allQuestionsRaw.map((q, idx) => ({ ...q, id: idx + 1 })).slice(0, 60);

type AppState = 'intro' | 'test' | 'result';

export default function SrtTestPage() {
    const router = useRouter();
    const [state, setState] = useState<AppState>('intro');
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [evaluationResult, setEvaluationResult] = useState<any>(null);
    const [failure, setFailure] = useState<EvaluationFailure | null>(null);

    const handleStart = async () => {
        // Advisory pre-flight only — /api/srt/submit holds the authoritative gate.
        const accessRes = await fetch('/api/practice/check-access?module=SRT');
        if (accessRes.status === 401) {
            router.push('/auth');
            return;
        }
        const accessData = await accessRes.json();
        if (!accessData.allowed) {
            router.push('/pricing');
            return;
        }

        setEvaluationResult(null);
        setFailure(null);
        setState('test');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const runSubmit = async (submittedAnswers: Record<number, string>) => {
        setIsSubmitting(true);
        setFailure(null);
        try {
            const inputs = allQuestions.map(q => ({
                question_id: q.id,
                theme: q.theme,
                difficulty: q.difficulty,
                user_response: submittedAnswers[q.id] || ''
            }));

            const res = await fetch('/api/srt/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inputs })
            });

            if (res.ok) {
                const data = await res.json();
                setEvaluationResult(data.evaluation);
            } else {
                setFailure(await toEvaluationFailure(res));
            }
        } catch (error) {
            console.error('Failed to submit SRT:', error);
            setFailure({
                reason: 'network',
                message: 'We could not reach the server. Check your connection and retry.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async (submittedAnswers: Record<number, string>) => {
        setAnswers(submittedAnswers);
        setState('result');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        await runSubmit(submittedAnswers);
    };

    const handleRetake = () => {
        setAnswers({});
        setEvaluationResult(null);
        setFailure(null);
        setState('intro');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDashboard = () => {
        router.push('/dashboard');
    };

    return (
        <div className="min-h-screen bg-[#FFFBF6] bg-grid-pattern overflow-x-hidden font-sans">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#FFFBF6]/80 pointer-events-none -z-10"></div>


            <div className="px-4 pt-28 pb-8 md:pb-12 sm:px-6 lg:px-8 max-w-7xl mx-auto flex items-center justify-center min-h-[calc(100vh-80px)]">
                <div className="w-full">
                    {state === 'intro' && <SrtIntro onStart={handleStart} />}
                    {state === 'test' && (
                        <SrtTestInterface
                            questions={allQuestions}
                            onSubmit={handleSubmit}
                        />
                    )}
                    {state === 'result' && (
                        failure && !isSubmitting ? (
                            <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-gray-100 shadow-xl">
                                <EvaluationError failure={failure} onRetry={() => runSubmit(answers)} />
                            </div>
                        ) : (
                            <SrtResult
                                result={evaluationResult}
                                onRetake={handleRetake}
                                onDashboard={handleDashboard}
                            />
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
