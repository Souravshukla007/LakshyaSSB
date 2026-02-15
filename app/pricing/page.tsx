'use client';

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import useScrollReveal from "@/hooks/useScrollReveal";
import Link from "next/link";

export default function Pricing() {
    useScrollReveal();

    return (
        <main className="antialiased overflow-x-hidden selection:bg-brand-orange selection:text-white font-sans bg-brand-bg">
            <Navbar />

            <section className="min-h-screen bg-brand-bg pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16 reveal">
                        <h1 className="font-hero font-bold text-4xl lg:text-6xl text-brand-dark mb-4">
                            Choose Your SSB <span className="text-brand-orange">Preparation Plan</span>
                        </h1>
                        <p className="text-gray-500 text-lg max-w-2xl mx-auto font-noname">
                            Start free and upgrade when you are ready to earn your stars.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto mb-20">
                        {/* FREE PLAN */}
                        <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col justify-between reveal-left">
                            <div>
                                <h3 className="font-hero font-bold text-2xl text-brand-dark mb-2">FREE PLAN</h3>
                                <div className="text-4xl font-bold text-brand-dark mb-8">
                                    ₹0 <span className="text-sm text-gray-400 font-normal">/month</span>
                                </div>
                                <ul className="space-y-4 mb-10">
                                    <li className="flex items-center gap-3 text-sm text-gray-600">
                                        <i className="fa-solid fa-check text-brand-orange"></i> 1 OIR test (limited)
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-gray-600">
                                        <i className="fa-solid fa-check text-brand-orange"></i> 10 WAT words per day
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-gray-600">
                                        <i className="fa-solid fa-check text-brand-orange"></i> 2 TAT images per day
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-gray-600">
                                        <i className="fa-solid fa-check text-brand-orange"></i> Basic OLQ radar
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-gray-400">
                                        <i className="fa-solid fa-xmark"></i> AI Evaluation & Trends
                                    </li>
                                </ul>
                            </div>
                            <button className="w-full py-4 border border-brand-dark rounded-full font-bold text-brand-dark hover:bg-brand-dark hover:text-white transition-all">
                                Start Free
                            </button>
                        </div>

                        {/* PRO PLAN */}
                        <div className="bg-white p-10 rounded-[3rem] border-4 border-brand-orange shadow-2xl relative flex flex-col justify-between reveal-right">
                            <div className="absolute -top-5 right-10 bg-brand-orange text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg">
                                MOST POPULAR
                            </div>
                            <div>
                                <h3 className="font-hero font-bold text-2xl text-brand-dark mb-2">PRO PLAN</h3>
                                <div className="text-4xl font-bold text-brand-dark mb-8">
                                    ₹249 <span className="text-sm text-gray-400 font-normal">/month</span>
                                </div>
                                <ul className="space-y-4 mb-10">
                                    <li className="flex items-center gap-3 text-sm text-gray-600 font-bold">
                                        <i className="fa-solid fa-check text-brand-orange"></i> Unlimited Practice
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-gray-600 font-bold">
                                        <i className="fa-solid fa-check text-brand-orange"></i> Full AI Psych Evaluation
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-gray-600 font-bold">
                                        <i className="fa-solid fa-check text-brand-orange"></i> OLQ trends & weekly graphs
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-gray-600 font-bold">
                                        <i className="fa-solid fa-check text-brand-orange"></i> Badge system & streaks
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-gray-600 font-bold">
                                        <i className="fa-solid fa-check text-brand-orange"></i> PIQ Builder + Interview Qs
                                    </li>
                                </ul>
                            </div>
                            <Link href="/checkout" className="w-full py-4 bg-brand-dark text-white rounded-full font-bold text-center hover:bg-brand-orange transition-all shadow-xl shadow-brand-dark/20">
                                Upgrade to Pro
                            </Link>
                        </div>
                    </div>

                    <div className="bg-white rounded-[3rem] p-8 lg:p-12 border border-gray-100 shadow-sm reveal">
                        <h3 className="font-hero font-bold text-2xl text-brand-dark mb-8 text-center">Feature Comparison</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="py-4 font-bold text-sm">Feature</th>
                                        <th className="py-4 font-bold text-sm text-center">Free</th>
                                        <th className="py-4 font-bold text-sm text-center">Pro</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm text-gray-600">
                                    <tr className="border-b border-gray-50">
                                        <td className="py-4">AI Evaluation</td>
                                        <td className="py-4 text-center text-red-400">✗</td>
                                        <td className="py-4 text-center text-green-500">✓</td>
                                    </tr>
                                    <tr className="border-b border-gray-50">
                                        <td className="py-4">Unlimited Practice</td>
                                        <td className="py-4 text-center text-red-400">✗</td>
                                        <td className="py-4 text-center text-green-500">✓</td>
                                    </tr>
                                    <tr className="border-b border-gray-50">
                                        <td className="py-4">OLQ Trends</td>
                                        <td className="py-4 text-center text-red-400">✗</td>
                                        <td className="py-4 text-center text-green-500">✓</td>
                                    </tr>
                                    <tr className="border-b border-gray-50">
                                        <td className="py-4">PIQ Builder</td>
                                        <td className="py-4 text-center text-red-400">✗</td>
                                        <td className="py-4 text-center text-green-500">✓</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
