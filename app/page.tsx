import Link from "next/link";

export default function Home() {
    return (
        <>
            {/* Navigation */}
            <nav className="absolute w-full z-50 top-0 left-0 py-6 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-12">
                        <div className="flex items-center gap-2 text-brand-orange">
                            <i className="fa-solid fa-shield-halved text-2xl"></i>
                            <span className="font-logo font-semibold text-2xl tracking-tight text-brand-dark">LakshaySSB</span>
                        </div>

                        <div className="hidden md:flex gap-8 text-sm font-noname font-medium text-gray-800 tracking-wide">
                            <Link href="/" className="hover:text-brand-orange transition">Home</Link>
                            <Link href="/#process" className="hover:text-brand-orange transition">SSB Process</Link>
                            <a href="#" className="hover:text-brand-orange transition">Success Stories</a>
                            <Link href="/dashboard" className="hover:text-brand-orange transition">Dashboard</Link>
                            <Link href="/auth" className="hover:text-brand-orange transition">Login / Sign Up</Link>
                        </div>
                    </div>

                    <Link href="/auth" className="group relative bg-brand-dark p-[2px] rounded-full shadow-lg transition-all duration-300 hover:shadow-xl">
                        <div className="relative w-full h-full rounded-full overflow-hidden bg-transparent flex items-center gap-3 pl-6 pr-1.5 py-1.5">
                            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full transition-transform duration-[1500ms] ease-out group-hover:scale-[30]"></div>
                            <span className="relative z-10 text-white group-hover:text-brand-dark text-sm font-medium transition-colors duration-[1000ms]">Join Academy</span>
                            <div className="relative z-10 bg-white text-brand-dark w-8 h-8 rounded-full flex items-center justify-center">
                                <i className="fa-solid fa-arrow-right text-xs"></i>
                            </div>
                        </div>
                    </Link>
                </div>
            </nav>

            <main>
                {/* Hero Section */}
                <section className="relative pt-40 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-brand-bg">
                    {/* Right Side Grid Background */}
                    <div className="absolute top-0 right-0 w-full lg:w-[calc(60%_-_40px)] h-full bg-grid-pattern opacity-100 z-0 pointer-events-none"></div>

                    <div className="max-w-7xl mx-auto px-6 relative z-10">
                        <div className="flex flex-col lg:flex-row items-center gap-16">
                            {/* Text Content */}
                            <div className="lg:w-1/2 reveal-left active">
                                <div className="inline-block px-4 py-1.5 rounded-full border border-brand-orange/20 bg-brand-orange/5 mb-6">
                                    <span className="font-noname text-xs font-bold text-brand-orange uppercase tracking-widest">Master the Selection Process</span>
                                </div>

                                <h1 className="font-hero font-bold text-5xl lg:text-7xl text-brand-dark tracking-tight leading-[1.1] mb-8">
                                    Prepare Like <br />an <span className="text-brand-orange">Officer</span>.
                                </h1>

                                <p className="text-lg text-gray-500 mb-10 leading-relaxed max-w-lg font-noname">
                                    Elite mentorship for SSB aspirants. Join 500+ recommended candidates who mastered the OLQs with our scientific preparation framework.
                                </p>

                                <div className="flex flex-wrap gap-4">
                                    <Link href="/auth" className="group relative bg-brand-dark p-[2px] rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                        <div className="relative w-full h-full rounded-full overflow-hidden bg-transparent flex items-center gap-4 pl-8 pr-2 py-2.5">
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full transition-transform duration-[1500ms] ease-out group-hover:scale-[30]"></div>
                                            <span className="relative z-10 text-white group-hover:text-brand-dark font-noname font-bold text-base transition-colors duration-[1000ms]">Start Preparation</span>
                                            <span className="relative z-10 bg-white text-brand-dark w-10 h-10 rounded-full flex items-center justify-center">
                                                <i className="fa-solid fa-bolt text-xs"></i>
                                            </span>
                                        </div>
                                    </Link>
                                    <a href="#process" className="text-brand-dark font-noname font-bold hover:text-brand-orange transition flex items-center gap-3 px-6 h-[58px] rounded-full border border-gray-200 bg-white">
                                        Explore Courses
                                    </a>
                                </div>

                                <div className="mt-12 flex items-center gap-6 pt-12 border-t border-gray-100 reveal delay-300 active">
                                    <div className="flex -space-x-3">
                                        <img className="w-10 h-10 rounded-full border-2 border-white object-cover" src="https://images.unsplash.com/photo-1556978254-407bc35f8e66?ixid=M3w4NjU0NDF8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBhcm15JTIwb2ZmaWNlciUyMHBvcnRyYWl0JTIwc3F1YXJlfGVufDB8Mnx8fDE3NzEwNTE1MzZ8MA&ixlib=rb-4.1.0&w=100&h=100&fit=crop&fm=jpg&q=80" alt="Officer" />
                                        <img className="w-10 h-10 rounded-full border-2 border-white object-cover" src="https://images.pexels.com/photos/8199174/pexels-photo-8199174.jpeg?w=100&h=100&fit=crop" alt="Aspirant" />
                                        <img className="w-10 h-10 rounded-full border-2 border-white object-cover" src="https://images.unsplash.com/photo-1538651954807-323f3c1c1123?ixid=M3w4NjU0NDF8MHwxfHNlYXJjaHwxfHxuYXZ5JTIwb2ZmaWNlciUyMHdvbWFuJTIwcG9ydHJhaXQlMjBzcXVhcmV8ZW58MHwyfHx8MTc3MTA1MTUzNXww&ixlib=rb-4.1.0&w=100&h=100&fit=crop&fm=jpg&q=80" alt="Officer" />
                                        <div className="w-10 h-10 rounded-full border-2 border-white bg-brand-orange flex items-center justify-center text-[10px] text-white font-bold">+500</div>
                                    </div>
                                    <p className="text-sm text-gray-500 font-noname"><strong>Recommended</strong> from NDA-152, CDS-OTA & AFCAT 02/24 batches.</p>
                                </div>
                            </div>

                            {/* Hero Visual */}
                            <div className="lg:w-1/2 reveal-right delay-200 relative active">
                                {/* Color Glow */}
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-[101%] h-[92%] blur-2xl -z-10 rounded-2xl opacity-20" style={{ background: 'linear-gradient(135deg, #FF5E3A 40%, #7C3AED, #FBBF24)' }}></div>

                                <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-10 w-full" style={{ transform: 'perspective(1200px) rotateY(-5deg) rotateX(5deg)' }}>
                                    <img src="https://www.ssbcrack.com/wp-content/uploads/2021/10/Join-IMA-Dehradun.png?w=1200&h=800&fit=crop" alt="National Defence Academy training" className="w-full h-[500px] object-cover scale-105" />

                                    {/* Overlay Info Card */}
                                    <div className="absolute bottom-6 left-6 right-6 glass-card p-6 rounded-2xl border border-white/40 flex items-center justify-between">
                                        <div>
                                            <div className="text-[10px] text-brand-orange uppercase font-bold tracking-widest mb-1">Next Batch Starting</div>
                                            <div className="text-lg font-bold text-brand-dark">15th October 2024</div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <div className="text-[10px] text-gray-400 font-bold mb-1">Limited Seats</div>
                                            <div className="flex gap-1 text-brand-yellow text-[10px]">
                                                <i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Floating Badges */}
                                <div className="absolute -top-12 -left-12 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-4 z-20 animate-float">
                                    <div className="w-12 h-12 rounded-xl bg-green-50 text-brand-green flex items-center justify-center text-xl">
                                        <i className="fa-solid fa-person-military-pointing"></i>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Psychology Expert</div>
                                        <div className="text-sm font-bold text-brand-dark">Ex-Asst. Psychologist DIPR</div>
                                    </div>
                                </div>

                                <div className="absolute -bottom-6 -right-6 bg-brand-dark p-5 rounded-2xl shadow-2xl z-20 text-white flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="text-3xl font-hero font-bold text-brand-orange">15/15</div>
                                        <div className="text-[10px] text-gray-400 uppercase font-medium">OLQs Covered</div>
                                    </div>
                                    <div className="w-[1px] h-10 bg-white/10"></div>
                                    <i className="fa-solid fa-bullseye text-2xl text-white/50"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* LOGO CLOUD / TRUST BAR */}
                <section className="border-y border-gray-100 bg-[#fcfbfa] py-10 overflow-hidden">
                    <div className="w-full">
                        <p className="text-center text-[10px] font-bold text-gray-400 mb-8 tracking-[0.3em] font-mono uppercase">Specialized Training For</p>

                        <div className="relative w-full overflow-hidden" style={{ WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)', maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>
                            <div className="flex w-max animate-marquee">
                                <div className="flex items-center gap-20 lg:gap-32 px-12">
                                    <span className="text-2xl font-hero font-bold text-gray-300">NDA</span>
                                    <span className="text-2xl font-hero font-bold text-gray-300">CDS (IMA/AFA/INA)</span>
                                    <span className="text-2xl font-hero font-bold text-gray-300">AFCAT</span>
                                    <span className="text-2xl font-hero font-bold text-gray-300">TES / UES</span>
                                    <span className="text-2xl font-hero font-bold text-gray-300">NCC SPECIAL</span>
                                    <span className="text-2xl font-hero font-bold text-gray-300">TERRITORIAL ARMY</span>
                                </div>
                                {/* Duplicate for Marquee */}
                                <div className="flex items-center gap-20 lg:gap-32 px-12">
                                    <span className="text-2xl font-hero font-bold text-gray-300">NDA</span>
                                    <span className="text-2xl font-hero font-bold text-gray-300">CDS (IMA/AFA/INA)</span>
                                    <span className="text-2xl font-hero font-bold text-gray-300">AFCAT</span>
                                    <span className="text-2xl font-hero font-bold text-gray-300">TES / UES</span>
                                    <span className="text-2xl font-hero font-bold text-gray-300">NCC SPECIAL</span>
                                    <span className="text-2xl font-hero font-bold text-gray-300">TERRITORIAL ARMY</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* SSB PROCESS SECTION */}
                <section id="process" className="py-24 px-6 bg-white overflow-hidden">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col lg:flex-row gap-16 items-center">
                            <div className="lg:w-1/2 reveal-left active">
                                <div className="inline-block px-3 py-1 rounded-lg border border-brand-orange/10 bg-brand-orange/5 mb-6">
                                    <span className="font-mono text-xs font-bold text-brand-orange">5-DAY PROCESS</span>
                                </div>
                                <h2 className="font-hero font-bold text-4xl lg:text-5xl mb-6 text-brand-dark tracking-tight leading-tight">
                                    The 5-Day SSB <br />Selection Roadmap
                                </h2>
                                <div className="space-y-6">
                                    <div className="flex gap-4 p-4 rounded-2xl hover:bg-brand-bg transition-colors border border-transparent hover:border-gray-100">
                                        <div className="w-12 h-12 rounded-full bg-brand-dark text-white flex items-center justify-center font-bold flex-shrink-0">01</div>
                                        <div>
                                            <h4 className="font-bold text-brand-dark mb-1">Screening (Stage I)</h4>
                                            <p className="text-sm text-gray-500 font-noname">OIR tests and PPDT. The first hurdle where decision-making and perception are tested.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 p-4 rounded-2xl hover:bg-brand-bg transition-colors border border-transparent hover:border-gray-100">
                                        <div className="w-12 h-12 rounded-full bg-brand-dark text-white flex items-center justify-center font-bold flex-shrink-0">02</div>
                                        <div>
                                            <h4 className="font-bold text-brand-dark mb-1">Psychology Tests (Stage II)</h4>
                                            <p className="text-sm text-gray-500 font-noname">TAT, WAT, SRT, and SD. Peeking into your subconscious mind and personality traits.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 p-4 rounded-2xl hover:bg-brand-bg transition-colors border border-transparent hover:border-gray-100">
                                        <div className="w-12 h-12 rounded-full bg-brand-dark text-white flex items-center justify-center font-bold flex-shrink-0">03</div>
                                        <div>
                                            <h4 className="font-bold text-brand-dark mb-1">GTO Tasks & Personal Interview</h4>
                                            <p className="text-sm text-gray-500 font-noname">Outdoor group tasks and deep-dive one-on-one conversations with the IO.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="lg:w-1/2 reveal-right relative active">
                                <div className="bg-brand-bg rounded-[2rem] p-2">
                                    <img src="https://images.pexels.com/photos/2450438/pexels-photo-2450438.jpeg?w=800&h=1000&fit=crop" alt="GTO Training" className="rounded-[1.8rem] w-full object-cover" />
                                </div>
                                {/* Floating Info */}
                                <div className="absolute -bottom-8 -left-8 bg-white shadow-2xl p-6 rounded-2xl border border-gray-100 max-w-[240px]">
                                    <div className="flex items-center gap-2 mb-2 text-brand-orange">
                                        <i className="fa-solid fa-medal"></i>
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Success Rate</span>
                                    </div>
                                    <div className="text-3xl font-hero font-bold text-brand-dark">92.4%</div>
                                    <p className="text-[10px] text-gray-400 mt-1">Recommendation rate of our recommended candidates in medicals.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* TRAINING DOMAINS (Bento) */}
                <section className="py-24 px-6 bg-brand-bg">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16 reveal active">
                            <h2 className="font-hero font-bold text-4xl text-brand-dark mb-4">Master Every Pillar of SSB</h2>
                            <p className="text-gray-500 font-noname">Scientific preparation modules designed by Ex-Assessors.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {/* Psychology Card */}
                            <div className="group bg-white rounded-3xl p-8 border border-gray-100 hover:shadow-xl transition-all reveal-scale active">
                                <div className="w-14 h-14 rounded-2xl bg-[#7C3AED]/10 text-brand-purple flex items-center justify-center text-2xl mb-8 group-hover:scale-110 transition-transform">
                                    <i className="fa-solid fa-brain"></i>
                                </div>
                                <h3 className="font-hero font-bold text-2xl text-brand-dark mb-4">Psychology Tests</h3>
                                <p className="text-gray-500 text-sm leading-relaxed mb-6 font-noname">Master TAT, WAT, and SRT with our proprietary &quot;Thought Projection&quot; technique. Get personalized feedback on your Self Description.</p>
                                <ul className="space-y-3 mb-8">
                                    <li className="flex items-center gap-2 text-xs font-bold text-brand-dark"><i className="fa-solid fa-check text-brand-green"></i> 50+ TAT Practice Sets</li>
                                    <li className="flex items-center gap-2 text-xs font-bold text-brand-dark"><i className="fa-solid fa-check text-brand-green"></i> Live SRT Analysis</li>
                                </ul>
                                <a href="#" className="text-brand-orange font-bold text-xs uppercase tracking-widest flex items-center gap-2 group/link">View Module <i className="fa-solid fa-arrow-right group-hover/link:translate-x-1 transition-transform"></i></a>
                            </div>

                            {/* GTO Card */}
                            <div className="group bg-white rounded-3xl p-8 border border-gray-100 hover:shadow-xl transition-all reveal-scale delay-100 active">
                                <div className="w-14 h-14 rounded-2xl bg-[#FF5E3A]/10 text-brand-orange flex items-center justify-center text-2xl mb-8 group-hover:scale-110 transition-transform">
                                    <i className="fa-solid fa-person-running"></i>
                                </div>
                                <h3 className="font-hero font-bold text-2xl text-brand-dark mb-4">GTO Ground Tasks</h3>
                                <p className="text-gray-500 text-sm leading-relaxed mb-6 font-noname">Simulated indoor GPEs and detailed walkthroughs of HGT, PGT, and Individual Obstacles using 3D modeling.</p>
                                <ul className="space-y-3 mb-8">
                                    <li className="flex items-center gap-2 text-xs font-bold text-brand-dark"><i className="fa-solid fa-check text-brand-green"></i> GPE Logic Building</li>
                                    <li className="flex items-center gap-2 text-xs font-bold text-brand-dark"><i className="fa-solid fa-check text-brand-green"></i> Obstacle Strategy</li>
                                </ul>
                                <a href="#" className="text-brand-orange font-bold text-xs uppercase tracking-widest flex items-center gap-2 group/link">View Module <i className="fa-solid fa-arrow-right group-hover/link:translate-x-1 transition-transform"></i></a>
                            </div>

                            {/* Interview Card */}
                            <div className="group bg-white rounded-3xl p-8 border border-gray-100 hover:shadow-xl transition-all reveal-scale delay-200 active">
                                <div className="w-14 h-14 rounded-2xl bg-[#10B981]/10 text-brand-green flex items-center justify-center text-2xl mb-8 group-hover:scale-110 transition-transform">
                                    <i className="fa-solid fa-comments"></i>
                                </div>
                                <h3 className="font-hero font-bold text-2xl text-brand-dark mb-4">Personal Interview</h3>
                                <p className="text-gray-500 text-sm leading-relaxed mb-6 font-noname">One-on-one mock interviews with Ex-Interviewing Officers. Learn to frame answers for tricky PIQ-based questions.</p>
                                <ul className="space-y-3 mb-8">
                                    <li className="flex items-center gap-2 text-xs font-bold text-brand-dark"><i className="fa-solid fa-check text-brand-green"></i> 2 Mock Interviews</li>
                                    <li className="flex items-center gap-2 text-xs font-bold text-brand-dark"><i className="fa-solid fa-check text-brand-green"></i> Detailed PI Feedback</li>
                                </ul>
                                <a href="#" className="text-brand-orange font-bold text-xs uppercase tracking-widest flex items-center gap-2 group/link">View Module <i className="fa-solid fa-arrow-right group-hover/link:translate-x-1 transition-transform"></i></a>
                            </div>
                        </div>
                    </div>
                </section>

                {/* DAILY PRACTICE SECTION */}
                <section className="py-20 bg-brand-dark text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>
                    <div className="max-w-7xl mx-auto px-6 relative z-10">
                        <div className="bg-white/5 backdrop-blur-md rounded-[3rem] p-8 lg:p-16 border border-white/10">
                            <div className="grid lg:grid-cols-2 gap-12 items-center">
                                <div className="reveal-left active">
                                    <h2 className="font-hero font-bold text-4xl lg:text-5xl mb-6">Daily Practice Habits</h2>
                                    <p className="text-gray-400 font-noname mb-10 leading-relaxed">Preparation isn&apos;t a 2-week course; it&apos;s a lifestyle change. Our daily portal keeps you on track with OLQ-building activities.</p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-full bg-brand-orange flex items-center justify-center text-sm"><i className="fa-solid fa-newspaper"></i></div>
                                            <div>
                                                <h5 className="font-bold text-sm">Daily News Analysis</h5>
                                                <p className="text-xs text-gray-500 mt-1">Handpicked current affairs for GD/Lecturette.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-full bg-brand-purple flex items-center justify-center text-sm"><i className="fa-solid fa-dumbbell"></i></div>
                                            <div>
                                                <h5 className="font-bold text-sm">Fitness Tracker</h5>
                                                <p className="text-xs text-gray-500 mt-1">Routine for stamina and core strength.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="reveal-right active">
                                    <div className="bg-white rounded-3xl p-6 text-brand-dark shadow-2xl">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="font-bold">Today&apos;s Practice Task</div>
                                            <div className="px-3 py-1 bg-brand-orange/10 text-brand-orange rounded-full text-xs font-bold">LIVE</div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="p-4 bg-brand-bg rounded-xl border border-gray-100 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-brand-orange"></div>
                                                    <span className="text-sm font-medium">WAT Practice (Set #42)</span>
                                                </div>
                                                <button className="text-xs font-bold text-brand-orange">START</button>
                                            </div>
                                            <div className="p-4 bg-brand-bg rounded-xl border border-gray-100 flex items-center justify-between opacity-50">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                                                    <span className="text-sm font-medium">Lecturette: &quot;Indo-Pacific Ties&quot;</span>
                                                </div>
                                                <span className="text-[10px] font-bold">LOCKED</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* SUCCESS STORIES (Testimonials) */}
                <section className="py-24 bg-white relative overflow-hidden">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-16 reveal active">
                            <h2 className="font-hero font-bold text-4xl text-brand-dark mb-4">From Aspirants to Officers</h2>
                            <p className="text-gray-500">Real stories from the hallowed portals of NDA, IMA, and AFA.</p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {/* Testimonial 1 */}
                            <div className="p-8 rounded-[2rem] border border-gray-100 bg-brand-bg relative reveal-scale active">
                                <div className="flex gap-1 text-brand-yellow mb-6">
                                    <i className="fa-solid fa-star text-xs"></i><i className="fa-solid fa-star text-xs"></i><i className="fa-solid fa-star text-xs"></i><i className="fa-solid fa-star text-xs"></i><i className="fa-solid fa-star text-xs"></i>
                                </div>
                                <p className="text-gray-600 italic font-noname mb-8">&quot;The psychology feedback was instrumental. I realized my TAT stories were negative, and LakshaySSB helped me reframe my mindset towards problem-solving.&quot;</p>
                                <div className="flex items-center gap-4">
                                    <img src="https://images.pexels.com/photos/6121941/pexels-photo-6121941.jpeg?w=100&h=100&fit=crop" alt="Success Story" className="w-12 h-12 rounded-full object-cover" />
                                    <div>
                                        <div className="font-bold text-brand-dark text-sm">Lt. Vikram Singh</div>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Cdt @ IMA, Dehradun</div>
                                    </div>
                                </div>
                            </div>

                            {/* Testimonial 2 */}
                            <div className="p-8 rounded-[2rem] border border-gray-100 bg-brand-bg relative reveal-scale delay-100 active">
                                <div className="flex gap-1 text-brand-yellow mb-6">
                                    <i className="fa-solid fa-star text-xs"></i><i className="fa-solid fa-star text-xs"></i><i className="fa-solid fa-star text-xs"></i><i className="fa-solid fa-star text-xs"></i><i className="fa-solid fa-star text-xs"></i>
                                </div>
                                <p className="text-gray-600 italic font-noname mb-8">&quot;I was a repeater with 4 screen-outs. Their PPDT module fixed my narration and group discussion stance. Finally made it in the 5th attempt!&quot;</p>
                                <div className="flex items-center gap-4">
                                    <img src="https://images.pexels.com/photos/20404402/pexels-photo-20404402.jpeg?w=100&h=100&fit=crop" alt="Success Story" className="w-12 h-12 rounded-full object-cover" />
                                    <div>
                                        <div className="font-bold text-brand-dark text-sm">Flt Lt. Ananya Iyer</div>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">AFCAT 01/24 Batch</div>
                                    </div>
                                </div>
                            </div>

                            {/* Testimonial 3 */}
                            <div className="p-8 rounded-[2rem] border border-gray-100 bg-brand-bg relative reveal-scale delay-200 active">
                                <div className="flex gap-1 text-brand-yellow mb-6">
                                    <i className="fa-solid fa-star text-xs"></i><i className="fa-solid fa-star text-xs"></i><i className="fa-solid fa-star text-xs"></i><i className="fa-solid fa-star text-xs"></i><i className="fa-solid fa-star text-xs"></i>
                                </div>
                                <p className="text-gray-600 italic font-noname mb-8">&quot;The GPE workshops were brilliant. Breaking down the &apos;Critical Task First&apos; logic helped me lead the group discussion effectively during my SSB in Kapurthala.&quot;</p>
                                <div className="flex items-center gap-4">
                                    <img src="https://images.pexels.com/photos/30386568/pexels-photo-30386568.jpeg?w=100&h=100&fit=crop" alt="Success Story" className="w-12 h-12 rounded-full object-cover" />
                                    <div>
                                        <div className="font-bold text-brand-dark text-sm">Srg. Rahul Mehra</div>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Recommended (NDA 151)</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* JOIN NOW BANNER */}
                <section className="py-24 px-6 mb-12">
                    <div className="max-w-6xl mx-auto">
                        <div className="relative rounded-[3rem] bg-brand-dark overflow-hidden p-12 lg:p-20 text-center">
                            {/* Decor */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/20 blur-[100px] rounded-full"></div>
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-purple/10 blur-[100px] rounded-full"></div>

                            <div className="relative z-10">
                                <h2 className="font-hero font-bold text-4xl lg:text-6xl text-white mb-6">Earn Your <span className="text-brand-orange">Stars</span>.</h2>
                                <p className="text-gray-400 max-w-2xl mx-auto mb-12 font-noname">The uniform isn&apos;t just fabric; it&apos;s a responsibility. Start your elite preparation now and join the lineage of defenders of the nation.</p>

                                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                                    <Link href="/auth" className="bg-brand-orange hover:bg-white hover:text-brand-dark text-white font-bold h-16 px-10 rounded-full transition-all duration-300 shadow-xl shadow-brand-orange/20 flex items-center justify-center">
                                        Join Next Batch
                                    </Link>
                                    <a href="#" className="bg-transparent border border-white/20 hover:bg-white/5 text-white font-bold h-16 px-10 rounded-full transition-all flex items-center justify-center">
                                        Talk to a Mentor
                                    </a>
                                </div>

                                <p className="mt-8 text-xs text-gray-500 uppercase tracking-widest font-bold">Admission ends in 4D : 12H : 30M</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-brand-dark text-orange-50/70 py-16 text-sm">
                <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-1 md:col-span-1">
                        <div className="flex items-center gap-2 text-white mb-6">
                            <i className="fa-solid fa-shield-halved text-brand-orange text-xl"></i>
                            <span className="font-logo font-bold text-2xl tracking-tight">LakshaySSB</span>
                        </div>
                        <p className="text-gray-500 leading-relaxed">
                            Crafting future leaders for the Indian Armed Forces. Specialized SSB training for NDA, CDS, and AFCAT.
                        </p>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-6">Resources</h4>
                        <ul className="space-y-3">
                            <li><a href="#" className="hover:text-white transition">Psychology Tips</a></li>
                            <li><a href="#" className="hover:text-white transition">GTO Ground Rules</a></li>
                            <li><a href="#" className="hover:text-white transition">Daily Current Affairs</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-6">Academy</h4>
                        <ul className="space-y-3">
                            <li><a href="#" className="hover:text-white transition">About Mentors</a></li>
                            <li><a href="#" className="hover:text-white transition">Admissions</a></li>
                            <li><a href="#" className="hover:text-white transition">Batch Schedule</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-6">Connect</h4>
                        <div className="flex gap-4">
                            <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-orange hover:text-white transition"><i className="fa-brands fa-youtube"></i></a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-orange hover:text-white transition"><i className="fa-brands fa-instagram"></i></a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-orange hover:text-white transition"><i className="fa-brands fa-telegram"></i></a>
                        </div>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
                    <p>© 2024 LakshaySSB Academy. Jai Hind.</p>
                    <div className="flex gap-8">
                        <a href="#" className="hover:text-white transition">Privacy Policy</a>
                        <a href="#" className="hover:text-white transition">Terms of Service</a>
                    </div>
                </div>
            </footer>
        </>
    );
}
