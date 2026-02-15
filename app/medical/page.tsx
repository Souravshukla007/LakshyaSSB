'use client';

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import useScrollReveal from "@/hooks/useScrollReveal";
import { useState } from "react";

export default function Medical() {
    useScrollReveal();

    const [checklist, setChecklist] = useState({
        bmi: true,
        vision: false,
        flatFoot: true
    });

    const totalItems = Object.keys(checklist).length;
    const checkedItems = Object.values(checklist).filter(Boolean).length;
    const score = Math.round((checkedItems / totalItems) * 100);

    const toggleItem = (key: keyof typeof checklist) => {
        setChecklist(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    return (
        <main className="antialiased overflow-x-hidden selection:bg-brand-orange selection:text-white font-sans bg-brand-bg">
            <Navbar />

            <section className="min-h-screen bg-brand-bg pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-12 reveal">
                        <h1 className="font-hero font-bold text-4xl text-brand-dark mb-2">
                            Medical <span className="text-brand-orange">Readiness</span>
                        </h1>
                        <p className="text-gray-500 font-noname">
                            Self-check your physical standard before reporting to the SSB.
                        </p>
                    </div>

                    <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm reveal-scale">
                        <div className="grid gap-6">
                            {/* Checklist Item 1 */}
                            <div className="flex items-center justify-between p-6 bg-brand-bg rounded-2xl">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-brand-orange shadow-sm">
                                        <i className="fa-solid fa-ruler-vertical"></i>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-brand-dark">Height & Weight</p>
                                        <p className="text-[10px] text-gray-400 tracking-wider">Meet the BMI chart standards</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={checklist.bmi}
                                        onChange={() => toggleItem('bmi')}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-green"></div>
                                </label>
                            </div>

                            {/* Checklist Item 2 */}
                            <div className="flex items-center justify-between p-6 bg-brand-bg rounded-2xl">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-brand-orange shadow-sm">
                                        <i className="fa-solid fa-eye"></i>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-brand-dark">Vision 6/6</p>
                                        <p className="text-[10px] text-gray-400 tracking-wider">Correctable if needed</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={checklist.vision}
                                        onChange={() => toggleItem('vision')}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-green"></div>
                                </label>
                            </div>

                            {/* Checklist Item 3 */}
                            <div className="flex items-center justify-between p-6 bg-brand-bg rounded-2xl">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-brand-orange shadow-sm">
                                        <i className="fa-solid fa-shoe-prints"></i>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-brand-dark">Flat Foot / Knock Knees</p>
                                        <p className="text-[10px] text-gray-400 tracking-wider">Check for standard gap</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={checklist.flatFoot}
                                        onChange={() => toggleItem('flatFoot')}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-green"></div>
                                </label>
                            </div>
                        </div>

                        <div className="mt-12 p-8 bg-brand-dark rounded-3xl text-center">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Medical Readiness Score</p>
                            <div className="text-5xl font-hero font-bold text-white mb-2">{score}%</div>
                            <div className="w-full h-1.5 bg-white/10 rounded-full max-w-xs mx-auto overflow-hidden">
                                <div
                                    className="h-full bg-brand-orange transition-all duration-500 ease-out"
                                    style={{ width: `${score}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
