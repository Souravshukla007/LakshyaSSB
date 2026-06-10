'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function FeedbackPage() {
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [userType, setUserType] = useState('');
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
    const [improvement, setImprovement] = useState('');
    const [featureRequest, setFeatureRequest] = useState('');
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const featuresList = [
        'OIR Practice',
        'WAT Practice',
        'TAT Practice',
        'SRT Practice',
        'Lecturette Trainer',
        'SSB Entry Navigator',
        'Group Planning Exercise',
        'Medical Simulator',
    ];

    const quickChips = [
        'Improve OIR practice',
        'Add GTO tasks',
        'Mobile app version',
        'More psychology tests',
        'AI evaluation',
    ];

    const toggleFeature = (f: string) => {
        if (selectedFeatures.includes(f)) {
            setSelectedFeatures(selectedFeatures.filter(item => item !== f));
        } else {
            setSelectedFeatures([...selectedFeatures, f]);
        }
    };

    const handleChipClick = (chip: string) => {
        setFeatureRequest(prev => prev ? `${prev}\n${chip}` : chip);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        
        if (!userType) {
            setErrorMsg('Please select a user type.');
            return;
        }
        if (rating === 0) {
            setErrorMsg('Please provide a rating.');
            return;
        }
        if (!improvement.trim() && !featureRequest.trim()) {
            setErrorMsg('Please share at least one improvement or feature request.');
            return;
        }

        setIsSubmitting(true);
        try {
            const suggestion = `Improvement: ${improvement}\n\nFeature Request: ${featureRequest}`.trim();

            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    email,
                    userType,
                    rating,
                    features: selectedFeatures,
                    suggestion,
                    isAnonymous
                })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to submit feedback');
            }

            setIsSubmitted(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err: any) {
            setErrorMsg(err.message || 'An unexpected error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen flex flex-col pt-28 pb-20 bg-[#FBF8F3] px-4 md:px-8 selection:bg-orange-200">
                <main className="flex-1 max-w-2xl mx-auto w-full flex items-center justify-center animate-fadeIn">
                    <div className="bg-white p-10 md:p-14 rounded-[2.5rem] shadow-xl border border-gray-100 text-center w-full">
                        <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
                            <i className="fa-solid fa-check" />
                        </div>
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">Feedback Received!</h2>
                        <p className="text-gray-500 mb-8 max-w-md mx-auto text-lg leading-relaxed">
                            Thank you for helping improve LakshyaSSB. Your input directly shapes our future updates.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/roadmap" className="px-8 py-3.5 bg-orange-50 hover:bg-orange-100 text-orange-600 font-bold rounded-full transition-all text-sm">
                                View Roadmap
                            </Link>
                            <Link href="/dashboard" className="px-8 py-3.5 bg-gray-900 hover:bg-black text-white font-bold rounded-full shadow-md transition-all text-sm">
                                Back to Dashboard
                            </Link>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col pt-28 pb-20 bg-[#FBF8F3] selection:bg-orange-200 relative overflow-hidden">
            {/* Grid bg */}
            <div className="fixed inset-0 pointer-events-none" style={{
                backgroundImage: 'linear-gradient(rgba(0,0,0,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.03) 1px,transparent 1px)',
                backgroundSize: '40px 40px'
            }} />

            <main className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-8 relative z-10 animate-fadeIn">
                
                {/* Hero Section */}
                <div className="text-center mb-10">
                    <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-3">Community Input</p>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
                        Help Us Improve <span className="text-orange-500">LakshyaSSB</span>
                    </h1>
                    <p className="text-gray-500 text-base md:text-lg max-w-xl mx-auto font-medium">
                        Your feedback helps us build the best SSB preparation platform. Your suggestions directly shape upcoming features.
                    </p>
                </div>

                {/* Feedback Form Card */}
                <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-gray-100">
                    <form onSubmit={handleSubmit} className="space-y-8">

                        {/* Anonymous Toggle */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <div>
                                <h3 className="text-sm font-bold text-gray-900">Submit Anonymously</h3>
                                <p className="text-[11px] text-gray-400 mt-0.5">Hide your name and email from this submission.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={isAnonymous} onChange={() => setIsAnonymous(!isAnonymous)} />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                            </label>
                        </div>

                        {/* Personal Info (Hidden if anonymous) */}
                        <div className={`grid md:grid-cols-2 gap-6 transition-all duration-300 ${isAnonymous ? 'opacity-30 pointer-events-none h-0 overflow-hidden m-0 p-0' : 'opacity-100 h-auto'}`}>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">Name (Optional)</label>
                                <input 
                                    type="text" 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="John Doe" 
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent block p-3.5 transition-all outline-none" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">Email (Optional)</label>
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="john@example.com" 
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent block p-3.5 transition-all outline-none" 
                                />
                            </div>
                        </div>

                        {/* User Type */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">I am a...</label>
                            <div className="relative">
                                <select 
                                    value={userType}
                                    onChange={(e) => setUserType(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent block p-3.5 transition-all outline-none appearance-none cursor-pointer"
                                    required
                                >
                                    <option value="" disabled>Select user type</option>
                                    <option value="aspirant">SSB Aspirant</option>
                                    <option value="recommended">Recommended Candidate</option>
                                    <option value="trainer">SSB Trainer</option>
                                    <option value="enthusiast">Defence Enthusiast</option>
                                </select>
                                <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs" />
                            </div>
                        </div>

                        {/* Rating */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-3">Rate your overall experience</label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        className="text-3xl transition-transform hover:scale-110 focus:outline-none"
                                    >
                                        <i className={`fa-star ${star <= (hoverRating || rating) ? 'fa-solid text-orange-500' : 'fa-regular text-gray-200'}`} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <hr className="border-gray-100" />

                        {/* Most Useful Feature Checkboxes */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-4">Most Useful Feature(s)</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {featuresList.map(f => (
                                    <label
                                        key={f}
                                        onClick={() => toggleFeature(f)}
                                        className={`flex items-center p-3.5 rounded-xl border cursor-pointer transition-all select-none ${selectedFeatures.includes(f) ? 'bg-orange-50 border-orange-200 text-orange-800' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        <div className={`w-5 h-5 rounded flex items-center justify-center mr-3 border transition-colors flex-shrink-0 ${selectedFeatures.includes(f) ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-300'}`}>
                                            {selectedFeatures.includes(f) && <i className="fa-solid fa-check text-[10px]" />}
                                        </div>
                                        <span className="text-sm font-medium">{f}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Textareas */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">What should we improve?</label>
                            <textarea 
                                rows={3} 
                                value={improvement}
                                onChange={(e) => setImprovement(e.target.value)}
                                placeholder="Tell us what we can improve..." 
                                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent block p-4 transition-all outline-none resize-none"
                            ></textarea>
                        </div>

                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest">Feature Request</label>
                            </div>
                            <textarea 
                                rows={3} 
                                value={featureRequest}
                                onChange={(e) => setFeatureRequest(e.target.value)}
                                placeholder="What feature would you like us to build next?" 
                                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent block p-4 transition-all outline-none resize-none mb-3"
                            ></textarea>
                            
                            {/* Quick Chips */}
                            <div className="flex flex-wrap gap-2">
                                {quickChips.map(chip => (
                                    <button 
                                        key={chip} 
                                        type="button"
                                        onClick={() => handleChipClick(chip)}
                                        className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[11px] font-bold text-gray-500 hover:border-orange-300 hover:text-orange-600 transition-colors flex items-center gap-1.5"
                                    >
                                        <i className="fa-solid fa-plus text-[9px]" /> {chip}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <hr className="border-gray-100" />

                        {errorMsg && (
                            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100">
                                <i className="fa-solid fa-triangle-exclamation mr-2" /> {errorMsg}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-full font-bold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <><i className="fa-solid fa-spinner fa-spin" /> Submitting...</>
                            ) : (
                                <><i className="fa-solid fa-paper-plane" /> Submit Feedback</>
                            )}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}
