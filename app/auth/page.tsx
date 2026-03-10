'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AuthPage() {
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<'login' | 'signup' | 'otp'>('login');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [otpEmail, setOtpEmail] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Show error from Google OAuth callback redirect
    useEffect(() => {
        const error = searchParams.get('error');
        if (error) {
            setMessage({ type: 'error', text: error });
        }
    }, [searchParams]);

    const handleGoogleLogin = () => {
        setLoading(true);
        setMessage(null);
        window.location.href = '/api/auth/google';
    };

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

    const handleSendOtp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        setOtpEmail(email);

        try {
            const response = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: 'OTP sent! Please check your email.' });
                setOtpSent(true);
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to send OTP' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const formData = new FormData(e.currentTarget);
        const otp = formData.get('otp') as string;

        try {
            const response = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: otpEmail, otp }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: 'Login successful! Welcome back.' });
                setTimeout(() => {
                    window.location.href = '/';
                }, 1500);
            } else {
                setMessage({ type: 'error', text: data.error || 'Invalid OTP' });
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
                    <Link href="/" className="flex items-center gap-2">
                        <img src="/LSSB_logo.png" alt="LakshyaSSB Logo" className="h-16 md:h-20 w-auto" />
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
                                    <div className="flex items-center gap-2 mb-12">
                                        <img src="/LSSB_logo.png" alt="LakshyaSSB Logo" className="h-20 md:h-24 w-auto" />
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
                                        onClick={() => { setActiveTab('login'); setMessage(null); setOtpSent(false); }}
                                        className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${activeTab === 'login'
                                            ? 'bg-white text-brand-dark shadow-sm'
                                            : 'text-gray-500 hover:text-brand-dark'
                                            }`}
                                    >
                                        Login
                                    </button>
                                    <button
                                        onClick={() => { setActiveTab('otp'); setMessage(null); setOtpSent(false); }}
                                        className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${activeTab === 'otp'
                                            ? 'bg-white text-brand-dark shadow-sm'
                                            : 'text-gray-500 hover:text-brand-dark'
                                            }`}
                                    >
                                        Login with OTP
                                    </button>
                                    <button
                                        onClick={() => { setActiveTab('signup'); setMessage(null); setOtpSent(false); }}
                                        className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${activeTab === 'signup'
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
                                                <div className="relative">
                                                    <input
                                                        type={showPassword ? 'text' : 'password'}
                                                        name="password"
                                                        placeholder="••••••••"
                                                        required
                                                        disabled={loading}
                                                        className="w-full h-14 bg-gray-50 border border-gray-100 rounded-xl px-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all disabled:opacity-50"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-orange transition-colors"
                                                    >
                                                        <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                                    </button>
                                                </div>
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

                                {/* OTP Form */}
                                {activeTab === 'otp' && (
                                    <div className="transition-all duration-500">
                                        <h3 className="font-hero font-bold text-3xl text-brand-dark mb-2">Passwordless Login</h3>
                                        <p className="text-gray-500 text-sm mb-8 font-noname">
                                            {otpSent ? 'Enter the 6-digit code sent to your email.' : 'Enter your email to receive a secure login code.'}
                                        </p>

                                        {!otpSent ? (
                                            <form className="space-y-5" onSubmit={handleSendOtp}>
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

                                                <button
                                                    type="submit"
                                                    disabled={loading}
                                                    className="w-full group relative bg-brand-dark p-[2px] rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <div className="relative w-full h-full rounded-full overflow-hidden bg-transparent flex items-center justify-between pl-8 pr-2 py-3">
                                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full transition-transform duration-[1500ms] ease-out group-hover:scale-[30]"></div>
                                                        <span className="relative z-10 text-white group-hover:text-brand-dark font-noname font-bold text-base transition-colors duration-[1000ms]">
                                                            {loading ? 'Sending OTP...' : 'Send OTP'}
                                                        </span>
                                                        <span className="relative z-10 bg-white text-brand-dark w-10 h-10 rounded-full flex items-center justify-center">
                                                            <i className="fa-solid fa-paper-plane text-xs"></i>
                                                        </span>
                                                    </div>
                                                </button>
                                            </form>
                                        ) : (
                                            <form className="space-y-5" onSubmit={handleVerifyOtp}>
                                                <div>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">6-Digit Code</label>
                                                        <button
                                                            type="button"
                                                            onClick={() => setOtpSent(false)}
                                                            className="text-[10px] font-bold text-brand-orange hover:underline"
                                                        >
                                                            Change Email
                                                        </button>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        name="otp"
                                                        placeholder="123456"
                                                        required
                                                        maxLength={6}
                                                        disabled={loading}
                                                        className="w-full h-14 bg-gray-50 border border-gray-100 rounded-xl px-4 text-center text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all disabled:opacity-50"
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
                                                            {loading ? 'Verifying...' : 'Verify Login'}
                                                        </span>
                                                        <span className="relative z-10 bg-white text-brand-dark w-10 h-10 rounded-full flex items-center justify-center">
                                                            <i className="fa-solid fa-check text-xs"></i>
                                                        </span>
                                                    </div>
                                                </button>
                                            </form>
                                        )}
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
                                                <div className="relative">
                                                    <input
                                                        type={showPassword ? 'text' : 'password'}
                                                        name="password"
                                                        placeholder="••••••••"
                                                        required
                                                        disabled={loading}
                                                        className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all disabled:opacity-50"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-orange transition-colors"
                                                    >
                                                        <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                                    </button>
                                                </div>
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

                                {/* Google Sign-In */}
                                <div className="mt-8 pt-8 border-t border-gray-100">
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="flex-1 h-px bg-gray-100"></div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Or continue with</span>
                                        <div className="flex-1 h-px bg-gray-100"></div>
                                    </div>
                                    <button
                                        onClick={handleGoogleLogin}
                                        disabled={loading}
                                        className="w-full flex items-center justify-center gap-3 h-14 bg-white border-2 border-gray-100 rounded-2xl px-6 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-200 hover:shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                        </svg>
                                        Continue with Google
                                    </button>
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
                        <div className="flex items-center gap-2 mb-6">
                            <img src="/LSSB_logo.png" alt="LakshyaSSB Logo" className="h-16 md:h-20 w-auto" />
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
