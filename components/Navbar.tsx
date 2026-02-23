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
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch user profile on mount
    useEffect(() => {
        fetch('/api/account/me')
            .then(res => res.ok ? res.json() : null)
            .then(data => { if (data?.fullName) setUser(data); })
            .catch(() => null);
    }, []);

    // Close desktop dropdown on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // Auto-close drawer + unlock scroll on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    // Lock / unlock body scroll while drawer is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [mobileMenuOpen]);

    const isActive = (path: string) => {
        if (path === '/' && pathname === '/') return true;
        if (path !== '/' && pathname?.startsWith(path)) return true;
        return false;
    };

    const getInitials = (name: string) =>
        name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    const handleLogout = async () => {
        setMobileMenuOpen(false);
        await fetch('/api/account/logout-all', { method: 'POST' });
        router.push('/auth');
        router.refresh();
    };

    // Links visible to everyone
    const guestNavLinks = [
        { href: '/', label: 'Home', icon: 'fa-house' },
        { href: '/practice', label: 'Practice', icon: 'fa-dumbbell' },
        { href: '/medical', label: 'Medical', icon: 'fa-heart-pulse' },
        { href: '/pricing', label: 'Pricing', icon: 'fa-credit-card' },
        { href: '/ssb-entry-navigator', label: 'SSB Entry Navigator', icon: 'fa-compass' },
    ];

    // Extra link only for logged-in users
    const authNavLinks = [
        ...guestNavLinks.slice(0, 4), // Home, Practice, Medical, Pricing
        { href: '/leaderboard', label: 'Leaderboard', icon: 'fa-trophy' },
        { href: '/ssb-entry-navigator', label: 'SSB Entry Navigator', icon: 'fa-compass' },
    ];

    const navLinks = user ? authNavLinks : guestNavLinks;

    const closeMobile = () => setMobileMenuOpen(false);

    return (
        <>
            {/* ═══════════════════════════════════════════
                DARK BACKDROP  (mobile only)
            ═══════════════════════════════════════════ */}
            <div
                onClick={closeMobile}
                className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
                aria-hidden="true"
            />

            {/* ═══════════════════════════════════════════
                NAV  (desktop bar + hamburger trigger)
            ═══════════════════════════════════════════ */}
            <nav className="absolute w-full z-50 top-0 left-0 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">

                    {/* ── Left: Logo + Desktop links ── */}
                    <div className="flex items-center gap-12">
                        <Link href="/" className="flex items-center gap-2 text-brand-orange">
                            <i className="fa-solid fa-shield-halved text-2xl" />
                            <span className="font-logo font-semibold text-2xl tracking-tight text-brand-dark">
                                LakshyaSSB
                            </span>
                        </Link>

                        {/* Desktop nav — unchanged */}
                        <div className="hidden md:flex gap-8 text-sm font-noname font-medium text-gray-800 tracking-wide">
                            {navLinks.map(({ href, label }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    className={`hover:text-brand-orange transition ${isActive(href) ? 'text-brand-orange font-bold' : ''}`}
                                >
                                    {label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* ── Right: Avatar + CTA + Hamburger ── */}
                    <div className="flex items-center gap-4">

                        {/* Avatar Dropdown (desktop) — unchanged */}
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
                                        <div className="px-4 py-3 border-b border-gray-50 mb-1">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cadet Profile</p>
                                            <p className="text-sm font-bold text-brand-dark truncate">{user.fullName}</p>
                                            {user.plan === 'PRO' && (
                                                <span className="inline-block mt-1 px-2 py-0.5 bg-brand-orange/10 text-brand-orange text-[10px] font-bold rounded-full uppercase tracking-wider">
                                                    PRO Active
                                                </span>
                                            )}
                                        </div>
                                        <Link href="/account" onClick={() => setDropdownOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-brand-orange transition-colors">
                                            <i className="fa-solid fa-user-gear w-4" /> Profile
                                        </Link>
                                        <Link href="/olq-report" onClick={() => setDropdownOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-brand-orange transition-colors">
                                            <i className="fa-solid fa-chart-pie w-4" /> OLQ Report
                                        </Link>
                                        <Link href="/pricing" onClick={() => setDropdownOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-brand-orange transition-colors">
                                            <i className="fa-solid fa-credit-card w-4" /> Pricing
                                        </Link>
                                        <div className="h-[1px] bg-gray-50 my-1 mx-2" />
                                        <button onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors">
                                            <i className="fa-solid fa-right-from-bracket w-4" /> Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Join Academy / Dashboard pill (desktop) */}
                        <div className="hidden md:flex items-center">
                            {user ? (
                                <Link href="/dashboard" className="group relative bg-brand-dark p-[2px] rounded-full shadow-lg transition-all duration-300 hover:shadow-xl">
                                    <div className="relative w-full h-full rounded-full overflow-hidden bg-transparent flex items-center gap-3 pl-6 pr-1.5 py-1.5">
                                        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full transition-transform duration-[1500ms] ease-out group-hover:scale-[30]" />
                                        <span className="relative z-10 text-white group-hover:text-brand-dark text-sm font-medium transition-colors duration-[1000ms]">Dashboard</span>
                                        <div className="relative z-10 bg-white text-brand-dark w-8 h-8 rounded-full flex items-center justify-center">
                                            <i className="fa-solid fa-gauge-high text-xs" />
                                        </div>
                                    </div>
                                </Link>
                            ) : (
                                <Link href="/auth" className="group relative bg-brand-dark p-[2px] rounded-full shadow-lg transition-all duration-300 hover:shadow-xl">
                                    <div className="relative w-full h-full rounded-full overflow-hidden bg-transparent flex items-center gap-3 pl-6 pr-1.5 py-1.5">
                                        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full transition-transform duration-[1500ms] ease-out group-hover:scale-[30]" />
                                        <span className="relative z-10 text-white group-hover:text-brand-dark text-sm font-medium transition-colors duration-[1000ms]">Join Academy</span>
                                        <div className="relative z-10 bg-white text-brand-dark w-8 h-8 rounded-full flex items-center justify-center">
                                            <i className="fa-solid fa-arrow-right text-xs" />
                                        </div>
                                    </div>
                                </Link>
                            )}
                        </div>

                        {/* ── Hamburger button (mobile only) ── */}
                        <button
                            onClick={() => setMobileMenuOpen(prev => !prev)}
                            className="md:hidden flex flex-col justify-center items-center w-10 h-10 rounded-xl bg-white/90 backdrop-blur-sm border border-gray-200 shadow-sm hover:shadow-md transition-all gap-[5px]"
                            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                            aria-expanded={mobileMenuOpen}
                        >
                            {/* Bar 1 */}
                            <span className={`block h-[2px] w-5 bg-brand-dark rounded-full transition-all duration-300 origin-center ${mobileMenuOpen ? 'rotate-45 translate-y-[7px]' : ''
                                }`} />
                            {/* Bar 2 */}
                            <span className={`block h-[2px] w-5 bg-brand-dark rounded-full transition-all duration-300 ${mobileMenuOpen ? 'opacity-0 scale-x-0' : ''
                                }`} />
                            {/* Bar 3 */}
                            <span className={`block h-[2px] w-5 bg-brand-dark rounded-full transition-all duration-300 origin-center ${mobileMenuOpen ? '-rotate-45 -translate-y-[7px]' : ''
                                }`} />
                        </button>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════
                    MOBILE DRAWER
                ═══════════════════════════════════════════ */}
                <div className={`md:hidden fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-y-0' : '-translate-y-full'
                    }`}>
                    <div className="bg-white rounded-b-3xl shadow-2xl overflow-hidden">

                        {/* ── Drawer Header: Logo + Close ── */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                            <Link href="/" onClick={closeMobile} className="flex items-center gap-2 text-brand-orange">
                                <i className="fa-solid fa-shield-halved text-xl" />
                                <span className="font-logo font-semibold text-xl tracking-tight text-brand-dark">LakshyaSSB</span>
                            </Link>
                            <button
                                onClick={closeMobile}
                                className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition"
                                aria-label="Close menu"
                            >
                                <i className="fa-solid fa-xmark text-lg" />
                            </button>
                        </div>

                        {/* ── Nav Links ── */}
                        <div className="px-4 py-3 flex flex-col gap-1">
                            {navLinks.map(({ href, label, icon }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    onClick={closeMobile}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${isActive(href)
                                        ? 'bg-brand-orange/10 text-brand-orange font-semibold'
                                        : 'text-gray-700 hover:bg-gray-50 hover:text-brand-orange'
                                        }`}
                                >
                                    <i className={`fa-solid ${icon} w-4 text-center ${isActive(href) ? 'text-brand-orange' : 'text-gray-400'}`} />
                                    {label}
                                    {isActive(href) && (
                                        <span className="ml-auto w-2 h-2 rounded-full bg-brand-orange" />
                                    )}
                                </Link>
                            ))}
                        </div>

                        {/* ── Cadet Profile Card (logged-in only) ── */}
                        {user && (
                            <>
                                <div className="mx-4 my-2 p-4 bg-gray-50 rounded-2xl flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-full bg-brand-dark flex items-center justify-center text-white font-bold text-sm shrink-0">
                                        {getInitials(user.fullName)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-brand-dark truncate">{user.fullName}</p>
                                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                        {user.plan === 'PRO' && (
                                            <span className="inline-block mt-0.5 px-2 py-0.5 bg-brand-orange/10 text-brand-orange text-[9px] font-bold rounded-full uppercase tracking-wider">
                                                PRO Active
                                            </span>
                                        )}
                                    </div>
                                    <Link
                                        href="/account"
                                        onClick={closeMobile}
                                        className="text-xs font-semibold text-brand-orange hover:underline shrink-0"
                                    >
                                        Edit
                                    </Link>
                                </div>

                                {/* ── 2-column Quick Links ── */}
                                <div className="grid grid-cols-2 gap-3 px-4 pb-2">
                                    <Link
                                        href="/olq-report"
                                        onClick={closeMobile}
                                        className="flex items-center gap-2 p-3 bg-gray-50 rounded-2xl text-sm text-gray-600 hover:bg-brand-orange/10 hover:text-brand-orange transition"
                                    >
                                        <i className="fa-solid fa-chart-pie text-gray-400 text-sm" />
                                        OLQ Report
                                    </Link>
                                    <Link
                                        href="/pricing"
                                        onClick={closeMobile}
                                        className="flex items-center gap-2 p-3 bg-gray-50 rounded-2xl text-sm text-gray-600 hover:bg-brand-orange/10 hover:text-brand-orange transition"
                                    >
                                        <i className="fa-solid fa-credit-card text-gray-400 text-sm" />
                                        Pricing
                                    </Link>
                                </div>
                            </>
                        )}

                        {/* ── CTA + Logout ── */}
                        <div className="px-4 pb-6 pt-2 flex flex-col gap-3">
                            {/* Full-width CTA */}
                            {user ? (
                                <Link
                                    href="/dashboard"
                                    onClick={closeMobile}
                                    className="flex items-center justify-center gap-2 w-full py-3.5 bg-brand-dark text-white rounded-2xl text-sm font-semibold hover:opacity-90 transition shadow-md"
                                >
                                    <i className="fa-solid fa-gauge-high text-xs" />
                                    Go to Dashboard
                                </Link>
                            ) : (
                                <Link
                                    href="/auth"
                                    onClick={closeMobile}
                                    className="flex items-center justify-center gap-2 w-full py-3.5 bg-brand-dark text-white rounded-2xl text-sm font-semibold hover:opacity-90 transition shadow-md"
                                >
                                    <i className="fa-solid fa-arrow-right text-xs" />
                                    Join Academy
                                </Link>
                            )}

                            {/* Logout (logged-in only) */}
                            {user && (
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-medium text-red-500 border border-red-100 bg-red-50 hover:bg-red-100 transition"
                                >
                                    <i className="fa-solid fa-right-from-bracket text-xs" />
                                    Logout
                                </button>
                            )}
                        </div>

                    </div>
                </div>
            </nav>
        </>
    );
}
