"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import SrtIntro from '@/components/srt/SrtIntro';
import SrtTestInterface from '@/components/srt/SrtTestInterface';
import SrtResult from '@/components/srt/SrtResult';
import OfflineFallback from '@/components/offline/OfflineFallback';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { saveDraft, type Draft } from '@/lib/offline/draftStore';
import srt01 from '@/data/practice/srt01.json';
import srt02 from '@/data/practice/srt02.json';

const allQuestionsRaw = [...srt01, ...srt02];
const allQuestions = allQuestionsRaw.map((q, idx) => ({ ...q, id: idx + 1 })).slice(0, 60);

type AppState = 'intro' | 'test' | 'result';

export default function SrtTestPage() {
    const router = useRouter();
    const connectivity = useOnlineStatus();
    const [state, setState] = useState<AppState>('intro');
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [evaluationResult, setEvaluationResult] = useState<any>(null);
    // Set when a submission is blocked because the device is offline. The SRT
    // AI evaluation (/api/srt/submit) is an online-only capability (Req 7.4).
    const [submitBlockedOffline, setSubmitBlockedOffline] = useState(false);
    // Set when the offline draft could not be persisted locally (quota exceeded).
    const [draftSaveFailed, setDraftSaveFailed] = useState(false);

    const handleStart = async () => {
        // Offline branch (Req 4.5, 7.1, 7.4): the questions are bundled into the
        // client JS chunk (imported above), so they are available offline once the
        // chunk is cached. Skip the online-only access-check gate and proceed
        // directly to the test. The online path below is left unchanged.
        if (connectivity === 'offline') {
            setEvaluationResult(null);
            setSubmitBlockedOffline(false);
            setState('test');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

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
        // Retain the user's entered responses regardless of connectivity (Req 7.2).
        setAnswers(submittedAnswers);
        setState('result');
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Build the same submission payload the online path posts, so it can be
        // either sent now (online) or saved for deferred submission (offline).
        const inputs = allQuestions.map(q => ({
            question_id: q.id,
            theme: q.theme,
            difficulty: q.difficulty,
            user_response: submittedAnswers[q.id] || ''
        }));

        // Offline branch (Req 6.1, 6.2, 6.7, 7.2): /api/srt/submit runs an online-only
        // AI evaluation. When offline, save the submission payload as a pending Draft
        // in the Local_Draft_Store so the existing syncManager/useDraftSync auto-submits
        // it on reconnect, and surface a notice while keeping the entered answers
        // recoverable. Guard all IndexedDB access so a storage failure never breaks UI.
        if (connectivity === 'offline') {
            setSubmitBlockedOffline(true);
            setIsSubmitting(false);
            try {
                const draft: Draft = {
                    id: 'srt:' + Date.now(),
                    flow: 'srt',
                    payload: { inputs },
                    endpoint: '/api/srt/submit',
                    updatedAt: Date.now(),
                    status: 'pending',
                    attempts: 0,
                };
                const result = await saveDraft(draft);
                setDraftSaveFailed(result === 'quota-exceeded');
            } catch (err) {
                console.error('Failed to save SRT draft locally:', err);
                setDraftSaveFailed(true);
            }
            return;
        }
        setSubmitBlockedOffline(false);
        setDraftSaveFailed(false);

        setIsSubmitting(true);
        try {
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
        setSubmitBlockedOffline(false);
        setDraftSaveFailed(false);
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
                        submitBlockedOffline ? (
                            <div>
                                <OfflineFallback
                                    title="Saved — will submit when you're back online"
                                    message="Your responses have been saved on this device. SRT evaluation is done online, so we'll automatically submit them and fetch your assessment as soon as you reconnect."
                                    onRetry={() => handleSubmit(answers)}
                                />
                                {draftSaveFailed && (
                                    <p className="mt-4 text-center text-sm font-noname text-red-600">
                                        Heads up: your latest changes couldn&apos;t be saved locally (device storage is full). Free up space, or stay on this screen and retry once you&apos;re back online.
                                    </p>
                                )}
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
