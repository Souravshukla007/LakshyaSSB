'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Feature {
    id: string;
    title: string;
    description: string;
    status: 'In Development' | 'Coming Soon' | 'Planned';
    icon: string;
    votes: number;
}

const initialFeatures: Feature[] = [
    {
        id: '1',
        title: 'GTO Task Simulator',
        description: 'Practice PGT, HGT and Command tasks with interactive obstacle planning.',
        status: 'Coming Soon',
        icon: 'fa-truck-field',
        votes: 342,
    },
    {
        id: '2',
        title: 'AI Psychology Analysis',
        description: 'Advanced analysis for WAT, TAT and SRT responses with OLQ scoring.',
        status: 'In Development',
        icon: 'fa-brain',
        votes: 891,
    },
    {
        id: '3',
        title: 'SSB Mock Interview AI',
        description: 'Simulate real SSB personal interviews with adaptive questions.',
        status: 'Coming Soon',
        icon: 'fa-user-tie',
        votes: 567,
    },
    {
        id: '4',
        title: 'Daily SSB Challenge',
        description: 'Complete daily OIR, WAT and SRT tasks to maintain practice streaks.',
        status: 'Planned',
        icon: 'fa-calendar-day',
        votes: 215,
    },
    {
        id: '5',
        title: 'Mobile App',
        description: 'Practice LakshyaSSB modules directly from your phone.',
        status: 'Coming Soon',
        icon: 'fa-mobile-screen',
        votes: 1045,
    },
    {
        id: '6',
        title: 'GPE Interactive Simulator',
        description: 'Solve real SSB group planning exercises with map-based scenarios.',
        status: 'In Development',
        icon: 'fa-map-location-dot',
        votes: 432,
    },
];

const statusStyles = {
    'In Development': 'bg-blue-50 text-blue-700 border-blue-200',
    'Coming Soon': 'bg-orange-50 text-orange-700 border-orange-200',
    'Planned': 'bg-gray-100 text-gray-600 border-gray-200',
};

export default function RoadmapPage() {
    const [features, setFeatures] = useState(initialFeatures);
    const [votedIds, setVotedIds] = useState<Set<string>>(new Set());

    const handleVote = (id: string) => {
        if (votedIds.has(id)) return;
        setFeatures(prev => 
            prev.map(f => f.id === id ? { ...f, votes: f.votes + 1 } : f)
        );
        setVotedIds(new Set(votedIds).add(id));
    };

    return (
        <div className="min-h-screen flex flex-col pt-28 pb-20 bg-[#FBF8F3] selection:bg-orange-200">
            {/* Grid bg */}
            <div className="fixed inset-0 pointer-events-none" style={{
                backgroundImage: 'linear-gradient(rgba(0,0,0,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.03) 1px,transparent 1px)',
                backgroundSize: '40px 40px'
            }} />

            <main className="flex-1 max-w-6xl mx-auto w-full px-4 md:px-8 relative z-10">
                
                {/* Hero */}
                <div className="text-center mb-16 animate-fadeIn">
                    <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-3">Product Vision</p>
                    <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-4">
                        LakshyaSSB <span className="text-orange-500">Roadmap</span>
                    </h1>
                    <p className="text-gray-500 text-base md:text-lg max-w-xl mx-auto font-medium mb-2">
                        See what we are building next for SSB aspirants.
                    </p>
                    <p className="text-sm font-bold text-gray-400">
                        New training modules and AI tools are coming soon.
                    </p>
                </div>

                {/* Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                    {features.sort((a,b) => b.votes - a.votes).map(feature => (
                        <div key={feature.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:border-orange-100 transition-all flex flex-col h-full group">
                            
                            <div className="flex items-start justify-between mb-5">
                                <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-600 flex items-center justify-center text-xl group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors">
                                    <i className={`fa-solid ${feature.icon}`} />
                                </div>
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-widest ${statusStyles[feature.status]}`}>
                                    {feature.status}
                                </span>
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                            <p className="text-sm text-gray-500 mb-6 flex-1 leading-relaxed">
                                {feature.description}
                            </p>

                            <div className="pt-4 border-t border-gray-50 mt-auto flex items-center justify-between">
                                <div className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                                    <i className="fa-solid fa-fire text-orange-400" />
                                    {feature.votes.toLocaleString()} users want this
                                </div>
                                <button 
                                    onClick={() => handleVote(feature.id)}
                                    disabled={votedIds.has(feature.id)}
                                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm ${votedIds.has(feature.id) ? 'bg-green-50 text-green-600 border border-green-200 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-black hover:scale-105'}`}
                                >
                                    {votedIds.has(feature.id) ? 'Voted' : 'Vote'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Suggest CTA box */}
                <div className="max-w-3xl mx-auto bg-gray-900 rounded-[2.5rem] p-10 md:p-12 text-center shadow-xl animate-fadeIn relative overflow-hidden" style={{ animationDelay: '0.2s' }}>
                    
                    {/* Background decor */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500 rounded-full mix-blend-multiply filter blur-[80px] opacity-20 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500 rounded-full mix-blend-multiply filter blur-[80px] opacity-20 pointer-events-none" />

                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-16 h-16 rounded-2xl bg-white/10 text-white flex items-center justify-center text-2xl mb-6 backdrop-blur-sm border border-white/10">
                            <i className="fa-solid fa-lightbulb" />
                        </div>
                        <h2 className="text-3xl font-extrabold text-white mb-2">Have a Feature Idea?</h2>
                        <p className="text-gray-400 text-sm md:text-base font-medium mb-8 max-w-sm">
                            Suggest a new feature for LakshyaSSB. We build what the community needs.
                        </p>
                        <Link href="/feedback" className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full shadow-lg transition-all text-sm flex items-center gap-2">
                            Submit Suggestion <i className="fa-solid fa-arrow-right text-xs" />
                        </Link>
                    </div>
                </div>

            </main>
        </div>
    );
}
