'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface PlateData {
    id: number;
    image: string;
    answer: string;
}


export default function ColorVisionTestPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState<'intro' | 'test' | 'result'>('intro');
    const [plateIndex, setPlateIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const [score, setScore] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [colorVisionData, setColorVisionData] = useState<PlateData[]>([]);

    useEffect(() => {
        if (currentStep === 'test' && inputRef.current) {
            inputRef.current.focus();
        }
    }, [currentStep, plateIndex]);

    useEffect(() => {
        if (!colorVisionData.length || !colorVisionData[plateIndex]) return;
        setInputValue(answers[colorVisionData[plateIndex].id] || '');
    }, [plateIndex, answers, currentStep, colorVisionData]);

    const handleStart = async () => {
        // Fetch plates from server-side API (TAT pattern)
        const res = await fetch('/api/medical/color-vision');
        const data = await res.json();
        const plates: PlateData[] = data.plates ?? [];
        setColorVisionData(plates);

        setPlateIndex(0);
        setAnswers({});
        setInputValue('');
        setScore(0);
        setCurrentStep('test');
    };

    const handleNext = () => {
        const currentPlateId = colorVisionData[plateIndex].id;
        const finalValue = inputValue.trim();
        
        const updatedAnswers = { ...answers, [currentPlateId]: finalValue };
        setAnswers(updatedAnswers);

        if (plateIndex < colorVisionData.length - 1) {
            setPlateIndex(prev => prev + 1);
        } else {
            // Calculate score
            let correct = 0;
            colorVisionData.forEach(plate => {
                if (updatedAnswers[plate.id] === plate.answer) {
                    correct++;
                }
            });
            setScore(correct);
            setCurrentStep('result');
            saveResult(correct);
        }
    };

    const handlePrevious = () => {
        if (plateIndex > 0) {
            setPlateIndex(prev => prev - 1);
        }
    };

    const saveResult = async (correct: number) => {
        try {
            setIsSaving(true);
            const total = colorVisionData.length || 1; // guard against divide-by-zero before data loads
            const percentage = (correct / total) * 100;
            let status = 'DEFICIENT';
            if (percentage >= 90) status = 'NORMAL';
            else if (percentage >= 60) status = 'MILD';

            // Self-assessment tool: persist to localStorage for dashboard reading.
            localStorage.setItem('lakshya_color_vision_status', status);
            localStorage.setItem('lakshya_color_vision_score', `${correct}/${total}`);
        } finally {
            setIsSaving(false);
        }
    };

    // Calculate result visual
    const percentage = (score / colorVisionData.length) * 100;
    const resultMeta = percentage >= 90
        ? { label: 'Normal Color Vision', color: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0' }
        : percentage >= 60
            ? { label: 'Possible Mild Color Vision Deficiency', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' }
            : { label: 'Possible Color Vision Deficiency', color: '#ef4444', bg: '#fef2f2', border: '#fecaca' };

    return (
        <div className="min-h-screen bg-[#FBF8F3] pt-28 pb-20 selection:bg-orange-200">
            <main className="max-w-3xl mx-auto px-4 md:px-8 w-full">
                
                {/* Intro Step */}
                {currentStep === 'intro' && (
                    <div className="animate-fadeIn">
                        <div className="mb-10 text-center">
                            <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-3">Medical Screening</p>
                            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
                                Color Vision Test
                            </h1>
                            <p className="text-gray-500 font-medium max-w-xl mx-auto">
                                Check your color perception before SSB medical examination.
                            </p>
                            <p className="text-xs text-gray-400 mt-2 italic">Based on Ishihara-style color vision plates.</p>
                        </div>

                        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-gray-100 max-w-2xl mx-auto">
                            <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center text-2xl mb-6 mx-auto">
                                <i className="fa-solid fa-eye"></i>
                            </div>
                            <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">Test Instructions</h2>
                            
                            <ul className="space-y-4 mb-10 text-gray-600 font-medium text-sm md:text-base">
                                <li className="flex items-start gap-3">
                                    <i className="fa-solid fa-circle-check text-orange-500 mt-1"></i>
                                    <span>You will see a series of colored number plates.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <i className="fa-solid fa-circle-check text-orange-500 mt-1"></i>
                                    <span>Identify the number visible in each plate.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <i className="fa-solid fa-circle-check text-orange-500 mt-1"></i>
                                    <span>Type the number in the box and press Enter. Leave blank if nothing is visible.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <i className="fa-solid fa-circle-check text-orange-500 mt-1"></i>
                                    <span>Complete all plates to see your result.</span>
                                </li>
                            </ul>

                            <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-400 uppercase bg-gray-50 py-3 rounded-xl mb-8">
                                <i className="fa-regular fa-clock"></i> Estimated time: 2–3 minutes
                            </div>

                            <button onClick={handleStart} className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-full font-bold transition-all shadow-md">
                                Start Test
                            </button>
                        </div>
                    </div>
                )}

                {/* Test Step */}
                {currentStep === 'test' && (
                    <div className="animate-fadeIn">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-bold text-gray-900">Plate {plateIndex + 1} / {colorVisionData.length}</h2>
                            <button onClick={() => {
                                if(confirm('Are you sure you want to exit the test?')) {
                                    router.push('/medical');
                                }
                            }} className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors">
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full h-2 bg-gray-200 rounded-full mb-8 overflow-hidden">
                            <div className="h-full bg-orange-500 transition-all duration-300" style={{ width: `${((plateIndex + 1) / colorVisionData.length) * 100}%` }}></div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-sm border border-gray-100 flex flex-col items-center">
                            
                            {/* Ishihara Image */}
                            <div className="w-full max-w-sm aspect-square bg-gray-50 rounded-3xl mb-8 overflow-hidden border border-gray-100 shadow-inner flex items-center justify-center relative p-8">
                                <img src={colorVisionData[plateIndex].image} alt={`Plate ${plateIndex + 1}`} className="w-full h-full object-contain" />
                                <div className="absolute inset-x-0 bottom-4 text-center">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-white/80 px-3 py-1 rounded-full backdrop-blur-sm shadow-sm">{colorVisionData[plateIndex].id}</span>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 mb-6 text-center w-full">What number do you see?</h3>

                            {/* Number Input Box */}
                            <div className="w-full max-w-sm flex flex-col items-center">
                                <input 
                                    ref={inputRef}
                                    type="number"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleNext();
                                        }
                                    }}
                                    placeholder="Enter number..."
                                    className="w-full text-center text-4xl font-black text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-3xl py-6 px-4 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all placeholder:text-gray-300 placeholder:text-2xl"
                                    autoFocus
                                />
                                <p className="mt-4 text-sm text-gray-400 font-medium">Leave blank if you see no number.</p>
                            </div>

                            {/* Navigation */}
                            <div className="flex gap-4 w-full mt-10">
                                <button 
                                    onClick={handlePrevious} 
                                    disabled={plateIndex === 0}
                                    className="flex-1 py-4 bg-white border border-gray-200 text-gray-600 rounded-full font-bold transition-all hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <button 
                                    onClick={handleNext}
                                    className={`flex-1 py-4 rounded-full font-bold transition-all bg-gray-900 text-white hover:bg-black shadow-md`}
                                >
                                    {plateIndex === colorVisionData.length - 1 ? 'Finish' : 'Next'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Result Step */}
                {currentStep === 'result' && (
                    <div className="animate-fadeIn flex flex-col items-center justify-center">
                        <div className="w-full max-w-2xl bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-gray-100 text-center">
                            
                            <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-2">Test Complete</p>
                            <h2 className="text-3xl font-extrabold text-gray-900 mb-8">Color Vision Test Result</h2>

                            <div className="grid grid-cols-2 gap-4 mb-10 w-full max-w-md mx-auto">
                                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                                    <div className="text-4xl font-black text-gray-900 mb-1">{score}</div>
                                    <div className="text-[11px] font-bold text-gray-400 uppercase">Correct</div>
                                </div>
                                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                                    <div className="text-4xl font-black text-gray-900 mb-1">{colorVisionData.length - score}</div>
                                    <div className="text-[11px] font-bold text-gray-400 uppercase">Incorrect</div>
                                </div>
                            </div>

                            <div className="mb-10 text-center rounded-3xl p-6 border transition-colors inline-block w-full max-w-md" style={{ background: resultMeta.bg, borderColor: resultMeta.border }}>
                                <p className="text-[10px] font-bold uppercase tracking-widest mb-2 opacity-70" style={{ color: resultMeta.color }}>Color Vision Status</p>
                                <div className="text-xl md:text-2xl font-bold" style={{ color: resultMeta.color }}>
                                    {resultMeta.label}
                                </div>
                            </div>

                            <p className="text-sm text-gray-500 max-w-sm mx-auto mb-10 font-medium leading-relaxed">
                                {percentage < 90 
                                    ? "This is a screening tool. Please consult an ophthalmologist for a formal diagnosis if you scored below normal."
                                    : "Great! Your color perception is normal according to this screening tool."}
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button onClick={handleStart} className="px-8 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-full transition-all text-sm">
                                    Retake Test
                                </button>
                                <Link href="/dashboard" className="px-8 py-3.5 bg-gray-900 hover:bg-black text-white font-bold rounded-full transition-all text-sm shadow-md">
                                    Go to Dashboard
                                </Link>
                                <Link href="/medical" className="px-8 py-3.5 bg-orange-50 hover:bg-orange-100 text-orange-600 font-bold rounded-full transition-all text-sm">
                                    Medical Hub
                                </Link>
                            </div>
                            
                            {isSaving && <p className="text-xs text-gray-400 mt-6 mt-4"><i className="fa-solid fa-spinner fa-spin mr-2"></i> Saving result...</p>}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
