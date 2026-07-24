"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import SrtIntro from '@/components/srt/SrtIntro';
import SrtTestInterface from '@/components/srt/SrtTestInterface';
import SrtResult from '@/components/srt/SrtResult';
import srt01 from '@/data/practice/srt01.json';
import srt02 from '@/data/practice/srt02.json';

const allQuestionsRaw = [...srt01, ...srt02];
const allQuestions = allQuestionsRaw.map((q, idx) => ({ ...q, id: idx + 1 })).slice(0, 60);

type AppState = 'intro' | 'test' | 'result';

export default function SrtTestPage() {
    const router = useRouter();
    const [state, setState] = useState<AppState>('intro');
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [evaluationResult, setEvaluationResult] = useState<any>(null);

    const handleStart = async () => {
        // ... same access check logic ...
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

        // Consume Attempt (POST)
        await fetch('/api/practice/check-access', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ module: 'SRT' })
        });

        setEvaluationResult(null);
        setState('test');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (submittedAnswers: Record<number, string>) => {
        setAnswers(submittedAnswers);
        setState('result');
        window.scrollTo({ top: 0, behavior: 'smooth' });

        setIsSubmitting(true);
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
            }
        } catch (error) {
            console.error('Failed to submit SRT:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRetake = () => {
        setAnswers({});
        setEvaluationResult(null);
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
                        <SrtResult 
                            result={evaluationResult} 
                            onRetake={handleRetake} 
                            onDashboard={handleDashboard} 
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
