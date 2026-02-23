'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// ─── Types ───────────────────────────────────────────────────────────────────
interface EligibilityForm {
    age: string;
    gender: string;
    education: string;
    pcmPercentage: string;
    graduationPercentage: string;
    jeeMains: string;
    clatScore: string;
    nccC: string;
}

interface EntryResult {
    name: string;
    fullName: string;
    eligible: boolean;
    reason: string;
    icon: string;
}

// ─── Eligibility logic ────────────────────────────────────────────────────────
function checkEligibility(form: EligibilityForm): EntryResult[] {
    const age = parseFloat(form.age);
    const pcm = parseFloat(form.pcmPercentage) || 0;
    const jee = parseFloat(form.jeeMains) || 0;
    const clat = parseFloat(form.clatScore) || 0;
    const isMale = form.gender === 'male';
    const edu = form.education;
    const hasNCC = form.nccC === 'yes';

    const results: EntryResult[] = [];

    // NDA – Male, 10+2 PCM, age 16.5–19.5
    results.push({
        name: 'NDA',
        fullName: 'National Defence Academy',
        icon: '⚔️',
        eligible: isMale && edu === '12th' && age >= 16.5 && age <= 19.5 && pcm >= 60,
        reason:
            isMale && edu === '12th' && age >= 16.5 && age <= 19.5 && pcm >= 60
                ? 'Male, 10+2 PCM, age & percentage criteria met. Appear for UPSC NDA written exam.'
                : !isMale
                    ? 'NDA is open to male candidates only.'
                    : edu !== '12th'
                        ? 'Requires 10+2 (Class XII) as minimum education.'
                        : age < 16.5 || age > 19.5
                            ? `Age limit: 16.5–19.5 years. Your age: ${age} years.`
                            : 'PCM percentage should be ≥ 60% (indicative threshold).',
    });

    // IMA – Male, Graduate, age 19–24
    results.push({
        name: 'IMA (CDS)',
        fullName: 'Indian Military Academy via CDS',
        icon: '🎖️',
        eligible: isMale && (edu === 'graduate' || edu === 'engineering' || edu === 'llb') && age >= 19 && age <= 24,
        reason:
            isMale && (edu === 'graduate' || edu === 'engineering' || edu === 'llb') && age >= 19 && age <= 24
                ? 'Eligible. Appear for UPSC Combined Defence Services (CDS) written exam.'
                : !isMale
                    ? 'IMA via CDS is open to male candidates only.'
                    : !(edu === 'graduate' || edu === 'engineering' || edu === 'llb')
                        ? 'Requires graduation or equivalent degree.'
                        : `Age limit: 19–24 years. Your age: ${age} years.`,
    });

    // SSC (NT) – Male/Female, Graduate, age 19–25
    results.push({
        name: 'SSC (NT)',
        fullName: 'Short Service Commission (Non-Technical)',
        icon: '🪖',
        eligible: (edu === 'graduate' || edu === 'engineering' || edu === 'llb') && age >= 19 && age <= 25,
        reason:
            (edu === 'graduate' || edu === 'engineering' || edu === 'llb') && age >= 19 && age <= 25
                ? 'Eligible. Appear for UPSC CDS written exam (SSC NT entry).'
                : !(edu === 'graduate' || edu === 'engineering' || edu === 'llb')
                    ? 'Requires graduation or equivalent degree.'
                    : `Age limit for SSC NT: 19–25 years. Your age: ${age} years.`,
    });

    // TES – Male, 10+2 PCM, age 16.5–19.5
    results.push({
        name: 'TES',
        fullName: 'Technical Entry Scheme (10+2)',
        icon: '⚙️',
        eligible: isMale && edu === '12th' && age >= 16.5 && age <= 19.5 && pcm >= 70,
        reason:
            isMale && edu === '12th' && age >= 16.5 && age <= 19.5 && pcm >= 70
                ? jee > 0
                    ? `JEE Mains score (${jee}) taken into account for shortlisting. Eligible – no written exam, SSB directly.`
                    : 'PCM ≥ 70% & JEE Mains score required for shortlisting. No separate written exam.'
                : !isMale
                    ? 'TES is open to male candidates only.'
                    : edu !== '12th'
                        ? 'Requires 10+2 (Class XII) with PCM.'
                        : age < 16.5 || age > 19.5
                            ? `Age limit: 16.5–19.5 years. Your age: ${age} years.`
                            : 'PCM percentage should be ≥ 70%.',
    });

    // TGC – Male, Engineering, age 20–27
    results.push({
        name: 'TGC',
        fullName: 'Technical Graduate Course',
        icon: '🔧',
        eligible: isMale && edu === 'engineering' && age >= 20 && age <= 27,
        reason:
            isMale && edu === 'engineering' && age >= 20 && age <= 27
                ? 'Eligible. Engineering graduates directly called based on marks. No written exam.'
                : !isMale
                    ? 'TGC is open to male candidates only.'
                    : edu !== 'engineering'
                        ? 'Requires an Engineering degree (B.Tech/B.E.).'
                        : `Age limit: 20–27 years. Your age: ${age} years.`,
    });

    // SSC (Tech) – Male/Female, Engineering, age 20–27
    results.push({
        name: 'SSC (Tech)',
        fullName: 'Short Service Commission (Technical)',
        icon: '💻',
        eligible: edu === 'engineering' && age >= 20 && age <= 27,
        reason:
            edu === 'engineering' && age >= 20 && age <= 27
                ? 'Eligible. Engineering marks based shortlisting. No written exam.'
                : edu !== 'engineering'
                    ? 'Requires an Engineering degree (B.Tech/B.E.).'
                    : `Age limit: 20–27 years. Your age: ${age} years.`,
    });

    // SSC (JAG) – Male/Female, LLB, age 21–27
    results.push({
        name: 'SSC (JAG)',
        fullName: 'Short Service Commission (Judge Advocate General)',
        icon: '⚖️',
        eligible: edu === 'llb' && age >= 21 && age <= 27,
        reason:
            edu === 'llb' && age >= 21 && age <= 27
                ? clat > 0
                    ? `CLAT score (${clat}) considered for shortlisting. Eligible.`
                    : 'LLB with valid CLAT score required for shortlisting. Eligible.'
                : edu !== 'llb'
                    ? 'Requires LLB degree (Law graduate).'
                    : `Age limit: 21–27 years. Your age: ${age} years.`,
    });

    // SSC (NCC) – All, Graduate + NCC C, age 19–25
    results.push({
        name: 'SSC (NCC)',
        fullName: 'Short Service Commission (NCC Special Entry)',
        icon: '🏅',
        eligible: (edu === 'graduate' || edu === 'engineering' || edu === 'llb') && age >= 19 && age <= 25 && hasNCC,
        reason:
            (edu === 'graduate' || edu === 'engineering' || edu === 'llb') && age >= 19 && age <= 25 && hasNCC
                ? 'NCC C Certificate holder. Direct SSB – no written exam. Eligible.'
                : !hasNCC
                    ? 'Requires NCC C Certificate (Army Wing, B or A grade).'
                    : !(edu === 'graduate' || edu === 'engineering' || edu === 'llb')
                        ? 'Requires graduation or equivalent degree.'
                        : `Age limit: 19–25 years. Your age: ${age} years.`,
    });

    return results;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SSBEntryNavigatorPage() {
    const router = useRouter();
    const [form, setForm] = useState<EligibilityForm>({
        age: '',
        gender: '',
        education: '',
        pcmPercentage: '',
        graduationPercentage: '',
        jeeMains: '',
        clatScore: '',
        nccC: 'no',
    });
    const [results, setResults] = useState<EntryResult[] | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null); // null = loading

    // ── Check session once on mount ──────────────────────────────────────────
    useEffect(() => {
        fetch('/api/auth/session')
            .then(r => r.json())
            .then(data => setIsLoggedIn(!!data.user))
            .catch(() => setIsLoggedIn(false));
    }, []);

    // ── Auth guard: run fn if logged in, else redirect to /auth ──────────────
    const requireAuth = useCallback(
        (fn: () => void) => {
            if (isLoggedIn === null) return; // still loading, ignore
            if (!isLoggedIn) {
                router.push('/auth');
            } else {
                fn();
            }
        },
        [isLoggedIn, router]
    );

    const handleCheck = () => {
        if (!form.age || !form.gender || !form.education) return;
        requireAuth(() => setResults(checkEligibility(form)));
    };

    const eligibleCount = results?.filter(r => r.eligible).length ?? 0;

    return (
        <>
            <Navbar />

            <main
                className="min-h-screen pt-24 pb-20 px-4 md:px-8"
                style={{
                    background: '#FBF8F3',
                    backgroundImage: `
            linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)
          `,
                    backgroundSize: '40px 40px',
                }}
            >
                <div className="max-w-6xl mx-auto space-y-16">

                    {/* ════════════════════════════════════
              PAGE HEADER
          ════════════════════════════════════ */}
                    <section className="text-center space-y-4 pt-6">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-100 text-orange-600 rounded-full text-xs font-bold uppercase tracking-widest mb-2">
                            <i className="fa-solid fa-compass text-[10px]" />
                            Career Guidance
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight">
                            SSB Entry <span className="text-orange-500">Navigator™</span>
                        </h1>
                        <p className="text-gray-500 text-lg md:text-xl max-w-2xl mx-auto">
                            Discover which Indian Defence officer entries you are eligible for.
                        </p>
                    </section>

                    {/* ════════════════════════════════════
              SECTION 1 — PROCESS OVERVIEW
          ════════════════════════════════════ */}
                    <section>
                        <div className="text-center mb-8">
                            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">The Stage Selection System</h2>
                            <p className="text-gray-500 mt-2 text-sm">From notification to academy — here is how every Defence officer is selected.</p>
                        </div>

                        {/* Flow: cards + arrows as siblings in the same row */}
                        <div className="flex flex-col md:flex-row items-center md:items-stretch gap-3 md:gap-0">
                            {[
                                { icon: 'fa-bell', color: 'bg-purple-100 text-purple-600', ring: 'hover:border-purple-200 hover:shadow-purple-100', title: 'Notification & Application', time: '12–09 Months', desc: 'Entry notification released; candidates apply online.', step: '00' },
                                { icon: 'fa-pen-nib', color: 'bg-blue-100 text-blue-600', ring: 'hover:border-blue-200 hover:shadow-blue-100', title: 'Stage 1 – Written Test', time: 'UPSC / JEE / Degree Filter', desc: 'UPSC exam, JEE Mains, degree marks, or CLAT score depending on entry.', step: '01' },
                                { icon: 'fa-brain', color: 'bg-orange-100 text-orange-600', ring: 'hover:border-orange-200 hover:shadow-orange-100', title: 'Stage 2 – SSB Personality Test', time: '5 Days at Selection Centre', desc: 'Officer Intelligence Rating, Psychological, Group Tasks, Personal Interview.', step: '02' },
                                { icon: 'fa-stethoscope', color: 'bg-red-100 text-red-600', ring: 'hover:border-red-200 hover:shadow-red-100', title: 'Stage 3 – Medical Board', time: 'At Service Hospital', desc: 'Medically fit candidates proceed to merit list.', step: '03' },
                                { icon: 'fa-flag', color: 'bg-green-100 text-green-600', ring: 'hover:border-green-200 hover:shadow-green-100', title: 'Merit List & Academy Joining', time: 'Final Step', desc: 'Merit list released. Selected candidates join NDA/NA, IMA, OTA, AFA or INA.', step: '04' },
                            ].map((step, i, arr) => (
                                // Each step renders the CARD + the ARROW (if not last) as a flat row pair
                                <div key={i} className="flex flex-row md:flex-row items-center flex-1 w-full md:w-auto min-w-0">

                                    {/* ── Card ── */}
                                    <div className={`
                                        group flex-1 bg-white/85 backdrop-blur-sm rounded-2xl border border-gray-100
                                        shadow-md p-5 flex flex-col gap-3 min-w-0 h-full
                                        transition-all duration-300
                                        hover:-translate-y-1.5 hover:shadow-xl ${step.ring}
                                        cursor-default
                                    `}>
                                        {/* Step badge */}
                                        <span className="self-start text-[10px] font-black text-gray-300 tracking-widest uppercase">{step.step}</span>

                                        {/* Icon */}
                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0 transition-transform duration-300 group-hover:scale-110 ${step.color}`}>
                                            <i className={`fa-solid ${step.icon}`} />
                                        </div>

                                        {/* Text */}
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm leading-tight">{step.title}</p>
                                            <p className="text-orange-500 text-xs font-semibold mt-0.5">{step.time}</p>
                                            <p className="text-gray-500 text-xs mt-1.5 leading-relaxed">{step.desc}</p>
                                        </div>
                                    </div>

                                    {/* ── Arrow (between cards, not below them) ── */}
                                    {i < arr.length - 1 && (
                                        <div className="flex items-center justify-center shrink-0 px-2 md:px-1.5">
                                            {/* Always right-pointing on desktop, down on mobile column layout */}
                                            <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center shadow-sm">
                                                <i className="fa-solid fa-chevron-right text-orange-500 text-xs" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ════════════════════════════════════
              SECTION 2 — UPSC vs Non-UPSC
          ════════════════════════════════════ */}
                    <section>
                        <div className="text-center mb-8">
                            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">UPSC vs Non-UPSC Entries</h2>
                            <p className="text-gray-500 mt-2 text-sm">Two distinct pathways for becoming an officer in the Defence Forces.</p>
                        </div>

                        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-md overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100">
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider w-1/4">Criteria</th>
                                            <th className="px-6 py-4 text-left">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-[10px] font-bold">U</span>
                                                    <span className="font-bold text-gray-900 text-sm">UPSC Entries</span>
                                                </div>
                                            </th>
                                            <th className="px-6 py-4 text-left">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-white text-[10px] font-bold">N</span>
                                                    <span className="font-bold text-gray-900 text-sm">Non-UPSC Entries</span>
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {[
                                            { label: '🌐 Website', upsc: 'upsc.gov.in', nonUpsc: 'joinindianarmy.nic.in' },
                                            { label: '📅 Notification', upsc: 'Bi-annual (May & Nov)', nonUpsc: 'Quarterly / As required' },
                                            { label: '🎓 Course Start', upsc: 'Jan & Jul (IMA), Apr & Oct (OTA)', nonUpsc: 'Jan / Apr / Jul / Oct (varies)' },
                                            { label: '📝 Application Window', upsc: '3–4 weeks (UPSC portal)', nonUpsc: '3–6 weeks (joinindianarmy.nic.in)' },
                                            { label: '✍️ Written Exam', upsc: 'UPSC Written (mandatory)', nonUpsc: 'Not required (JEE/marks/CLAT based)' },
                                            { label: '📋 Entries', upsc: 'NDA, CDS (IMA, OTA, AFA)', nonUpsc: 'TES, TGC, SSC(T), SSC(JAG), SSC(NCC)' },
                                        ].map((row, i) => (
                                            <tr key={i} className="hover:bg-gray-50/80 transition-colors">
                                                <td className="px-6 py-4 text-gray-500 font-semibold text-xs">{row.label}</td>
                                                <td className="px-6 py-4 text-gray-700 text-sm">{row.upsc}</td>
                                                <td className="px-6 py-4 text-gray-700 text-sm">{row.nonUpsc}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>

                    {/* ════════════════════════════════════
              SECTION 3 — WRITTEN TEST QUALIFICATION
          ════════════════════════════════════ */}
                    <section>
                        <div className="text-center mb-8">
                            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">Stage 1 – Written Qualification Criteria</h2>
                            <p className="text-gray-500 mt-2 text-sm">How candidates are shortlisted before appearing for SSB.</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* UPSC Card */}
                            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-md overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-bold">U</span>
                                        <h3 className="font-bold text-gray-900">UPSC Entries</h3>
                                    </div>
                                    <span className="text-xs bg-orange-50 text-orange-600 font-bold px-3 py-1 rounded-full">Shortlist 1:20</span>
                                </div>
                                <div className="p-6 space-y-3">
                                    {[
                                        { entry: 'NDA', filter: 'UPSC Written Exam', note: 'Maths + GAT paper' },
                                        { entry: 'IMA (CDS)', filter: 'UPSC Written Exam', note: 'English + GK + Maths' },
                                        { entry: 'SSC (NT)', filter: 'UPSC Written Exam', note: 'CDS Written (no Maths)' },
                                    ].map((row, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-orange-50/60 rounded-xl border border-orange-100">
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm">{row.entry}</p>
                                                <p className="text-gray-400 text-xs">{row.note}</p>
                                            </div>
                                            <span className="text-xs font-semibold text-orange-600 bg-white px-2.5 py-1 rounded-lg border border-orange-200">{row.filter}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Non-UPSC Card */}
                            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-md overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-xl bg-gray-900 flex items-center justify-center text-white text-xs font-bold">N</span>
                                        <h3 className="font-bold text-gray-900">Non-UPSC Entries</h3>
                                    </div>
                                    <span className="text-xs bg-gray-100 text-gray-600 font-bold px-3 py-1 rounded-full">Shortlist 1:100</span>
                                </div>
                                <div className="p-6 space-y-3">
                                    {[
                                        { entry: 'TES', filter: 'JEE Mains Score', note: '10+2 PCM + JEE rank' },
                                        { entry: 'TGC', filter: 'Engineering Marks', note: 'B.Tech/B.E. aggregate' },
                                        { entry: 'SSC (Tech)', filter: 'Engineering Marks', note: 'B.Tech/B.E. aggregate' },
                                        { entry: 'SSC (JAG)', filter: 'CLAT Score', note: 'LLB graduates' },
                                        { entry: 'SSC (NCC)', filter: 'Graduation + NCC C', note: 'Direct SSB, no written' },
                                    ].map((row, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm">{row.entry}</p>
                                                <p className="text-gray-400 text-xs">{row.note}</p>
                                            </div>
                                            <span className="text-xs font-semibold text-gray-700 bg-white px-2.5 py-1 rounded-lg border border-gray-200">{row.filter}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Shortlisting ratio banner */}
                        <div className="mt-6 grid sm:grid-cols-2 gap-4">
                            <div className="flex items-center gap-4 bg-orange-50 border border-orange-100 rounded-2xl px-5 py-4">
                                <i className="fa-solid fa-filter text-orange-500 text-xl" />
                                <div>
                                    <p className="font-bold text-gray-900">UPSC Shortlisting</p>
                                    <p className="text-orange-600 font-extrabold text-2xl">1 : 20</p>
                                    <p className="text-gray-400 text-xs">1 candidate per every 20 who appear for SSB</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4">
                                <i className="fa-solid fa-filter text-gray-600 text-xl" />
                                <div>
                                    <p className="font-bold text-gray-900">Non-UPSC Shortlisting</p>
                                    <p className="text-gray-800 font-extrabold text-2xl">1 : 100</p>
                                    <p className="text-gray-400 text-xs">Higher competition; merit-based cutoffs apply</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ════════════════════════════════════
              SECTION 4 — ELIGIBILITY CALCULATOR
          ════════════════════════════════════ */}
                    <section>
                        <div className="text-center mb-8">
                            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">Find Your Eligible Entries</h2>
                            <p className="text-gray-500 mt-2 text-sm">Fill in your profile and instantly see which entries you qualify for.</p>
                        </div>

                        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-md p-8 md:p-10">
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">

                                {/* Age */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Age (years)</label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 19"
                                        min={15}
                                        max={30}
                                        value={form.age}
                                        onChange={e => setForm({ ...form, age: e.target.value })}
                                        suppressHydrationWarning
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
                                    />
                                </div>

                                {/* Gender */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Gender</label>
                                    <select
                                        value={form.gender}
                                        onChange={e => setForm({ ...form, gender: e.target.value })}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition appearance-none"
                                    >
                                        <option value="">Select gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                    </select>
                                </div>

                                {/* Education */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Education Level</label>
                                    <select
                                        value={form.education}
                                        onChange={e => setForm({ ...form, education: e.target.value })}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition appearance-none"
                                    >
                                        <option value="">Select education</option>
                                        <option value="12th">10+2 (Class XII)</option>
                                        <option value="graduate">Graduate (Any Stream)</option>
                                        <option value="engineering">Engineering (B.Tech/B.E.)</option>
                                        <option value="llb">LLB (Law Graduate)</option>
                                    </select>
                                </div>

                                {/* PCM % */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">PCM Percentage (%)</label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 75"
                                        min={0}
                                        max={100}
                                        value={form.pcmPercentage}
                                        onChange={e => setForm({ ...form, pcmPercentage: e.target.value })}
                                        suppressHydrationWarning
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
                                    />
                                </div>

                                {/* Graduation % */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Graduation Percentage (%)</label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 65"
                                        min={0}
                                        max={100}
                                        value={form.graduationPercentage}
                                        onChange={e => setForm({ ...form, graduationPercentage: e.target.value })}
                                        suppressHydrationWarning
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
                                    />
                                </div>

                                {/* JEE Mains */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        JEE Mains Score <span className="text-gray-400 font-normal normal-case">(optional)</span>
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 120"
                                        min={0}
                                        max={300}
                                        value={form.jeeMains}
                                        onChange={e => setForm({ ...form, jeeMains: e.target.value })}
                                        suppressHydrationWarning
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
                                    />
                                </div>

                                {/* CLAT */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        CLAT Score <span className="text-gray-400 font-normal normal-case">(optional)</span>
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 95"
                                        min={0}
                                        max={120}
                                        value={form.clatScore}
                                        onChange={e => setForm({ ...form, clatScore: e.target.value })}
                                        suppressHydrationWarning
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
                                    />
                                </div>

                                {/* NCC C Certificate */}
                                <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">NCC C Certificate</label>
                                    <div className="flex gap-3">
                                        {['yes', 'no'].map(val => (
                                            <button
                                                key={val}
                                                onClick={() => setForm({ ...form, nccC: val })}
                                                className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${form.nccC === val
                                                    ? val === 'yes'
                                                        ? 'bg-green-500 text-white border-green-500 shadow-md'
                                                        : 'bg-gray-800 text-white border-gray-800 shadow-md'
                                                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                {val === 'yes' ? '✅ Yes, I have it' : '❌ No'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Submit button */}
                            <div className="mt-8 flex justify-center">
                                <button
                                    onClick={handleCheck}
                                    disabled={!form.age || !form.gender || !form.education}
                                    className="inline-flex items-center gap-3 bg-gray-900 text-white px-10 py-4 rounded-2xl font-bold text-base hover:opacity-90 transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <i className="fa-solid fa-magnifying-glass text-orange-400" />
                                    Check Eligibility
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* ════════════════════════════════════
              RESULTS SECTION
          ════════════════════════════════════ */}
                    {results && (
                        <section>
                            <div className="text-center mb-8">
                                <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">You Are Eligible For:</h2>
                                <div className="mt-3 flex items-center justify-center gap-3">
                                    {eligibleCount > 0 ? (
                                        <span className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-bold">
                                            <i className="fa-solid fa-circle-check text-xs" />
                                            {eligibleCount} entr{eligibleCount === 1 ? 'y' : 'ies'} found
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-2 bg-red-100 text-red-600 px-4 py-1.5 rounded-full text-sm font-bold">
                                            <i className="fa-solid fa-circle-xmark text-xs" />
                                            No entries matched your profile
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                {results.map((entry, i) => (
                                    <div
                                        key={i}
                                        className={`relative bg-white/80 backdrop-blur-sm rounded-2xl border shadow-md p-5 flex flex-col gap-3 transition-all duration-300 hover:-translate-y-1 ${entry.eligible
                                            ? 'border-green-200 shadow-green-100/60'
                                            : 'border-gray-100 opacity-75'
                                            }`}
                                    >
                                        {/* Status badge */}
                                        <div className={`absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm ${entry.eligible ? 'bg-green-500' : 'bg-red-400'}`}>
                                            {entry.eligible ? '✓' : '✗'}
                                        </div>

                                        {/* Icon & name */}
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${entry.eligible ? 'bg-green-50' : 'bg-gray-100'}`}>
                                            {entry.icon}
                                        </div>

                                        <div>
                                            <p className="font-extrabold text-gray-900 text-base">{entry.name}</p>
                                            <p className="text-gray-400 text-xs leading-tight">{entry.fullName}</p>
                                        </div>

                                        {/* Status label */}
                                        <span className={`self-start text-xs font-bold px-2.5 py-1 rounded-lg ${entry.eligible
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-red-50 text-red-500'
                                            }`}>
                                            {entry.eligible ? '✅ Eligible' : '❌ Not Eligible'}
                                        </span>

                                        {/* Reason */}
                                        <p className="text-gray-500 text-xs leading-relaxed">{entry.reason}</p>
                                    </div>
                                ))}
                            </div>

                            {/* CTA */}
                            {eligibleCount > 0 && (
                                <div className="relative overflow-hidden rounded-3xl bg-gray-900 shadow-2xl px-8 py-10 text-center">
                                    <div className="absolute -top-10 -left-10 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
                                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
                                    <div className="relative z-10 space-y-4">
                                        <p className="text-orange-400 text-xs font-bold uppercase tracking-widest">Next Step</p>
                                        <h3 className="text-2xl md:text-3xl font-extrabold text-white">
                                            Start Preparation for <span className="text-orange-500">Selected Entry</span>
                                        </h3>
                                        <p className="text-gray-400 text-sm max-w-lg mx-auto">
                                            Our structured modules cover PIQ, Leaderboard coaching, OLQ reports, and daily practice — everything you need to crack SSB.
                                        </p>
                                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4">
                                            <button
                                                onClick={() => requireAuth(() => router.push('/practice'))}
                                                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white px-8 py-3.5 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-orange-900/30"
                                            >
                                                <i className="fa-solid fa-dumbbell text-xs" />
                                                Start Practice Now
                                            </button>
                                            <button
                                                onClick={() => requireAuth(() => router.push('/piq-builder'))}
                                                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-8 py-3.5 rounded-2xl font-semibold text-sm transition-all"
                                            >
                                                <i className="fa-solid fa-clipboard-list text-xs" />
                                                Build Your PIQ
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </section>
                    )}

                </div>
            </main>

            <Footer />
        </>
    );
}
