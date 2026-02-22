import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
    title: "Contact Us | LakshyaSSB",
    description:
        "Get in touch with the LakshyaSSB support team for billing, subscription, or platform queries. We typically respond within 24 business hours.",
};

const LAST_UPDATED = "22 February 2026";

export default function ContactPage() {
    return (
        <main className="antialiased overflow-x-hidden font-sans bg-brand-bg selection:bg-brand-orange selection:text-white">
            <Navbar />

            <section className="pt-40 pb-20 px-6">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-14">
                        <span className="inline-block mb-4 px-4 py-1.5 bg-brand-orange/10 text-brand-orange text-xs font-bold rounded-full uppercase tracking-widest">
                            Support
                        </span>
                        <h1 className="font-hero font-bold text-4xl lg:text-5xl text-brand-dark mb-4">
                            Contact <span className="text-brand-orange">Us</span>
                        </h1>
                        <p className="text-gray-500 text-base max-w-xl mx-auto font-noname">
                            We&apos;re here to help. Reach out for any questions about your subscription,
                            payments, or platform access.
                        </p>
                        <p className="text-gray-400 text-xs mt-4">Last Updated: {LAST_UPDATED}</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mb-10">
                        {/* Email */}
                        <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
                            <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 flex items-center justify-center mb-4">
                                <i className="fa-solid fa-envelope text-brand-orange text-lg" />
                            </div>
                            <h2 className="font-hero font-bold text-lg text-brand-dark mb-2">Email Support</h2>
                            <p className="text-gray-500 text-sm mb-3">
                                For billing, subscription, and platform issues:
                            </p>
                            <a
                                href="mailto:support@lakshyssb.in"
                                className="text-brand-orange font-bold hover:underline text-sm"
                            >
                                support@lakshyssb.in
                            </a>
                            <p className="text-gray-400 text-xs mt-3">
                                Response time: within 24–48 business hours (Mon–Sat, 10 AM – 6 PM IST)
                            </p>
                        </div>

                        {/* Registered Address */}
                        <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
                            <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 flex items-center justify-center mb-4">
                                <i className="fa-solid fa-location-dot text-brand-orange text-lg" />
                            </div>
                            <h2 className="font-hero font-bold text-lg text-brand-dark mb-2">Registered Address</h2>
                            <address className="not-italic text-gray-600 text-sm leading-relaxed">
                                LakshyaSSB Academy<br />
                                Sai Ram Nagar, Hydershakote,<br />
                                Hyderabad, Telangana – 500091<br />
                                India
                            </address>
                            <p className="text-gray-400 text-xs mt-3">
                                This is a correspondence address only. We do not maintain a walk-in centre.
                            </p>
                        </div>

                        {/* Payment / Billing */}
                        <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
                            <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 flex items-center justify-center mb-4">
                                <i className="fa-solid fa-credit-card text-brand-orange text-lg" />
                            </div>
                            <h2 className="font-hero font-bold text-lg text-brand-dark mb-2">Payment & Billing</h2>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                All payments are processed by <strong>Razorpay</strong>. If you notice an
                                incorrect charge or did not receive access after payment, email us with your
                                Razorpay Order ID and we will resolve it promptly.
                            </p>
                            <a
                                href="mailto:billing@lakshyssb.in"
                                className="text-brand-orange font-bold hover:underline text-sm mt-3 inline-block"
                            >
                                billing@lakshyssb.in
                            </a>
                        </div>

                        {/* Refund Queries */}
                        <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
                            <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 flex items-center justify-center mb-4">
                                <i className="fa-solid fa-rotate-left text-brand-orange text-lg" />
                            </div>
                            <h2 className="font-hero font-bold text-lg text-brand-dark mb-2">Refund Requests</h2>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                To request a refund, email us within 7 days of purchase with your registered
                                email address and Razorpay payment ID. Please review our{" "}
                                <a href="/refund-policy" className="text-brand-orange hover:underline font-medium">
                                    Refund Policy
                                </a>{" "}
                                before submitting a request.
                            </p>
                        </div>
                    </div>

                    {/* Note */}
                    <div className="bg-brand-dark rounded-[2rem] p-8 text-center">
                        <i className="fa-solid fa-shield-halved text-brand-orange text-2xl mb-3 block" />
                        <h3 className="font-hero font-bold text-white text-lg mb-2">No Physical Products</h3>
                        <p className="text-gray-400 text-sm max-w-xl mx-auto">
                            LakshyaSSB is an entirely digital platform. We do not ship, courier, or
                            deliver any physical goods. All access is provided online immediately
                            after a successful payment confirmation.
                        </p>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
