'use client';

import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function DailyQuestion() {
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('active');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.15 }
        );

        document
            .querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale')
            .forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    }, []);

    return (
        <>
            <Navbar />

            <main>
                <section className="py-24 px-6 bg-brand-bg relative overflow-hidden pt-40">
                    {/* Beige Grid Background */}
                    <div className="absolute inset-0 bg-grid-pattern opacity-100 pointer-events-none"></div>

                    <div className="max-w-7xl mx-auto relative z-10">
                        {/* Header */}
                        <div className="text-center max-w-3xl mx-auto mb-16 reveal">
                            <h2 className="font-hero font-bold text-4xl lg:text-5xl text-brand-dark mb-6 tracking-tight">
                                Daily <span className="text-brand-orange">SSB Question</span>
                            </h2>
                            <p className="text-gray-500 font-noname text-lg">
                                Practice one real SSB question every day and improve your OLQs consistently.
                            </p>
                        </div>

                        <div className="grid lg:grid-cols-12 gap-8 items-start">

                            {/* ── LEFT: Question Area ── */}
                            <div className="lg:col-span-8">
                                <div className="bg-white/90 backdrop-blur-md p-8 lg:p-12 rounded-[3rem] border border-gray-100 shadow-soft reveal-left">
                                    {/* Tags */}
                                    <div className="flex items-center justify-between mb-8">
                                        <span className="px-4 py-1.5 rounded-full bg-brand-orange/10 text-brand-orange text-[10px] font-bold uppercase tracking-[0.2em] border border-brand-orange/10">
                                            Today&apos;s Question
                                        </span>
                                        <span className="px-3 py-1 bg-gray-100 text-gray-400 text-[10px] font-bold uppercase rounded-lg">
                                            Interview Question
                                        </span>
                                    </div>

                                    {/* Question */}
                                    <h3 className="font-hero font-bold text-2xl lg:text-3xl text-brand-dark mb-10 leading-tight">
                                        &quot;Why do you want to join the Armed Forces?&quot;
                                    </h3>

                                    {/* Answer Area */}
                                    <div className="space-y-6">
                                        <div className="relative">
                                            <textarea
                                                className="w-full h-64 bg-brand-bg border border-gray-100 rounded-[2rem] p-8 text-sm focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all font-noname resize-none"
                                                placeholder="Type your answer here..."
                                            ></textarea>
                                            <div className="absolute bottom-6 right-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                0 / 300 words
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                            <button className="flex-1 py-4 bg-brand-dark text-white rounded-full font-bold text-sm shadow-xl hover:bg-brand-orange transition-all duration-300">
                                                Submit Answer
                                            </button>
                                            <button className="flex-1 py-4 border-2 border-brand-dark text-brand-dark rounded-full font-bold text-sm hover:bg-gray-50 transition-all">
                                                View Sample Answer
                                            </button>
                                        </div>
                                    </div>

                                    {/* Feedback Preview */}
                                    <div className="mt-12 pt-12 border-t border-gray-50">
                                        <div className="flex items-center justify-between mb-8">
                                            <h4 className="font-hero font-bold text-xl text-brand-dark">Sample Feedback Preview</h4>
                                            <div className="text-2xl font-hero font-bold text-brand-orange">
                                                7<span className="text-sm text-gray-400">/10</span>
                                            </div>
                                        </div>
                                        <ul className="space-y-4 mb-8">
                                            <li className="flex items-start gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-brand-orange mt-2 shrink-0"></div>
                                                <p className="text-sm text-gray-600 font-noname">Good clarity in motivation and service knowledge.</p>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-brand-orange mt-2 shrink-0"></div>
                                                <p className="text-sm text-gray-600 font-noname">Add a real-life example to back your claims of discipline.</p>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-brand-orange mt-2 shrink-0"></div>
                                                <p className="text-sm text-gray-600 font-noname">Be more specific about your choice of service (Army/Navy/AF).</p>
                                            </li>
                                        </ul>
                                        <div className="p-4 bg-brand-dark rounded-2xl text-center text-white/50 text-[10px] font-bold uppercase tracking-widest">
                                            <i className="fa-solid fa-lock mr-2 text-brand-orange"></i>
                                            Unlock detailed feedback with Pro.
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ── RIGHT: Streak + CTA ── */}
                            <div className="lg:col-span-4 space-y-8">

                                {/* Practice Streak */}
                                <div className="bg-white/90 backdrop-blur-md p-10 rounded-[3rem] border border-gray-100 shadow-soft reveal-right">
                                    <h4 className="font-hero font-bold text-lg text-brand-dark mb-8">Your Practice Streak</h4>
                                    <div className="flex flex-col items-center text-center">
                                        <div className="text-6xl font-hero font-bold text-brand-dark mb-2">
                                            5 <span className="text-brand-orange">Days</span> 🔥
                                        </div>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-10">
                                            Consistency builds officer qualities.
                                        </p>
                                        <button className="w-full py-4 bg-brand-bg border border-gray-100 rounded-2xl text-xs font-bold text-brand-dark hover:bg-gray-100 transition-all">
                                            View All Daily Questions
                                        </button>
                                    </div>
                                </div>

                                {/* Unlock CTA */}
                                <div className="bg-brand-dark p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden reveal-right">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-brand-orange/20 blur-[60px] rounded-full"></div>
                                    <div className="relative z-10">
                                        <h4 className="font-hero font-bold text-2xl mb-4 leading-tight">
                                            Practice Daily. <br /> Improve Faster.
                                        </h4>
                                        <p className="text-gray-400 text-sm font-noname mb-8">
                                            The elite way to ensure you are board-ready before your reporting date.
                                        </p>
                                        <button className="w-full py-4 bg-brand-orange text-white rounded-full font-bold text-sm shadow-xl hover:bg-white hover:text-brand-dark transition-all duration-300">
                                            Unlock Unlimited Practice
                                        </button>
                                        <div className="mt-6 flex flex-wrap gap-2">
                                            {['Daily Interview', '•', 'PPDT', '•', 'WAT', '•', 'OLQ Feedback'].map((tag, i) => (
                                                <span key={i} className="text-[8px] font-bold text-white/30 uppercase tracking-widest">{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}
