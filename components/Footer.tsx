import Link from 'next/link';

export default function Footer() {
    return (
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
    );
}
