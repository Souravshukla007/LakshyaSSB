'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function Day3() {
    useEffect(() => {
        // Sidebar Active State
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    if (id) {
                        document.querySelectorAll('.sidebar-link').forEach(link => {
                            link.classList.remove('text-brand-orange');
                            link.classList.add('text-gray-400');
                            if (link.getAttribute('href') === `#${id}`) {
                                link.classList.add('text-brand-orange');
                                link.classList.remove('text-gray-400', 'text-brand-dark');
                            }
                        });
                    }
                }
            });
        }, { threshold: 0.2, rootMargin: "-20% 0px -50% 0px" });

        document.querySelectorAll('div[id]').forEach(section => {
            observer.observe(section);
        });

        // Reveal Animations
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(el => revealObserver.observe(el));

        return () => {
            observer.disconnect();
            revealObserver.disconnect();
        };
    }, []);

    return (
        <>
            <Navbar />

            <main>
                <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden bg-brand-bg">
                    {/* Background Decor */}
                    <div className="absolute top-0 right-0 w-full lg:w-[calc(60%_-_40px)] h-full bg-grid-pattern opacity-100 z-0 pointer-events-none"></div>

                    <div className="max-w-7xl mx-auto px-6 relative z-10">
                        {/* Breadcrumb & Progress */}
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 reveal">
                            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-gray-400">
                                <Link href="/" className="hover:text-brand-orange transition">SSB</Link>
                                <i className="fa-solid fa-chevron-right text-[8px]"></i>
                                <span className="text-brand-orange">Day 3</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Progress: Day 3 of 5</div>
                                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="w-[60%] h-full bg-brand-orange"></div>
                                </div>
                            </div>
                        </div>

                        {/* Hero Section */}
                        <div className="flex flex-col lg:flex-row items-end justify-between gap-8 mb-16 reveal">
                            <div className="max-w-2xl">
                                <h1 className="font-hero font-bold text-5xl lg:text-6xl text-brand-dark mb-4">
                                    Day 3 – <span className="text-brand-orange">GTO I & Interview</span>
                                </h1>
                                <p className="text-lg text-gray-500 font-noname leading-relaxed">
                                    Evaluates teamwork, planning ability and your personal background through the first field tasks and individual interviews.
                                </p>
                            </div>
                            <button className="group relative bg-brand-dark p-[2px] rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className="relative w-full h-full rounded-full overflow-hidden bg-transparent flex items-center gap-4 pl-8 pr-2 py-3">
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full transition-transform duration-[1500ms] ease-out group-hover:scale-[30]"></div>
                                    <span className="relative z-10 text-white group-hover:text-brand-dark font-noname font-bold text-base transition-colors duration-[1000ms]">Practice GTO & PI</span>
                                    <span className="relative z-10 bg-white text-brand-dark w-10 h-10 rounded-full flex items-center justify-center">
                                        <i className="fa-solid fa-bolt text-xs"></i>
                                    </span>
                                </div>
                            </button>
                        </div>

                        {/* Quick Navigation */}
                        <div className="flex flex-wrap gap-2 mb-16 reveal sticky top-24 z-40 bg-brand-bg/80 backdrop-blur-md py-4 border-y border-gray-100">
                            <a href="#mindmap" className="px-5 py-2 rounded-full bg-white border border-gray-100 text-[11px] font-bold text-brand-dark uppercase hover:border-brand-orange transition-all">Mind Map</a>
                            <a href="#tasks" className="px-5 py-2 rounded-full bg-white border border-gray-100 text-[11px] font-bold text-brand-dark uppercase hover:border-brand-orange transition-all">Task Breakdown</a>
                            <a href="#olqs" className="px-5 py-2 rounded-full bg-white border border-gray-100 text-[11px] font-bold text-brand-dark uppercase hover:border-brand-orange transition-all">OLQs</a>
                            <a href="#dos" className="px-5 py-2 rounded-full bg-white border border-gray-100 text-[11px] font-bold text-brand-dark uppercase hover:border-brand-orange transition-all">Do&apos;s & Don&apos;ts</a>
                            <a href="#example" className="px-5 py-2 rounded-full bg-white border border-gray-100 text-[11px] font-bold text-brand-dark uppercase hover:border-brand-orange transition-all">Solved Example</a>
                        </div>

                        <div className="grid lg:grid-cols-12 gap-12">
                            {/* Main Content */}
                            <div className="lg:col-span-9 space-y-24">

                                {/* SECTION 1: MIND MAP */}
                                <div id="mindmap" className="reveal-scale scroll-mt-32">
                                    <div className="p-8 lg:p-12 bg-white rounded-[3rem] border border-gray-100 shadow-sm relative overflow-hidden">
                                        <h3 className="font-hero font-bold text-2xl text-brand-dark mb-12">Visual Mind Map</h3>

                                        <div className="relative flex items-center justify-center py-20">
                                            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" overflow="visible">
                                                <line x1="50%" y1="50%" x2="20%" y2="20%" stroke="#FF5E3A" strokeWidth="1.5"></line>
                                                <line x1="50%" y1="50%" x2="80%" y2="20%" stroke="#FF5E3A" strokeWidth="1.5"></line>
                                                <line x1="50%" y1="50%" x2="20%" y2="80%" stroke="#FF5E3A" strokeWidth="1.5"></line>
                                                <line x1="50%" y1="50%" x2="80%" y2="80%" stroke="#FF5E3A" strokeWidth="1.5"></line>
                                            </svg>
                                            <div className="relative z-10 w-32 h-32 rounded-full bg-brand-dark text-white flex flex-col items-center justify-center shadow-2xl border-4 border-brand-orange">
                                                <span className="text-[10px] uppercase font-bold tracking-tight">SSB Stage</span>
                                                <span className="text-xl font-hero font-bold">Day 3</span>
                                            </div>
                                            <div className="absolute top-[15%] left-[15%] px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-md flex items-center gap-2">
                                                <span className="text-xs font-bold text-brand-dark">GD</span>
                                            </div>
                                            <div className="absolute top-[15%] right-[15%] px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-md flex items-center gap-2">
                                                <span className="text-xs font-bold text-brand-dark">GPE</span>
                                            </div>
                                            <div className="absolute bottom-[15%] left-[15%] px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-md flex items-center gap-2">
                                                <span className="text-xs font-bold text-brand-dark">PGT</span>
                                            </div>
                                            <div className="absolute bottom-[15%] right-[15%] px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-md flex items-center gap-2">
                                                <span className="text-xs font-bold text-brand-dark">Personal Interview</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 3: TASK BREAKDOWN */}
                                <div id="tasks" className="reveal-scale scroll-mt-32">
                                    <h3 className="font-hero font-bold text-2xl text-brand-dark mb-8">Group & Individual Tasks</h3>
                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div className="p-8 bg-white rounded-[2rem] border border-gray-100">
                                            <h4 className="font-hero font-bold text-lg text-brand-dark mb-2">Group Discussion (GD)</h4>
                                            <p className="text-sm text-gray-500 font-noname">Debate on current affair topics. Tests domain knowledge and social communication.</p>
                                        </div>
                                        <div className="p-8 bg-white rounded-[2rem] border border-gray-100">
                                            <h4 className="font-hero font-bold text-lg text-brand-dark mb-2">Group Planning Exercise (GPE)</h4>
                                            <p className="text-sm text-gray-500 font-noname">Solving real-world crisis scenarios with limited time/resources. Tests prioritisation logic.</p>
                                        </div>
                                        <div className="p-8 bg-white rounded-[2rem] border border-gray-100">
                                            <h4 className="font-hero font-bold text-lg text-brand-dark mb-2">Progressive Group Task (PGT)</h4>
                                            <p className="text-sm text-gray-500 font-noname">Outdoor obstacle course using helping materials (rope, plank). Tests teamwork.</p>
                                        </div>
                                        <div className="p-8 bg-white rounded-[2rem] border border-gray-100">
                                            <h4 className="font-hero font-bold text-lg text-brand-dark mb-2">Personal Interview (PI)</h4>
                                            <p className="text-sm text-gray-500 font-noname">Deep interaction based on PIQ. Tests honesty, awareness and personal background.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 4: OLQs */}
                                <div id="olqs" className="reveal scroll-mt-32">
                                    <div className="bg-brand-dark rounded-[3rem] p-12 text-white relative overflow-hidden">
                                        <h3 className="font-hero font-bold text-2xl mb-8 text-brand-orange">OLQs Assessed</h3>
                                        <div className="flex flex-wrap gap-4">
                                            <span className="px-5 py-2 rounded-full border border-white/10 bg-white/5 text-[11px] font-bold uppercase tracking-widest text-white">Teamwork</span>
                                            <span className="px-5 py-2 rounded-full border border-white/10 bg-white/5 text-[11px] font-bold uppercase tracking-widest text-white">Planning Ability</span>
                                            <span className="px-5 py-2 rounded-full border border-white/10 bg-white/5 text-[11px] font-bold uppercase tracking-widest text-white">Leadership</span>
                                            <span className="px-5 py-2 rounded-full border border-white/10 bg-white/5 text-[11px] font-bold uppercase tracking-widest text-white">Social Adaptability</span>
                                            <span className="px-5 py-2 rounded-full border border-white/10 bg-white/5 text-[11px] font-bold uppercase tracking-widest text-white">Honesty</span>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 5: DOS & DONTS */}
                                <div id="dos" className="scroll-mt-32">
                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div className="bg-green-50 border border-green-100 p-8 rounded-[2.5rem]">
                                            <h4 className="font-hero font-bold text-xl text-green-900 mb-6">Do&apos;s</h4>
                                            <ul className="space-y-3 text-sm text-green-700">
                                                <li>• Give logical and data-backed points in GD</li>
                                                <li>• Actually help the team carry weights in PGT</li>
                                                <li>• Be completely truthful in the interview</li>
                                            </ul>
                                        </div>
                                        <div className="bg-red-50 border border-red-100 p-8 rounded-[2.5rem]">
                                            <h4 className="font-hero font-bold text-xl text-red-900 mb-6">Don&apos;ts</h4>
                                            <ul className="space-y-3 text-sm text-red-700">
                                                <li>• Shouting or aggression in GD</li>
                                                <li>• Staying passive or away from the team in field tasks</li>
                                                <li>• Bluffing or lying about your marks/achievements</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 7: SOLVED EXAMPLE */}
                                <div id="example" className="reveal-scale scroll-mt-32">
                                    <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
                                        <h3 className="font-hero font-bold text-2xl text-brand-dark mb-6">GPE Solution Approach</h3>
                                        <div className="p-8 bg-brand-bg rounded-[2rem]">
                                            <p className="text-sm font-bold text-brand-dark mb-4">The Golden Hierarchy:</p>
                                            <ul className="space-y-3 text-xs text-gray-600 font-noname">
                                                <li className="flex items-center gap-2"><i className="fa-solid fa-1"></i> Prioritise Saving Life First</li>
                                                <li className="flex items-center gap-2"><i className="fa-solid fa-2"></i> Inform Authorities (Police/Hospital/Station Master)</li>
                                                <li className="flex items-center gap-2"><i className="fa-solid fa-3"></i> Divide Team based on complexity of tasks</li>
                                                <li className="flex items-center gap-2"><i className="fa-solid fa-4"></i> Manage time to reach the final meeting point</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* BOTTOM NAV */}
                                <div className="pt-20 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-6 reveal">
                                    <Link href="/ssb/day-2" className="flex items-center gap-3 text-sm font-bold text-gray-500 hover:text-brand-orange transition group">
                                        <i className="fa-solid fa-arrow-left group-hover:-translate-x-1 transition-transform"></i> Previous: Day 2
                                    </Link>
                                    <button className="bg-brand-dark text-white h-14 px-10 rounded-full font-bold shadow-xl hover:bg-brand-orange hover:-translate-y-1 transition-all">Practice GTO Tasks</button>
                                    <Link href="/ssb/day-4" className="flex items-center gap-3 text-sm font-bold text-gray-500 hover:text-brand-orange transition group">
                                        Next: Day 4 <i className="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
                                    </Link>
                                </div>
                            </div>

                            {/* Sidebar */}
                            <div className="hidden lg:block lg:col-span-3">
                                <div className="sticky top-40 space-y-6">
                                    <div className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm">
                                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Quick Links</h4>
                                        <nav className="space-y-4">
                                            <a href="#mindmap" className="block text-sm font-bold text-brand-dark hover:text-brand-orange transition sidebar-link">Mind Map</a>
                                            <a href="#tasks" className="block text-sm font-bold text-gray-400 hover:text-brand-orange transition sidebar-link">Task Breakdown</a>
                                            <a href="#olqs" className="block text-sm font-bold text-gray-400 hover:text-brand-orange transition sidebar-link">OLQs</a>
                                            <a href="#dos" className="block text-sm font-bold text-gray-400 hover:text-brand-orange transition sidebar-link">Do&apos;s & Don&apos;ts</a>
                                            <a href="#example" className="block text-sm font-bold text-gray-400 hover:text-brand-orange transition sidebar-link">Solved Case</a>
                                        </nav>
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
