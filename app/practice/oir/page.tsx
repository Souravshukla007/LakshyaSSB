import React from 'react';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import { ArrowRight, Clock, BookOpen, Brain, Target, ShieldCheck } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const CATEGORIES = [
    { file: 'oir_analogy.json', name: 'Analogy' },
    { file: 'oir_CodeDe.json', name: 'Coding-Decoding' },
    { file: 'oir_Dice.json', name: 'Dice Problems' },
    { file: 'oir_dictonary.json', name: 'Dictionary Order' },
    { file: 'oir_number.json', name: 'Number Pattern' },
    { file: 'oir_odd.json', name: 'Odd One Out' },
    { file: 'oir_Rank.json', name: 'Rank Problems' },
    { file: 'oir_rearrange.json', name: 'Sentence Rearrangement' },
    { file: 'oir_sym.json', name: 'Synonym Replacement' },
    { file: 'oir_wordProb.json', name: 'Arithmetic Word Problems' }
];

async function getExampleQuestions() {
    const examples: any[] = [];

    for (const { file, name } of CATEGORIES) {
        try {
            const filePath = path.join(process.cwd(), file);
            if (fs.existsSync(filePath)) {
                const fileContent = fs.readFileSync(filePath, 'utf-8');
                const questions = JSON.parse(fileContent);
                if (Array.isArray(questions) && questions.length > 0) {
                    examples.push({
                        categoryName: name,
                        ...questions[0]
                    });
                }
            }
        } catch (err) {
            console.error(`Error loading example from ${file}`, err);
        }
    }

    return examples;
}

export default async function OIRIntroPage() {
    const examples = await getExampleQuestions();

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-[#fafaf9] flex flex-col items-center pb-24 pt-32">

                {/* Hero Section */}
                <section className="w-full max-w-5xl px-6 pb-16 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 text-sm font-bold text-brand-orange border border-brand-orange/20 bg-brand-orange/5 rounded-full">
                        <Clock className="w-4 h-4" />
                        <span>⏱ Timed Practice Test</span>
                    </div>
                    <h1 className="font-hero font-bold text-4xl md:text-5xl lg:text-6xl text-brand-dark mb-6 text-balance">
                        OIR Intelligence <span className="text-brand-orange">Test</span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed font-noname">
                        Practice Intelligence and Reasoning similar to the real SSB Screening Test. Master verbal and non-verbal challenges under time pressure.
                    </p>
                </section>

                {/* Start CTA Card */}
                <section className="w-full max-w-2xl px-6 mb-24">
                    <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl border border-gray-100 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-brand-orange/5 rounded-bl-[100px] -z-0"></div>

                        <div className="relative z-10 w-full flex flex-col items-center">
                            <h2 className="text-3xl font-hero font-bold text-brand-dark mb-8">Practice Full OIR Test</h2>

                            <ul className="text-left space-y-5 mb-10 text-gray-600 font-noname text-lg">
                                <li className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange">
                                        <Target className="w-5 h-5" />
                                    </div>
                                    <span className="font-bold">Randomized question set</span>
                                </li>
                                <li className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange">
                                        <Brain className="w-5 h-5" />
                                    </div>
                                    <span className="font-bold">35 to 50 questions</span>
                                </li>
                                <li className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <span className="font-bold">Real SSB time pressure (3 Q per min)</span>
                                </li>
                                <li className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange">
                                        <BookOpen className="w-5 h-5" />
                                    </div>
                                    <span className="font-bold">Mixed reasoning categories</span>
                                </li>
                            </ul>

                            <Link href="/practice/oir/test" className="w-full">
                                <button className="w-full bg-brand-dark text-white hover:bg-brand-orange transition-colors py-5 px-8 rounded-full font-bold text-lg flex items-center justify-center gap-3 shadow-xl">
                                    Start OIR Test
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Examples Section */}
                <section className="w-full max-w-6xl px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-hero font-bold text-brand-dark mb-4">Question Type Examples</h2>
                        <p className="text-gray-500 max-w-2xl mx-auto font-noname text-lg">
                            Review the types of questions you will encounter during the test. Each requires different logic and reasoning capabilities.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {examples.map((ex, idx) => (
                            <div key={idx} className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover:border-brand-orange/30 transition-colors">
                                <div className="inline-block px-4 py-1.5 mb-6 text-xs font-bold text-brand-orange bg-brand-orange/10 rounded-lg uppercase tracking-wider">
                                    {ex.categoryName}
                                </div>

                                <p className="text-xl font-hero font-bold text-brand-dark mb-8 leading-relaxed">
                                    {ex.question}
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                    {ex.options?.map((opt: string, i: number) => {
                                        const isCorrect = opt === ex.answer;
                                        return (
                                            <div
                                                key={i}
                                                className={`p-4 rounded-2xl border text-sm font-bold flex items-center gap-4 transition-colors
                          ${isCorrect
                                                        ? 'border-green-200 bg-green-50 text-green-900'
                                                        : 'border-gray-100 bg-gray-50 text-gray-500'
                                                    }`}
                                            >
                                                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shadow-sm
                          ${isCorrect ? 'bg-green-500 text-white border-transparent' : 'bg-white border border-gray-200'}
                        `}>
                                                    {String.fromCharCode(65 + i)}
                                                </span>
                                                {opt}
                                                {isCorrect && <ShieldCheck className="w-5 h-5 ml-auto text-green-500" />}
                                            </div>
                                        );
                                    })}
                                </div>

                                {ex.explanation && (
                                    <div className="p-6 bg-brand-orange/5 rounded-2xl border border-brand-orange/10">
                                        <h4 className="text-xs font-bold text-brand-orange uppercase tracking-widest mb-2">Explanation</h4>
                                        <p className="text-sm text-brand-dark font-noname leading-relaxed">
                                            {ex.explanation}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

            </div>
            <Footer />
        </>
    );
}
