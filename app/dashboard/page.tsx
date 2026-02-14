
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Dashboard() {
    const session = await getSession();

    if (!session) {
        redirect('/auth');
    }

    const { user } = session;

    return (
        <main className="min-h-screen bg-brand-bg pt-32 pb-20 px-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 reveal">
                    <div>
                        <div className="inline-block px-3 py-1 rounded-lg bg-brand-orange/10 text-brand-orange text-[10px] font-bold uppercase tracking-widest mb-4">
                            Cadet Dashboard
                        </div>
                        <h1 className="font-hero font-bold text-4xl text-brand-dark mb-2">Welcome, <span className="text-brand-orange">{user.name}</span></h1>
                        <p className="text-gray-500 font-noname italic">"Service Before Self — Ready for {user.entry || 'SSB'}?"</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="p-4 bg-white rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm">
                            <div className="w-10 h-10 rounded-full bg-green-50 text-brand-green flex items-center justify-center">
                                <i className="fa-solid fa-calendar-check"></i>
                            </div>
                            <div>
                                <div className="text-[10px] text-gray-400 font-bold uppercase">Days to SSB</div>
                                <div className="text-xl font-bold text-brand-dark">42</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-12 gap-8">
                    {/* Left Side: Progress & Stats */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* OLQ Assessment Radar (Visual Representation) */}
                        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm reveal-left">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="font-hero font-bold text-xl text-brand-dark">OLQ Profile Analysis</h3>
                                <button className="text-xs font-bold text-brand-orange hover:underline">Download Report</button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {/* Factor 1 */}
                                <div className="text-center p-4 rounded-3xl bg-brand-bg border border-gray-50">
                                    <div className="relative w-16 h-16 mx-auto mb-4">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-100"></circle>
                                            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray="175.9" strokeDashoffset="35.1" className="text-brand-orange transition-all duration-1000"></circle>
                                        </svg>
                                        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">80%</span>
                                    </div>
                                    <div className="text-[10px] font-bold text-brand-dark uppercase tracking-tighter">Planning & Org</div>
                                </div>
                                {/* Factor 2 */}
                                <div className="text-center p-4 rounded-3xl bg-brand-bg border border-gray-50">
                                    <div className="relative w-16 h-16 mx-auto mb-4">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-100"></circle>
                                            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray="175.9" strokeDashoffset="61.5" className="text-brand-purple transition-all duration-1000"></circle>
                                        </svg>
                                        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">65%</span>
                                    </div>
                                    <div className="text-[10px] font-bold text-brand-dark uppercase tracking-tighter">Social Adj.</div>
                                </div>
                                {/* Factor 3 */}
                                <div className="text-center p-4 rounded-3xl bg-brand-bg border border-gray-100">
                                    <div className="relative w-16 h-16 mx-auto mb-4">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-100"></circle>
                                            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray="175.9" strokeDashoffset="17.5" className="text-brand-green transition-all duration-1000"></circle>
                                        </svg>
                                        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">90%</span>
                                    </div>
                                    <div className="text-[10px] font-bold text-brand-dark uppercase tracking-tighter">Effective Intel</div>
                                </div>
                                {/* Factor 4 */}
                                <div className="text-center p-4 rounded-3xl bg-brand-bg border border-gray-100">
                                    <div className="relative w-16 h-16 mx-auto mb-4">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-100"></circle>
                                            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray="175.9" strokeDashoffset="87.9" className="text-brand-yellow transition-all duration-1000"></circle>
                                        </svg>
                                        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">50%</span>
                                    </div>
                                    <div className="text-[10px] font-bold text-brand-dark uppercase tracking-tighter">Dynamic</div>
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

                        {/* Daily Tasks */}
                        <div className="bg-brand-dark rounded-[2.5rem] p-8 text-white reveal-right">
                            <h3 className="font-hero font-bold text-lg mb-6">Today's Drills</h3>
                            <div className="space-y-4">
                                <label className="flex items-center gap-4 group cursor-pointer">
                                    <div className="relative flex items-center justify-center">
                                        <input type="checkbox" defaultChecked className="peer appearance-none w-5 h-5 border border-white/20 rounded-md checked:bg-brand-orange checked:border-brand-orange transition-all" />
                                        <i className="fa-solid fa-check absolute text-[10px] text-white opacity-0 peer-checked:opacity-100"></i>
                                    </div>
                                    <span className="text-sm font-noname text-gray-300 peer-checked:line-through peer-checked:text-gray-500">Solve 1 WAT Practice Set</span>
                                </label>
                                <label className="flex items-center gap-4 group cursor-pointer">
                                    <div className="relative flex items-center justify-center">
                                        <input type="checkbox" className="peer appearance-none w-5 h-5 border border-white/20 rounded-md checked:bg-brand-orange checked:border-brand-orange transition-all" />
                                        <i className="fa-solid fa-check absolute text-[10px] text-white opacity-0 peer-checked:opacity-100"></i>
                                    </div>
                                    <span className="text-sm font-noname text-gray-300">Run 2.5km (Stamina Phase)</span>
                                </label>
                                <label className="flex items-center gap-4 group cursor-pointer">
                                    <div className="relative flex items-center justify-center">
                                        <input type="checkbox" className="peer appearance-none w-5 h-5 border border-white/20 rounded-md checked:bg-brand-orange checked:border-brand-orange transition-all" />
                                        <i className="fa-solid fa-check absolute text-[10px] text-white opacity-0 peer-checked:opacity-100"></i>
                                    </div>
                                    <span className="text-sm font-noname text-gray-300">Read "India-China Borders"</span>
                                </label>
                            </div>
                            <button className="w-full mt-8 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold uppercase tracking-widest transition-all">
                                Update Tasks
                            </button>
                        </div>

                        {/* Mentor Card */}
                        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm reveal-right delay-200">
                            <div className="text-center mb-6">
                                <div className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-brand-bg overflow-hidden relative">
                                    {/* Placeholder Image */}
                                    <div className="w-full h-full bg-gray-200"></div>
                                </div>
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
                                <p className="text-xs text-yellow-800 leading-relaxed font-noname"><strong>Mentor Note:</strong> {user.name.split(' ')[0]}, your PPDT narration needs better voice modulation. Focus on the 'Chest Up' posture.</p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </main>
    );
}
