'use client';

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import useScrollReveal from "@/hooks/useScrollReveal";
import Link from "next/link";

// Note: metadata must go in a server component wrapper or generateMetadata — since this
// page is already 'use client', add the title via the layout or a dedicated metadata file.

const FREE_FEATURES = [
    { text: "1 OIR test (limited)", included: true },
    { text: "10 WAT words per day", included: true },
    { text: "2 TAT images per day", included: true },
    { text: "Basic OLQ radar", included: true },
    { text: "AI Evaluation & Trends", included: false },
    { text: "PIQ Builder", included: false },
    { text: "Interview Preparation", included: false },
];

const PRO_FEATURES = [
    { text: "Unlimited Practice Tests", included: true },
    { text: "Full AI Psych Evaluation", included: true },
    { text: "OLQ Trends & Weekly Graphs", included: true },
    { text: "Badge System & Streaks", included: true },
    { text: "PIQ Builder + Interview Qs", included: true },
    { text: "Priority Email Support", included: true },
    { text: "30-Day Access (One-Time Purchase)", included: true },
];

const COMPARISON_ROWS = [
    { feature: "AI Evaluation", free: false, pro: true },
    { feature: "Unlimited Practice", free: false, pro: true },
    { feature: "OLQ Trends", free: false, pro: true },
    { feature: "PIQ Builder", free: false, pro: true },
    { feature: "Interview Preparation", free: false, pro: true },
    { feature: "WAT Practice", free: "10/day", pro: "Unlimited" },
    { feature: "TAT Practice", free: "2/day", pro: "Unlimited" },
    { feature: "OIR Mock Test", free: "1 limited", pro: "Full" },
];

export default function Pricing() {
    useScrollReveal();

    return (
        <main className="antialiased overflow-x-hidden selection:bg-brand-orange selection:text-white font-sans bg-brand-bg">
            <Navbar />

            <section className="min-h-screen bg-brand-bg pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto">

                    {/* Header */}
                    <div className="text-center mb-6 reveal">
                        <span className="inline-block mb-4 px-4 py-1.5 bg-brand-orange/10 text-brand-orange text-xs font-bold rounded-full uppercase tracking-widest">
                            Pricing
                        </span>
                        <h1 className="font-hero font-bold text-4xl lg:text-6xl text-brand-dark mb-4">
                            Choose Your SSB <span className="text-brand-orange">Preparation Plan</span>
                        </h1>
                        <p className="text-gray-500 text-lg max-w-2xl mx-auto font-noname">
                            Start free and upgrade when you are ready to earn your stars.
                        </p>
                    </div>

                    {/* Digital-only notice */}
                    <div className="flex justify-center mb-12 reveal">
                        <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-full shadow-sm text-xs text-gray-500 font-medium">
                            <i className="fa-solid fa-laptop text-brand-orange" />
                            <span>Digital Access Only — No Physical Products or Shipping</span>
                            <span className="mx-2 text-gray-200">|</span>
                            <i className="fa-solid fa-lock text-brand-orange" />
                            <span>Secured by Razorpay</span>
                        </div>
                    </div>

                    {/* Plan Cards */}
                    <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto mb-20">

                        {/* FREE PLAN */}
                        <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col justify-between reveal-left">
                            <div>
                                <h3 className="font-hero font-bold text-2xl text-brand-dark mb-2">FREE PLAN</h3>
                                <div className="text-4xl font-bold text-brand-dark mb-2">
                                    ₹0 <span className="text-sm text-gray-400 font-normal">/month</span>
                                </div>
                                <p className="text-xs text-gray-400 mb-8">Limited access · No credit card required</p>
                                <ul className="space-y-4 mb-10">
                                    {FREE_FEATURES.map(({ text, included }) => (
                                        <li key={text} className={`flex items-center gap-3 text-sm ${included ? 'text-gray-600' : 'text-gray-300'}`}>
                                            <i className={`fa-solid ${included ? 'fa-check text-brand-orange' : 'fa-xmark'}`} />
                                            {text}
                                        </li>
                                    ))}
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
                                <div className="text-4xl font-bold text-brand-dark mb-2">
                                    ₹99 <span className="text-sm text-gray-400 font-normal">one-time</span>
                                </div>
                                <p className="text-xs text-gray-400 mb-8">Full access · One-time payment · 30 days of digital access</p>
                                <ul className="space-y-4 mb-10">
                                    {PRO_FEATURES.map(({ text }) => (
                                        <li key={text} className="flex items-center gap-3 text-sm text-gray-600 font-bold">
                                            <i className="fa-solid fa-check text-brand-orange" />
                                            {text}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <Link
                                    href="/checkout"
                                    className="w-full py-4 bg-brand-dark text-white rounded-full font-bold text-center hover:bg-brand-orange transition-all shadow-xl shadow-brand-dark/20 block"
                                >
                                    Upgrade to Pro
                                </Link>
                                <p className="text-center text-xs text-gray-400 mt-3">
                                    One-time purchase · No auto-renewal ·{" "}
                                    <Link href="/refund-policy" className="text-brand-orange hover:underline">
                                        Refund Policy
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Feature Comparison Table */}
                    <div className="bg-white rounded-[3rem] p-8 lg:p-12 border border-gray-100 shadow-sm reveal mb-10">
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
                                    {COMPARISON_ROWS.map(({ feature, free, pro }) => (
                                        <tr key={feature} className="border-b border-gray-50">
                                            <td className="py-4">{feature}</td>
                                            <td className="py-4 text-center">
                                                {typeof free === 'string' ? (
                                                    <span className="text-gray-500 text-xs">{free}</span>
                                                ) : free ? (
                                                    <span className="text-green-500">✓</span>
                                                ) : (
                                                    <span className="text-red-400">✗</span>
                                                )}
                                            </td>
                                            <td className="py-4 text-center">
                                                {typeof pro === 'string' ? (
                                                    <span className="text-brand-orange font-bold text-xs">{pro}</span>
                                                ) : pro ? (
                                                    <span className="text-green-500">✓</span>
                                                ) : (
                                                    <span className="text-red-400">✗</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Legal / Payment note */}
                    <div className="max-w-2xl mx-auto text-center reveal">
                        <div className="bg-gray-50 rounded-[2rem] p-6 border border-gray-100 text-xs text-gray-400 leading-relaxed space-y-2">
                            <p>
                                <i className="fa-solid fa-lock text-brand-orange mr-1" />
                                Payments are processed securely via <strong className="text-gray-600">Razorpay</strong>. We accept UPI, credit/debit cards, and net banking.
                            </p>
                            <p>
                                <i className="fa-solid fa-laptop text-brand-orange mr-1" />
                                This is a <strong className="text-gray-600">digital-only subscription</strong>. No physical goods are shipped. Access is granted electronically upon payment confirmation.
                            </p>
                            <p>
                                LakshyaSSB does not guarantee SSB selection. This platform is for preparation purposes only.{" "}
                                <Link href="/terms" className="text-brand-orange hover:underline">Terms</Link>{" · "}
                                <Link href="/privacy" className="text-brand-orange hover:underline">Privacy</Link>{" · "}
                                <Link href="/refund-policy" className="text-brand-orange hover:underline">Refund Policy</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
