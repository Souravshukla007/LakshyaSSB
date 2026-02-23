'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AuthPage() {
    const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: 'Login successful! Welcome back.' });
                // Here you would typically store the session/token and redirect
                setTimeout(() => {
                    window.location.href = '/';
                }, 1500);
            } else {
                setMessage({ type: 'error', text: data.error || 'Login failed' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const formData = new FormData(e.currentTarget);
        const fullName = formData.get('fullName') as string;
        const email = formData.get('email') as string;
        const targetEntry = formData.get('targetEntry') as string;
        const password = formData.get('password') as string;

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName, email, targetEntry, password }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: 'Account created successfully! You can now login.' });
                setTimeout(() => {
                    setActiveTab('login');
                    setMessage(null);
                }, 2000);
            } else {
                setMessage({ type: 'error', text: data.error || 'Signup failed' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Navigation — logo only on auth page */}
            <nav className="absolute w-full z-50 top-0 left-0 py-6">
                <div className="max-w-7xl mx-auto px-6 flex items-center">
                    <Link href="/" className="flex items-center gap-2 text-brand-orange">
                        <i className="fa-solid fa-shield-halved text-2xl"></i>
                        <span className="font-logo font-semibold text-2xl tracking-tight text-brand-dark">LakshyaSSB</span>
                    </Link>
                </div>
            </nav>

            <main>
                <section className="min-h-screen pt-32 pb-20 px-6 bg-brand-bg relative overflow-hidden flex items-center justify-center">
                    {/* Background Decor */}
                    <div className="absolute top-0 right-0 w-full lg:w-[calc(60%_-_40px)] h-full bg-grid-pattern opacity-100 z-0 pointer-events-none"></div>
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-orange/5 blur-[120px] rounded-full pointer-events-none"></div>

                    <div className="max-w-6xl mx-auto w-full relative z-10">
                        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col lg:flex-row items-stretch min-h-[650px] reveal-scale active">

                            {/* Left Side: Visual/Information */}
                            <div className="lg:w-1/2 bg-brand-dark p-12 lg:p-16 text-white flex flex-col justify-between relative overflow-hidden">
                                <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>

                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 text-brand-orange mb-12">
                                        <i className="fa-solid fa-shield-halved text-2xl"></i>
                                        <span className="font-logo font-semibold text-2xl tracking-tight">LakshyaSSB</span>
                                    </div>

                                    <h2 className="font-hero font-bold text-4xl lg:text-5xl mb-6 leading-tight">
                                        Your Journey to the <span className="text-brand-orange">Academy</span> Starts Here.
                                    </h2>
                                    <p className="text-gray-400 font-noname text-lg">
                                        Access elite resources, track your OLQ progress, and connect with Ex-Assessors.
                                    </p>
                                </div>

                                <div className="relative z-10 mt-12">
                                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                                        <div className="w-12 h-12 rounded-full bg-brand-orange flex items-center justify-center">
                                            <i className="fa-solid fa-quote-left text-xs"></i>
                                        </div>
                                        <div>
                                            <p className="text-xs italic text-gray-300">&quot;The best way to predict your future is to create it.&quot;</p>
                                            <p className="text-[10px] font-bold text-brand-orange mt-1 uppercase tracking-widest">— OfficerPrep Mentors</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Forms */}
                            <div className="lg:w-1/2 p-8 lg:p-16 bg-white relative">
                                {/* Message Display */}
                                {message && (
                                    <div className={`mb-6 p-4 rounded-xl border ${message.type === 'success'
                                        ? 'bg-green-50 border-green-200 text-green-800'
                                        : 'bg-red-50 border-red-200 text-red-800'
                                        }`}>
                                        <p className="text-sm font-medium">{message.text}</p>
                                    </div>
                                )}

                                {/* Toggle Tabs */}
                                <div className="flex mb-10 bg-gray-100 p-1 rounded-2xl w-fit">
                                    <button
                                        onClick={() => { setActiveTab('login'); setMessage(null); }}
                                        className={`px-8 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${activeTab === 'login'
                                            ? 'bg-white text-brand-dark shadow-sm'
                                            : 'text-gray-500 hover:text-brand-dark'
                                            }`}
                                    >
                                        Login
                                    </button>
                                    <button
                                        onClick={() => { setActiveTab('signup'); setMessage(null); }}
                                        className={`px-8 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${activeTab === 'signup'
                                            ? 'bg-white text-brand-dark shadow-sm'
                                            : 'text-gray-500 hover:text-brand-dark'
                                            }`}
                                    >
                                        Sign Up
                                    </button>
                                </div>

                                {/* Login Form */}
                                {activeTab === 'login' && (
                                    <div className="transition-all duration-500">
                                        <h3 className="font-hero font-bold text-3xl text-brand-dark mb-2">Welcome Back</h3>
                                        <p className="text-gray-500 text-sm mb-8 font-noname">Enter your details to access your dashboard.</p>

                                        <form className="space-y-5" onSubmit={handleLogin}>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 font-mono">Email Address</label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    placeholder="cadet@academy.in"
                                                    required
                                                    disabled={loading}
                                                    className="w-full h-14 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all disabled:opacity-50"
                                                />
                                            </div>
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">Password</label>
                                                    <a href="#" className="text-[10px] font-bold text-brand-orange hover:underline">Forgot Password?</a>
                                                </div>
                                                <input
                                                    type="password"
                                                    name="password"
                                                    placeholder="••••••••"
                                                    required
                                                    disabled={loading}
                                                    className="w-full h-14 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all disabled:opacity-50"
                                                />
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="w-full group relative bg-brand-dark p-[2px] rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <div className="relative w-full h-full rounded-full overflow-hidden bg-transparent flex items-center justify-between pl-8 pr-2 py-3">
                                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full transition-transform duration-[1500ms] ease-out group-hover:scale-[30]"></div>
                                                    <span className="relative z-10 text-white group-hover:text-brand-dark font-noname font-bold text-base transition-colors duration-[1000ms]">
                                                        {loading ? 'Signing In...' : 'Sign In'}
                                                    </span>
                                                    <span className="relative z-10 bg-white text-brand-dark w-10 h-10 rounded-full flex items-center justify-center">
                                                        <i className="fa-solid fa-right-to-bracket text-xs"></i>
                                                    </span>
                                                </div>
                                            </button>
                                        </form>
                                    </div>
                                )}

                                {/* Signup Form */}
                                {activeTab === 'signup' && (
                                    <div className="transition-all duration-500">
                                        <h3 className="font-hero font-bold text-3xl text-brand-dark mb-2">Create Account</h3>
                                        <p className="text-gray-500 text-sm mb-8 font-noname">Join the next batch of recommended candidates.</p>

                                        <form className="space-y-4" onSubmit={handleSignup}>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 font-mono">Full Name</label>
                                                <input
                                                    type="text"
                                                    name="fullName"
                                                    placeholder="Vikram Batra"
                                                    required
                                                    disabled={loading}
                                                    className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all disabled:opacity-50"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 font-mono">Email Address</label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    placeholder="cadet@academy.in"
                                                    required
                                                    disabled={loading}
                                                    className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all disabled:opacity-50"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 font-mono">Target Entry</label>
                                                <select
                                                    name="targetEntry"
                                                    disabled={loading}
                                                    className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all disabled:opacity-50"
                                                >
                                                    <option value="">Select your target entry</option>
                                                    <option value="NDA">NDA</option>
                                                    <option value="CDS-OTA">CDS (OTA)</option>
                                                    <option value="CDS-IMA">CDS (IMA/INA/AFA)</option>
                                                    <option value="AFCAT">AFCAT</option>
                                                    <option value="Technical">Technical Entries</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 font-mono">Password</label>
                                                <input
                                                    type="password"
                                                    name="password"
                                                    placeholder="••••••••"
                                                    required
                                                    disabled={loading}
                                                    className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all disabled:opacity-50"
                                                />
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="w-full group relative bg-brand-dark p-[2px] rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <div className="relative w-full h-full rounded-full overflow-hidden bg-transparent flex items-center justify-between pl-8 pr-2 py-3">
                                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full transition-transform duration-[1500ms] ease-out group-hover:scale-[30]"></div>
                                                    <span className="relative z-10 text-white group-hover:text-brand-dark font-noname font-bold text-base transition-colors duration-[1000ms]">
                                                        {loading ? 'Creating Account...' : 'Create Account'}
                                                    </span>
                                                    <span className="relative z-10 bg-white text-brand-dark w-10 h-10 rounded-full flex items-center justify-center">
                                                        <i className="fa-solid fa-user-plus text-xs"></i>
                                                    </span>
                                                </div>
                                            </button>
                                        </form>
                                    </div>
                                )}

                                {/* Footer of Form */}
                                <div className="mt-8 pt-8 border-t border-gray-50 flex items-center justify-center gap-6">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Or continue with</span>
                                    <div className="flex gap-4">
                                        <button className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors">
                                            <i className="fa-brands fa-google text-sm"></i>
                                        </button>
                                        <button className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors">
                                            <i className="fa-brands fa-apple text-sm"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-brand-dark text-orange-50/70 py-16 text-sm">
                <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-1 md:col-span-1">
                        <div className="flex items-center gap-2 text-white mb-6">
                            <i className="fa-solid fa-shield-halved text-brand-orange text-xl"></i>
                            <span className="font-logo font-bold text-2xl tracking-tight">OfficerPrep</span>
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
                    <p>© 2024 OfficerPrep Academy. Jai Hind.</p>
                    <div className="flex gap-8">
                        <a href="#" className="hover:text-white transition">Privacy Policy</a>
                        <a href="#" className="hover:text-white transition">Terms of Service</a>
                    </div>
                </div>
            </footer>
        </>
    );
}
