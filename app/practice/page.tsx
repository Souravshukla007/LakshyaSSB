'use client';

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import useScrollReveal from "@/hooks/useScrollReveal";
import Link from "next/link";

export default function Practice() {
    useScrollReveal();

    return (
        <main className="antialiased overflow-x-hidden selection:bg-brand-orange selection:text-white font-sans bg-brand-bg">
            <Navbar />

            <section className="min-h-screen bg-brand-bg pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-12 reveal">
                        <h1 className="font-hero font-bold text-4xl text-brand-dark mb-2">
                            SSB Practice <span className="text-brand-orange">Arena</span>
                        </h1>
                        <p className="text-gray-500 font-noname">
                            Simulate real SSB test conditions with strict timers and AI feedback.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* OIR */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-brand-orange/20 transition-all group flex flex-col justify-between reveal-scale">
                            <div>
                                <div className="w-14 h-14 rounded-2xl bg-brand-bg flex items-center justify-center text-brand-dark text-2xl mb-6 group-hover:bg-brand-dark group-hover:text-white transition-colors">
                                    <i className="fa-solid fa-stopwatch"></i>
                                </div>
                                <h3 className="font-hero font-bold text-xl text-brand-dark mb-2">OIR Timed Test</h3>
                                <p className="text-sm text-gray-500 font-noname mb-6">40 questions / 30 minutes. Verbal and non-verbal reasoning.</p>
                            </div>
                            <Link href="/practice/oir" className="w-full py-4 bg-brand-dark text-white rounded-full font-bold text-sm text-center hover:bg-brand-orange transition-all">
                                Start Practice
                            </Link>
                        </div>

                        {/* WAT */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-brand-orange/20 transition-all group flex flex-col justify-between reveal-scale delay-75">
                            <div>
                                <div className="w-14 h-14 rounded-2xl bg-brand-bg flex items-center justify-center text-brand-dark text-2xl mb-6 group-hover:bg-brand-dark group-hover:text-white transition-colors">
                                    <i className="fa-solid fa-bolt-lightning"></i>
                                </div>
                                <h3 className="font-hero font-bold text-xl text-brand-dark mb-2">WAT Real Timer</h3>
                                <p className="text-sm text-gray-500 font-noname mb-6">15 seconds per word. 60 words sequence. Tests mindset.</p>
                            </div>
                            <Link href="/practice/wat" className="w-full py-4 bg-brand-dark text-white rounded-full font-bold text-sm text-center hover:bg-brand-orange transition-all">
                                Start Practice
                            </Link>
                        </div>

                        {/* TAT */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-brand-orange/20 transition-all group flex flex-col justify-between reveal-scale delay-100">
                            <div>
                                <div className="w-14 h-14 rounded-2xl bg-brand-bg flex items-center justify-center text-brand-dark text-2xl mb-6 group-hover:bg-brand-dark group-hover:text-white transition-colors">
                                    <i className="fa-solid fa-image"></i>
                                </div>
                                <h3 className="font-hero font-bold text-xl text-brand-dark mb-2">TAT Image Mode</h3>
                                <p className="text-sm text-gray-500 font-noname mb-6">4 minutes per story. Situation-based practice with AI review.</p>
                            </div>
                            <Link href="/practice/tat" className="w-full py-4 bg-brand-dark text-white rounded-full font-bold text-sm text-center hover:bg-brand-orange transition-all">
                                Start Practice
                            </Link>
                        </div>

                        {/* SRT */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-brand-orange/20 transition-all group flex flex-col justify-between reveal-scale delay-150">
                            <div>
                                <div className="w-14 h-14 rounded-2xl bg-brand-bg flex items-center justify-center text-brand-dark text-2xl mb-6 group-hover:bg-brand-dark group-hover:text-white transition-colors">
                                    <i className="fa-solid fa-person-circle-question"></i>
                                </div>
                                <h3 className="font-hero font-bold text-xl text-brand-dark mb-2">SRT Rapid Response</h3>
                                <p className="text-sm text-gray-500 font-noname mb-6">60 situations / 30 minutes. Tests practical intelligence.</p>
                            </div>
                            <Link href="/practice/srt-test" className="w-full py-4 bg-brand-dark text-white rounded-full font-bold text-sm text-center hover:bg-brand-orange transition-all">
                                Start Practice
                            </Link>
                        </div>

                        {/* Lecturette */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-brand-orange/20 transition-all group flex flex-col justify-between reveal-scale delay-200">
                            <div>
                                <div className="w-14 h-14 rounded-2xl bg-brand-bg flex items-center justify-center text-brand-dark text-2xl mb-6 group-hover:bg-brand-dark group-hover:text-white transition-colors">
                                    <i className="fa-solid fa-microphone-lines"></i>
                                </div>
                                <h3 className="font-hero font-bold text-xl text-brand-dark mb-2">Lecturette Trainer</h3>
                                <p className="text-sm text-gray-500 font-noname mb-6">3 minute speech timer. Practice structure & confidence.</p>
                            </div>
                            <Link href="/practice/lecturette" className="w-full py-4 bg-brand-dark text-white rounded-full font-bold text-sm text-center hover:bg-brand-orange transition-all">
                                Start Practice
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
