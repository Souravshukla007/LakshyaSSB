import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
    title: "Privacy Policy | LakshyaSSB",
    description:
        "Learn how LakshyaSSB collects, uses, and protects your personal data. We are committed to your privacy under the Indian Information Technology Act, 2000.",
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
        title: "1. Who We Are",
        content: (
            <p>
                LakshyaSSB Academy (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates the digital educational
                platform at <strong>lakshyssb.in</strong>. This Privacy Policy explains how we collect, use, store, and
                protect your personal information when you access our Platform or subscribe to our services.
            </p>
        ),
    },
    {
        icon: "fa-database",
        title: "2. Information We Collect",
        content: (
            <>
                <p className="mb-3">We collect the following types of information:</p>
                <div className="space-y-4">
                    <div>
                        <p className="font-bold text-brand-dark mb-1">a) Account Information</p>
                        <ul className="list-disc list-inside space-y-1 text-gray-500">
                            <li>Full name and email address (provided during registration)</li>
                            <li>Hashed password (we never store plain-text passwords)</li>
                            <li>Account creation date and subscription plan details</li>
                        </ul>
                    </div>
                    <div>
                        <p className="font-bold text-brand-dark mb-1">b) Payment Information</p>
                        <p className="text-gray-500">
                            We do <strong>not</strong> store any card numbers, UPI IDs, or bank details on our servers.
                            All payment data is handled directly by <strong>Razorpay</strong> (a PCI-DSS compliant payment
                            processor). We only receive a payment confirmation token and order ID from Razorpay.
                        </p>
                    </div>
                    <div>
                        <p className="font-bold text-brand-dark mb-1">c) Usage Data</p>
                        <ul className="list-disc list-inside space-y-1 text-gray-500">
                            <li>Practice test responses, OLQ scores, and progress data</li>
                            <li>Pages visited, session duration, and feature interactions</li>
                            <li>Device type and browser information (for performance optimisation)</li>
                        </ul>
                    </div>
                    <div>
                        <p className="font-bold text-brand-dark mb-1">d) Cookies</p>
                        <p className="text-gray-500">
                            We use session cookies to keep you logged in and analytics cookies (e.g., basic page view
                            analytics) to improve the Platform. You may disable cookies in your browser settings, though
                            some features may not function correctly without them.
                        </p>
                    </div>
                </div>
            </>
        ),
    },
    {
        icon: "fa-chart-bar",
        title: "3. How We Use Your Information",
        content: (
            <ul className="list-disc list-inside space-y-1.5 text-gray-500">
                <li>To create and manage your account and subscription</li>
                <li>To provide and personalise your learning experience</li>
                <li>To process payments and send payment receipts</li>
                <li>To send service-related emails (e.g., account activation, subscription renewal reminders)</li>
                <li>To improve Platform performance and fix technical issues</li>
                <li>To comply with applicable Indian laws and regulations</li>
            </ul>
        ),
    },
    {
        icon: "fa-share-nodes",
        title: "4. Data Sharing",
        content: (
            <>
                <p className="mb-3">
                    We <strong>do not sell, rent, or trade</strong> your personal information to third parties.
                    Limited data may be shared with:
                </p>
                <ul className="list-disc list-inside space-y-1.5 text-gray-500">
                    <li>
                        <strong>Razorpay:</strong> for payment processing (governed by{" "}
                        <a
                            href="https://razorpay.com/privacy/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-orange hover:underline"
                        >
                            Razorpay&apos;s Privacy Policy
                        </a>
                        )
                    </li>
                    <li>
                        <strong>Cloud infrastructure providers</strong> (e.g., database hosting) operating under
                        strict data processing agreements
                    </li>
                    <li>
                        <strong>Regulatory / law enforcement authorities</strong> only when required by applicable
                        Indian law
                    </li>
                </ul>
            </>
        ),
    },
    {
        icon: "fa-lock",
        title: "5. Data Security",
        content: (
            <p>
                We implement industry-standard security measures including HTTPS encryption, hashed password storage,
                and secure server infrastructure to protect your personal data. While we take reasonable precautions,
                no method of transmission over the internet is 100% secure. In the event of a data breach that
                affects your rights, we will notify you as required by applicable law.
            </p>
        ),
    },
    {
        icon: "fa-clock",
        title: "6. Data Retention",
        content: (
            <p>
                We retain your account data for as long as your account is active or as needed to provide our
                services. If you request account deletion, we will remove your personal data within{" "}
                <strong>30 days</strong>, except where retention is required by law (e.g., financial records for
                tax compliance).
            </p>
        ),
    },
    {
        icon: "fa-user-shield",
        title: "7. Your Rights",
        content: (
            <>
                <p className="mb-3">As a user, you have the right to:</p>
                <ul className="list-disc list-inside space-y-1.5 text-gray-500">
                    <li>Access the personal data we hold about you</li>
                    <li>Correct inaccurate personal information</li>
                    <li>Request deletion of your account and associated data</li>
                    <li>Withdraw consent for marketing communications at any time</li>
                </ul>
                <p className="mt-3">
                    To exercise any of these rights, email us at{" "}
                    <a href="mailto:privacy@lakshyssb.in" className="text-brand-orange hover:underline">
                        privacy@lakshyssb.in
                    </a>
                    .
                </p>
            </>
        ),
    },
    {
        icon: "fa-flag",
        title: "8. Compliance",
        content: (
            <p>
                This Privacy Policy is formulated in accordance with the{" "}
                <strong>Information Technology Act, 2000</strong> and the{" "}
                <strong>Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011</strong>,
                applicable in India. We are also committed to compliance with the{" "}
                <strong>Digital Personal Data Protection Act (DPDP Act), 2023</strong> as it comes into effect.
            </p>
        ),
    },
    {
        icon: "fa-pen",
        title: "9. Changes to This Policy",
        content: (
            <p>
                We may update this Privacy Policy from time to time. The &quot;Last Updated&quot; date at the top of
                this page reflects the most recent revision. Continued use of the Platform after changes are posted
                constitutes your acceptance of the revised policy.
            </p>
        ),
    },
];

export default function PrivacyPage() {
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
                            Privacy <span className="text-brand-orange">Policy</span>
                        </h1>
                        <p className="text-gray-400 text-sm">Last Updated: {LAST_UPDATED}</p>
                    </div>

                    {/* Intro */}
                    <div className="bg-brand-dark rounded-[2rem] p-6 mb-10 flex items-start gap-4">
                        <i className="fa-solid fa-shield-halved text-brand-orange text-xl mt-0.5 shrink-0" />
                        <p className="text-gray-300 text-sm leading-relaxed">
                            Your privacy matters to us. LakshyaSSB does{" "}
                            <strong className="text-white">not sell your personal data</strong>. We use your information
                            only to deliver and improve our educational services.
                        </p>
                    </div>

                    {/* Sections */}
                    <div className="space-y-5">
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

                    <div className="mt-10 text-center text-sm text-gray-400">
                        Privacy concerns?{" "}
                        <a href="mailto:privacy@lakshyssb.in" className="text-brand-orange hover:underline font-medium">
                            privacy@lakshyssb.in
                        </a>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
