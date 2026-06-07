import React from 'react';
import Link from 'next/link';

type SrtResultProps = {
    result: any;
    onRetake: () => void;
    onDashboard: () => void;
};

export default function SrtResult({ result, onRetake, onDashboard }: SrtResultProps) {
    if (!result) return (
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-20 border border-gray-100 shadow-xl text-center">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-8"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Evaluating Reactions</h2>
            <p className="text-gray-500 font-medium">Please wait while we analyze your situational responses...</p>
        </div>
    );

    const overallScore = result.totalScore;

    const themes = Object.entries(result.themeScores || {}).map(([name, data]: [string, any]) => ({
        name: name.replace('_', ' '),
        score: Math.round(data.percentage)
    }));

    const indicators = result.riskLevel === 'LOW' ? [
        'High action orientation',
        'Strong problem-solving mindset',
        'Positive outcome orientation'
    ] : result.riskLevel === 'MODERATE' ? [
        'Moderate action orientation',
        'Good logic, needs more speed',
        'Some dependency on others'
    ] : [
        'Low action orientation',
        'Passive approach to problems',
        'High dependency on authority'
    ];

    const suggestions = result.riskLevel === 'LOW' ? [
        'Maintain consistency in reactions',
        'Practice time-bound simulations',
        'Refine the brevity of your responses'
    ] : [
        'Improve decisiveness under stress',
        'Avoid delayed reaction statements',
        'Focus on immediate practical actions'
    ];

    return (
        <div className="max-w-4xl mx-auto w-full pb-12 animate-fadeIn">

            <div className="bg-white/90 backdrop-blur-md shadow-card rounded-3xl p-8 mb-8 border border-gray-100 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-[#F97316]"></div>

                <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
                    <div className="text-center">
                        <p className="text-gray-500 mb-2 font-medium">Overall SRT Score</p>
                        <div className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-gray-900 to-gray-600">
                            {overallScore}<span className="text-3xl text-gray-400">/100</span>
                        </div>
                    </div>

                    <div className="w-px h-24 bg-gray-200 hidden md:block"></div>

                    <div className="text-center md:text-left">
                        <p className="text-gray-500 mb-2 font-medium">Risk Badge</p>
                        <div className="inline-flex items-center gap-3 bg-green-50 text-green-700 px-5 py-3 rounded-xl border border-green-200 font-semibold shadow-sm">
                            <span className="relative flex h-4 w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
                            </span>
                            Strong Officer Traits
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">

                {/* Theme Breakdown */}
                <div className="bg-white/90 backdrop-blur-md shadow-card rounded-3xl p-8 border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <svg className="w-5 h-5 text-[#F97316]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        Theme Breakdown
                    </h3>
                    <div className="space-y-5">
                        {themes.map((theme) => (
                            <div key={theme.name}>
                                <div className="flex justify-between mb-1 text-sm font-medium text-gray-700">
                                    <span>{theme.name}</span>
                                    <span>{theme.score}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-orange-400 to-[#F97316] h-full rounded-full transition-all duration-1000"
                                        style={{ width: `${theme.score}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Behavioral Indicators */}
                    <div className="bg-white/90 backdrop-blur-md shadow-card rounded-3xl p-8 border border-gray-100 h-full">
                        <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                            <svg className="w-5 h-5 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Behavioral Indicators
                        </h3>
                        <ul className="space-y-3">
                            {indicators.map((indicator, idx) => (
                                <li key={idx} className="flex items-start gap-3 text-gray-700 bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                                    <span className="text-[#10B981] mt-0.5">•</span>
                                    {indicator}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Improvement Suggestions */}
                <div className="space-y-8 md:col-span-2">
                    <div className="bg-white/90 backdrop-blur-md shadow-card rounded-3xl p-8 border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                            <svg className="w-5 h-5 text-[#FBBF24]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            Improvement Suggestions
                        </h3>
                        <ul className="space-y-3 grid md:grid-cols-3 gap-4">
                            {suggestions.map((sugg, idx) => (
                                <li key={idx} className="flex items-start gap-3 text-gray-700 bg-orange-50/30 p-3 rounded-lg border border-orange-50/50">
                                    <span className="text-[#FBBF24] mt-0.5">•</span>
                                    {sugg}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

            </div>

            {/* Action Buttons */}
            <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-4 justify-center mt-10">
                <button
                    onClick={onRetake}
                    className="px-10 py-4 rounded-full border-2 border-gray-900 text-gray-900 font-bold text-sm hover:bg-gray-900 hover:text-white transition-all hover:-translate-y-0.5 text-center"
                >
                    <i className="fa-solid fa-rotate-right mr-2"></i> Retake Test
                </button>
                <Link
                    href="/practice"
                    className="px-10 py-4 rounded-full bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 transition-all hover:-translate-y-0.5 text-center shadow-xl hover:shadow-orange-500/40"
                >
                    <i className="fa-solid fa-dumbbell mr-2"></i> Go to Practice
                </Link>
                <Link
                    href="/dashboard"
                    className="px-10 py-4 rounded-full bg-gray-50 border-2 border-gray-200 text-gray-900 font-bold text-sm hover:border-gray-900 transition-all hover:-translate-y-0.5 text-center"
                >
                    <i className="fa-solid fa-house mr-2"></i> Go to Dashboard
                </Link>
            </div>

        </div>
    );
}
