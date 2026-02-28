'use client';

import Link from 'next/link';
import { useState } from 'react';
import ApkDownloadModal from './ApkDownloadModal';

export default function Footer() {
    const [isApkModalOpen, setIsApkModalOpen] = useState(false);

    return (
        <footer className="bg-brand-dark text-orange-50/70 py-16 text-sm">
            <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12 mb-16">
                {/* Brand Column */}
                <div className="col-span-1 md:col-span-1">
                    <div className="flex items-center gap-2 mb-6">
                        <img src="/LSSB_logo.png" alt="LakshyaSSB Logo" className="h-16 md:h-20 w-auto" />
                    </div>
                    <p className="text-gray-500 leading-relaxed">
                        Crafting future leaders for the Indian Armed Forces. Specialized SSB training for NDA, CDS, and AFCAT.
                    </p>
                </div>

                {/* Resources Column */}
                <div>
                    <h4 className="text-white font-bold mb-6">Resources</h4>
                    <ul className="space-y-3">
                        <li>
                            <button onClick={() => setIsApkModalOpen(true)} className="hover:text-white transition flex items-center gap-2">
                                <i className="fa-brands fa-android text-brand-orange" /> Download Android App
                            </button>
                        </li>
                        <li><a href="#" className="hover:text-white transition">Psychology Tips</a></li>
                        <li><a href="#" className="hover:text-white transition">GTO Ground Rules</a></li>
                        <li><a href="#" className="hover:text-white transition">Daily Current Affairs</a></li>
                    </ul>
                </div>

                {/* Academy Column */}
                <div>
                    <h4 className="text-white font-bold mb-6">Academy</h4>
                    <ul className="space-y-3">
                        <li><Link href="/about" className="hover:text-white transition">About Us</Link></li>
                        <li><Link href="/contact" className="hover:text-white transition">Contact Us</Link></li>
                        <li><a href="#" className="hover:text-white transition">Batch Schedule</a></li>
                    </ul>
                </div>

                {/* Legal Column */}
                <div>
                    <h4 className="text-white font-bold mb-6">Legal</h4>
                    <ul className="space-y-3">
                        <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
                        <li><Link href="/terms" className="hover:text-white transition">Terms &amp; Conditions</Link></li>
                        <li><Link href="/refund-policy" className="hover:text-white transition">Refund Policy</Link></li>
                    </ul>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
                <p>© 2026 LakshyaSSB Academy. Payments secured by Razorpay. Jai Hind.</p>
                <div className="flex gap-6 flex-wrap justify-center">
                    <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
                    <Link href="/terms" className="hover:text-white transition">Terms &amp; Conditions</Link>
                    <Link href="/refund-policy" className="hover:text-white transition">Refund Policy</Link>
                    <Link href="/about" className="hover:text-white transition">About Us</Link>
                    <Link href="/contact" className="hover:text-white transition">Contact Us</Link>
                </div>
            </div>

            <ApkDownloadModal
                isOpen={isApkModalOpen}
                onClose={() => setIsApkModalOpen(false)}
            />
        </footer>
    );
}
