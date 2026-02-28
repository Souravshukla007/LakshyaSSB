import React from 'react';

type SrtIntroProps = {
    onStart: () => void;
};

export default function SrtIntro({ onStart }: SrtIntroProps) {
    return (
        <div className="max-w-3xl mx-auto w-full animate-fadeIn">
            <div className="bg-white/90 backdrop-blur-md shadow-xl rounded-2xl p-8 md:p-12 border border-orange-100">
                <div className="text-center mb-10">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700">
                        Situation Reaction Test (SRT)
                    </h1>
                    <p className="text-lg text-gray-600 max-w-xl mx-auto">
                        Assess your practical decision-making and officer-like qualities.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-10">
                    <div className="bg-orange-50/50 rounded-xl p-6 border border-orange-100">
                        <h3 className="font-semibold text-gray-900 text-lg mb-4 flex items-center gap-2">
                            <span className="text-[#F97316]">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </span>
                            Test Details
                        </h3>
                        <ul className="space-y-3 text-gray-700">
                            <li className="flex justify-between items-center border-b border-orange-100/50 pb-2">
                                <span className="text-gray-500">Total Questions</span>
                                <span className="font-medium">60</span>
                            </li>
                            <li className="flex justify-between items-center border-b border-orange-100/50 pb-2">
                                <span className="text-gray-500">Time Limit</span>
                                <span className="font-medium text-[#F97316]">30 Minutes</span>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-gray-50/80 rounded-xl p-6 border border-gray-100">
                        <h3 className="font-semibold text-gray-900 text-lg mb-4 flex items-center gap-2">
                            <span className="text-gray-400">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </span>
                            Instructions
                        </h3>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li className="flex items-start gap-2">
                                <span className="text-[#F97316] mt-0.5">•</span>
                                <span>Write short, practical responses.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[#F97316] mt-0.5">•</span>
                                <span>Avoid theory.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[#F97316] mt-0.5">•</span>
                                <span>Focus on action.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[#F97316] mt-0.5">•</span>
                                <span>Be realistic.</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="flex justify-center">
                    <button
                        onClick={onStart}
                        className="bg-black hover:bg-gray-800 text-white font-medium py-4 px-10 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 w-full md:w-auto"
                    >
                        Start SRT Test
                    </button>
                </div>
            </div>
        </div>
    );
}
