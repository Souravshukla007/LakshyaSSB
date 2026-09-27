'use client';

import { useState, useEffect } from "react";


import useScrollReveal from "@/hooks/useScrollReveal";
import Script from "next/script";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * Razorpay's checkout.js attaches itself to `window`. Declaring it here replaces a
 * `// @ts-ignore` on the constructor call — the suppression was hiding the fact
 * that the global may legitimately be undefined when the script hasn't loaded.
 */
interface RazorpayInstance {
    open: () => void;
    on: (event: string, handler: (response: any) => void) => void;
}

declare global {
    interface Window {
        Razorpay?: new (options: Record<string, any>) => RazorpayInstance;
    }
}

/** How long to wait for a webhook-confirmed capture before telling the user to sit tight. */
const ACTIVATION_POLL_ATTEMPTS = 10;
const ACTIVATION_POLL_INTERVAL_MS = 2000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function Checkout() {
    useScrollReveal();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string>('');
    const [isPro, setIsPro] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetch('/api/auth/status')
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data?.email) setUserEmail(data.email);
                // Pro is a one-time lifetime grant, so an existing Pro user must
                // not be shown a payment sheet — they would simply be charged
                // again for something they already own.
                if (data?.plan === 'PRO') setIsPro(true);
            })
            .catch(() => null);
    }, []);

    /**
     * Wait for the plan to flip to PRO.
     *
     * Used when Razorpay reports the payment as authorised but not yet captured:
     * the money isn't ours until capture, so /api/payment/verify refuses to grant
     * access and the webhook finishes the job a moment later.
     */
    const waitForActivation = async () => {
        for (let attempt = 0; attempt < ACTIVATION_POLL_ATTEMPTS; attempt++) {
            await sleep(ACTIVATION_POLL_INTERVAL_MS);
            try {
                const res = await fetch('/api/account/check-plan', { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    if (data?.plan === 'PRO') {
                        router.push('/dashboard?payment=success');
                        return;
                    }
                }
            } catch {
                // Keep polling; a transient failure shouldn't end the wait.
            }
        }

        setNotice(null);
        setError(
            'Your payment went through but access is still being confirmed. It usually lands within a few minutes — ' +
            'please refresh, and contact support if it has not unlocked.'
        );
        setIsLoading(false);
    };

    const handlePayment = async () => {
        setIsLoading(true);
        setError(null);
        setNotice(null);

        try {
            // 1. Create Order
            const res = await fetch('/api/payment/create-order', { method: 'POST' });
            const data = await res.json();

            if (res.status === 409 && data?.reason === 'already_pro') {
                setIsPro(true);
                setIsLoading(false);
                return;
            }

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create order');
            }

            // 2. Initialize Razorpay options
            const options = {
                // Publishable key id, handed back by create-order so there is only
                // one place the key is configured.
                key: data.key,
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
                            return;
                        }

                        // 202: captured confirmation hasn't arrived yet. The webhook
                        // will settle it, so wait rather than showing a failure for a
                        // payment the customer genuinely made.
                        if (verifyRes.status === 202 && verifyData.pending) {
                            setNotice(verifyData.error || 'Payment received. Confirming your access…');
                            await waitForActivation();
                            return;
                        }

                        setError(verifyData.error || 'Payment verification failed.');
                        setIsLoading(false);
                    } catch (err) {
                        setError('Payment verification failed.');
                        setIsLoading(false);
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

            // The checkout script is loaded via <Script> below, which is async.
            // Without this guard, clicking Pay before it lands threw
            // "window.Razorpay is not a constructor" straight into the error banner
            // — a raw stack-trace string shown to a customer on the payment page.
            // It also happens whenever an ad blocker or ORB blocks Razorpay's CDN.
            if (!window.Razorpay) {
                setError('The payment window is still loading. Please wait a moment and try again.');
                setIsLoading(false);
                return;
            }

            const rzp = new window.Razorpay({
                ...options,
                modal: {
                    // Closing the Razorpay modal fires neither `payment.failed` nor
                    // the success handler, so `isLoading` stayed true forever and the
                    // Pay button was stuck in a spinner until a full page reload.
                    ondismiss: () => setIsLoading(false),
                },
            });

            rzp.on('payment.failed', function (response: any) {
                setError(response.error?.description || 'Payment failed');
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
            

            <section className="min-h-screen bg-brand-bg pt-32 sm:pt-40 pb-16 sm:pb-20 px-4 sm:px-6 flex items-center justify-center">
                <div className="max-w-md w-full relative z-10 reveal-scale">
                    <div className="bg-white p-6 sm:p-10 rounded-3xl sm:rounded-[3rem] border border-gray-100 shadow-2xl">
                        {isPro ? (
                            <>
                                <h2 className="font-hero font-bold text-2xl sm:text-3xl text-brand-dark mb-2">
                                    You already have <span className="text-brand-orange">Pro</span>
                                </h2>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-8">Lifetime Access</p>
                                <p className="text-sm text-gray-500 mb-8">
                                    Pro is a one-time purchase and your account already has it, so there is nothing to pay.
                                    Everything is unlocked.
                                </p>
                                <Link
                                    href="/practice"
                                    className="block w-full py-4 text-center text-white rounded-full font-bold shadow-xl bg-brand-dark hover:bg-brand-orange transition-all duration-300"
                                >
                                    Go to Practice
                                </Link>
                            </>
                        ) : (
                            <>
                                <h2 className="font-hero font-bold text-2xl sm:text-3xl text-brand-dark mb-2">
                                    Complete <span className="text-brand-orange">Upgrade</span>
                                </h2>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-8">Secure Checkout</p>

                                <div className="bg-brand-bg p-4 sm:p-6 rounded-2xl mb-6 sm:mb-8 border border-gray-50">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-sm font-bold text-brand-dark">Pro Training Plan</span>
                                        <span className="text-lg font-bold text-brand-orange">₹9</span>
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

                                {notice && (
                                    <div className="mb-4 p-3 bg-amber-50 text-amber-700 text-xs rounded-xl border border-amber-100 flex items-center gap-2">
                                        <i className="fa-solid fa-circle-notch fa-spin" />
                                        {notice}
                                    </div>
                                )}

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
                                    {/* Was "Stripe & Razorpay Secured". There is no Stripe
                                        integration — package.json ships `razorpay` only — so
                                        naming it was a false trust signal on a payment page. */}
                                    Razorpay Secured
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </section>

            
        </main>
    );
}
