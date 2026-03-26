'use client';

import React from 'react';
import { Mic, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface LecturetteCardProps {
    topic?: string;
    points?: string[];
}

const DEFAULT_TOPIC = "India's Role in the Indo-Pacific Region";
const DEFAULT_POINTS = [
    "Strategic significance of the Indo-Pacific for global trade and security.",
    "India's QUAD participation and maritime partnerships.",
    "Countering China's string of pearls strategy."
];

export default function LecturetteCard({ topic, points }: LecturetteCardProps) {
    const displayTopic = topic || DEFAULT_TOPIC;
    const displayPoints = points || DEFAULT_POINTS;
    const isLoading = !topic;

    return (
        <div className="bg-gradient-to-br from-brand-bg to-orange-50 rounded-3xl p-8 border border-orange-100 shadow-soft relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/5 rounded-full blur-3xl -z-0 transform group-hover:scale-110 transition-transform duration-700"></div>
            
            <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-6">
                    <div className="w-12 h-12 bg-brand-orange/10 rounded-2xl flex items-center justify-center text-brand-orange">
                        <Mic className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xs font-bold text-brand-orange uppercase tracking-wider font-hero mb-1">
                            Topic of the Day
                        </h2>
                        <h3 className="font-hero font-bold text-2xl text-brand-dark">
                            Lecturette Trainer
                        </h3>
                    </div>
                </div>

                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/50">
                    {isLoading ? (
                        <div className="animate-pulse space-y-3">
                            <div className="h-5 bg-gray-200 rounded-lg w-3/4"></div>
                            <div className="h-4 bg-gray-100 rounded-lg w-full mt-4"></div>
                            <div className="h-4 bg-gray-100 rounded-lg w-5/6"></div>
                            <div className="h-4 bg-gray-100 rounded-lg w-4/6"></div>
                        </div>
                    ) : (
                        <>
                            <h4 className="font-hero font-bold text-lg text-brand-dark mb-4">
                                Topic: {displayTopic}
                            </h4>
                            
                            <ul className="space-y-3 mb-6">
                                {displayPoints.map((point, i) => (
                                    <li key={i} className="flex items-start">
                                        <span className="w-1.5 h-1.5 rounded-full bg-brand-orange mt-2 mr-3 flex-shrink-0"></span>
                                        <span className="text-sm text-gray-600 font-noname">{point}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="bg-brand-bg/50 p-4 rounded-xl border border-gray-50 flex items-start">
                                <span className="text-brand-orange font-bold mr-2">»</span>
                                <p className="text-sm text-brand-dark font-medium italic">
                                    Practice speaking fluidly for 3 minutes on this topic in a confident, structured manner.
                                </p>
                            </div>
                        </>
                    )}
                </div>

                <Link href="/practice/lecturette" className="inline-flex items-center px-6 py-3 bg-brand-orange text-white rounded-xl font-bold text-sm tracking-wide hover:bg-orange-600 transition-all hover:shadow-glow focus:ring-4 focus:ring-orange-200">
                    Practice Lecturette
                    <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
            </div>
        </div>
    );
}
