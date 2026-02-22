import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
    title: "About Us | LakshyaSSB",
    description:
        "Learn about LakshyaSSB — India's digital SSB preparation platform offering psychology tests, mock interviews, and OLQ development tools for aspiring defence officers.",
};

export default function AboutPage() {
    return (
        <main className="antialiased overflow-x-hidden font-sans bg-brand-bg selection:bg-brand-orange selection:text-white">
            <Navbar />

            {/* Hero */}
            <section className="pt-40 pb-20 px-6 bg-brand-bg">
                <div className="max-w-4xl mx-auto text-center">
                    <span className="inline-block mb-4 px-4 py-1.5 bg-brand-orange/10 text-brand-orange text-xs font-bold rounded-full uppercase tracking-widest">
                        Our Story
                    </span>
                    <h1 className="font-hero font-bold text-4xl lg:text-5xl text-brand-dark mb-6 leading-tight">
                        Built for Aspirants, <br />
                        <span className="text-brand-orange">By People Who Care</span>
                    </h1>
                    <p className="text-gray-500 text-lg leading-relaxed max-w-2xl mx-auto font-noname">
                        LakshyaSSB is a fully digital educational platform designed to help Indian defence aspirants
                        systematically prepare for the Services Selection Board (SSB) interview process.
                    </p>
                </div>
            </section>

            {/* Mission */}
            <section className="py-16 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm mb-8">
                        <h2 className="font-hero font-bold text-2xl text-brand-dark mb-4 flex items-center gap-3">
                            <i className="fa-solid fa-bullseye text-brand-orange" />
                            Our Mission
                        </h2>
                        <p className="text-gray-600 leading-relaxed text-base">
                            To democratise access to high-quality SSB preparation by providing structured, science-backed
                            digital resources — including psychology practice tests (TAT, WAT, SRT), Officer-Like Quality (OLQ)
                            assessment tools, PIQ builders, and mock interview frameworks — accessible from anywhere in India at
                            an affordable price.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
                            <h2 className="font-hero font-bold text-xl text-brand-dark mb-3 flex items-center gap-3">
                                <i className="fa-solid fa-laptop text-brand-orange" />
                                100% Digital Service
                            </h2>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                LakshyaSSB is a purely online digital educational service. We do{" "}
                                <strong>not</strong> sell or ship any physical products, printed materials,
                                books, devices, or tangible goods. All content is delivered electronically
                                via our web platform immediately upon successful payment.
                            </p>
                        </div>
                        <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
                            <h2 className="font-hero font-bold text-xl text-brand-dark mb-3 flex items-center gap-3">
                                <i className="fa-solid fa-shield-halved text-brand-orange" />
                                Secure Payments
                            </h2>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                All payments are processed securely via{" "}
                                <strong>Razorpay</strong>, a PCI-DSS compliant payment gateway regulated in
                                India. We do not store your card details on our servers. Your financial
                                data is protected under Razorpay's encryption and security standards.
                            </p>
                        </div>
                    </div>

                    {/* What We Offer */}
                    <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm mb-8">
                        <h2 className="font-hero font-bold text-2xl text-brand-dark mb-6">
                            What We Offer
                        </h2>
                        <ul className="space-y-4 text-sm text-gray-600">
                            {[
                                ["fa-brain", "Psychology Practice Modules", "TAT (Thematic Apperception Test), WAT (Word Association Test), and SRT (Situation Reaction Test) practice with AI-assisted feedback."],
                                ["fa-chart-radar", "OLQ Assessment", "Track your Officer-Like Qualities across 15 dimensions with weekly progress graphs."],
                                ["fa-clipboard-list", "PIQ Builder", "Build and rehearse your Personal Information Questionnaire answers with guidance."],
                                ["fa-comments", "Interview Preparation", "Common SSB interview questions, model answers, and scenario-based preparation frameworks."],
                                ["fa-trophy", "Mock SSB Tests", "Simulated full-length digital SSB mock tests to build exam temperament."],
                            ].map(([icon, title, desc]) => (
                                <li key={title} className="flex gap-4">
                                    <i className={`fa-solid ${icon} text-brand-orange mt-0.5 w-4 shrink-0`} />
                                    <div>
                                        <p className="font-bold text-brand-dark">{title}</p>
                                        <p className="text-gray-500 mt-0.5">{desc}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Disclaimer */}
                    <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-8">
                        <h2 className="font-hero font-bold text-lg text-amber-800 mb-3 flex items-center gap-2">
                            <i className="fa-solid fa-triangle-exclamation text-amber-500" />
                            Important Disclaimer
                        </h2>
                        <p className="text-amber-700 text-sm leading-relaxed">
                            LakshyaSSB is an independent educational preparation platform. We are{" "}
                            <strong>not affiliated with</strong> the Ministry of Defence, Indian Armed Forces,
                            Services Selection Board, UPSC, or any government body. Access to our platform and
                            successful completion of our tests does <strong>not guarantee</strong> selection,
                            recommendation, or any specific outcome at an actual SSB interview. SSB selection
                            is at the sole discretion of the Indian Armed Forces.
                        </p>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
