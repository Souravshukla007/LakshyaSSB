'use client';

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import useScrollReveal from "@/hooks/useScrollReveal";
import Script from "next/script";
import { useRouter } from "next/navigation";

export default function Checkout() {
    useScrollReveal();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string>('');
    const router = useRouter();

    useEffect(() => {
        fetch('/api/auth/status')
            .then(res => res.ok ? res.json() : null)
            .then(data => { if (data?.email) setUserEmail(data.email); })
            .catch(() => null);
    }, []);

    const handlePayment = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // 1. Create Order
            const res = await fetch('/api/payment/create-order', { method: 'POST' });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create order');
            }

            // 2. Initialize Razorpay options
            const options = {
                key: data.key, // NEXT_PUBLIC_RAZORPAY_KEY_ID
                amount: data.amount,
                currency: data.currency,
                name: "LakshyaSSB",
                description: "Pro Training Plan Access",
                order_id: data.orderId,
                handler: async function (response: any) {
                    try {
                        // 3. Verify Payment
                        const verifyRes = await fetch('/api/payment/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature
                            })
                        });

                        const verifyData = await verifyRes.json();

                        if (verifyRes.ok && verifyData.success) {
                            router.push('/dashboard?payment=success');
                        } else {
                            setError(verifyData.error || 'Payment verification failed.');
                        }
                    } catch (err) {
                        setError('Payment verification failed.');
                    }
                },
                prefill: {
                    name: "SSB Aspirant",
                    email: userEmail || "cadet@academy.in",
                    contact: ""
                },
                theme: {
                    color: "#FF5E00" // brand-orange
                }
            };

            // @ts-ignore
            const rzp = new window.Razorpay(options);

            rzp.on('payment.failed', function (response: any) {
                setError(response.error.description || 'Payment failed');
                setIsLoading(false);
            });

            rzp.open();
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
            setIsLoading(false);
        }
    };

    return (
        <main className="antialiased overflow-x-hidden selection:bg-brand-orange selection:text-white font-sans bg-brand-bg">
            <Script src="https://checkout.razorpay.com/v1/checkout.js" />
            <Navbar />

            <section className="min-h-screen bg-brand-bg pt-32 sm:pt-40 pb-16 sm:pb-20 px-4 sm:px-6 flex items-center justify-center">
                <div className="max-w-md w-full relative z-10 reveal-scale">
                    <div className="bg-white p-6 sm:p-10 rounded-3xl sm:rounded-[3rem] border border-gray-100 shadow-2xl">
                        <h2 className="font-hero font-bold text-2xl sm:text-3xl text-brand-dark mb-2">
                            Complete <span className="text-brand-orange">Upgrade</span>
                        </h2>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-8">Secure Checkout</p>

                        <div className="bg-brand-bg p-4 sm:p-6 rounded-2xl mb-6 sm:mb-8 border border-gray-50">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-sm font-bold text-brand-dark">Pro Training Plan</span>
                                <span className="text-lg font-bold text-brand-orange">₹49</span>
                            </div>
                            <p className="text-[10px] text-gray-500">
                                Includes unlimited AI evaluation, practice arena access, and performance tracking.
                            </p>
                        </div>

                        <div className="space-y-4 mb-8 sm:mb-10">
                            <div className="flex items-center gap-3 p-3 sm:p-4 border border-gray-100 rounded-xl">
                                <i className="fa-solid fa-envelope text-brand-orange"></i>
                                <span className="text-sm font-bold text-gray-400">{userEmail || 'Loading...'}</span>
                            </div>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 text-red-500 text-xs rounded-xl border border-red-100">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handlePayment}
                            disabled={isLoading}
                            className={`w-full py-4 text-white rounded-full font-bold shadow-xl transition-all duration-300 ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-brand-dark hover:bg-brand-orange'}`}
                        >
                            {isLoading ? 'Processing...' : 'Proceed to Payment'}
                        </button>
                        <p className="text-center text-[10px] text-gray-400 mt-6 uppercase tracking-widest font-bold">
                            Stripe & Razorpay Secured
                        </p>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
