'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PIQForm() {
    const router = useRouter();

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.push('/piq/result');
    };

    return (
        <>
            <Navbar />

            <main>
                <section className="min-h-screen bg-brand-bg pt-32 pb-20 px-6">
                    <div className="max-w-5xl mx-auto">

                        {/* Page Header */}
                        <div className="mb-12 reveal">
                            <h1 className="font-hero font-bold text-4xl text-brand-dark mb-2">
                                Fill Your{' '}
                                <span className="text-brand-orange">PIQ Details</span>
                            </h1>
                            <p className="text-gray-500 font-noname italic">
                                Enter details exactly as per official SSB PIQ form for accurate analysis.
                            </p>
                            <div className="mt-6 flex items-center gap-4">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    Progress
                                </span>
                                <div className="w-48 h-1.5 bg-gray-200 rounded-full">
                                    <div className="w-full h-full bg-brand-orange rounded-full"></div>
                                </div>
                                <span className="text-[10px] font-bold text-brand-orange">
                                    Step 1 of 1
                                </span>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="space-y-12">

                                {/* ── SECTION 1: Personal Details ── */}
                                <div className="bg-white p-8 lg:p-12 rounded-[3rem] border border-gray-100 shadow-sm reveal-scale">
                                    <h3 className="font-hero font-bold text-xl text-brand-dark mb-8 border-l-4 border-brand-orange pl-4">
                                        SECTION 1 — Personal Details
                                    </h3>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">
                                                Full Name (CAPITAL)
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="VIKRAM BATRA"
                                                className="w-full h-14 bg-brand-bg border border-gray-100 rounded-2xl px-6 text-sm focus:ring-2 focus:ring-brand-orange/20 outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">
                                                Father&apos;s Name
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full h-14 bg-brand-bg border border-gray-100 rounded-2xl px-6 text-sm focus:ring-2 focus:ring-brand-orange/20 outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">
                                                Date of Birth
                                            </label>
                                            <input
                                                type="date"
                                                className="w-full h-14 bg-brand-bg border border-gray-100 rounded-2xl px-6 text-sm focus:ring-2 focus:ring-brand-orange/20 outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">
                                                Marital Status
                                            </label>
                                            <select className="w-full h-14 bg-brand-bg border border-gray-100 rounded-2xl px-6 text-sm focus:ring-2 focus:ring-brand-orange/20 outline-none">
                                                <option>Single</option>
                                                <option>Married</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">
                                                Religion
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full h-14 bg-brand-bg border border-gray-100 rounded-2xl px-6 text-sm focus:ring-2 focus:ring-brand-orange/20 outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">
                                                Category
                                            </label>
                                            <select className="w-full h-14 bg-brand-bg border border-gray-100 rounded-2xl px-6 text-sm focus:ring-2 focus:ring-brand-orange/20 outline-none">
                                                <option>General</option>
                                                <option>OBC</option>
                                                <option>SC</option>
                                                <option>ST</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">
                                                Mother Tongue
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full h-14 bg-brand-bg border border-gray-100 rounded-2xl px-6 text-sm focus:ring-2 focus:ring-brand-orange/20 outline-none"
                                            />
                                        </div>
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">
                                                Place of Maximum Residence (City, State)
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full h-14 bg-brand-bg border border-gray-100 rounded-2xl px-6 text-sm focus:ring-2 focus:ring-brand-orange/20 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* ── SECTION 2: Family Details ── */}
                                <div className="bg-white p-8 lg:p-12 rounded-[3rem] border border-gray-100 shadow-sm reveal-scale">
                                    <h3 className="font-hero font-bold text-xl text-brand-dark mb-8 border-l-4 border-brand-orange pl-4">
                                        SECTION 2 — Family Details
                                    </h3>
                                    <div className="grid md:grid-cols-3 gap-6">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">
                                                Parents Alive?
                                            </label>
                                            <div className="flex gap-2 bg-brand-bg p-1 rounded-xl border border-gray-100">
                                                <button
                                                    type="button"
                                                    className="flex-1 py-2 rounded-lg bg-white text-brand-dark text-xs font-bold shadow-sm"
                                                >
                                                    Yes
                                                </button>
                                                <button
                                                    type="button"
                                                    className="flex-1 py-2 rounded-lg text-gray-400 text-xs font-bold"
                                                >
                                                    No
                                                </button>
                                            </div>
                                        </div>
                                        <div className="md:col-span-2 grid md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">
                                                    Father Occupation
                                                </label>
                                                <input
                                                    type="text"
                                                    className="w-full h-14 bg-brand-bg border border-gray-100 rounded-2xl px-6 text-sm focus:ring-2 focus:ring-brand-orange/20 outline-none"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">
                                                    Father Income (Monthly)
                                                </label>
                                                <input
                                                    type="text"
                                                    className="w-full h-14 bg-brand-bg border border-gray-100 rounded-2xl px-6 text-sm focus:ring-2 focus:ring-brand-orange/20 outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ── SECTION 3: Educational Record ── */}
                                <div className="bg-white p-8 lg:p-12 rounded-[3rem] border border-gray-100 shadow-sm reveal-scale">
                                    <h3 className="font-hero font-bold text-xl text-brand-dark mb-8 border-l-4 border-brand-orange pl-4">
                                        SECTION 3 — Educational Record
                                    </h3>
                                    <div className="space-y-10">
                                        {/* Matriculation */}
                                        <div className="space-y-4">
                                            <h4 className="text-xs font-bold text-brand-orange uppercase tracking-wider">
                                                Matriculation (10th)
                                            </h4>
                                            <div className="grid md:grid-cols-3 gap-4">
                                                <input
                                                    type="text"
                                                    placeholder="School Name"
                                                    className="bg-brand-bg h-12 rounded-xl px-4 text-xs border border-gray-100 outline-none"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Board"
                                                    className="bg-brand-bg h-12 rounded-xl px-4 text-xs border border-gray-100 outline-none"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Year"
                                                    className="bg-brand-bg h-12 rounded-xl px-4 text-xs border border-gray-100 outline-none"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Percentage"
                                                    className="bg-brand-bg h-12 rounded-xl px-4 text-xs border border-gray-100 outline-none"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Medium"
                                                    className="bg-brand-bg h-12 rounded-xl px-4 text-xs border border-gray-100 outline-none"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Achievement"
                                                    className="bg-brand-bg h-12 rounded-xl px-4 text-xs border border-gray-100 outline-none"
                                                />
                                            </div>
                                        </div>

                                        {/* Intermediate */}
                                        <div className="space-y-4">
                                            <h4 className="text-xs font-bold text-brand-orange uppercase tracking-wider">
                                                Intermediate (10+2)
                                            </h4>
                                            <div className="grid md:grid-cols-3 gap-4">
                                                <input
                                                    type="text"
                                                    placeholder="School Name"
                                                    className="bg-brand-bg h-12 rounded-xl px-4 text-xs border border-gray-100 outline-none"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Stream (e.g. PCM)"
                                                    className="bg-brand-bg h-12 rounded-xl px-4 text-xs border border-gray-100 outline-none"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Percentage"
                                                    className="bg-brand-bg h-12 rounded-xl px-4 text-xs border border-gray-100 outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ── SECTION 4 & 5: Physical & Occupation ── */}
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm reveal-left">
                                        <h3 className="font-hero font-bold text-xl text-brand-dark mb-6">
                                            SECTION 4 — Physical
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-2">
                                                    Height (Mtrs)
                                                </label>
                                                <input
                                                    type="text"
                                                    className="w-full h-12 bg-brand-bg border border-gray-100 rounded-xl px-4 text-xs outline-none"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-2">
                                                    Weight (Kg)
                                                </label>
                                                <input
                                                    type="text"
                                                    className="w-full h-12 bg-brand-bg border border-gray-100 rounded-xl px-4 text-xs outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm reveal-right">
                                        <h3 className="font-hero font-bold text-xl text-brand-dark mb-6">
                                            SECTION 5 — Occupation
                                        </h3>
                                        <div className="space-y-4">
                                            <input
                                                type="text"
                                                placeholder="Current Occupation"
                                                className="w-full h-12 bg-brand-bg border border-gray-100 rounded-xl px-4 text-xs outline-none"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Monthly Income (If any)"
                                                className="w-full h-12 bg-brand-bg border border-gray-100 rounded-xl px-4 text-xs outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* ── SECTION 7: Activities & Achievement ── */}
                                <div className="bg-white p-8 lg:p-12 rounded-[3rem] border border-gray-100 shadow-sm reveal-scale">
                                    <h3 className="font-hero font-bold text-xl text-brand-dark mb-8 border-l-4 border-brand-orange pl-4">
                                        SECTION 7 — Activities &amp; Achievement
                                    </h3>
                                    <div className="space-y-8">
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2 mb-3 block">
                                                Sports Participation (Game, Level, Duration)
                                            </label>
                                            <textarea
                                                className="w-full h-24 bg-brand-bg border border-gray-100 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-brand-orange/20 outline-none resize-none"
                                                placeholder="Cricket, District, 2 Years..."
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2 mb-3 block">
                                                Hobbies
                                            </label>
                                            <textarea
                                                className="w-full h-24 bg-brand-bg border border-gray-100 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-brand-orange/20 outline-none resize-none"
                                                placeholder="Sketching, Marathon running..."
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2 mb-3 block">
                                                Positions of Responsibility (Captain, Coordinator)
                                            </label>
                                            <textarea
                                                className="w-full h-24 bg-brand-bg border border-gray-100 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-brand-orange/20 outline-none resize-none"
                                                placeholder="School Head Boy, NCC Under Officer..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* ── Submit Button ── */}
                                <div className="flex justify-center pt-8">
                                    <button
                                        type="submit"
                                        className="group relative bg-brand-dark p-[2px] rounded-full shadow-2xl transition-all duration-300 hover:shadow-brand-orange/20 hover:-translate-y-1 w-full max-w-md"
                                    >
                                        <div className="relative w-full h-full rounded-full overflow-hidden bg-transparent flex items-center justify-between pl-8 pr-2 py-4">
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full transition-transform duration-[1500ms] ease-out group-hover:scale-[30]"></div>
                                            <span className="relative z-10 text-white group-hover:text-brand-dark font-hero font-bold text-lg transition-colors duration-[1000ms]">
                                                Generate My PIQ Readiness Score
                                            </span>
                                            <span className="relative z-10 bg-white text-brand-dark w-12 h-12 rounded-full flex items-center justify-center">
                                                <i className="fa-solid fa-arrow-right"></i>
                                            </span>
                                        </div>
                                    </button>
                                </div>

                            </div>
                        </form>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}
