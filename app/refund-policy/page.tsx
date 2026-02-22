import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
    title: "Refund Policy | LakshyaSSB",
    description:
        "Read LakshyaSSB's refund policy for our digital SSB preparation subscription. Understand conditions, timelines, and the dispute resolution process.",
};

const LAST_UPDATED = "22 February 2026";

interface Section {
    icon: string;
    title: string;
    content: React.ReactNode;
}

const sections: Section[] = [
    {
        icon: "fa-circle-info",
        title: "1. Nature of Service",
        content: (
            <p>
                LakshyaSSB provides a <strong>100% digital educational subscription service</strong>. Upon successful
                payment, users receive immediate online access to psychology practice modules, mock tests, PIQ tools, and
                interview preparation content. We do <strong>not</strong> sell or deliver any physical products, books,
                DVDs, or tangible goods. All content is delivered digitally via our web platform.
            </p>
        ),
    },
    {
        icon: "fa-rotate-left",
        title: "2. Refund Eligibility",
        content: (
            <>
                <p className="mb-3">
                    Because our service is delivered digitally and access is granted immediately upon payment, refunds are
                    evaluated on a case-by-case basis. You may be eligible for a full refund if:
                </p>
                <ul className="space-y-2 list-disc list-inside text-gray-500">
                    <li>Your refund request is raised <strong>within 7 calendar days</strong> of the original purchase date.</li>
                    <li>
                        You have <strong>not accessed</strong> or consumed substantial portions of the PRO content
                        (e.g., completed less than 2 practice sessions or tests).
                    </li>
                    <li>
                        Your payment was successfully debited but platform access was <strong>not granted</strong> due to a
                        technical error on our end.
                    </li>
                </ul>
            </>
        ),
    },
    {
        icon: "fa-ban",
        title: "3. Non-Refundable Situations",
        content: (
            <>
                <p className="mb-3">Refunds will <strong>not</strong> be issued in the following cases:</p>
                <ul className="space-y-2 list-disc list-inside text-gray-500">
                    <li>Request is made after 7 calendar days from the purchase date.</li>
                    <li>You have accessed, downloaded, or consumed a significant portion of the PRO content.</li>
                    <li>The subscription was purchased during a promotional or discounted period, unless access was not granted.</li>
                    <li>Refund is requested on grounds of not clearing the actual SSB interview (our service is a preparation tool and does not guarantee any selection outcome).</li>
                    <li>Account was suspended or terminated due to violation of our Terms &amp; Conditions.</li>
                </ul>
            </>
        ),
    },
    {
        icon: "fa-file-alt",
        title: "4. How to Request a Refund",
        content: (
            <>
                <p className="mb-3">To initiate a refund request, email us at:</p>
                <a
                    href="mailto:billing@lakshyssb.in"
                    className="text-brand-orange font-bold hover:underline"
                >
                    billing@lakshyssb.in
                </a>
                <p className="mt-3">Please include the following in your email:</p>
                <ul className="space-y-2 list-disc list-inside text-gray-500 mt-2">
                    <li>Your full name and registered email address</li>
                    <li>Razorpay Payment ID (found in your payment confirmation email)</li>
                    <li>Date of purchase</li>
                    <li>Reason for the refund request</li>
                </ul>
                <p className="mt-3">We will acknowledge your request within <strong>2 business days</strong> and process
                    eligible refunds within <strong>7–10 business days</strong> to the original payment method.</p>
            </>
        ),
    },
    {
        icon: "fa-credit-card",
        title: "5. Payment & Refund Processing",
        content: (
            <p>
                All payments on LakshyaSSB are processed securely via <strong>Razorpay</strong>, a PCI-DSS compliant
                payment gateway licensed in India. Approved refunds are credited to the original source of payment
                (UPI, debit/credit card, net banking). Processing times may vary depending on your bank or payment
                method (typically 5–7 banking days after we initiate the refund).
            </p>
        ),
    },
    {
        icon: "fa-gavel",
        title: "6. Dispute Resolution",
        content: (
            <p>
                If you believe a charge was made in error or are dissatisfied with the outcome of a refund decision,
                please contact us at{" "}
                <a href="mailto:support@lakshyssb.in" className="text-brand-orange hover:underline font-medium">
                    support@lakshyssb.in
                </a>
                . We are committed to resolving disputes fairly and promptly. If the matter remains unresolved, it
                shall be governed by the laws of India, and disputes shall be subject to the jurisdiction of courts
                in <strong>Hyderabad, Telangana, India</strong>.
            </p>
        ),
    },
    {
        icon: "fa-triangle-exclamation",
        title: "7. No Guarantee of SSB Selection",
        content: (
            <p>
                LakshyaSSB is an independent digital preparation platform. Use of our service does{" "}
                <strong>not guarantee</strong> selection, recommendation, or any outcome at an SSB interview or
                any defence recruitment process. Refunds cannot be sought on the basis of SSB performance or
                non-selection by the Indian Armed Forces.
            </p>
        ),
    },
];

export default function RefundPolicyPage() {
    return (
        <main className="antialiased overflow-x-hidden font-sans bg-brand-bg selection:bg-brand-orange selection:text-white">
            <Navbar />

            <section className="pt-40 pb-20 px-6">
                <div className="max-w-3xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-14">
                        <span className="inline-block mb-4 px-4 py-1.5 bg-brand-orange/10 text-brand-orange text-xs font-bold rounded-full uppercase tracking-widest">
                            Legal
                        </span>
                        <h1 className="font-hero font-bold text-4xl lg:text-5xl text-brand-dark mb-4">
                            Refund <span className="text-brand-orange">Policy</span>
                        </h1>
                        <p className="text-gray-400 text-sm">Last Updated: {LAST_UPDATED}</p>
                    </div>

                    {/* Intro banner */}
                    <div className="bg-brand-dark rounded-[2rem] p-6 mb-10 flex items-start gap-4">
                        <i className="fa-solid fa-shield-halved text-brand-orange text-xl mt-0.5 shrink-0" />
                        <p className="text-gray-300 text-sm leading-relaxed">
                            This policy applies to all purchases made on <strong className="text-white">lakshyssb.in</strong>.
                            Since we offer a digital service with immediate access upon payment, please read this policy
                            carefully before subscribing.
                        </p>
                    </div>

                    {/* Sections */}
                    <div className="space-y-6">
                        {sections.map((s) => (
                            <div
                                key={s.title}
                                className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm"
                            >
                                <h2 className="font-hero font-bold text-lg text-brand-dark mb-4 flex items-center gap-3">
                                    <i className={`fa-solid ${s.icon} text-brand-orange`} />
                                    {s.title}
                                </h2>
                                <div className="text-gray-600 text-sm leading-relaxed">{s.content}</div>
                            </div>
                        ))}
                    </div>

                    {/* Contact footer note */}
                    <div className="mt-10 text-center text-sm text-gray-400">
                        Questions about this policy?{" "}
                        <a href="/contact" className="text-brand-orange hover:underline font-medium">
                            Contact our support team
                        </a>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
