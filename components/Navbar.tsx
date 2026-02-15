'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
    const pathname = usePathname();

    const isActive = (path: string) => {
        if (path === '/' && pathname === '/') return true;
        if (path !== '/' && pathname?.startsWith(path)) return true;
        return false;
    };

    return (
        <nav className="absolute w-full z-50 top-0 left-0 py-6 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                <div className="flex items-center gap-12">
                    <div className="flex items-center gap-2 text-brand-orange">
                        <i className="fa-solid fa-shield-halved text-2xl"></i>
                        <span className="font-logo font-semibold text-2xl tracking-tight text-brand-dark">LakshyaSSB</span>
                    </div>

                    <div className="hidden md:flex gap-8 text-sm font-noname font-medium text-gray-800 tracking-wide">
                        <Link href="/" className={`hover:text-brand-orange transition ${isActive('/') ? 'text-brand-orange font-bold' : ''}`}>Home</Link>
                        <Link href="/practice" className={`hover:text-brand-orange transition ${isActive('/practice') ? 'text-brand-orange font-bold' : ''}`}>Practice</Link>
                        <Link href="/medical" className={`hover:text-brand-orange transition ${isActive('/medical') ? 'text-brand-orange font-bold' : ''}`}>Medical</Link>
                        <Link href="/pricing" className={`hover:text-brand-orange transition ${isActive('/pricing') ? 'text-brand-orange font-bold' : ''}`}>Pricing</Link>
                        <Link href="/dashboard" className={`hover:text-brand-orange transition ${isActive('/dashboard') ? 'text-brand-orange font-bold' : ''}`}>Dashboard</Link>
                        {/* <Link href="/auth" className={`hover:text-brand-orange transition ${isActive('/auth') ? 'text-brand-orange font-bold' : ''}`}>Login / Sign Up</Link> */}
                    </div>
                </div>

                <Link href="/auth" className="group relative bg-brand-dark p-[2px] rounded-full shadow-lg transition-all duration-300 hover:shadow-xl">
                    <div className="relative w-full h-full rounded-full overflow-hidden bg-transparent flex items-center gap-3 pl-6 pr-1.5 py-1.5">
                        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full transition-transform duration-[1500ms] ease-out group-hover:scale-[30]"></div>
                        <span className="relative z-10 text-white group-hover:text-brand-dark text-sm font-medium transition-colors duration-[1000ms]">Join Academy</span>
                        <div className="relative z-10 bg-white text-brand-dark w-8 h-8 rounded-full flex items-center justify-center">
                            <i className="fa-solid fa-arrow-right text-xs"></i>
                        </div>
                    </div>
                </Link>
            </div>
        </nav>
    );
}
