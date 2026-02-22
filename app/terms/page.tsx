import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
    title: "Terms & Conditions | LakshyaSSB",
    description:
        "Read the Terms and Conditions governing your use of LakshyaSSB's digital SSB preparation platform, including subscription terms, payment conditions, and disclaimers.",
};

const LAST_UPDATED = "22 February 2026";

interface Clause {
    icon: string;
    title: string;
    content: React.ReactNode;
}

const clauses: Clause[] = [
    {
        icon: "fa-circle-check",
        title: "1. Acceptance of Terms",
        content: (
            <p>
                By accessing or using the LakshyaSSB platform available at{" "}
                <strong>lakshyssb.in</strong> (the &quot;Platform&quot;), creating an account, or completing a
                payment, you agree to be bound by these Terms &amp; Conditions (&quot;Terms&quot;). If you do not
                agree to these Terms, please do not use the Platform.
            </p>
        ),
    },
    {
        icon: "fa-laptop",
        title: "2. Nature of Service",
        content: (
            <>
                <p className="mb-3">
                    LakshyaSSB is an independent, fully <strong>digital educational platform</strong> offering SSB
                    preparation content including psychology practice tests (TAT, WAT, SRT), OLQ assessment, PIQ
                    building, and interview preparation modules.
                </p>
                <ul className="list-disc list-inside space-y-1.5 text-gray-500">
                    <li>All services are delivered digitally via the web platform.</li>
                    <li>We do <strong>not</strong> sell or ship any physical products.</li>
                    <li>Access is granted electronically upon successful payment confirmation.</li>
                </ul>
            </>
        ),
    },
    {
        icon: "fa-user-check",
        title: "3. User Eligibility",
        content: (
            <ul className="list-disc list-inside space-y-1.5 text-gray-500">
                <li>You must be at least 16 years of age to register on the Platform.</li>
                <li>You must provide accurate and complete registration information.</li>
                <li>One account per person. You may not share your account credentials with others.</li>
                <li>
                    Users are responsible for maintaining the confidentiality of their account login details.
                </li>
            </ul>
        ),
    },
    {
        icon: "fa-credit-card",
        title: "4. Subscription & Payments",
        content: (
            <>
                <p className="mb-3">
                    The PRO plan is a <strong>one-time purchase</strong> that grants 30 days of access to all PRO features
                    from the date of activation. There is <strong>no auto-renewal</strong> — you will never be charged again
                    unless you choose to repurchase.
                </p>
                <ul className="list-disc list-inside space-y-1.5 text-gray-500">
                    <li>
                        All payments are processed securely via <strong>Razorpay</strong>, a PCI-DSS compliant
                        payment gateway authorised in India.
                    </li>
                    <li>Prices are listed in Indian Rupees (INR) inclusive of applicable taxes.</li>
                    <li>The purchase price is charged once at the time of transaction. No recurring charges.</li>
                    <li>We reserve the right to change pricing with advance notice.</li>
                    <li>
                        Refunds are governed by our{" "}
                        <a href="/refund-policy" className="text-brand-orange hover:underline">
                            Refund Policy
                        </a>
                        .
                    </li>
                </ul>
            </>
        ),
    },
    {
        icon: "fa-shield",
        title: "5. Acceptable Use",
        content: (
            <>
                <p className="mb-3">You agree not to:</p>
                <ul className="list-disc list-inside space-y-1.5 text-gray-500">
                    <li>Reproduce, distribute, or resell any Platform content without written permission.</li>
                    <li>Use automated bots, scrapers, or scripts to access Platform content.</li>
                    <li>Attempt to reverse-engineer, hack, or disrupt the Platform.</li>
                    <li>Share your subscription access with other individuals.</li>
                    <li>Upload or transmit harmful, offensive, or misleading content.</li>
                </ul>
                <p className="mt-3">
                    Violation of these rules may result in immediate account suspension without refund.
                </p>
            </>
        ),
    },
    {
        icon: "fa-copyright",
        title: "6. Intellectual Property",
        content: (
            <p>
                All content on the Platform — including but not limited to text, questions, images, OLQ frameworks,
                test scenarios, and UI design — is the intellectual property of LakshyaSSB Academy and is protected
                under Indian copyright law. Unauthorised reproduction or distribution is strictly prohibited and may
                attract legal action.
            </p>
        ),
    },
    {
        icon: "fa-triangle-exclamation",
        title: "7. No Guarantee of SSB Selection",
        content: (
            <p>
                LakshyaSSB is <strong>not affiliated</strong> with the Ministry of Defence, Indian Armed Forces,
                Services Selection Board, UPSC, or any government body. Use of the Platform, successful completion
                of practice tests, or improvement in OLQ scores does <strong>not guarantee</strong> selection,
                recommendation, or any outcome at an actual SSB interview. SSB selection is entirely at the discretion
                of the Indian Armed Forces.
            </p>
        ),
    },
    {
        icon: "fa-ban",
        title: "8. Limitation of Liability",
        content: (
            <p>
                To the maximum extent permitted by applicable law, LakshyaSSB shall not be liable for any indirect,
                incidental, or consequential damages arising from your use of the Platform, including but not limited
                to loss of data, failure to achieve a desired exam outcome, or service interruptions. Our total
                liability in any dispute shall not exceed the amount paid by you in the 30 days preceding the
                event giving rise to the claim.
            </p>
        ),
    },
    {
        icon: "fa-gavel",
        title: "9. Governing Law & Dispute Resolution",
        content: (
            <p>
                These Terms shall be governed by and construed in accordance with the laws of India. Any disputes
                arising from these Terms or your use of the Platform shall be subject to the exclusive jurisdiction
                of the competent courts located in <strong>Hyderabad, Telangana, India</strong>. We encourage users to
                contact us at{" "}
                <a href="mailto:support@lakshyssb.in" className="text-brand-orange hover:underline">
                    support@lakshyssb.in
                </a>{" "}
                before initiating any legal proceedings.
            </p>
        ),
    },
    {
        icon: "fa-pen",
        title: "10. Amendments",
        content: (
            <p>
                We reserve the right to update these Terms at any time. Changes will be notified via the Platform
                or email. Continued use of the Platform after such changes constitutes your acceptance of the
                revised Terms. The &quot;Last Updated&quot; date at the top of this page reflects the most recent
                revision.
            </p>
        ),
    },
];

export default function TermsPage() {
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
                            Terms &amp; <span className="text-brand-orange">Conditions</span>
                        </h1>
                        <p className="text-gray-400 text-sm">Last Updated: {LAST_UPDATED}</p>
                    </div>

                    {/* Intro */}
                    <div className="bg-brand-dark rounded-[2rem] p-6 mb-10 flex items-start gap-4">
                        <i className="fa-solid fa-shield-halved text-brand-orange text-xl mt-0.5 shrink-0" />
                        <p className="text-gray-300 text-sm leading-relaxed">
                            Please read these Terms carefully before using LakshyaSSB. These Terms constitute a legally
                            binding agreement between you and <strong className="text-white">LakshyaSSB Academy</strong>.
                        </p>
                    </div>

                    {/* Clauses */}
                    <div className="space-y-5">
                        {clauses.map((c) => (
                            <div
                                key={c.title}
                                className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm"
                            >
                                <h2 className="font-hero font-bold text-lg text-brand-dark mb-4 flex items-center gap-3">
                                    <i className={`fa-solid ${c.icon} text-brand-orange`} />
                                    {c.title}
                                </h2>
                                <div className="text-gray-600 text-sm leading-relaxed">{c.content}</div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-10 text-center text-sm text-gray-400">
                        Questions?{" "}
                        <a href="/contact" className="text-brand-orange hover:underline font-medium">
                            Contact us
                        </a>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
