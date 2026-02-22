'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface UserProfile {
    fullName: string;
    email: string;
    plan: string;
}

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();

    const [user, setUser] = useState<UserProfile | null>(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch user profile on mount
    useEffect(() => {
        fetch('/api/account/me')
            .then(res => res.ok ? res.json() : null)
            .then(data => { if (data?.fullName) setUser(data); })
            .catch(() => null);
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const isActive = (path: string) => {
        if (path === '/' && pathname === '/') return true;
        if (path !== '/' && pathname?.startsWith(path)) return true;
        return false;
    };

    const getInitials = (name: string) =>
        name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    const handleLogout = async () => {
        await fetch('/api/account/logout-all', { method: 'POST' });
        router.push('/auth');
        router.refresh();
    };

    return (
        <nav className="absolute w-full z-50 top-0 left-0 py-6 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                {/* Left: Logo + Nav Links */}
                <div className="flex items-center gap-12">
                    <Link href="/" className="flex items-center gap-2 text-brand-orange">
                        <i className="fa-solid fa-shield-halved text-2xl"></i>
                        <span className="font-logo font-semibold text-2xl tracking-tight text-brand-dark">LakshyaSSB</span>
                    </Link>

                    <div className="hidden md:flex gap-8 text-sm font-noname font-medium text-gray-800 tracking-wide">
                        <Link href="/" className={`hover:text-brand-orange transition ${isActive('/') ? 'text-brand-orange font-bold' : ''}`}>Home</Link>
                        <Link href="/practice" className={`hover:text-brand-orange transition ${isActive('/practice') ? 'text-brand-orange font-bold' : ''}`}>Practice</Link>
                        <Link href="/medical" className={`hover:text-brand-orange transition ${isActive('/medical') ? 'text-brand-orange font-bold' : ''}`}>Medical</Link>
                        <Link href="/pricing" className={`hover:text-brand-orange transition ${isActive('/pricing') ? 'text-brand-orange font-bold' : ''}`}>Pricing</Link>
                        <Link href="/dashboard" className={`hover:text-brand-orange transition ${isActive('/dashboard') ? 'text-brand-orange font-bold' : ''}`}>Dashboard</Link>
                    </div>
                </div>

                {/* Right: Avatar + CTA */}
                <div className="flex items-center gap-4">

                    {/* Avatar Dropdown — shown only when logged in */}
                    {user && (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setDropdownOpen(prev => !prev)}
                                className="w-10 h-10 rounded-full bg-gray-200 border border-gray-100 flex items-center justify-center text-brand-dark font-bold text-sm shadow-sm hover:shadow-md transition-all"
                                aria-label="User menu"
                            >
                                {getInitials(user.fullName)}
                            </button>

                            {dropdownOpen && (
                                <div className="absolute top-full right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-[100]">
                                    {/* User Info */}
                                    <div className="px-4 py-3 border-b border-gray-50 mb-1">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cadet Profile</p>
                                        <p className="text-sm font-bold text-brand-dark truncate">{user.fullName}</p>
                                        {user.plan === 'PRO' && (
                                            <span className="inline-block mt-1 px-2 py-0.5 bg-brand-orange/10 text-brand-orange text-[10px] font-bold rounded-full uppercase tracking-wider">PRO Active</span>
                                        )}
                                    </div>

                                    <Link
                                        href="/account"
                                        onClick={() => setDropdownOpen(false)}
                                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-brand-orange transition-colors"
                                    >
                                        <i className="fa-solid fa-user-gear w-4"></i> Profile
                                    </Link>
                                    <Link
                                        href="/olq-report"
                                        onClick={() => setDropdownOpen(false)}
                                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-brand-orange transition-colors"
                                    >
                                        <i className="fa-solid fa-chart-pie w-4"></i> OLQ Report
                                    </Link>
                                    <Link
                                        href="/pricing"
                                        onClick={() => setDropdownOpen(false)}
                                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-brand-orange transition-colors"
                                    >
                                        <i className="fa-solid fa-credit-card w-4"></i> Pricing
                                    </Link>

                                    <div className="h-[1px] bg-gray-50 my-1 mx-2"></div>

                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
                                    >
                                        <i className="fa-solid fa-right-from-bracket w-4"></i> Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* CTA: Dashboard (logged in) or Join Academy (guest) */}
                    {user ? (
                        <Link href="/dashboard" className="group relative bg-brand-dark p-[2px] rounded-full shadow-lg transition-all duration-300 hover:shadow-xl">
                            <div className="relative w-full h-full rounded-full overflow-hidden bg-transparent flex items-center gap-3 pl-6 pr-1.5 py-1.5">
                                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full transition-transform duration-[1500ms] ease-out group-hover:scale-[30]"></div>
                                <span className="relative z-10 text-white group-hover:text-brand-dark text-sm font-medium transition-colors duration-[1000ms]">Dashboard</span>
                                <div className="relative z-10 bg-white text-brand-dark w-8 h-8 rounded-full flex items-center justify-center">
                                    <i className="fa-solid fa-gauge text-xs"></i>
                                </div>
                            </div>
                        </Link>
                    ) : (
                        <Link href="/auth" className="group relative bg-brand-dark p-[2px] rounded-full shadow-lg transition-all duration-300 hover:shadow-xl">
                            <div className="relative w-full h-full rounded-full overflow-hidden bg-transparent flex items-center gap-3 pl-6 pr-1.5 py-1.5">
                                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full transition-transform duration-[1500ms] ease-out group-hover:scale-[30]"></div>
                                <span className="relative z-10 text-white group-hover:text-brand-dark text-sm font-medium transition-colors duration-[1000ms]">Join Academy</span>
                                <div className="relative z-10 bg-white text-brand-dark w-8 h-8 rounded-full flex items-center justify-center">
                                    <i className="fa-solid fa-arrow-right text-xs"></i>
                                </div>
                            </div>
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}
