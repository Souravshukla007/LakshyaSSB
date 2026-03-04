'use client';

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import useScrollReveal from "@/hooks/useScrollReveal";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";

interface AccessStatus {
    isGuest: boolean;
    isPro: boolean;
    modules: Record<string, { allowed: boolean }>;
}

export default function Practice() {
    useScrollReveal();
    const router = useRouter();
    const [access, setAccess] = useState<AccessStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch('/api/practice/access-status')
            .then(res => {
                if (!res.ok && res.status !== 401) throw new Error('Failed to fetch status');
                return res.json();
            })
            .then(data => {
                // Determine if user is guest by 401 or explicit flag
                if (data.isGuest || data.error === 'Unauthorized') {
                    setAccess({ isGuest: true, isPro: false, modules: {} });
                } else {
                    setAccess(data);
                }
            })
            .catch(() => {
                setAccess({ isGuest: true, isPro: false, modules: {} });
            })
            .finally(() => setIsLoading(false));
    }, []);

    const renderAction = (moduleCode: string, link: string) => {
        if (isLoading) {
            return (
                <div className="w-full py-4 bg-gray-100 animate-pulse rounded-full"></div>
            );
        }

        if (access?.isGuest) {
            return (
                <Link href="/auth" className="w-full py-4 border-2 border-brand-dark text-brand-dark rounded-full font-bold text-sm text-center hover:bg-brand-dark hover:text-white transition-all flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4" />
                    Sign in to Practice
                </Link>
            );
        }

        const isAllowed = access?.isPro || access?.modules?.[moduleCode]?.allowed;

        if (!isAllowed) {
            return (
                <Link href="/pricing" className="w-full py-4 bg-gradient-to-r from-orange-400 to-brand-orange text-white rounded-full font-bold text-sm text-center hover:shadow-lg transition-all flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4" />
                    Unlock PRO for More
                </Link>
            );
        }

        return (
            <button
                onClick={() => router.push(link)}
                className="w-full py-4 bg-brand-dark text-white rounded-full font-bold text-sm text-center hover:bg-brand-orange transition-all"
            >
                Start Practice {access?.isPro ? '' : '(1 Free Try)'}
            </button>
        );
    };

    return (
        <main className="antialiased overflow-x-hidden selection:bg-brand-orange selection:text-white font-sans bg-brand-bg">
            <Navbar />

            <section className="min-h-screen bg-brand-bg pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-12 reveal">
                        <h1 className="font-hero font-bold text-4xl text-brand-dark mb-2">
                            SSB Practice <span className="text-brand-orange">Arena</span>
                        </h1>
                        <p className="text-gray-500 font-noname text-lg">
                            Simulate real SSB test conditions with strict timers and AI feedback.
                        </p>
                        {access?.isGuest === false && !access?.isPro && (
                            <div className="mt-4 inline-flex items-center px-4 py-2 bg-orange-100 text-orange-800 rounded-lg text-sm font-semibold border border-orange-200">
                                Free Trial Active: You have 1 free attempt per module. Upgrade to PRO for unlimited tests.
                            </div>
                        )}
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* OIR */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-brand-orange/20 transition-all flex flex-col justify-between reveal-scale relative overflow-hidden group">
                            {!isLoading && !access?.isGuest && !access?.isPro && !access?.modules?.OIR?.allowed && (
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gray-100 rounded-bl-full -z-0 opacity-50"></div>
                            )}
                            <div className="relative z-10">
                                <div className="w-14 h-14 rounded-2xl bg-brand-bg flex items-center justify-center text-brand-dark text-2xl mb-6 group-hover:bg-brand-dark group-hover:text-white transition-colors">
                                    <i className="fa-solid fa-stopwatch"></i>
                                </div>
                                <h3 className="font-hero font-bold text-xl text-brand-dark mb-2">OIR Timed Test</h3>
                                <p className="text-sm text-gray-500 font-noname mb-6">40 questions / 30 minutes. Verbal and non-verbal reasoning.</p>
                            </div>
                            <div className="relative z-10 w-full">
                                {renderAction('OIR', '/practice/oir')}
                            </div>
                        </div>

                        {/* WAT */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-brand-orange/20 transition-all flex flex-col justify-between reveal-scale delay-75 relative overflow-hidden group">
                            <div className="relative z-10">
                                <div className="w-14 h-14 rounded-2xl bg-brand-bg flex items-center justify-center text-brand-dark text-2xl mb-6 group-hover:bg-brand-dark group-hover:text-white transition-colors">
                                    <i className="fa-solid fa-bolt-lightning"></i>
                                </div>
                                <h3 className="font-hero font-bold text-xl text-brand-dark mb-2">WAT Real Timer</h3>
                                <p className="text-sm text-gray-500 font-noname mb-6">15 seconds per word. 60 words sequence. Tests mindset.</p>
                            </div>
                            <div className="relative z-10 w-full">
                                {renderAction('WAT', '/practice/wat')}
                            </div>
                        </div>

                        {/* TAT */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-brand-orange/20 transition-all flex flex-col justify-between reveal-scale delay-100 relative overflow-hidden group">
                            <div className="relative z-10">
                                <div className="w-14 h-14 rounded-2xl bg-brand-bg flex items-center justify-center text-brand-dark text-2xl mb-6 group-hover:bg-brand-dark group-hover:text-white transition-colors">
                                    <i className="fa-solid fa-image"></i>
                                </div>
                                <h3 className="font-hero font-bold text-xl text-brand-dark mb-2">TAT Image Mode</h3>
                                <p className="text-sm text-gray-500 font-noname mb-6">4 minutes per story. Situation-based practice with AI review.</p>
                            </div>
                            <div className="relative z-10 w-full">
                                {renderAction('TAT', '/practice/tat')}
                            </div>
                        </div>

                        {/* SRT */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-brand-orange/20 transition-all flex flex-col justify-between reveal-scale delay-150 relative overflow-hidden group">
                            <div className="relative z-10">
                                <div className="w-14 h-14 rounded-2xl bg-brand-bg flex items-center justify-center text-brand-dark text-2xl mb-6 group-hover:bg-brand-dark group-hover:text-white transition-colors">
                                    <i className="fa-solid fa-person-circle-question"></i>
                                </div>
                                <h3 className="font-hero font-bold text-xl text-brand-dark mb-2">SRT Rapid Response</h3>
                                <p className="text-sm text-gray-500 font-noname mb-6">60 situations / 30 minutes. Tests practical intelligence.</p>
                            </div>
                            <div className="relative z-10 w-full">
                                {renderAction('SRT', '/practice/srt')}
                            </div>
                        </div>

                        {/* Lecturette */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-brand-orange/20 transition-all flex flex-col justify-between reveal-scale delay-200 relative overflow-hidden group">
                            <div className="relative z-10">
                                <div className="w-14 h-14 rounded-2xl bg-brand-bg flex items-center justify-center text-brand-dark text-2xl mb-6 group-hover:bg-brand-dark group-hover:text-white transition-colors">
                                    <i className="fa-solid fa-microphone-lines"></i>
                                </div>
                                <h3 className="font-hero font-bold text-xl text-brand-dark mb-2">Lecturette Trainer</h3>
                                <p className="text-sm text-gray-500 font-noname mb-6">3 minute speech timer. Practice structure & confidence.</p>
                            </div>
                            <div className="relative z-10 w-full">
                                {renderAction('LECTURETTE', '/practice/lecturette')}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
