'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

interface User {
    name: string;
    email: string;
    entry?: string;
    plan?: string;
}

interface DashboardClientProps {
    user: User;
}

export default function DashboardClient({ user }: DashboardClientProps) {
    const counterRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Reveal Animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(el => observer.observe(el));

        // Counter Animation
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target as HTMLElement;
                    const target = parseInt(el.getAttribute('data-target') || '0');
                    let count = 0;
                    const update = () => {
                        const inc = target / 50;
                        if (count < target) {
                            count += inc;
                            el.innerText = Math.ceil(count).toString();
                            setTimeout(update, 20);
                        } else {
                            el.innerText = target.toString();
                        }
                    };
                    update();
                    counterObserver.unobserve(el);
                }
            });
        }, { threshold: 0.5 });

        document.querySelectorAll('.counter').forEach(el => counterObserver.observe(el));

        return () => {
            observer.disconnect();
            counterObserver.disconnect();
        };
    }, []);

    return (
        <main className="min-h-screen bg-brand-bg pt-32 pb-20 px-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 reveal">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="inline-block px-3 py-1 rounded-lg bg-brand-orange/10 text-brand-orange text-[10px] font-bold uppercase tracking-widest">
                                Cadet Dashboard
                            </div>
                            <div className="px-3 py-1 bg-brand-orange text-white text-[10px] font-bold uppercase rounded-full shadow-glow">
                                PRO PLAN
                            </div>
                        </div>
                        <h1 className="font-hero font-bold text-4xl text-brand-dark mb-2">Welcome, <span className="text-brand-orange">{user.name}</span></h1>
                        <p className="text-gray-500 font-noname italic">"Service Before Self — Ready for {user.entry || 'SSB'}?"</p>
                        <div className="mt-4">
                            <Link href="/pricing" className="inline-block py-2 px-6 bg-brand-dark text-white rounded-full text-xs font-bold hover:bg-brand-orange transition-all">Go Pro!</Link>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="p-4 bg-white rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm">
                            <div className="w-10 h-10 rounded-full bg-green-50 text-brand-green flex items-center justify-center">
                                <i className="fa-solid fa-calendar-check"></i>
                            </div>
                            <div>
                                <div className="text-[10px] text-gray-400 font-bold uppercase">Days to SSB</div>
                                <div className="text-xl font-bold text-brand-dark counter" data-target="42">0</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-12 gap-8">
                    {/* Left Side: Progress & Stats */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* AI PSYCH EVALUATION */}
                        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm reveal-left">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="font-hero font-bold text-2xl text-brand-dark">AI Psych Evaluation</h3>
                                    <p className="text-sm text-gray-500 font-noname">Extract OLQs from your TAT, WAT, and SRT responses.</p>
                                </div>
                                <img src="https://images.unsplash.com/photo-1725399633872-32ba508b0607?ixid=M3w4NjU0NDF8MHwxfHNlYXJjaHwxfHxCcmFpbiUyMHdpdGglMjBjaGVja2xpc3QlMjBpbGx1c3RyYXRpb258ZW58MHx8fHwxNzcxMTAzNjI3fDA&ixlib=rb-4.1.0&w=60&h=60&fit=crop&fm=jpg&q=80" className="w-12 h-12" alt="AI Logic" />
                            </div>

                            <div className="grid md:grid-cols-2 gap-8 items-center">
                                <div className="relative aspect-square bg-brand-bg rounded-3xl p-6 flex items-center justify-center border border-gray-100 overflow-hidden">
                                    {/* SVG Radar Chart Simulation */}
                                    <svg viewBox="0 0 200 200" className="w-full h-full">
                                        <polygon points="100,20 160,80 180,150 100,180 20,150 40,80" fill="none" stroke="#e5e7eb" strokeWidth="1"></polygon>
                                        <polygon points="100,40 140,85 160,140 100,160 50,140 60,85" fill="none" stroke="#e5e7eb" strokeWidth="1"></polygon>
                                        <polygon points="100,45 150,90 170,160 100,170 30,140 50,70" fill="rgba(255, 94, 58, 0.2)" stroke="#FF5E3A" strokeWidth="2"></polygon>
                                        <text x="100" y="15" textAnchor="middle" className="text-[8px] font-bold fill-gray-400 uppercase">Leadership</text>
                                        <text x="185" y="80" textAnchor="start" className="text-[8px] font-bold fill-gray-400 uppercase">Initiative</text>
                                        <text x="185" y="160" textAnchor="start" className="text-[8px] font-bold fill-gray-400 uppercase">Responsibility</text>
                                        <text x="100" y="195" textAnchor="middle" className="text-[8px] font-bold fill-gray-400 uppercase">Communication</text>
                                        <text x="15" y="160" textAnchor="end" className="text-[8px] font-bold fill-gray-400 uppercase">Teamwork</text>
                                        <text x="15" y="80" textAnchor="end" className="text-[8px] font-bold fill-gray-400 uppercase">Intel</text>
                                    </svg>
                                </div>
                                <div className="space-y-4">
                                    <div className="p-4 rounded-2xl bg-brand-bg border border-gray-100">
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-[10px] font-bold uppercase text-gray-400">Analysis Summary</span>
                                            <span className="text-xs font-bold text-brand-orange">72% Overall Match</span>
                                        </div>
                                        <p className="text-[11px] text-gray-500 font-noname leading-relaxed italic">"Your SRT responses show high responsibility (80%), but Initiative (65%) can be improved by taking quicker actions in TAT stories."</p>
                                    </div>
                                    <Link href="/olq-report" className="w-full block text-center py-4 bg-brand-dark text-white rounded-full font-bold text-sm shadow-xl shadow-brand-dark/20 hover:bg-brand-orange transition-all duration-300">
                                        View Full Report
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* OLQ PROGRESS TRACKER */}
                        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm reveal-left">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="font-hero font-bold text-xl text-brand-dark">OLQ Progress Growth</h3>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Weekly Metrics Tracker</p>
                                </div>
                                <div className="px-3 py-1 bg-green-50 text-brand-green rounded-lg text-xs font-bold">
                                    +12% Initiative
                                </div>
                            </div>

                            {/* Line Chart Visual Simulation */}
                            <div className="h-48 w-full relative mb-6">
                                <div className="absolute inset-0 flex items-end justify-between px-4 pb-2">
                                    <div className="w-1/4 h-[58%] bg-brand-orange/10 border-t-2 border-brand-orange relative group">
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold opacity-0 group-hover:opacity-100">58</div>
                                    </div>
                                    <div className="w-1/4 h-[62%] bg-brand-orange/10 border-t-2 border-brand-orange relative group">
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold opacity-0 group-hover:opacity-100">62</div>
                                    </div>
                                    <div className="w-1/4 h-[67%] bg-brand-orange/10 border-t-2 border-brand-orange relative group">
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold opacity-0 group-hover:opacity-100">67</div>
                                    </div>
                                    <div className="w-1/4 h-[71%] bg-brand-orange/20 border-t-4 border-brand-orange relative group">
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold">71</div>
                                    </div>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gray-100"></div>
                                <div className="absolute top-0 bottom-0 left-0 w-[1px] bg-gray-100"></div>
                            </div>

                            <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase px-4 mb-8">
                                <span>Week 1</span>
                                <span>Week 2</span>
                                <span>Week 3</span>
                                <span>Week 4</span>
                            </div>

                            <div className="p-4 rounded-2xl bg-brand-bg border border-gray-50 flex items-center gap-4">
                                <img src="https://images.unsplash.com/photo-1632055186471-64814edeaab4?ixid=M3w4NjU0NDF8MHwxfHNlYXJjaHwxfHxHcm93dGglMjBhcnJvdyUyMGFuYWx5dGljc3xlbnwwfHx8fDE3NzExMDM2MjZ8MA&ixlib=rb-4.1.0&w=40&h=40&fit=crop&fm=jpg&q=80" className="w-10 h-10" alt="Growth" />
                                <p className="text-xs text-gray-500 font-noname">Insight: Your <strong>Initiative</strong> and <strong>Social Adj.</strong> are trending upwards. Focused GTO practice is next.</p>
                            </div>
                        </div>

                        {/* SSB PRACTICE ARENA */}
                        <div className="reveal-scale">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-hero font-bold text-xl text-brand-dark">SSB Practice Arena</h3>
                                <span className="text-xs font-bold text-brand-orange">Timed Sessions</span>
                            </div>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* OIR Timed */}
                                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 hover:shadow-lg transition-all group">
                                    <div className="w-12 h-12 rounded-2xl bg-brand-bg flex items-center justify-center text-brand-dark mb-4 group-hover:bg-brand-dark group-hover:text-white transition-colors">
                                        <i className="fa-solid fa-stopwatch"></i>
                                    </div>
                                    <h4 className="font-bold text-brand-dark mb-2">OIR Timed Test</h4>
                                    <p className="text-xs text-gray-400 mb-4 font-noname">40 questions / 30 mins</p>
                                    <Link href="/practice/oir" className="w-full block text-center py-2 bg-brand-bg hover:bg-brand-orange hover:text-white rounded-xl text-[10px] font-bold transition-all">START PRACTICE</Link>
                                </div>
                                {/* WAT Real Timer */}
                                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 hover:shadow-lg transition-all group">
                                    <div className="w-12 h-12 rounded-2xl bg-brand-bg flex items-center justify-center text-brand-dark mb-4 group-hover:bg-brand-dark group-hover:text-white transition-colors">
                                        <i className="fa-solid fa-bolt-lightning"></i>
                                    </div>
                                    <h4 className="font-bold text-brand-dark mb-2">WAT Real Timer</h4>
                                    <p className="text-xs text-gray-400 mb-4 font-noname">15s per word (60 words)</p>
                                    <Link href="/practice/wat" className="w-full block text-center py-2 bg-brand-bg hover:bg-brand-orange hover:text-white rounded-xl text-[10px] font-bold transition-all">START PRACTICE</Link>
                                </div>
                                {/* TAT Image Mode */}
                                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 hover:shadow-lg transition-all group">
                                    <div className="w-12 h-12 rounded-2xl bg-brand-bg flex items-center justify-center text-brand-dark mb-4 group-hover:bg-brand-dark group-hover:text-white transition-colors">
                                        <i className="fa-solid fa-image"></i>
                                    </div>
                                    <h4 className="font-bold text-brand-dark mb-2">TAT Image Mode</h4>
                                    <p className="text-xs text-gray-400 mb-4 font-noname">4 mins per situational story</p>
                                    <Link href="/practice/tat" className="w-full block text-center py-2 bg-brand-bg hover:bg-brand-orange hover:text-white rounded-xl text-[10px] font-bold transition-all">START PRACTICE</Link>
                                </div>
                            </div>
                        </div>

                        {/* Course Modules */}
                        <div className="reveal-scale">
                            <h3 className="font-hero font-bold text-xl text-brand-dark mb-6">Learning Path</h3>
                            <div className="space-y-4">
                                {/* Module 1 */}
                                <div className="group bg-white p-6 rounded-3xl border border-gray-100 flex items-center justify-between hover:shadow-md transition-all">
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 rounded-2xl bg-brand-orange text-white flex items-center justify-center text-lg">
                                            <i className="fa-solid fa-brain"></i>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-brand-dark">Psychology Masterclass</h4>
                                            <p className="text-xs text-gray-400 font-noname">TAT & WAT Analysis • 12/15 Lessons Completed</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="hidden md:block w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="w-4/5 h-full bg-brand-orange"></div>
                                        </div>
                                        <button className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center group-hover:bg-brand-dark group-hover:text-white transition-colors">
                                            <i className="fa-solid fa-play text-xs"></i>
                                        </button>
                                    </div>
                                </div>
                                {/* Module 2 */}
                                <div className="group bg-white p-6 rounded-3xl border border-gray-100 flex items-center justify-between hover:shadow-md transition-all">
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 rounded-2xl bg-brand-purple text-white flex items-center justify-center text-lg">
                                            <i className="fa-solid fa-microphone-lines"></i>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-brand-dark">Personal Interview Drill</h4>
                                            <p className="text-xs text-gray-400 font-noname">Common PIQ Questions • 2/10 Lessons Completed</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="hidden md:block w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="w-1/5 h-full bg-brand-purple"></div>
                                        </div>
                                        <button className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center group-hover:bg-brand-dark group-hover:text-white transition-colors">
                                            <i className="fa-solid fa-lock text-xs"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Right Side: Tasks & Mentor */}
                    <div className="lg:col-span-4 space-y-8">

                        {/* PERFORMANCE INSIGHTS */}
                        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm reveal-right">
                            <h3 className="font-hero font-bold text-lg text-brand-dark mb-6">Performance Insights</h3>

                            <div className="space-y-6">
                                {/* Reaction Time */}
                                <div>
                                    <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase mb-3">
                                        <span>WAT Reaction Time</span>
                                        <span className="text-brand-orange">7.9s Avg</span>
                                    </div>
                                    <div className="flex gap-1 h-12 items-end">
                                        <div className="flex-1 bg-brand-orange/10 h-[90%] rounded-t-lg"></div>
                                        <div className="flex-1 bg-brand-orange/20 h-[80%] rounded-t-lg"></div>
                                        <div className="flex-1 bg-brand-orange/40 h-[70%] rounded-t-lg"></div>
                                        <div className="flex-1 bg-brand-orange h-[60%] rounded-t-lg"></div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                                    <div>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Practice Streak</div>
                                        <div className="text-2xl font-bold text-brand-dark">6 <span className="text-xs text-gray-400 font-normal">Days</span></div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Best Streak</div>
                                        <div className="text-2xl font-bold text-brand-orange">14 <span className="text-xs text-gray-400 font-normal">Days</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ACHIEVEMENTS / BADGES */}
                        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm reveal-right delay-75">
                            <h3 className="font-hero font-bold text-lg text-brand-dark mb-6">Achievements</h3>
                            <div className="grid grid-cols-3 gap-4">
                                {/* Screening Master */}
                                <div className="group relative flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 rounded-full bg-brand-orange shadow-glow flex items-center justify-center text-white text-lg">
                                        <i className="fa-solid fa-shield-halved"></i>
                                    </div>
                                    <span className="text-[8px] font-bold text-center uppercase tracking-tighter">Screening</span>
                                </div>
                                {/* Psych Pro */}
                                <div className="group relative flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 rounded-full bg-brand-orange shadow-glow flex items-center justify-center text-white text-lg">
                                        <i className="fa-solid fa-brain"></i>
                                    </div>
                                    <span className="text-[8px] font-bold text-center uppercase tracking-tighter">Psych Pro</span>
                                </div>
                                {/* GTO Leader (Locked) */}
                                <div className="group relative flex flex-col items-center gap-2 opacity-30 grayscale">
                                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-lg">
                                        <i className="fa-solid fa-crown"></i>
                                    </div>
                                    <span className="text-[8px] font-bold text-center uppercase tracking-tighter">GTO Leader</span>
                                </div>
                            </div>
                        </div>

                        {/* PHYSICAL PREPARATION */}
                        <div className="bg-brand-dark rounded-[2.5rem] p-8 text-white reveal-right">
                            <h3 className="font-hero font-bold text-lg mb-6">Fitness Tracker</h3>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-bold uppercase text-gray-400">
                                        <span>2.4km Run (Sub 10m)</span>
                                        <span>65%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-brand-orange w-[65%]"></div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-bold uppercase text-gray-400">
                                        <span>Push-ups (40 Target)</span>
                                        <span>50%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-brand-orange w-[50%]"></div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-bold uppercase text-gray-400">
                                        <span>Chin-ups (6 Target)</span>
                                        <span>40%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-brand-orange w-[40%]"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Daily Tasks */}
                        <div className="bg-gray-50 rounded-[2.5rem] p-8 border border-gray-100 reveal-right">
                            <h3 className="font-hero font-bold text-lg text-brand-dark mb-6">Today's Goals</h3>
                            <div className="space-y-4">
                                <label className="flex items-center gap-4 group cursor-pointer">
                                    <div className="relative flex items-center justify-center">
                                        <input type="checkbox" defaultChecked className="peer appearance-none w-5 h-5 border border-gray-200 rounded-md checked:bg-brand-orange checked:border-brand-orange transition-all" />
                                        <i className="fa-solid fa-check absolute text-[10px] text-white opacity-0 peer-checked:opacity-100"></i>
                                    </div>
                                    <span className="text-sm font-noname text-gray-500 peer-checked:line-through">Personal PIQ Building</span>
                                </label>
                                <label className="flex items-center gap-4 group cursor-pointer">
                                    <div className="relative flex items-center justify-center">
                                        <input type="checkbox" className="peer appearance-none w-5 h-5 border border-gray-200 rounded-md checked:bg-brand-orange checked:border-brand-orange transition-all" />
                                        <i className="fa-solid fa-check absolute text-[10px] text-white opacity-0 peer-checked:opacity-100"></i>
                                    </div>
                                    <span className="text-sm font-noname text-gray-500">Practice 3 Lecturette Topics</span>
                                </label>
                            </div>
                            <button className="w-full mt-8 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-brand-dark hover:text-white transition-all">
                                Update Progress
                            </button>
                        </div>

                        {/* Mentor Card */}
                        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm reveal-right delay-200">
                            <div className="text-center mb-6">
                                <img src="https://images.unsplash.com/photo-1556978254-407bc35f8e66?ixid=M3w4NjU0NDF8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBhcm15JTIwb2ZmaWNlciUyMHBvcnRyYWl0JTIwc3F1YXJlfGVufDB8Mnx8fDE3NzEwNTE1MzZ8MA&w=200&h=200&fit=crop" className="w-20 h-20 rounded-full mx-auto object-cover border-4 border-brand-bg mb-4" alt="Mentor" />
                                <h4 className="font-bold text-brand-dark">Col. Hardeep Singh (Retd.)</h4>
                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Ex-GTO & IO</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="flex-1 py-3 bg-brand-bg rounded-xl text-[10px] font-bold text-brand-dark hover:bg-gray-100 transition-colors">
                                    <i className="fa-solid fa-message mr-2"></i> CHAT
                                </button>
                                <button className="flex-1 py-3 bg-brand-orange text-white rounded-xl text-[10px] font-bold shadow-lg shadow-brand-orange/20 hover:-translate-y-1 transition-all">
                                    <i className="fa-solid fa-phone mr-2"></i> CALL
                                </button>
                            </div>
                            <div className="mt-6 p-4 bg-yellow-50 rounded-2xl border border-yellow-100">
                                <p className="text-xs text-yellow-800 leading-relaxed font-noname"><strong>Mentor Note:</strong> {(user.name || 'Cadet').split(' ')[0]}, your PPDT narration needs better voice modulation. Focus on the &apos;Chest Up&apos; posture.</p>
                            </div>
                        </div>

                    </div>
                </div>

                {/* PIQ BUILDER & EXPERIENCE LIBRARY */}
                <div className="mt-12 grid lg:grid-cols-2 gap-8 reveal">
                    {/* PIQ Builder */}
                    <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-brand-bg flex items-center justify-center text-brand-dark text-xl">
                                <i className="fa-solid fa-file-pen"></i>
                            </div>
                            <div>
                                <h3 className="font-hero font-bold text-2xl text-brand-dark">Build Your PIQ Profile</h3>
                                <p className="text-sm text-gray-400 font-noname">Generate your projected interview questions.</p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mb-8">
                            <div className="p-4 bg-brand-bg rounded-2xl">
                                <h5 className="text-[10px] font-bold uppercase text-gray-400 mb-2">Sample Questions</h5>
                                <ul className="text-[11px] text-gray-600 space-y-2">
                                    <li>• Tell me about your biggest responsibility.</li>
                                    <li>• Why do you want to join the Armed Forces?</li>
                                    <li>• Describe a leadership experience.</li>
                                </ul>
                            </div>
                            <img src="https://images.unsplash.com/photo-1693045181178-d5d83fb070c8?ixid=M3w4NjU0NDF8MHwxfHNlYXJjaHwxfHxJbnRlcnZpZXclMjBwcm9maWxlJTIwZm9ybSUyMFVJJTIwaWxsdXN0cmF0aW9ufGVufDB8fHx8MTc3MTEwMzYzNnww&ixlib=rb-4.1.0&w=300&h=200&fit=crop&fm=jpg&q=80" className="rounded-2xl w-full h-full object-cover" alt="PIQ Builder" />
                        </div>

                        <Link href="/piq-builder" className="w-full block text-center py-4 bg-brand-dark text-white rounded-full font-bold text-sm hover:bg-brand-orange transition-all">Open PIQ Builder</Link>
                    </div>

                    {/* Medical Readiness */}
                    <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm relative overflow-hidden">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-brand-bg flex items-center justify-center text-brand-dark text-xl">
                                <i className="fa-solid fa-notes-medical"></i>
                            </div>
                            <div>
                                <h3 className="font-hero font-bold text-2xl text-brand-dark">SSB Medical Readiness</h3>
                                <p className="text-sm text-gray-400 font-noname">Initial health standard self-check.</p>
                                <Link href="/medical" className="text-[10px] font-bold text-brand-orange uppercase hover:underline">Check Status &rarr;</Link>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-brand-bg rounded-2xl">
                                <div className="flex items-center gap-3">
                                    <i className="fa-solid fa-ruler-vertical text-brand-orange"></i>
                                    <span className="text-sm font-medium">Height/Weight Standard</span>
                                </div>
                                <span className="px-2 py-1 bg-green-50 text-brand-green text-[10px] font-bold rounded">READY</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-brand-bg rounded-2xl">
                                <div className="flex items-center gap-3">
                                    <i className="fa-solid fa-eye text-brand-orange"></i>
                                    <span className="text-sm font-medium">Vision 6/6 Target</span>
                                </div>
                                <span className="px-2 py-1 bg-yellow-50 text-brand-yellow text-[10px] font-bold rounded">NEEDS TEST</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-brand-bg rounded-2xl">
                                <div className="flex items-center gap-3">
                                    <i className="fa-solid fa-shoe-prints text-brand-orange"></i>
                                    <span className="text-sm font-medium">No Knock Knees/Flat Foot</span>
                                </div>
                                <span className="px-2 py-1 bg-green-50 text-brand-green text-[10px] font-bold rounded">READY</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* POST-SSB ROADMAP */}
                <div className="mt-12 bg-brand-dark rounded-[3rem] p-12 text-white reveal relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-5 pointer-events-none"></div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-12">
                        <div className="max-w-md">
                            <h3 className="font-hero font-bold text-3xl mb-4">Post-SSB Recommendation Roadmap</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">Once you hear those golden words from the board, here's what follows next in your journey to the academy.</p>
                        </div>
                        <div className="flex-1 w-full overflow-x-auto pb-4">
                            <div className="flex gap-4 min-w-[600px]">
                                <div className="flex-1 p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
                                    <div className="text-[10px] font-bold text-brand-orange mb-2">DAY 0</div>
                                    <div className="font-bold text-sm">Recommended</div>
                                </div>
                                <div className="flex-1 p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
                                    <div className="text-[10px] font-bold text-brand-orange mb-2">WEEK 1-2</div>
                                    <div className="font-bold text-sm">Medical Board</div>
                                </div>
                                <div className="flex-1 p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
                                    <div className="text-[10px] font-bold text-brand-orange mb-2">MONTH 1-3</div>
                                    <div className="font-bold text-sm">Merit List</div>
                                </div>
                                <div className="flex-1 p-6 rounded-2xl bg-white/5 border border-white/10 text-center relative overflow-hidden">
                                    <div className="absolute inset-0 bg-brand-orange/20 animate-pulse"></div>
                                    <div className="relative z-10">
                                        <div className="text-[10px] font-bold text-white mb-2 uppercase">FINAL</div>
                                        <div className="font-bold text-sm">Academy Reporting</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
