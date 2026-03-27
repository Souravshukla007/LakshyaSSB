'use client';

import React from 'react';
import { CalendarDays, BookOpen, MessageSquare, Mic, Crosshair } from 'lucide-react';

interface NewsCardProps {
    data: {
        id: string;
        title: string;
        category: string;
        date: string;
        summary: string;
        ssb_importance: string;
        gd_topic: string;
        lecturette: string;
        interview_question: string;
    };
    isTopNews?: boolean;
}

export default function NewsCard({ data, isTopNews }: NewsCardProps) {
    return (
        <div className={`bg-white rounded-2xl p-6 border ${isTopNews ? 'border-brand-orange ring-1 ring-brand-orange shadow-[0_0_20px_rgba(255,106,61,0.15)]' : 'border-gray-100 shadow-soft hover:shadow-card'} hover:-translate-y-1 transition-all duration-300 flex flex-col h-full group relative`}>
            {isTopNews && (
                <div className="absolute -top-3 -right-3 bg-brand-orange text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md z-10 animate-pulse">
                    🔥 TOP NEWS
                </div>
            )}
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <span className="px-3 py-1 bg-brand-bg text-brand-orange text-xs font-bold rounded-full border border-orange-100">
                    {data?.category || 'General'}
                </span>
                <div className="flex items-center text-gray-400 text-xs font-noname">
                    <CalendarDays className="w-3 h-3 mr-1" />
                    {data?.date || 'Recent'}
                </div>
            </div>

            {/* Title & Summary */}
            <h3 className="font-hero font-bold text-xl text-brand-dark mb-3 leading-tight group-hover:text-brand-orange transition-colors flex-1">
                {data?.title || 'Daily Current Affairs Updates'}
            </h3>
            <p className="text-gray-600 text-sm font-noname mb-6 line-clamp-3 leading-relaxed">
                {data?.summary || 'Updates gathering... check back shortly for detailed intelligence.'}
            </p>

            {/* SSB Highlights Grid */}
            <div className="mt-auto grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 bg-brand-bg p-4 rounded-xl">
                <div className="space-y-1">
                    <div className="flex items-center text-brand-dark text-xs font-bold font-hero">
                        <Crosshair className="w-3 h-3 mr-1 text-brand-orange" /> Why it matters
                    </div>
                    <p className="text-xs text-gray-500 font-noname line-clamp-2" title={data?.ssb_importance || 'Not available'}>{data?.ssb_importance || 'Not available'}</p>
                </div>
                
                <div className="space-y-1">
                    <div className="flex items-center text-brand-dark text-xs font-bold font-hero">
                        <MessageSquare className="w-3 h-3 mr-1 text-brand-orange" /> GD Topic
                    </div>
                    <p className="text-xs text-gray-500 font-noname line-clamp-2" title={data?.gd_topic || 'Not available'}>{data?.gd_topic || 'Not available'}</p>
                </div>
                
                <div className="space-y-1">
                    <div className="flex items-center text-brand-dark text-xs font-bold font-hero">
                        <Mic className="w-3 h-3 mr-1 text-brand-orange" /> Lecturette
                    </div>
                    <p className="text-xs text-gray-500 font-noname line-clamp-2" title={data?.lecturette || 'Not available'}>{data?.lecturette || 'Not available'}</p>
                </div>
                
                <div className="space-y-1">
                    <div className="flex items-center text-brand-dark text-xs font-bold font-hero">
                        <BookOpen className="w-3 h-3 mr-1 text-brand-orange" /> Interview Q
                    </div>
                    <p className="text-xs text-gray-500 font-noname line-clamp-2" title={data?.interview_question || 'Not available'}>{data?.interview_question || 'Not available'}</p>
                </div>
            </div>

            {/* Action */}
            <button className="w-full py-3 bg-brand-dark text-white rounded-xl font-bold text-sm text-center hover:bg-brand-orange transition-all duration-300 hover:shadow-glow">
                Read More
            </button>
        </div>
    );
}
