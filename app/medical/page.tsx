'use client';

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useEffect, useRef, useCallback } from "react";
import type { VisionType, MedicalScoreBreakdown, WeeklyPlan } from "@/lib/medical-score";


// ─── Types ────────────────────────────────────────────────────────────────────
interface ConditionCard {
    id: string;
    label: string;
    icon: string;
    standard: string;
    rejection: string;
    advice: string;
}

interface HistoryEntry {
    id: string;
    bmi: number;
    bmiScore: number;
    visionScore: number;
    conditionScore: number;
    fitnessScore: number;
    medicalScore: number;
    riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
    createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CONDITIONS: ConditionCard[] = [
    {
        id: "vision66",
        label: "Vision 6/6",
        icon: "👁️",
        standard: "Army requires 6/6 in both eyes (correctable to 6/6 with spectacles allowed for some entries).",
        rejection: "Uncorrected vision below 6/24 or colour blindness may result in rejection.",
        advice: "Undergo a Snellen chart test. For mild defects, LASIK is permitted 6 months post-surgery for most entries.",
    },
    {
        id: "flatFoot",
        label: "Flat Foot / Knock Knees",
        icon: "🦶",
        standard: "Medial arch must be present. Knock knee (genu valgum) > 7 cm between ankles while knees touch is disqualifying.",
        rejection: "Grade 3–4 flat foot or severe genu valgum are permanent disqualifiers.",
        advice: "Practice arch-strengthening exercises (towel scrunches, heel raises). Start barefoot walking on grass daily.",
    },
    {
        id: "colorBlind",
        label: "Color Blindness",
        icon: "🎨",
        standard: "Full colour perception required. Tested using Ishihara plates & Lantern tests.",
        rejection: "Any degree of colour blindness is disqualifying for combat roles. Some technical roles may allow partial defects.",
        advice: "No medical correction exists. Consult an ophthalmologist to determine the degree and relevant entry implications.",
    },
    {
        id: "surgery",
        label: "History of Surgery",
        icon: "🏥",
        standard: "Most surgeries require a waiting period of at least 6 months before medical examination.",
        rejection: "Recent surgeries, organ removal, or permanent implants can result in temporary or permanent rejection.",
        advice: "Carry all discharge summaries and operative notes. Disclose all past surgeries honestly; concealment leads to permanent ban.",
    },
];

const STEPS = ["Height & Weight", "Vision & Conditions", "Fitness Performance", "Final Report"];

// ─── Animated Number ──────────────────────────────────────────────────────────
function AnimatedNumber({ value, decimals = 1 }: { value: number; decimals?: number }) {
    const [display, setDisplay] = useState(0);
    const raf = useRef<number | null>(null);

    useEffect(() => {
        const start = display;
        const end = value;
        const duration = 600;
        const startTime = performance.now();
        const step = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            setDisplay(start + (end - start) * ease);
            if (progress < 1) raf.current = requestAnimationFrame(step);
        };
        raf.current = requestAnimationFrame(step);
        return () => { if (raf.current) cancelAnimationFrame(raf.current); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    return <>{display.toFixed(decimals)}</>;
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ pct, color = "#F97316" }: { pct: number; color?: string }) {
    return (
        <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden">
            <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: color }}
            />
        </div>
    );
}

// ─── Step Indicator ───────────────────────────────────────────────────────────
function StepIndicator({ current }: { current: number }) {
    return (
        <div className="w-full mb-10">
            {/* Mobile: compact pills */}
            <div className="flex items-center gap-1 sm:hidden">
                {STEPS.map((_, i) => (
                    <div
                        key={i}
                        className="flex-1 h-1.5 rounded-full transition-all duration-500"
                        style={{ background: i <= current ? "#F97316" : "#e5e7eb" }}
                    />
                ))}
            </div>

            {/* Desktop: full steps */}
            <div className="hidden sm:flex items-center justify-between relative">
                <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-10" />
                <div
                    className="absolute top-5 left-0 h-0.5 bg-orange-400 -z-10 transition-all duration-700 ease-out"
                    style={{ width: `${(current / (STEPS.length - 1)) * 100}%` }}
                />
                {STEPS.map((label, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                        <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 border-2"
                            style={
                                i < current
                                    ? { background: "#F97316", borderColor: "#F97316", color: "#fff" }
                                    : i === current
                                        ? { background: "#fff", borderColor: "#F97316", color: "#F97316", boxShadow: "0 0 0 4px #FED7AA" }
                                        : { background: "#fff", borderColor: "#e5e7eb", color: "#9ca3af" }
                            }
                        >
                            {i < current ? "✓" : i + 1}
                        </div>
                        <span
                            className="text-xs font-semibold whitespace-nowrap"
                            style={{ color: i === current ? "#F97316" : i < current ? "#1a1a1a" : "#9ca3af" }}
                        >
                            {label}
                        </span>
                    </div>
                ))}
            </div>

            <p className="sm:hidden text-xs text-gray-400 mt-2 font-medium">
                Step {current + 1} of {STEPS.length} — <span className="text-brand-orange font-semibold">{STEPS[current]}</span>
            </p>
        </div>
    );
}

// ─── Input Field ──────────────────────────────────────────────────────────────
function NumberInput({
    label, value, onChange, unit, min, max, placeholder,
}: {
    label: string; value: string; onChange: (v: string) => void;
    unit?: string; min?: number; max?: number; placeholder?: string;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</label>
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
                <input
                    type="number"
                    min={min}
                    max={max}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="flex-1 bg-transparent px-4 py-3.5 text-base font-semibold text-brand-dark outline-none min-w-0"
                />
                {unit && (
                    <span className="px-4 text-sm font-bold text-gray-400 border-l border-gray-200 bg-gray-100 py-3.5 whitespace-nowrap">
                        {unit}
                    </span>
                )}
            </div>
        </div>
    );
}

// ─── Nav Buttons ──────────────────────────────────────────────────────────────
function NavButtons({
    onBack, onNext, nextLabel = "Continue", backDisabled = false, nextDisabled = false,
}: {
    onBack: () => void; onNext: () => void;
    nextLabel?: string; backDisabled?: boolean; nextDisabled?: boolean;
}) {
    return (
        <div className="flex gap-3 mt-8">
            {!backDisabled && (
                <button
                    onClick={onBack}
                    className="flex-1 sm:flex-none px-6 py-3.5 rounded-2xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all"
                >
                    ← Back
                </button>
            )}
            <button
                onClick={onNext}
                disabled={nextDisabled}
                className="flex-1 px-6 py-3.5 rounded-2xl text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: nextDisabled ? "#9ca3af" : "#1a1a1a" }}
            >
                {nextLabel} →
            </button>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// STEP 1 — BMI CALCULATOR
// ══════════════════════════════════════════════════════════════════════════════
function Step1BMI({
    height, setHeight, weight, setWeight, onNext,
}: {
    height: string; setHeight: (v: string) => void;
    weight: string; setWeight: (v: string) => void;
    onNext: () => void;
}) {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    const bmi = h > 0 && w > 0 ? w / ((h / 100) ** 2) : 0;
    const valid = bmi > 0;

    const { category, color, suggestion } = (() => {
        if (!valid) return { category: "—", color: "#9ca3af", suggestion: "" };
        if (bmi < 18.5) return { category: "Underweight", color: "#3b82f6", suggestion: `Gain ${Math.ceil((18.5 * (h / 100) ** 2) - w)} kg to reach healthy BMI.` };
        if (bmi < 25) return { category: "Fit ✓", color: "#22c55e", suggestion: "You meet the BMI standard. Maintain your current fitness." };
        if (bmi < 30) return { category: "Overweight", color: "#f59e0b", suggestion: `Reduce ${Math.ceil(w - (24.9 * (h / 100) ** 2))} kg to reach ideal BMI.` };
        return { category: "Obese", color: "#ef4444", suggestion: `Reduce ${Math.ceil(w - (24.9 * (h / 100) ** 2))} kg. Seek structured diet + exercise plan.` };
    })();

    // BMI bar: 0=10, 100=40
    const barPct = valid ? Math.min(100, Math.max(0, ((bmi - 10) / 30) * 100)) : 0;

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-brand-dark mb-1">Height & Weight</h2>
                <p className="text-sm text-gray-400">Enter your measurements to calculate BMI and Army fitness standard.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <NumberInput label="Height" value={height} onChange={setHeight} unit="cm" min={100} max={250} placeholder="170" />
                <NumberInput label="Weight" value={weight} onChange={setWeight} unit="kg" min={30} max={200} placeholder="65" />
            </div>

            {/* BMI Card */}
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-5 transition-all">
                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Your BMI</p>
                        <div className="text-5xl font-bold" style={{ color: valid ? color : "#e5e7eb" }}>
                            {valid ? <AnimatedNumber value={bmi} decimals={1} /> : "—"}
                        </div>
                    </div>
                    <span
                        className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
                        style={{ background: valid ? `${color}18` : "#f3f4f6", color: valid ? color : "#9ca3af" }}
                    >
                        {category}
                    </span>
                </div>

                {/* BMI Scale */}
                <div>
                    <div className="relative h-3 rounded-full overflow-hidden mb-2"
                        style={{
                            background: "linear-gradient(to right, #3b82f6 0%, #3b82f6 27%, #22c55e 27%, #22c55e 55%, #f59e0b 55%, #f59e0b 75%, #ef4444 75%, #ef4444 100%)"
                        }}>
                        {valid && (
                            <div
                                className="absolute top-0 w-3 h-3 rounded-full border-2 border-white shadow-md transition-all duration-700"
                                style={{ left: `calc(${barPct}% - 6px)`, background: color }}
                            />
                        )}
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-gray-400">
                        <span>Underweight</span><span>Fit</span><span>Overweight</span><span>Obese</span>
                    </div>
                </div>

                {valid && suggestion && (
                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-orange-50 border border-orange-100">
                        <span className="text-orange-400 text-lg mt-0.5">💡</span>
                        <p className="text-sm text-orange-800 font-medium">{suggestion}</p>
                    </div>
                )}
            </div>

            <NavButtons onBack={() => { }} onNext={onNext} nextLabel="Continue to Vision Check" backDisabled />
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// STEP 2 — VISION & CONDITIONS
// ══════════════════════════════════════════════════════════════════════════════
function Step2Vision({
    conditions, setConditions, vision, setVision, onBack, onNext,
}: {
    conditions: Record<string, boolean>;
    setConditions: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    vision: VisionType;
    setVision: (v: VisionType) => void;
    onBack: () => void; onNext: () => void;
}) {
    const [expanded, setExpanded] = useState<string | null>(null);

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-brand-dark mb-1">Vision & Physical Conditions</h2>
                <p className="text-sm text-gray-400">Select your vision acuity and any physical conditions that apply.</p>
            </div>

            {/* Vision Acuity Selector */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs font-bold text-brand-dark uppercase tracking-widest mb-3">👁️ Visual Acuity</p>
                <div className="grid grid-cols-3 gap-2">
                    {(
                        [
                            { value: '6/6' as VisionType, label: '6/6 (Perfect)', sub: 'Meets SSB standard' },
                            { value: 'correctable' as VisionType, label: 'Correctable', sub: 'Glasses / contact lens' },
                            { value: 'none' as VisionType, label: 'Defective', sub: 'Cannot be corrected' },
                        ] as const
                    ).map((opt) => {
                        const active = vision === opt.value;
                        return (
                            <button
                                key={opt.value}
                                onClick={() => setVision(opt.value)}
                                className="rounded-xl border-2 p-3 text-left transition-all duration-200"
                                style={{ borderColor: active ? '#F97316' : '#e5e7eb', background: active ? '#FFF7ED' : '#fff' }}
                            >
                                <div className="flex items-center gap-1.5 mb-1">
                                    <div
                                        className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                                        style={{ borderColor: active ? '#F97316' : '#d1d5db', background: active ? '#F97316' : '#fff' }}
                                    >
                                        {active && <span className="text-white text-[7px]">●</span>}
                                    </div>
                                    <span className="text-xs font-bold text-brand-dark">{opt.label}</span>
                                </div>
                                <p className="text-[10px] text-gray-400 pl-5">{opt.sub}</p>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-3">
                {CONDITIONS.map((c) => {
                    const isExpanded = expanded === c.id;
                    const isSelected = conditions[c.id];
                    return (
                        <div
                            key={c.id}
                            className="rounded-2xl border transition-all duration-300 overflow-hidden"
                            style={{
                                borderColor: isSelected ? "#FED7AA" : "#f3f4f6",
                                background: isSelected ? "#FFF7ED" : "#fff",
                            }}
                        >
                            <div className="flex items-center justify-between p-5 cursor-pointer select-none"
                                onClick={() => setConditions(prev => ({ ...prev, [c.id]: !prev[c.id] }))}>
                                <div className="flex items-center gap-4">
                                    <span className="text-2xl">{c.icon}</span>
                                    <div>
                                        <p className="text-sm font-bold text-brand-dark">{c.label}</p>
                                        <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                                            {isSelected ? "Condition selected — tap to deselect" : "Tap to select this condition"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0"
                                        style={{
                                            borderColor: isSelected ? "#F97316" : "#d1d5db",
                                            background: isSelected ? "#F97316" : "#fff",
                                        }}
                                    >
                                        {isSelected && <span className="text-white text-[10px] font-bold">✓</span>}
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setExpanded(isExpanded ? null : c.id); }}
                                        className="w-7 h-7 rounded-full bg-gray-100 hover:bg-orange-100 flex items-center justify-center text-gray-400 hover:text-orange-500 transition-all text-xs font-bold"
                                    >
                                        {isExpanded ? "−" : "+"}
                                    </button>
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="px-5 pb-5 space-y-3 border-t border-orange-100">
                                    <InfoBlock icon="📋" label="Army Medical Standard" text={c.standard} color="blue" />
                                    <InfoBlock icon="⚠️" label="Common Rejection Reason" text={c.rejection} color="red" />
                                    <InfoBlock icon="✅" label="Improvement Advice" text={c.advice} color="green" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <NavButtons onBack={onBack} onNext={onNext} nextLabel="Continue to Fitness" />
        </div>
    );
}

function InfoBlock({ icon, label, text, color }: { icon: string; label: string; text: string; color: "blue" | "red" | "green" }) {
    const styles = {
        blue: { bg: "#eff6ff", border: "#bfdbfe", text: "#1e40af" },
        red: { bg: "#fef2f2", border: "#fecaca", text: "#991b1b" },
        green: { bg: "#f0fdf4", border: "#bbf7d0", text: "#166534" },
    }[color];
    return (
        <div className="p-3 rounded-xl mt-3 border" style={{ background: styles.bg, borderColor: styles.border }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: styles.text }}>{icon} {label}</p>
            <p className="text-xs text-gray-600 leading-relaxed">{text}</p>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// STEP 3 — FITNESS PERFORMANCE
// ══════════════════════════════════════════════════════════════════════════════
function Step3Fitness({
    pushups, setPushups, runTime, setRunTime, situps, setSitups,
    onBack, onNext,
}: {
    pushups: string; setPushups: (v: string) => void;
    runTime: string; setRunTime: (v: string) => void;
    situps: string; setSitups: (v: string) => void;
    onBack: () => void; onNext: () => void;
}) {
    const pu = parseFloat(pushups) || 0;
    const rt = parseFloat(runTime) || 0;
    const su = parseFloat(situps) || 0;

    // Scoring: pushups (max 40 = 100%), run (6 min = 100%, 10 min = 0%), situps (max 40 = 100%)
    const puScore = Math.min(100, (pu / 40) * 100);
    const rtScore = rt > 0 ? Math.max(0, Math.min(100, ((10 - rt) / 4) * 100)) : 0;
    const suScore = Math.min(100, (su / 40) * 100);
    const overallFitness = (puScore + rtScore + suScore) / 3;

    const metrics = [
        { label: "Push-ups", value: pushups, score: puScore, standard: "≥ 40 reps", icon: "💪" },
        { label: "1.6 km Run", value: runTime, score: rtScore, standard: "≤ 6 min", icon: "🏃" },
        { label: "Sit-ups", value: situps, score: suScore, standard: "≥ 40 reps", icon: "🧘" },
    ];

    const fitnessLabel = overallFitness >= 80 ? "Excellent" : overallFitness >= 60 ? "Good" : overallFitness >= 40 ? "Average" : "Needs Work";
    const fitnessColor = overallFitness >= 80 ? "#22c55e" : overallFitness >= 60 ? "#F97316" : overallFitness >= 40 ? "#f59e0b" : "#ef4444";

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-brand-dark mb-1">Fitness Performance</h2>
                <p className="text-sm text-gray-400">Enter your best performance. These are assessed during SSB medical tests.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <NumberInput label="Push-ups" value={pushups} onChange={setPushups} unit="reps" min={0} max={100} placeholder="30" />
                <NumberInput label="1.6 km Run Time" value={runTime} onChange={setRunTime} unit="min" min={0} max={30} placeholder="7.5" />
                <NumberInput label="Sit-ups" value={situps} onChange={setSitups} unit="reps" min={0} max={100} placeholder="30" />
            </div>

            {/* Metrics Breakdown */}
            <div className="space-y-4">
                {metrics.map((m) => (
                    <div key={m.label} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                        <span className="text-xl w-8 text-center">{m.icon}</span>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1.5">
                                <span className="text-sm font-bold text-brand-dark">{m.label}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-gray-400 font-medium">Standard: {m.standard}</span>
                                    <span className="text-xs font-bold" style={{ color: m.score >= 80 ? "#22c55e" : m.score >= 50 ? "#F97316" : "#ef4444" }}>
                                        {m.score.toFixed(0)}%
                                    </span>
                                </div>
                            </div>
                            <ProgressBar pct={m.score} color={m.score >= 80 ? "#22c55e" : m.score >= 50 ? "#F97316" : "#ef4444"} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Overall Fitness Score */}
            <div className="p-6 rounded-3xl text-center border border-gray-100 shadow-sm bg-white">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Fitness Score</p>
                <div className="text-5xl font-bold mb-2" style={{ color: fitnessColor }}>
                    <AnimatedNumber value={overallFitness} decimals={0} />%
                </div>
                <span className="inline-block px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                    style={{ background: `${fitnessColor}18`, color: fitnessColor }}>
                    {fitnessLabel}
                </span>
                <div className="mt-4">
                    <ProgressBar pct={overallFitness} color={fitnessColor} />
                </div>
            </div>

            <NavButtons onBack={onBack} onNext={onNext} nextLabel="Generate Medical Report" />
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// STEP 4 — FINAL REPORT (API-wired)
// ══════════════════════════════════════════════════════════════════════════════

function ScoreSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            <div className="h-48 rounded-3xl bg-gray-100" />
            <div className="h-40 rounded-3xl bg-gray-100" />
            <div className="h-32 rounded-3xl bg-gray-100" />
        </div>
    );
}

function HistoryPanel({ entries }: { entries: HistoryEntry[] }) {
    if (entries.length === 0) return null;
    const riskMeta = (r: HistoryEntry['riskLevel']) =>
        r === 'LOW' ? { label: 'Low Risk', color: '#22c55e', emoji: '🟢' }
            : r === 'MODERATE' ? { label: 'Moderate', color: '#f59e0b', emoji: '🟡' }
                : { label: 'High Risk', color: '#ef4444', emoji: '🔴' };

    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 text-sm">📂</span>
                <h3 className="text-sm font-bold text-brand-dark">Previous Assessments</h3>
            </div>
            <div className="divide-y divide-gray-50">
                {entries.map((e) => {
                    const rm = riskMeta(e.riskLevel);
                    const date = new Date(e.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                    return (
                        <div key={e.id} className="px-6 py-4 flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-sm font-bold" style={{ color: rm.color }}>{e.medicalScore}%</span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${rm.color}18`, color: rm.color }}>{rm.emoji} {rm.label}</span>
                                </div>
                                <p className="text-[11px] text-gray-400">BMI: {e.bmi.toFixed(1)} · Fitness: {e.fitnessScore}/25 · {date}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function Step4Report({
    height, weight, vision, conditions, pushups, runTime, situps, onBack, onRestart,
}: {
    height: string; weight: string;
    vision: VisionType;
    conditions: Record<string, boolean>;
    pushups: string; runTime: string; situps: string;
    onBack: () => void; onRestart: () => void;
}) {
    const [status, setStatus] = useState<'loading' | 'done' | 'guest' | 'error'>('loading');
    const [result, setResult] = useState<MedicalScoreBreakdown | null>(null);
    const [toast, setToast] = useState<string | null>(null);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const hasFetched = useRef(false);

    const showToast = useCallback((msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3500);
    }, []);

    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;

        const payload = {
            heightCm: parseFloat(height) || 0,
            weightKg: parseFloat(weight) || 0,
            vision,
            flatFoot: conditions.flatFoot ?? false,
            colorBlind: conditions.colorBlind ?? false,
            surgeryHistory: conditions.surgery ?? false,
            pushups: parseFloat(pushups) || 0,
            runMinutes: parseFloat(runTime) || 0,
            situps: parseFloat(situps) || 0,
        };

        (async () => {
            try {
                const res = await fetch('/api/medical/calculate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                if (res.status === 401) {
                    // Guest: compute client-side using same lib logic
                    const { computeMedicalScore } = await import('@/lib/medical-score');
                    const clientResult = computeMedicalScore({
                        ...payload,
                        pushups: Math.round(payload.pushups),
                        situps: Math.round(payload.situps),
                    });
                    setResult(clientResult);
                    setStatus('guest');
                    return;
                }

                if (!res.ok) throw new Error('API error');

                const data = await res.json();
                setResult({
                    bmi: data.bmi,
                    bmiScore: data.bmiScore,
                    visionScore: data.visionScore,
                    conditionScore: data.conditionScore,
                    fitnessScore: data.fitnessScore,
                    medicalScore: data.medicalScore,
                    riskLevel: data.riskLevel,
                    plan: data.plan,
                });
                setStatus('done');
                if (data.savedToProfile) showToast('✓ Saved to your profile');

                // Load history in background
                fetch('/api/medical/history')
                    .then(r => r.ok ? r.json() : [])
                    .then((h: HistoryEntry[]) => setHistory(h.slice(1))) // skip the one just saved
                    .catch(() => { });

            } catch {
                // Fallback: compute client-side
                const { computeMedicalScore } = await import('@/lib/medical-score');
                const clientResult = computeMedicalScore({
                    ...payload,
                    pushups: Math.round(payload.pushups),
                    situps: Math.round(payload.situps),
                });
                setResult(clientResult);
                setStatus('error');
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (status === 'loading' || !result) {
        return (
            <div className="space-y-8">
                <div>
                    <h2 className="text-2xl font-bold text-brand-dark mb-1">Generating Your Report…</h2>
                    <p className="text-sm text-gray-400">Calculating your Medical Readiness Score.</p>
                </div>
                <ScoreSkeleton />
            </div>
        );
    }

    const overall = result.medicalScore;
    const risk = overall >= 75
        ? { label: 'Low Risk', emoji: '🟢', color: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0' }
        : overall >= 60
            ? { label: 'Moderate Risk', emoji: '🟡', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' }
            : { label: 'High Risk', emoji: '🔴', color: '#ef4444', bg: '#fef2f2', border: '#fecaca' };

    const breakdown = [
        { label: 'BMI & Weight', badge: '30 pts', score: result.bmiScore, max: 30, raw: `${result.bmi.toFixed(1)} BMI` },
        { label: 'Vision Health', badge: '25 pts', score: result.visionScore, max: 25, raw: vision === '6/6' ? 'Perfect 6/6' : vision === 'correctable' ? 'Correctable' : 'Defective' },
        { label: 'Physical Conditions', badge: '25 pts', score: result.conditionScore, max: 25, raw: result.conditionScore === 25 ? 'No flags' : `Score: ${result.conditionScore}/25` },
        { label: 'Fitness Performance', badge: '25 pts', score: result.fitnessScore, max: 25, raw: `${result.fitnessScore}/25` },
    ];

    const weeklyPlan: WeeklyPlan[] = result.plan;

    return (
        <div className="space-y-8">
            {/* Toast */}
            {toast && (
                <div className="fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gray-900 text-white text-sm font-semibold shadow-xl animate-fadeIn">
                    <span className="text-green-400">✓</span> {toast}
                </div>
            )}

            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-brand-dark mb-1">Your Medical Report</h2>
                    <p className="text-sm text-gray-400">Based on your inputs — SSB Medical Readiness assessment.</p>
                </div>
                {status === 'guest' && (
                    <div className="flex-shrink-0 text-[10px] font-bold text-orange-500 bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-xl">
                        Guest Mode — <a href="/auth/login" className="underline">Log in to save</a>
                    </div>
                )}
            </div>

            {/* Big Score */}
            <div className="rounded-3xl p-8 text-center border" style={{ background: risk.bg, borderColor: risk.border }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: risk.color }}>Medical Readiness Score</p>
                <div className="text-7xl font-bold mb-3" style={{ color: risk.color }}>
                    <AnimatedNumber value={overall} decimals={0} />%
                </div>
                <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold"
                    style={{ background: '#fff', color: risk.color, border: `1.5px solid ${risk.border}` }}>
                    {risk.emoji} {risk.label}
                </span>
                <div className="mt-6 max-w-xs mx-auto">
                    <ProgressBar pct={overall} color={risk.color} />
                </div>
            </div>

            {/* Score Breakdown */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="text-sm font-bold text-brand-dark">Score Breakdown</h3>
                </div>
                <div className="divide-y divide-gray-50">
                    {breakdown.map((b) => {
                        const pct = (b.score / b.max) * 100;
                        const clr = pct >= 80 ? '#22c55e' : pct >= 50 ? '#F97316' : '#ef4444';
                        return (
                            <div key={b.label} className="px-6 py-4">
                                <div className="flex justify-between items-center mb-2">
                                    <div>
                                        <span className="text-sm font-bold text-brand-dark">{b.label}</span>
                                        <span className="ml-2 text-[10px] font-bold text-gray-400 uppercase bg-gray-100 px-2 py-0.5 rounded-full">{b.badge}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[11px] text-gray-400">{b.raw}</span>
                                        <span className="text-sm font-bold" style={{ color: clr }}>{b.score}/{b.max}</span>
                                    </div>
                                </div>
                                <ProgressBar pct={pct} color={clr} />
                            </div>
                        );
                    })}
                    {/* Total */}
                    <div className="px-6 py-4 bg-gray-50">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-brand-dark">Total Score</span>
                            <span className="text-base font-bold" style={{ color: risk.color }}>{overall}/100</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 30-Day Plan */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 text-sm">📅</span>
                    <h3 className="text-sm font-bold text-brand-dark">30-Day Medical Preparation Plan</h3>
                </div>
                <div className="p-6 space-y-4">
                    {weeklyPlan.map((item, i) => (
                        <div key={i} className="flex gap-4">
                            <div className="flex-shrink-0 w-16">
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-orange-50 text-orange-500 rounded-lg block text-center">
                                    {item.week}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 pt-1 leading-relaxed">{item.task}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* History (authenticated users only) */}
            {history.length > 0 && (
                <div>
                    <button
                        onClick={() => setShowHistory(v => !v)}
                        className="text-sm font-bold text-gray-400 hover:text-brand-orange transition-colors mb-3"
                    >
                        {showHistory ? '▲ Hide' : '▼ Show'} previous assessments ({history.length})
                    </button>
                    {showHistory && <HistoryPanel entries={history} />}
                </div>
            )}

            {/* Upgrade CTA */}
            <div className="rounded-3xl overflow-hidden border border-gray-900 bg-gray-900 p-8 text-center relative">
                <div className="absolute inset-0 opacity-5"
                    style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #F97316 0%, transparent 60%)' }} />
                <div className="relative">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                        ⭐ Pro Feature
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Unlock Detailed Medical Analysis</h3>
                    <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto leading-relaxed">
                        Get a personalised rejection probability, custom fitness roadmap, and complete medical document checklist.
                    </p>
                    <ul className="text-left max-w-xs mx-auto mb-7 space-y-2">
                        {['Detailed rejection probability score', 'Personalised fitness roadmap', 'Medical document checklist'].map((item, i) => (
                            <li key={i} className="flex items-center gap-2.5 text-sm text-gray-300">
                                <span className="w-4 h-4 rounded-full bg-orange-500/30 flex items-center justify-center flex-shrink-0">
                                    <span className="text-orange-400 text-[8px]">✓</span>
                                </span>
                                {item}
                            </li>
                        ))}
                    </ul>
                    <button className="px-8 py-3.5 rounded-2xl bg-brand-orange text-white font-bold text-sm hover:opacity-90 transition-opacity">
                        Unlock Pro Analysis — ₹99
                    </button>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
                <button
                    onClick={onBack}
                    className="flex-1 px-6 py-3.5 rounded-2xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
                >
                    ← Edit Fitness Data
                </button>
                <button
                    onClick={onRestart}
                    className="flex-1 px-6 py-3.5 rounded-2xl bg-brand-dark text-white text-sm font-bold hover:opacity-90 transition-all"
                >
                    🔄 Restart Simulator
                </button>
            </div>
        </div>
    );
}
// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function MedicalSimulator() {
    const [step, setStep] = useState(0);

    // Step 1
    const [height, setHeight] = useState("");
    const [weight, setWeight] = useState("");

    // Step 2
    const [conditions, setConditions] = useState<Record<string, boolean>>({
        vision66: false, flatFoot: false, colorBlind: false, surgery: false,
    });
    // Vision type for scoring
    const [vision, setVision] = useState<VisionType>('6/6');

    // Step 3
    const [pushups, setPushups] = useState("");
    const [runTime, setRunTime] = useState("");
    const [situps, setSitups] = useState("");

    const next = () => setStep((s) => Math.min(3, s + 1));
    const back = () => setStep((s) => Math.max(0, s - 1));
    const restart = () => {
        setStep(0);
        setHeight(''); setWeight('');
        setConditions({ vision66: false, flatFoot: false, colorBlind: false, surgery: false });
        setVision('6/6');
        setPushups(''); setRunTime(''); setSitups('');
    };

    return (
        <main className="antialiased overflow-x-hidden selection:bg-brand-orange selection:text-white font-sans bg-brand-bg">
            <Navbar />

            {/* Hero */}
            <section className="pt-32 pb-6 px-6 bg-brand-bg">
                <div className="max-w-3xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-600 text-[10px] font-bold uppercase tracking-widest mb-5">
                        🩺 SSB Medical Simulator
                    </div>
                    <h1 className="font-hero font-bold text-3xl sm:text-4xl text-brand-dark mb-3">
                        Medical Readiness <span className="text-brand-orange">Simulator</span>
                    </h1>
                    <p className="text-gray-500 text-sm sm:text-base max-w-xl mx-auto">
                        Evaluate your physical standards before reporting to SSB. Complete all 4 steps for your personalised report.
                    </p>
                </div>
            </section>

            {/* Simulator */}
            <section className="pb-24 px-6">
                <div className="max-w-3xl mx-auto">
                    {/* Card */}
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6 sm:p-10">
                        <StepIndicator current={step} />

                        <div key={step} className="animate-fadeIn">
                            {step === 0 && (
                                <Step1BMI
                                    height={height} setHeight={setHeight}
                                    weight={weight} setWeight={setWeight}
                                    onNext={next}
                                />
                            )}
                            {step === 1 && (
                                <Step2Vision
                                    conditions={conditions} setConditions={setConditions}
                                    vision={vision} setVision={setVision}
                                    onBack={back} onNext={next}
                                />
                            )}
                            {step === 2 && (
                                <Step3Fitness
                                    pushups={pushups} setPushups={setPushups}
                                    runTime={runTime} setRunTime={setRunTime}
                                    situps={situps} setSitups={setSitups}
                                    onBack={back} onNext={next}
                                />
                            )}
                            {step === 3 && (
                                <Step4Report
                                    height={height} weight={weight}
                                    vision={vision}
                                    conditions={conditions}
                                    pushups={pushups} runTime={runTime} situps={situps}
                                    onBack={back} onRestart={restart}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
