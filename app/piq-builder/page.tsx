'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OLQScores {
    leadership: number;
    initiative: number;
    responsibility: number;
    socialAdaptability: number;
    confidence: number;
    consistency: number;
}

interface PIQLatest {
    status: 'NO_PIQ' | 'HAS_PIQ';
    latestScore?: number;
    riskLevel?: 'LOW' | 'MODERATE' | 'HIGH';
    lastUpdated?: string;
    olqs?: OLQScores;
}

interface PIQHistoryRow {
    id: string;
    totalScore: number;
    riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
    createdAt: string;
    leadership: number;
    initiative: number;
    responsibility: number;
    socialAdaptability: number;
    confidence: number;
    consistency: number;
}

interface IOQuestion {
    question: string;
    context: string;
    triggerOLQ: string;
}

// ─── SVG Components ───────────────────────────────────────────────────────────

function ScoreCircle({ score, size = 160 }: { score: number; size?: number }) {
    const r = (size / 2) - 12;
    const circumference = 2 * Math.PI * r;
    const offset = circumference - (score / 100) * circumference;
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-lg">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f3f4f6" strokeWidth="10" />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#FF5E3A" strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                style={{ transition: 'stroke-dashoffset 1.2s ease' }}
            />
            <text x={size / 2} y={size / 2 - 6} textAnchor="middle" fill="#0F0F12" fontSize={size * 0.18} fontWeight="800">{score}</text>
            <text x={size / 2} y={size / 2 + 14} textAnchor="middle" fill="#9ca3af" fontSize={size * 0.09}>/100</text>
        </svg>
    );
}

const OLQ_LABELS: { key: keyof OLQScores; label: string; abbr: string }[] = [
    { key: 'leadership', label: 'Leadership', abbr: 'LD' },
    { key: 'initiative', label: 'Initiative', abbr: 'IN' },
    { key: 'responsibility', label: 'Responsibility', abbr: 'RE' },
    { key: 'socialAdaptability', label: 'Social Adapt.', abbr: 'SA' },
    { key: 'confidence', label: 'Confidence', abbr: 'CO' },
    { key: 'consistency', label: 'Consistency', abbr: 'CS' },
];

function OLQRadar({ olqs, activeOLQ, onSelect }: {
    olqs: OLQScores;
    activeOLQ: string | null;
    onSelect: (id: string) => void;
}) {
    const cx = 160, cy = 160, maxR = 110;
    const n = OLQ_LABELS.length;
    const angles = OLQ_LABELS.map((_, i) => (2 * Math.PI * i) / n - Math.PI / 2);

    const gridCircles = [2, 4, 6, 8, 10];

    const dataPoints = OLQ_LABELS.map(({ key }, i) => {
        const v = olqs[key] / 10;
        return {
            x: cx + maxR * v * Math.cos(angles[i]),
            y: cy + maxR * v * Math.sin(angles[i]),
        };
    });

    const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';

    return (
        <svg viewBox="0 0 320 320" className="w-full h-full max-w-[320px] mx-auto">
            {/* Grid circles */}
            {gridCircles.map(v => (
                <circle key={v} cx={cx} cy={cy} r={maxR * v / 10}
                    fill="none" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="3,3" />
            ))}
            {/* Axes */}
            {OLQ_LABELS.map((_, i) => (
                <line key={i}
                    x1={cx} y1={cy}
                    x2={cx + maxR * Math.cos(angles[i])}
                    y2={cy + maxR * Math.sin(angles[i])}
                    stroke="#d1d5db" strokeWidth="1" />
            ))}
            {/* Data area */}
            <path d={dataPath} fill="rgba(255,94,58,0.18)" stroke="#FF5E3A" strokeWidth="2.5" strokeLinejoin="round" />
            {/* Data dots */}
            {dataPoints.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="5" fill="#FF5E3A" />
            ))}
            {/* Clickable labels */}
            {OLQ_LABELS.map(({ key, label }, i) => {
                const lx = cx + (maxR + 26) * Math.cos(angles[i]);
                const ly = cy + (maxR + 26) * Math.sin(angles[i]);
                const v = olqs[key];
                const isActive = activeOLQ === key;
                const isWeak = v < 5;
                return (
                    <g key={key} onClick={() => onSelect(key)} style={{ cursor: 'pointer' }}>
                        <circle cx={lx} cy={ly} r="18"
                            fill={isActive ? '#FF5E3A' : isWeak ? '#FEF2F2' : '#F9FAFB'}
                            stroke={isActive ? '#FF5E3A' : isWeak ? '#FCA5A5' : '#E5E7EB'}
                            strokeWidth={isActive ? 0 : 1.5}
                        />
                        <text x={lx} y={ly - 3} textAnchor="middle" fill={isActive ? '#fff' : isWeak ? '#EF4444' : '#0F0F12'}
                            fontSize="8" fontWeight="800">{v}/10</text>
                        <text x={lx} y={ly + 8} textAnchor="middle" fill={isActive ? '#fff' : '#6B7280'}
                            fontSize="6" fontWeight="600">{label.split(' ')[0]}</text>
                    </g>
                );
            })}
        </svg>
    );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function riskBadge(level: 'LOW' | 'MODERATE' | 'HIGH') {
    if (level === 'LOW') return { label: '🟢 Low Risk', cls: 'bg-green-50  text-green-700  border-green-200' };
    if (level === 'MODERATE') return { label: '🟡 Moderate Risk', cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' };
    return { label: '🔴 High Risk', cls: 'bg-red-50    text-red-700    border-red-200' };
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PIQBuilderPage() {
    const [latest, setLatest] = useState<PIQLatest | null>(null);
    const [history, setHistory] = useState<PIQHistoryRow[]>([]);
    const [ioQs, setIoQs] = useState<IOQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeOLQ, setActiveOLQ] = useState<keyof OLQScores | null>(null);
    const [expandedQ, setExpandedQ] = useState<number | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        // Fetch in parallel
        Promise.all([
            fetch('/api/piq/latest').then(r => r.json()),
            fetch('/api/piq/history').then(r => r.json()),
            fetch('/api/piq/io-questions').then(r => r.json()),
        ]).then(([lat, hist, io]) => {
            setLatest(lat);
            setHistory(Array.isArray(hist) ? hist : []);
            setIoQs(Array.isArray(io.questions) ? io.questions : []);
        }).catch(console.error).finally(() => setLoading(false));

        // Reveal animations
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('active'); obs.unobserve(e.target); } });
        }, { threshold: 0.1 });
        document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
        return () => obs.disconnect();
    }, []);

    if (!mounted || loading) {
        return (
            <main className="min-h-screen bg-brand-bg pt-28 pb-24 px-6">
                <div className="max-w-5xl mx-auto space-y-8 animate-pulse">
                    <div className="h-10 bg-gray-200 rounded-full w-1/3" />
                    <div className="h-72 bg-white rounded-[2.5rem]" />
                    <div className="h-72 bg-white rounded-[2.5rem]" />
                </div>
            </main>
        );
    }

    // No PIQ yet
    if (!latest || latest.status === 'NO_PIQ') {
        return (
            <main className="min-h-screen bg-brand-bg pt-28 pb-24 px-6 flex items-center justify-center">
                <div className="bg-white rounded-[2.5rem] p-12 border border-gray-100 shadow-sm max-w-md w-full text-center">
                    <div className="text-5xl mb-6">📋</div>
                    <h2 className="font-hero font-bold text-2xl text-brand-dark mb-3">No PIQ Data Yet</h2>
                    <p className="text-sm text-gray-500 font-noname mb-8">Complete your PIQ form to generate your OLQ analysis and SSB readiness score.</p>
                    <Link href="/piq/form"
                        className="inline-block px-10 py-4 bg-brand-dark text-white rounded-full font-bold text-sm hover:bg-brand-orange transition-all shadow-lg">
                        Fill PIQ Form
                    </Link>
                </div>
            </main>
        );
    }

    const score = latest.latestScore!;
    const risk = latest.riskLevel!;
    const olqs = latest.olqs!;
    const badge = riskBadge(risk);
    const lastDate = new Date(latest.lastUpdated!).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const activeOLQData = activeOLQ ? OLQ_LABELS.find(o => o.key === activeOLQ) : null;

    // Heatmap zones
    const heatmap = OLQ_LABELS.map(({ key, label }) => {
        const v = olqs[key];
        return {
            label,
            value: v,
            zone: v >= 7 ? 'strong' : v >= 5 ? 'moderate' : 'risk',
        };
    });

    return (
        <main className="min-h-screen bg-brand-bg pt-24 pb-24 px-6">
            <div className="max-w-5xl mx-auto space-y-10">

                {/* ── HEADER ── */}
                <div className="reveal">
                    <p className="text-[10px] font-bold text-brand-orange uppercase tracking-widest mb-2">PIQ Analysis Engine</p>
                    <h1 className="font-hero font-bold text-4xl text-brand-dark leading-tight">
                        PIQ Interactive Analysis
                    </h1>
                    <p className="text-sm text-gray-500 font-noname mt-2">Your personal Officer Like Qualities breakdown — click any OLQ to explore.</p>
                </div>

                {/* ── SECTION 1: SCORE OVERVIEW ── */}
                <section className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm reveal">
                    <div className="flex flex-col md:flex-row items-center gap-10">
                        <ScoreCircle score={score} />
                        <div className="flex-1">
                            <p className="text-[10px] font-bold text-brand-orange uppercase tracking-widest mb-1">PIQ Readiness Score™</p>
                            <div className="text-5xl font-hero font-bold text-brand-dark mb-2">
                                {score}<span className="text-2xl text-gray-400">/100</span>
                            </div>
                            <span className={`inline-flex px-4 py-1.5 rounded-full text-xs font-bold border mb-4 ${badge.cls}`}>{badge.label}</span>
                            <p className="text-xs text-gray-500 font-noname mb-6">Last evaluated {lastDate}</p>

                            {/* Mini history sparkline */}
                            {history.length > 1 && (
                                <div>
                                    <p className="text-[9px] font-bold uppercase text-gray-400 mb-2">Score History</p>
                                    <div className="flex items-end gap-1 h-10">
                                        {history.map((h, i) => {
                                            const maxScore = Math.max(...history.map(x => x.totalScore));
                                            const pct = (h.totalScore / Math.max(maxScore, 100)) * 100;
                                            return (
                                                <div key={h.id} title={`Attempt ${i + 1}: ${h.totalScore}/100`}
                                                    className="flex-1 rounded-t-sm transition-all duration-500"
                                                    style={{ height: `${pct}%`, background: i === history.length - 1 ? '#FF5E3A' : '#e5e7eb' }} />
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="mt-6 flex gap-3">
                                <Link href="/piq/form"
                                    className="px-6 py-3 bg-brand-dark text-white rounded-full font-bold text-xs hover:bg-brand-orange transition-all">
                                    Re-Analyse PIQ
                                </Link>
                                <button onClick={() => document.getElementById('history-section')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="px-6 py-3 bg-brand-bg border border-gray-200 text-brand-dark rounded-full font-bold text-xs hover:bg-gray-100 transition-all">
                                    View History
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── SECTION 2: OLQ RADAR ── */}
                <section className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm reveal">
                    <p className="text-[10px] font-bold text-brand-orange uppercase tracking-widest mb-1">OLQ Breakdown</p>
                    <h2 className="font-hero font-bold text-2xl text-brand-dark mb-6">Clickable OLQ Radar</h2>
                    <div className="grid md:grid-cols-2 gap-8 items-start">
                        <div className="w-full aspect-square">
                            <OLQRadar olqs={olqs} activeOLQ={activeOLQ} onSelect={(k) => setActiveOLQ(activeOLQ === k ? null : k as keyof OLQScores)} />
                        </div>
                        <div>
                            {OLQ_LABELS.map(({ key, label }) => {
                                const v = olqs[key];
                                const pct = v * 10;
                                return (
                                    <button key={key} onClick={() => setActiveOLQ(activeOLQ === key ? null : key)}
                                        className="w-full text-left mb-3 focus:outline-none group">
                                        <div className="flex justify-between text-xs font-bold mb-1">
                                            <span className="text-brand-dark group-hover:text-brand-orange transition-colors">{label}</span>
                                            <span style={{ color: v < 5 ? '#EF4444' : v >= 7 ? '#10B981' : '#F59E0B' }}>{v}/10</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-700"
                                                style={{ width: `${pct}%`, background: v < 5 ? '#EF4444' : v >= 7 ? '#10B981' : '#F59E0B' }} />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Active OLQ Detail Panel */}
                    {activeOLQ && activeOLQData && (
                        <div className="mt-6 p-6 bg-brand-bg rounded-2xl border border-gray-100 animate-fadeIn">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-hero font-bold text-lg text-brand-dark">{activeOLQData.label}</h3>
                                <span className="text-2xl font-bold text-brand-orange">{olqs[activeOLQ]}/10</span>
                            </div>
                            {olqs[activeOLQ] < 5 ? (
                                <>
                                    <p className="text-xs text-red-600 font-bold mb-2">⚠️ Risk Zone — IO is likely to probe this OLQ</p>
                                    <p className="text-sm text-gray-600 font-noname">Your profile shows limited evidence for this quality. Focus on concrete examples from academics, sports, or community activities.</p>
                                </>
                            ) : olqs[activeOLQ] >= 7 ? (
                                <>
                                    <p className="text-xs text-green-600 font-bold mb-2">✅ Strong Signal — Good evidence found</p>
                                    <p className="text-sm text-gray-600 font-noname">Your PIQ shows consistent evidence of {activeOLQData.label.toLowerCase()}. Build specific STAR-format stories for the IO interview.</p>
                                </>
                            ) : (
                                <>
                                    <p className="text-xs text-yellow-600 font-bold mb-2">🟡 Moderate — Strengthen before interview</p>
                                    <p className="text-sm text-gray-600 font-noname">You have some evidence but it needs more depth. Prepare 2–3 strong examples and practice articulating them confidently.</p>
                                </>
                            )}
                        </div>
                    )}
                </section>

                {/* ── SECTION 3: RISK HEATMAP ── */}
                <section className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm reveal">
                    <p className="text-[10px] font-bold text-brand-orange uppercase tracking-widest mb-1">Risk Analysis</p>
                    <h2 className="font-hero font-bold text-2xl text-brand-dark mb-6">OLQ Risk Heatmap</h2>
                    <div className="grid sm:grid-cols-3 gap-4">
                        {(['strong', 'moderate', 'risk'] as const).map(zone => {
                            const items = heatmap.filter(h => h.zone === zone);
                            const config = zone === 'strong'
                                ? { icon: '🟢', title: 'Strong', color: 'border-green-200 bg-green-50', badge: 'bg-green-100 text-green-700' }
                                : zone === 'moderate'
                                    ? { icon: '🟡', title: 'Moderate', color: 'border-yellow-200 bg-yellow-50', badge: 'bg-yellow-100 text-yellow-700' }
                                    : { icon: '🔴', title: 'Risk Zone', color: 'border-red-200 bg-red-50', badge: 'bg-red-100 text-red-700' };
                            return (
                                <div key={zone} className={`rounded-2xl border p-5 ${config.color}`}>
                                    <p className="text-xs font-bold mb-3">{config.icon} {config.title}</p>
                                    {items.length === 0
                                        ? <p className="text-xs text-gray-400 italic">None</p>
                                        : items.map(item => (
                                            <div key={item.label} className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold mr-2 mb-2 ${config.badge}`}>
                                                {item.label} ({item.value}/10)
                                            </div>
                                        ))
                                    }
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* ── SECTION 4: IO QUESTION GENERATOR ── */}
                <section className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm reveal">
                    <p className="text-[10px] font-bold text-brand-orange uppercase tracking-widest mb-1">IO Prep</p>
                    <h2 className="font-hero font-bold text-2xl text-brand-dark mb-2">Predicted IO Questions</h2>
                    <p className="text-sm text-gray-500 font-noname mb-6">Generated from your weak OLQs and PIQ gaps. Practice answering these.</p>

                    {ioQs.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <p className="text-sm font-noname">No specific risk areas detected — your profile looks solid!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {ioQs.map((q, i) => (
                                <div key={i} className="border border-gray-100 rounded-2xl overflow-hidden">
                                    <button
                                        onClick={() => setExpandedQ(expandedQ === i ? null : i)}
                                        className="w-full flex items-center justify-between p-5 text-left hover:bg-brand-bg transition-colors"
                                    >
                                        <div className="flex items-start gap-4">
                                            <span className="w-7 h-7 rounded-full bg-brand-bg border border-gray-200 text-brand-dark text-xs font-bold flex-shrink-0 flex items-center justify-center">
                                                {i + 1}
                                            </span>
                                            <span className="text-sm font-noname font-medium text-brand-dark leading-snug">{q.question}</span>
                                        </div>
                                        <i className={`fa-solid fa-chevron-down text-gray-400 ml-4 transition-transform ${expandedQ === i ? 'rotate-180' : ''}`}></i>
                                    </button>
                                    {expandedQ === i && (
                                        <div className="px-5 pb-5 border-t border-gray-50 bg-brand-bg">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase mt-4 mb-2">Why this question?</p>
                                            <p className="text-xs text-gray-600 font-noname mb-4">{q.context}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Practice your answer</p>
                                            <textarea
                                                rows={4}
                                                placeholder="Type your answer here to practise..."
                                                className="w-full text-sm font-noname p-4 rounded-xl border border-gray-200 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange transition-all"
                                            />
                                            <p className="text-xs text-gray-400 font-noname mt-3 flex items-center gap-1">
                                                <i className="fa-solid fa-lock text-[10px]"></i>
                                                AI feedback available on Pro plan
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* ── SECTION 5: SCORE HISTORY TIMELINE ── */}
                <section id="history-section" className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm reveal">
                    <p className="text-[10px] font-bold text-brand-orange uppercase tracking-widest mb-1">Progress Tracking</p>
                    <h2 className="font-hero font-bold text-2xl text-brand-dark mb-6">Score History</h2>

                    {history.length === 0 ? (
                        <p className="text-sm text-gray-400 font-noname">No previous attempts yet. Re-evaluate to track your progress.</p>
                    ) : (
                        <div className="space-y-4">
                            {history.map((h, i) => {
                                const b = riskBadge(h.riskLevel);
                                const date = new Date(h.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                                const isLatest = i === history.length - 1;
                                return (
                                    <div key={h.id} className={`flex items-center gap-5 p-5 rounded-2xl border transition-all ${isLatest ? 'border-brand-orange/30 bg-orange-50/30' : 'border-gray-100 bg-brand-bg'}`}>
                                        <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${isLatest ? 'bg-brand-orange text-white' : 'bg-gray-100 text-gray-500'}`}>
                                            #{i + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="font-hero font-bold text-xl text-brand-dark">{h.totalScore}<span className="text-sm text-gray-400">/100</span></span>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${b.cls}`}>{b.label}</span>
                                                {isLatest && <span className="px-2 py-0.5 bg-brand-orange text-white rounded-full text-[9px] font-bold">Latest</span>}
                                            </div>
                                            <p className="text-[10px] text-gray-400 font-noname">{date}</p>
                                        </div>
                                        <div className="hidden sm:grid grid-cols-3 gap-x-4 gap-y-1 text-right">
                                            <p className="text-[9px] text-gray-400">LD: <strong className="text-brand-dark">{h.leadership}</strong></p>
                                            <p className="text-[9px] text-gray-400">IN: <strong className="text-brand-dark">{h.initiative}</strong></p>
                                            <p className="text-[9px] text-gray-400">RE: <strong className="text-brand-dark">{h.responsibility}</strong></p>
                                            <p className="text-[9px] text-gray-400">SA: <strong className="text-brand-dark">{h.socialAdaptability}</strong></p>
                                            <p className="text-[9px] text-gray-400">CO: <strong className="text-brand-dark">{h.confidence}</strong></p>
                                            <p className="text-[9px] text-gray-400">CS: <strong className="text-brand-dark">{h.consistency}</strong></p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* ── SECTION 6: RE-EVALUATE CTA ── */}
                <section className="bg-brand-dark rounded-[2.5rem] p-10 text-center reveal">
                    <p className="text-[10px] font-bold text-brand-orange uppercase tracking-widest mb-3">Keep Growing</p>
                    <h2 className="font-hero font-bold text-3xl text-white mb-3">Updated your activities?</h2>
                    <p className="text-sm text-gray-400 font-noname mb-8 max-w-md mx-auto">Re-fill your PIQ form whenever you gain new experience — each re-evaluation inserts a new score row and updates your progress history.</p>
                    <Link href="/piq/form"
                        className="inline-block px-10 py-4 bg-brand-orange text-white rounded-full font-bold hover:scale-105 transition-all shadow-xl">
                        Re-Evaluate PIQ Now
                    </Link>
                </section>

            </div>
        </main>
    );
}
