'use client';

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import useScrollReveal from "@/hooks/useScrollReveal";

export default function Checkout() {
    useScrollReveal();

    return (
        <main className="antialiased overflow-x-hidden selection:bg-brand-orange selection:text-white font-sans bg-brand-bg">
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
                                <span className="text-lg font-bold text-brand-orange">₹99/mo</span>
                            </div>
                            <p className="text-[10px] text-gray-500">
                                Includes unlimited AI evaluation, practice arena access, and performance tracking.
                            </p>
                        </div>

                        <div className="space-y-4 mb-8 sm:mb-10">
                            <div className="flex items-center gap-3 p-3 sm:p-4 border border-gray-100 rounded-xl">
                                <i className="fa-solid fa-envelope text-brand-orange"></i>
                                <span className="text-sm font-bold text-gray-400">cadet@academy.in</span>
                            </div>
                        </div>

                        <button className="w-full py-4 bg-brand-dark text-white rounded-full font-bold shadow-xl hover:bg-brand-orange transition-all duration-300">
                            Proceed to Payment
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
