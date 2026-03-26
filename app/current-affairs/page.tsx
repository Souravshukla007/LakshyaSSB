'use client';

import React, { useEffect, useState } from 'react';
import NewsCard from '@/components/current-affairs/NewsCard';
import LecturetteCard from '@/components/current-affairs/LecturetteCard';
import CategoryFilter from '@/components/current-affairs/CategoryFilter';
import QuizSection from '@/components/current-affairs/QuizSection';
import { Search } from 'lucide-react';
import useScrollReveal from '@/hooks/useScrollReveal';
import seedNews from '@/data/currentAffairs.json'; // Static fallback

export default function CurrentAffairsPage() {
    useScrollReveal();
    const [news, setNews] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    useEffect(() => {
        fetch('/api/current-affairs')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.data && data.data.length > 0) {
                    setNews(data.data);
                } else {
                    // Fall back to static seed data so filters always work
                    setNews(seedNews as any[]);
                }
            })
            .catch(() => setNews(seedNews as any[]))
            .finally(() => setIsLoading(false));
    }, []);

    const categories = ['All', 'Defence', 'International', 'India', 'Economy', 'Science'];

    const filteredNews = news.filter((item) => {
        const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              item.summary.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <main className="antialiased overflow-x-hidden selection:bg-brand-orange selection:text-white font-sans bg-brand-bg relative min-h-screen pt-32 pb-20 px-6">
            <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-12 items-center">
                    {/* 1. Hero Section */}
                    <div className="lg:col-span-7 text-center md:text-left reveal">
                        <h1 className="font-hero font-bold text-4xl md:text-6xl text-brand-dark mb-4 leading-tight">
                            Current Affairs for <br className="hidden md:block"/>
                            <span className="text-brand-orange">SSB Aspirants</span>
                        </h1>
                        <p className="text-gray-500 font-noname text-lg md:text-xl max-w-2xl mx-auto md:mx-0 mb-8">
                            Stay updated with defence-focused news, interview insights, and GD topics converted directly into SSB formats.
                        </p>
                        <button className="px-8 py-4 bg-brand-dark text-white rounded-full font-bold text-sm tracking-wide hover:bg-brand-orange transition-all duration-300 hover:shadow-glow">
                            Start Daily Practice
                        </button>
                    </div>

                    {/* 2. Lecturette Topic of the Day */}
                    <div className="lg:col-span-5 reveal-scale">
                        <LecturetteCard 
                            topic={news[0]?.lecturette}
                            points={news[0] ? [
                                news[0].ssb_importance,
                                news[0].gd_topic,
                                `Interview Q: ${news[0].interview_question}`
                            ] : undefined}
                        />
                    </div>
                </div>

                {/* Search and Filters Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 reveal delay-100">
                    {/* Search Bar */}
                    <div className="relative w-full md:w-[350px] lg:w-[400px]">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-noname focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition-all shadow-sm"
                            placeholder="Search current affairs, GD topics..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Category Filters */}
                    <div className="w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide flex-1 flex md:justify-end">
                        <CategoryFilter 
                            categories={categories} 
                            selectedCategory={selectedCategory} 
                            onSelect={setSelectedCategory} 
                        />
                    </div>
                </div>

                {/* 3. News Cards Grid */}
                <div className="mb-16">
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm animate-pulse">
                                    <div className="h-4 bg-gray-100 rounded-full w-1/3 mb-4"></div>
                                    <div className="h-6 bg-gray-200 rounded-xl w-full mb-3"></div>
                                    <div className="h-4 bg-gray-100 rounded-xl w-5/6 mb-2"></div>
                                    <div className="h-4 bg-gray-100 rounded-xl w-4/6 mb-6"></div>
                                    <div className="h-px bg-gray-100 w-full mb-6"></div>
                                    <div className="space-y-3">
                                        <div className="h-10 bg-gray-100 rounded-xl w-full"></div>
                                        <div className="h-10 bg-gray-100 rounded-xl w-full"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredNews.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 reveal">
                            {filteredNews.map((newsItem, idx) => {
                                const isTopNews = idx < 3 && selectedCategory === 'All' && searchQuery === '';
                                return <NewsCard key={newsItem.id || idx} data={newsItem} isTopNews={isTopNews} />;
                            })}
                        </div>
                    ) : searchQuery || selectedCategory !== 'All' ? (
                        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                            <h3 className="text-xl font-bold text-gray-400 font-hero">No intel found for your search criteria.</h3>
                            <button
                                onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                                className="mt-4 text-brand-orange font-bold hover:underline"
                            >
                                Clear filters
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                            <div className="text-5xl mb-4">📡</div>
                            <h3 className="text-xl font-bold text-gray-700 font-hero mb-2">Intel Being Gathered</h3>
                            <p className="text-gray-400 font-noname max-w-sm mx-auto">
                                Our AI pipeline is collecting the latest defence & geopolitical news. Check back shortly.
                            </p>
                        </div>
                    )}
                </div>

                {/* 5. Weekly Quiz Section */}
                <div className="reveal">
                    <QuizSection />
                </div>
            </div>
        </main>
    );
}
