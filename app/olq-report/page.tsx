'use client';

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import useScrollReveal from "@/hooks/useScrollReveal";

export default function OlqReport() {
    useScrollReveal();

    return (
        <main className="antialiased overflow-x-hidden selection:bg-brand-orange selection:text-white font-sans bg-brand-bg">
            <Navbar />

            <section className="min-h-screen bg-brand-bg pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-end mb-12 reveal">
                        <div>
                            <h1 className="font-hero font-bold text-4xl text-brand-dark mb-2">
                                Detailed <span className="text-brand-orange">OLQ Report</span>
                            </h1>
                            <p className="text-gray-500 font-noname">
                                Psychologist's view of your projected officer-like qualities.
                            </p>
                        </div>
                        <button className="px-6 py-3 bg-brand-dark text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-brand-orange transition-all">
                            Download PDF
                        </button>
                    </div>

                    <div className="grid lg:grid-cols-12 gap-12">
                        {/* Left: Radar & Trends */}
                        <div className="lg:col-span-8 space-y-12">
                            <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm reveal-left">
                                <h3 className="font-hero font-bold text-xl text-brand-dark mb-8">OLQ Radar Projection</h3>
                                <div className="relative w-full aspect-square max-w-lg mx-auto bg-brand-bg rounded-[2rem] p-8 flex items-center justify-center">
                                    {/* Simulated Radar Graph */}
                                    <svg viewBox="0 0 200 200" className="w-full h-full">
                                        <polygon points="100,20 160,80 180,150 100,180 20,150 40,80" fill="none" stroke="#e5e7eb" strokeWidth="1"></polygon>
                                        <polygon points="100,45 150,90 170,160 100,170 30,140 50,70" fill="rgba(255, 94, 58, 0.2)" stroke="#FF5E3A" strokeWidth="2"></polygon>
                                        <text x="100" y="15" textAnchor="middle" className="text-[6px] font-bold fill-gray-400">Leadership</text>
                                        <text x="185" y="80" textAnchor="start" className="text-[6px] font-bold fill-gray-400">Initiative</text>
                                        <text x="185" y="160" textAnchor="start" className="text-[6px] font-bold fill-gray-400">Responsibility</text>
                                        <text x="100" y="195" textAnchor="middle" className="text-[6px] font-bold fill-gray-400">Communication</text>
                                        <text x="15" y="160" textAnchor="end" className="text-[6px] font-bold fill-gray-400">Teamwork</text>
                                    </svg>
                                </div>
                            </div>

                            {/* Trends */}
                            <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm reveal-left">
                                <h3 className="font-hero font-bold text-xl text-brand-dark mb-8">Weekly Progress Growth</h3>
                                <div className="h-48 w-full relative mb-8 flex items-end justify-between px-10">
                                    <div className="w-16 h-[58%] bg-brand-orange/10 border-t-2 border-brand-orange rounded-t-lg"></div>
                                    <div className="w-16 h-[62%] bg-brand-orange/20 border-t-2 border-brand-orange rounded-t-lg"></div>
                                    <div className="w-16 h-[67%] bg-brand-orange/40 border-t-2 border-brand-orange rounded-t-lg"></div>
                                    <div className="w-16 h-[71%] bg-brand-orange border-t-4 border-brand-orange rounded-t-lg"></div>
                                </div>
                                <div className="flex justify-between px-10 text-[10px] font-bold text-gray-400 uppercase">
                                    <span>Week 1</span>
                                    <span>Week 2</span>
                                    <span>Week 3</span>
                                    <span>Week 4</span>
                                </div>
                            </div>
                        </div>

                        {/* Right: Insights & Badges */}
                        <div className="lg:col-span-4 space-y-12">
                            <div className="bg-brand-dark p-8 rounded-[3rem] text-white reveal-right">
                                <h4 className="font-hero font-bold text-lg mb-4 text-brand-orange">Psych Insight</h4>
                                <p className="text-sm font-noname leading-relaxed text-gray-400">
                                    "Your <strong>Initiative</strong> improved by 12%. Ensure your SRT responses in the 'Rescue' category show more practical intelligence. Focus next on Communication during GTO tasks."
                                </p>
                            </div>

                            <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm reveal-right">
                                <h4 className="font-hero font-bold text-lg mb-6">Achievements</h4>
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4 group">
                                        <div className="w-12 h-12 rounded-full bg-brand-orange shadow-glow flex items-center justify-center text-white">
                                            <i className="fa-solid fa-shield-halved"></i>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-brand-dark">Screening Master</p>
                                            <p className="text-[8px] text-gray-400 font-bold uppercase">UNLOCKED</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 group">
                                        <div className="w-12 h-12 rounded-full bg-brand-orange shadow-glow flex items-center justify-center text-white">
                                            <i className="fa-solid fa-brain"></i>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-brand-dark">Psych Pro</p>
                                            <p className="text-[8px] text-gray-400 font-bold uppercase">UNLOCKED</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 opacity-30 grayscale">
                                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                            <i className="fa-solid fa-crown"></i>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-400">GTO Leader</p>
                                            <p className="text-[8px] text-gray-400 font-bold uppercase">LOCKED</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
