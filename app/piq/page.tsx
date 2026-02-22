'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PIQLanding() {
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
                <section className="relative pt-40 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-brand-bg">
                    {/* Background Grid Decor */}
                    <div className="absolute top-0 right-0 w-full lg:w-[calc(60%_-_40px)] h-full bg-grid-pattern opacity-100 z-0 pointer-events-none"></div>

                    <div className="max-w-7xl mx-auto px-6 relative z-10">

                        {/* Hero */}
                        <div className="text-center max-w-3xl mx-auto mb-20 reveal">
                            <h1 className="font-hero font-bold text-5xl lg:text-7xl text-brand-dark tracking-tight leading-[1.1] mb-8">
                                PIQ Readiness{' '}
                                <span className="text-brand-orange">Score™</span>
                            </h1>
                            <p className="text-lg text-gray-500 mb-10 leading-relaxed font-noname">
                                Know your SSB interview strength before entering the board. Our AI analyzes your
                                personal information to detect leadership gaps and potential red flags.
                            </p>
                            <div className="flex flex-wrap justify-center gap-4">
                                <Link
                                    href="/piq/form"
                                    className="group relative bg-brand-dark p-[2px] rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                                >
                                    <div className="relative w-full h-full rounded-full overflow-hidden bg-transparent flex items-center gap-4 pl-8 pr-2 py-3">
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full transition-transform duration-[1500ms] ease-out group-hover:scale-[30]"></div>
                                        <span className="relative z-10 text-white group-hover:text-brand-dark font-noname font-bold text-base transition-colors duration-[1000ms]">
                                            Start PIQ Evaluation
                                        </span>
                                        <span className="relative z-10 bg-white text-brand-dark w-10 h-10 rounded-full flex items-center justify-center">
                                            <i className="fa-solid fa-chart-simple text-xs"></i>
                                        </span>
                                    </div>
                                </Link>
                            </div>
                        </div>

                        {/* Feature Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 reveal-scale">
                            <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all">
                                <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 text-brand-orange flex items-center justify-center mb-6">
                                    <i className="fa-solid fa-brain"></i>
                                </div>
                                <h3 className="font-hero font-bold text-lg text-brand-dark mb-3">OLQ Based Analysis</h3>
                                <p className="text-sm text-gray-500 font-noname leading-relaxed">
                                    Scientific mapping of your personal history to 15 Officer Like Qualities.
                                </p>
                            </div>

                            <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all">
                                <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 text-brand-orange flex items-center justify-center mb-6">
                                    <i className="fa-solid fa-flag"></i>
                                </div>
                                <h3 className="font-hero font-bold text-lg text-brand-dark mb-3">Red Flag Detection</h3>
                                <p className="text-sm text-gray-500 font-noname leading-relaxed">
                                    Identify contradictory statements or gaps that raise suspicion during interview.
                                </p>
                            </div>

                            <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all">
                                <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 text-brand-orange flex items-center justify-center mb-6">
                                    <i className="fa-solid fa-wand-magic-sparkles"></i>
                                </div>
                                <h3 className="font-hero font-bold text-lg text-brand-dark mb-3">Question Generator</h3>
                                <p className="text-sm text-gray-500 font-noname leading-relaxed">
                                    Predict exactly what the Interviewing Officer will ask based on your profile.
                                </p>
                            </div>

                            <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all">
                                <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 text-brand-orange flex items-center justify-center mb-6">
                                    <i className="fa-solid fa-arrow-up-right-dots"></i>
                                </div>
                                <h3 className="font-hero font-bold text-lg text-brand-dark mb-3">Improvement Plan</h3>
                                <p className="text-sm text-gray-500 font-noname leading-relaxed">
                                    Actionable tips to strengthen your participation and leadership credentials.
                                </p>
                            </div>
                        </div>

                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}
