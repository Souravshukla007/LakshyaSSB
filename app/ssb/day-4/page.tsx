'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function Day4() {
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
                                <span className="text-brand-orange">Day 4</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Progress: Day 4 of 5</div>
                                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="w-[80%] h-full bg-brand-orange"></div>
                                </div>
                            </div>
                        </div>

                        {/* Hero Section */}
                        <div className="flex flex-col lg:flex-row items-end justify-between gap-8 mb-16 reveal">
                            <div className="max-w-2xl">
                                <h1 className="font-hero font-bold text-5xl lg:text-6xl text-brand-dark mb-4">
                                    Day 4 – <span className="text-brand-orange">GTO Tasks II</span>
                                </h1>
                                <p className="text-lg text-gray-500 font-noname leading-relaxed">
                                    The final outdoor assessments and the culmination of the Personal Interview phase. This is where your stamina meets leadership.
                                </p>
                            </div>
                            <button className="group relative bg-brand-dark p-[2px] rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className="relative w-full h-full rounded-full overflow-hidden bg-transparent flex items-center gap-4 pl-8 pr-2 py-3">
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full transition-transform duration-[1500ms] ease-out group-hover:scale-[30]"></div>
                                    <span className="relative z-10 text-white group-hover:text-brand-dark font-noname font-bold text-base transition-colors duration-[1000ms]">Practice for Day 4</span>
                                    <span className="relative z-10 bg-white text-brand-dark w-10 h-10 rounded-full flex items-center justify-center">
                                        <i className="fa-solid fa-bolt text-xs"></i>
                                    </span>
                                </div>
                            </button>
                        </div>

                        {/* Quick Navigation */}
                        <div className="flex flex-wrap gap-2 mb-16 reveal sticky top-24 z-40 bg-brand-bg/80 backdrop-blur-md py-4 border-y border-gray-100">
                            <a href="#mindmap" className="px-5 py-2 rounded-full bg-white border border-gray-100 text-[11px] font-bold text-brand-dark uppercase hover:border-brand-orange transition-all">Mind Map</a>
                            <a href="#overview" className="px-5 py-2 rounded-full bg-white border border-gray-100 text-[11px] font-bold text-brand-dark uppercase hover:border-brand-orange transition-all">Overview</a>
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
                                            {/* SVG Lines */}
                                            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" overflow="visible">
                                                <line x1="50%" y1="50%" x2="20%" y2="20%" stroke="#FF5E3A" strokeWidth="1.5"></line>
                                                <line x1="50%" y1="50%" x2="80%" y2="20%" stroke="#FF5E3A" strokeWidth="1.5"></line>
                                                <line x1="50%" y1="50%" x2="20%" y2="80%" stroke="#FF5E3A" strokeWidth="1.5"></line>
                                                <line x1="50%" y1="50%" x2="80%" y2="80%" stroke="#FF5E3A" strokeWidth="1.5"></line>
                                                <line x1="50%" y1="50%" x2="50%" y2="10%" stroke="#FF5E3A" strokeWidth="1.5"></line>
                                            </svg>

                                            {/* Center */}
                                            <div className="relative z-10 w-32 h-32 rounded-full bg-brand-dark text-white flex flex-col items-center justify-center shadow-2xl border-4 border-brand-orange">
                                                <span className="text-[10px] uppercase font-bold tracking-tight">SSB Stage</span>
                                                <span className="text-xl font-hero font-bold">Day 4</span>
                                            </div>

                                            {/* Nodes */}
                                            <div className="absolute top-[10%] left-1/2 -translate-x-1/2 px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-md flex items-center gap-2">
                                                <i className="fa-solid fa-person-running text-brand-orange"></i>
                                                <span className="text-xs font-bold text-brand-dark">Individual Obstacles</span>
                                            </div>
                                            <div className="absolute top-[20%] left-[10%] px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-md flex items-center gap-2">
                                                <i className="fa-solid fa-users text-brand-orange"></i>
                                                <span className="text-xs font-bold text-brand-dark">HGT</span>
                                            </div>
                                            <div className="absolute top-[20%] right-[10%] px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-md flex items-center gap-2">
                                                <i className="fa-solid fa-bullhorn text-brand-orange"></i>
                                                <span className="text-xs font-bold text-brand-dark">Lecturette</span>
                                            </div>
                                            <div className="absolute bottom-[20%] left-[10%] px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-md flex items-center gap-2">
                                                <i className="fa-solid fa-medal text-brand-orange"></i>
                                                <span className="text-xs font-bold text-brand-dark">Command Task</span>
                                            </div>
                                            <div className="absolute bottom-[20%] right-[10%] px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-md flex items-center gap-2">
                                                <i className="fa-solid fa-comments text-brand-orange"></i>
                                                <span className="text-xs font-bold text-brand-dark">Personal Interview</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 2: DAY FLOW */}
                                <div id="overview" className="reveal-left scroll-mt-32">
                                    <h3 className="font-hero font-bold text-2xl text-brand-dark mb-8">Sequence of Events</h3>
                                    <div className="flex flex-col md:flex-row gap-4 overflow-x-auto pb-6 scrollbar-hide">
                                        <div className="flex-shrink-0 w-full md:w-64 p-6 bg-white rounded-3xl border border-gray-100 flex flex-col items-center text-center">
                                            <div className="w-12 h-12 rounded-full bg-brand-bg text-brand-orange flex items-center justify-center mb-4"><i className="fa-solid fa-sun"></i></div>
                                            <h4 className="font-bold text-sm mb-2">Morning (0630h)</h4>
                                            <p className="text-xs text-gray-400">Briefing for Group Tasks and finishing remaining ground tasks.</p>
                                        </div>
                                        <div className="flex-shrink-0 w-full md:w-64 p-6 bg-white rounded-3xl border border-gray-100 flex flex-col items-center text-center border-brand-orange shadow-lg">
                                            <div className="w-12 h-12 rounded-full bg-brand-orange text-white flex items-center justify-center mb-4"><i className="fa-solid fa-person-military-to-person"></i></div>
                                            <h4 className="font-bold text-sm mb-2">Individual Tasks</h4>
                                            <p className="text-xs text-gray-400">Performing Obstacles & Command Task showing your specific potential.</p>
                                        </div>
                                        <div className="flex-shrink-0 w-full md:w-64 p-6 bg-white rounded-3xl border border-gray-100 flex flex-col items-center text-center">
                                            <div className="w-12 h-12 rounded-full bg-brand-bg text-brand-orange flex items-center justify-center mb-4"><i className="fa-solid fa-user-tie"></i></div>
                                            <h4 className="font-bold text-sm mb-2">Afternoon</h4>
                                            <p className="text-xs text-gray-400">Final Interviews for those whose interviews were not completed.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 3: TASK BREAKDOWN */}
                                <div id="tasks" className="reveal-scale scroll-mt-32">
                                    <h3 className="font-hero font-bold text-2xl text-brand-dark mb-8">Task Breakdown</h3>
                                    <div className="grid md:grid-cols-2 gap-8">
                                        {/* Task 1 */}
                                        <div className="group bg-white rounded-[2rem] border border-gray-100 overflow-hidden hover:shadow-2xl hover:border-brand-orange transition-all duration-500">
                                            <div className="h-48 bg-brand-bg flex items-center justify-center overflow-hidden">
                                                <i className="fa-solid fa-person-running text-6xl text-brand-orange/20 group-hover:scale-110 transition-transform duration-700"></i>
                                            </div>
                                            <div className="p-8">
                                                <div className="flex justify-between items-center mb-4">
                                                    <h4 className="font-hero font-bold text-xl text-brand-dark">Individual Obstacles</h4>
                                                    <span className="px-3 py-1 bg-brand-bg text-[10px] font-bold text-brand-dark rounded-lg">3 Minutes</span>
                                                </div>
                                                <p className="text-sm text-gray-500 font-noname mb-6 leading-relaxed">Perform 10 obstacles of varying difficulties. Each obstacle has specified points (1 to 10).</p>
                                                <div className="p-4 bg-brand-bg rounded-2xl mb-6">
                                                    <div className="text-[10px] font-bold text-brand-orange uppercase tracking-widest mb-2">Assessor Focus</div>
                                                    <p className="text-[11px] text-gray-600 font-medium">Stamina, physical courage, agile decision making, and determination.</p>
                                                </div>
                                                <div className="text-xs font-bold text-brand-dark flex items-center gap-2">
                                                    <i className="fa-solid fa-lightbulb text-brand-yellow"></i>
                                                    <span>Tip: Plan your path to score high points first.</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Task 2 */}
                                        <div className="group bg-white rounded-[2rem] border border-gray-100 overflow-hidden hover:shadow-2xl hover:border-brand-orange transition-all duration-500">
                                            <div className="h-48 bg-brand-bg flex items-center justify-center overflow-hidden">
                                                <i className="fa-solid fa-medal text-6xl text-brand-orange/20 group-hover:scale-110 transition-transform duration-700"></i>
                                            </div>
                                            <div className="p-8">
                                                <div className="flex justify-between items-center mb-4">
                                                    <h4 className="font-hero font-bold text-xl text-brand-dark">Command Task</h4>
                                                    <span className="px-3 py-1 bg-brand-bg text-[10px] font-bold text-brand-dark rounded-lg">15 Minutes</span>
                                                </div>
                                                <p className="text-sm text-gray-500 font-noname mb-6 leading-relaxed">You are made a Commander and must lead two subordinates to clear a specific obstacle zone.</p>
                                                <div className="p-4 bg-brand-bg rounded-2xl mb-6">
                                                    <div className="text-[10px] font-bold text-brand-orange uppercase tracking-widest mb-2">Assessor Focus</div>
                                                    <p className="text-[11px] text-gray-600 font-medium">Leadership, command ability, human resource utilization, and intelligence.</p>
                                                </div>
                                                <div className="text-xs font-bold text-brand-dark flex items-center gap-2">
                                                    <i className="fa-solid fa-lightbulb text-brand-yellow"></i>
                                                    <span>Tip: Brief your subordinates clearly before starting.</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 4: OLQs */}
                                <div id="olqs" className="reveal scroll-mt-32">
                                    <div className="bg-brand-dark rounded-[3rem] p-12 text-white relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/10 blur-[100px] rounded-full"></div>
                                        <h3 className="font-hero font-bold text-2xl mb-4 text-brand-orange">OLQs Assessed on Day 4</h3>
                                        <p className="text-gray-400 font-noname text-sm mb-10 max-w-xl">This day is critical for testing your individual capabilities and your ability to lead others under pressure.</p>

                                        <div className="flex flex-wrap gap-3">
                                            <span className="px-5 py-2 rounded-full border border-white/10 bg-white/5 text-[11px] font-bold uppercase tracking-widest text-brand-orange">Initiative</span>
                                            <span className="px-5 py-2 rounded-full border border-white/10 bg-white/5 text-[11px] font-bold uppercase tracking-widest text-white">Stamina</span>
                                            <span className="px-5 py-2 rounded-full border border-white/10 bg-white/5 text-[11px] font-bold uppercase tracking-widest text-brand-orange">Leadership</span>
                                            <span className="px-5 py-2 rounded-full border border-white/10 bg-white/5 text-[11px] font-bold uppercase tracking-widest text-white">Effective Intelligence</span>
                                            <span className="px-5 py-2 rounded-full border border-white/10 bg-white/5 text-[11px] font-bold uppercase tracking-widest text-white">Teamwork</span>
                                            <span className="px-5 py-2 rounded-full border border-white/10 bg-white/5 text-[11px] font-bold uppercase tracking-widest text-brand-orange">Responsibility</span>
                                            <span className="px-5 py-2 rounded-full border border-white/10 bg-white/5 text-[11px] font-bold uppercase tracking-widest text-white">Confidence</span>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 5: DOS & DONTS */}
                                <div id="dos" className="scroll-mt-32">
                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div className="bg-red-50/50 border border-red-100 p-8 rounded-[2.5rem] reveal-left">
                                            <h4 className="font-hero font-bold text-xl text-red-900 mb-6 flex items-center gap-3">
                                                <i className="fa-solid fa-circle-xmark"></i> Common Mistakes
                                            </h4>
                                            <ul className="space-y-4">
                                                <li className="flex items-start gap-3 text-sm text-red-700">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2"></div>
                                                    <span>Giving up mid-way through a difficult obstacle.</span>
                                                </li>
                                                <li className="flex items-start gap-3 text-sm text-red-700">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2"></div>
                                                    <span>Shouting at subordinates during the Command Task.</span>
                                                </li>
                                                <li className="flex items-start gap-3 text-sm text-red-700">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2"></div>
                                                    <span>Failing to explain the plan during HGT/Command task.</span>
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="bg-green-50/50 border border-green-100 p-8 rounded-[2.5rem] reveal-right">
                                            <h4 className="font-hero font-bold text-xl text-green-900 mb-6 flex items-center gap-3">
                                                <i className="fa-solid fa-circle-check"></i> Do&apos;s and Don&apos;ts
                                            </h4>
                                            <div className="space-y-6">
                                                <div>
                                                    <h5 className="text-xs font-bold text-green-800 uppercase mb-3">Do&apos;s</h5>
                                                    <ul className="text-xs text-green-700 space-y-2">
                                                        <li>• Keep a smile and positive attitude.</li>
                                                        <li>• Lead from the front in physical tasks.</li>
                                                        <li>• Be appreciative of your subordinates.</li>
                                                    </ul>
                                                </div>
                                                <div>
                                                    <h5 className="text-xs font-bold text-red-800 uppercase mb-3">Don&apos;ts</h5>
                                                    <ul className="text-xs text-red-700 space-y-2">
                                                        <li>• Don&apos;t jump from obstacles incorrectly.</li>
                                                        <li>• Don&apos;t dominate the Lecturette by noise.</li>
                                                        <li>• Don&apos;t lie in the Personal Interview.</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 7: SOLVED EXAMPLE */}
                                <div id="example" className="reveal-scale scroll-mt-32">
                                    <div className="bg-brand-orange/5 border border-brand-orange/20 rounded-[3rem] p-10">
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="w-12 h-12 rounded-2xl bg-brand-orange text-white flex items-center justify-center text-xl shadow-lg shadow-brand-orange/20">
                                                <i className="fa-solid fa-clipboard-question"></i>
                                            </div>
                                            <div>
                                                <h3 className="font-hero font-bold text-2xl text-brand-dark">Solved Case Study</h3>
                                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Command Task Scenario</p>
                                            </div>
                                        </div>

                                        <div className="space-y-8">
                                            <div>
                                                <h5 className="text-sm font-bold text-brand-dark mb-2">Situation:</h5>
                                                <p className="text-sm text-gray-600 font-noname p-4 bg-white rounded-2xl border border-gray-100">Your task is to transport a heavy load over a 15ft bomb-threat zone using a plank and rope, but your main subordinate is struggling with the weight.</p>
                                            </div>

                                            <div className="grid md:grid-cols-2 gap-6">
                                                <div className="p-6 rounded-2xl bg-red-50 border border-red-100">
                                                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-2 block">Bad Response</span>
                                                    <p className="text-xs text-red-900 mb-2">Commander yells: &quot;Why are you so slow? Just move it!&quot; then does the work himself while subordinates watch.</p>
                                                    <p className="text-[10px] text-red-400"><strong>Why it fails:</strong> Lack of leadership, poor resource management, loss of temper.</p>
                                                </div>
                                                <div className="p-6 rounded-2xl bg-green-50 border border-green-100">
                                                    <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest mb-2 block">Good Response</span>
                                                    <p className="text-xs text-green-900 mb-2">Commander: &quot;Place the plank first to distribute weight. I will hold the support, you slide it across.&quot;</p>
                                                    <p className="text-[10px] text-green-400"><strong>OLQs:</strong> Effective Intel, Cooperation, Initiative.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 8: PREPARE */}
                                <div className="reveal-scale">
                                    <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
                                        <h3 className="font-hero font-bold text-2xl text-brand-dark mb-8">How to Prepare Daily</h3>
                                        <div className="grid sm:grid-cols-2 gap-6">
                                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-brand-bg">
                                                <div className="w-6 h-6 rounded-full bg-brand-orange text-white flex items-center justify-center text-[10px]"><i className="fa-solid fa-check"></i></div>
                                                <span className="text-sm font-bold text-brand-dark">Practice Narration in Mirror</span>
                                            </div>
                                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-brand-bg">
                                                <div className="w-6 h-6 rounded-full bg-brand-orange text-white flex items-center justify-center text-[10px]"><i className="fa-solid fa-check"></i></div>
                                                <span className="text-sm font-bold text-brand-dark">Run 3km Daily (Morning)</span>
                                            </div>
                                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-brand-bg">
                                                <div className="w-6 h-6 rounded-full bg-brand-orange text-white flex items-center justify-center text-[10px]"><i className="fa-solid fa-check"></i></div>
                                                <span className="text-sm font-bold text-brand-dark">Read Current Affairs Topics</span>
                                            </div>
                                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-brand-bg">
                                                <div className="w-6 h-6 rounded-full bg-brand-orange text-white flex items-center justify-center text-[10px]"><i className="fa-solid fa-check"></i></div>
                                                <span className="text-sm font-bold text-brand-dark">Solve GPE Maps logic</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* BOTTOM NAV */}
                                <div className="pt-20 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-6 reveal">
                                    <Link href="/ssb/day-3" className="flex items-center gap-3 text-sm font-bold text-gray-500 hover:text-brand-orange transition group">
                                        <i className="fa-solid fa-arrow-left group-hover:-translate-x-1 transition-transform"></i> Previous: Day 3
                                    </Link>
                                    <button className="bg-brand-dark text-white h-14 px-10 rounded-full font-bold shadow-xl hover:bg-brand-orange hover:-translate-y-1 transition-all">Start AI Practice</button>
                                    <Link href="/ssb/day-5" className="flex items-center gap-3 text-sm font-bold text-gray-500 hover:text-brand-orange transition group">
                                        Next: Day 5 <i className="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
                                    </Link>
                                </div>
                            </div>

                            {/* Sidebar Navigation */}
                            <div className="hidden lg:block lg:col-span-3">
                                <div className="sticky top-40 space-y-6">
                                    <div className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm">
                                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-6">Page Content</h4>
                                        <nav className="space-y-4">
                                            <a href="#mindmap" className="block text-sm font-bold text-brand-dark hover:text-brand-orange transition sidebar-link">Visual Mind Map</a>
                                            <a href="#overview" className="block text-sm font-bold text-gray-400 hover:text-brand-orange transition sidebar-link">Sequence of Events</a>
                                            <a href="#tasks" className="block text-sm font-bold text-gray-400 hover:text-brand-orange transition sidebar-link">Task Breakdown</a>
                                            <a href="#olqs" className="block text-sm font-bold text-gray-400 hover:text-brand-orange transition sidebar-link">OLQs Assessed</a>
                                            <a href="#dos" className="block text-sm font-bold text-gray-400 hover:text-brand-orange transition sidebar-link">Do&apos;s & Don&apos;ts</a>
                                            <a href="#example" className="block text-sm font-bold text-gray-400 hover:text-brand-orange transition sidebar-link">Solved Case Study</a>
                                        </nav>
                                    </div>

                                    <div className="p-8 bg-brand-orange rounded-3xl text-white shadow-xl shadow-brand-orange/20 relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
                                        <h4 className="font-hero font-bold text-xl mb-4 relative z-10">Need a Mock Review?</h4>
                                        <p className="text-white/80 text-xs mb-6 relative z-10">Get your command task strategy reviewed by Ex-GTO mentors.</p>
                                        <button className="w-full py-3 bg-white text-brand-orange font-bold rounded-xl text-xs hover:bg-brand-dark hover:text-white transition-all relative z-10">Book Slot</button>
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
