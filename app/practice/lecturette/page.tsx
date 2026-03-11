'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import topicsData from '@/data/lecturette/topics.json';

// ─── Types ────────────────────────────────────────────────────────────────────
type View = 'intro' | 'prep' | 'speech' | 'eval' | 'result';

interface Topic {
    id: number;
    topic: string;
    category: string;
    hint: string;
    difficulty: 'easy' | 'medium' | 'hard';
}

interface EvalScores {
    confidence: number;
    clarity: number;
    content: number;
    knowledge: number;
    timeManagement: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const PREP_TIME = 3 * 60;
const SPEECH_TIME = 3 * 60;
const CATEGORY_COLORS: Record<string, string> = {
    'Leadership': 'bg-blue-50 text-blue-700 border-blue-100',
    'Social Issues': 'bg-purple-50 text-purple-700 border-purple-100',
    'Defence': 'bg-red-50 text-red-700 border-red-100',
    'Technology': 'bg-cyan-50 text-cyan-700 border-cyan-100',
    'Ethics': 'bg-yellow-50 text-yellow-700 border-yellow-100',
    'Economy': 'bg-green-50 text-green-700 border-green-100',
    'Current Affairs': 'bg-orange-50 text-orange-700 border-orange-100',
    'Environment': 'bg-teal-50 text-teal-700 border-teal-100',
};
const DIFF_COLORS: Record<string, string> = {
    easy: 'bg-green-50 text-green-600',
    medium: 'bg-yellow-50 text-yellow-700',
    hard: 'bg-red-50 text-red-600',
};

// ─── Sound helper ─────────────────────────────────────────────────────────────
function playShutter() {
    if (typeof window === 'undefined') return;
    try { new Audio('/sound/audio.mp3').play().catch(() => null); } catch { /* noop */ }
}

// ─── Timer display ────────────────────────────────────────────────────────────
function fmt(s: number) { return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; }

// ─── AI Feedback generator (simulated) ───────────────────────────────────────
function generateFeedback(scores: EvalScores, topic: Topic): { strength: string; improve: string; structure: string } {
    const avg = (scores.confidence + scores.clarity + scores.content + scores.knowledge + scores.timeManagement) / 5;
    const strength = avg >= 7
        ? `Good command over the topic "${topic.topic}". Your content was well-structured and showed depth.`
        : scores.content >= 6
        ? `You demonstrated reasonable knowledge about "${topic.topic}". Keep building on this.`
        : `You picked a challenging topic. Your attempt shows initiative and willingness to explore.`;
    const improve = scores.clarity < 6
        ? 'Work on speaking more clearly and at a steady pace. Practice in front of a mirror or record yourself.'
        : scores.confidence < 6
        ? 'Build confidence by practising regularly. Start with easier topics and gradually move to complex ones.'
        : 'Add real-world examples and current data to strengthen your arguments.';
    const structure = scores.timeManagement >= 7
        ? 'Strong time management. You covered introduction, body and conclusion within the time limit.'
        : 'Work on your speech structure. Spend 30 secs on intro, 2 mins on body points and 30 secs on conclusion.';
    return { strength, improve, structure };
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LecturettePage() {
    const router = useRouter();
    const topics = topicsData as Topic[];

    // View state
    const [view, setView] = useState<View>('intro');
    const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
    const [filterCat, setFilterCat] = useState<string>('All');

    // Timers
    const [prepLeft, setPrepLeft] = useState(PREP_TIME);
    const [speechLeft, setSpeechLeft] = useState(SPEECH_TIME);
    const [speechUsed, setSpeechUsed] = useState(0);
    const [prepUsed, setPrepUsed] = useState(0);

    // Recording
    const mediaRef = useRef<MediaRecorder | null>(null);
    const [recording, setRecording] = useState(false);
    const [canRecord, setCanRecord] = useState(false);

    // Evaluation
    const [scores, setScores] = useState<EvalScores>({ confidence: 5, clarity: 5, content: 5, knowledge: 5, timeManagement: 5 });

    // Feedback
    const [feedback, setFeedback] = useState<{ strength: string; improve: string; structure: string } | null>(null);

    // Check mic availability
    useEffect(() => {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices) setCanRecord(true);
    }, []);

    // Prep timer
    useEffect(() => {
        if (view !== 'prep') return;
        if (prepLeft <= 0) { playShutter(); handleStartSpeech(); return; }
        const t = setInterval(() => setPrepLeft(p => p - 1), 1000);
        return () => clearInterval(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view, prepLeft]);

    // Speech timer
    useEffect(() => {
        if (view !== 'speech') return;
        if (speechLeft <= 0) { playShutter(); handleSpeechEnd(); return; }
        const t = setInterval(() => setSpeechLeft(p => p - 1), 1000);
        return () => clearInterval(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view, speechLeft]);

    // ── Access check + kick off ───────────────────────────────────────────────
    const handleBegin = async (topic: Topic) => {
        const res = await fetch('/api/practice/check-access?module=LECTURETTE');
        if (res.status === 401) { router.push('/auth'); return; }
        const data = await res.json();
        if (!data.allowed) { router.push('/pricing'); return; }
        await fetch('/api/practice/check-access', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ module: 'LECTURETTE' }),
        });
        setSelectedTopic(topic);
        setPrepLeft(PREP_TIME);
        setPrepUsed(0);
        playShutter();
        setView('prep');
    };

    const handleRandomTopic = () => {
        const t = topics[Math.floor(Math.random() * topics.length)];
        setSelectedTopic(t);
    };

    const handleStartSpeech = useCallback(() => {
        setPrepUsed(PREP_TIME - prepLeft);
        setSpeechLeft(SPEECH_TIME);
        setSpeechUsed(0);
        playShutter();
        setView('speech');
    }, [prepLeft]);

    const handleSpeechEnd = useCallback(() => {
        setSpeechUsed(SPEECH_TIME - speechLeft);
        stopRecording();
        setView('eval');
    }, [speechLeft]);

    const handleSubmitEval = () => {
        if (!selectedTopic) return;
        setFeedback(generateFeedback(scores, selectedTopic));
        setView('result');
    };

    // ── Recording helpers ─────────────────────────────────────────────────────
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mr = new MediaRecorder(stream);
            mr.start();
            mediaRef.current = mr;
            setRecording(true);
        } catch { setRecording(false); }
    };
    const stopRecording = () => {
        mediaRef.current?.stop();
        mediaRef.current?.stream?.getTracks().forEach(t => t.stop());
        setRecording(false);
    };

    // ── Derived values ────────────────────────────────────────────────────────
    const categories = ['All', ...Array.from(new Set(topics.map(t => t.category)))];
    const filteredTopics = filterCat === 'All' ? topics : topics.filter(t => t.category === filterCat);
    const avgScore = Math.round((scores.confidence + scores.clarity + scores.content + scores.knowledge + scores.timeManagement) / 5 * 10) / 10;
    const prepUsedDisplay = `${Math.floor(prepUsed / 60)}m ${prepUsed % 60}s`;
    const speechUsedDisplay = `${Math.floor(speechUsed / 60)}m ${speechUsed % 60}s`;

    return (
        <div className="min-h-screen flex flex-col bg-[#FBF8F3] selection:bg-orange-200">
            {/* Grid bg */}
            <div className="fixed inset-0 pointer-events-none" style={{
                backgroundImage: 'linear-gradient(rgba(0,0,0,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.03) 1px,transparent 1px)',
                backgroundSize: '40px 40px'
            }} />

            <main className="flex-1 max-w-6xl w-full mx-auto px-4 md:px-8 pt-28 pb-20 relative z-10">

                {/* ══ INTRO VIEW ══════════════════════════════════════════════════════════ */}
                {view === 'intro' && (
                    <div className="animate-fadeIn">
                        {/* Hero */}
                        <div className="text-center mb-12">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-50 text-orange-500 text-3xl mb-6">
                                <i className="fa-solid fa-microphone-lines" />
                            </div>
                            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-4">
                                Lecturette <span className="text-orange-500">Trainer</span>
                            </h1>
                            <p className="text-gray-500 text-base md:text-lg max-w-xl mx-auto font-medium">
                                Practice 3-minute structured speaking like real SSB GTO Lecturette tasks.
                            </p>
                            <p className="text-xs text-orange-500 font-bold uppercase tracking-widest mt-2">
                                Preparation + Speech Timer Simulation
                            </p>
                        </div>

                        {/* Rules card */}
                        <div className="max-w-2xl mx-auto mb-10">
                            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <i className="fa-solid fa-circle-info text-orange-500" /> Lecturette Format
                                </h2>
                                <div className="grid sm:grid-cols-4 gap-3">
                                    {[
                                        { icon: 'fa-list', label: 'Pick a Topic', sub: 'From the grid below' },
                                        { icon: 'fa-brain', label: '3 Min Prep', sub: 'Structure your points' },
                                        { icon: 'fa-microphone', label: '3 Min Speech', sub: 'Deliver confidently' },
                                        { icon: 'fa-star', label: 'Self-Rate', sub: 'Evaluate your performance' },
                                    ].map((s, i) => (
                                        <div key={i} className="flex flex-col items-center text-center p-3 rounded-2xl bg-gray-50 border border-gray-100">
                                            <i className={`fa-solid ${s.icon} text-orange-500 text-lg mb-2`} />
                                            <p className="text-xs font-bold text-gray-800">{s.label}</p>
                                            <p className="text-[10px] text-gray-400 mt-0.5">{s.sub}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Filters + Random */}
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                            <div className="flex flex-wrap gap-2">
                                {categories.map(c => (
                                    <button key={c} onClick={() => setFilterCat(c)}
                                        className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${filterCat === c ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                                        {c}
                                    </button>
                                ))}
                            </div>
                            <button onClick={handleRandomTopic}
                                className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-bold text-sm transition-all shadow-md">
                                <i className="fa-solid fa-shuffle" /> Random Topic
                            </button>
                        </div>

                        {/* Selected topic highlight */}
                        {selectedTopic && (
                            <div className="mb-6 bg-orange-50 border border-orange-200 rounded-2xl px-6 py-4 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-1">Selected Topic</p>
                                    <p className="font-bold text-gray-900">{selectedTopic.topic}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{selectedTopic.hint}</p>
                                </div>
                                <button onClick={() => handleBegin(selectedTopic)}
                                    className="ml-6 flex-shrink-0 px-6 py-3 bg-gray-900 hover:bg-black text-white rounded-full font-bold text-sm transition-all shadow-md">
                                    Start Practice <i className="fa-solid fa-arrow-right ml-1 text-xs" />
                                </button>
                            </div>
                        )}

                        {/* Topic grid */}
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredTopics.map(t => (
                                <div key={t.id}
                                    onClick={() => setSelectedTopic(t)}
                                    className={`bg-white p-6 rounded-3xl border cursor-pointer shadow-sm hover:shadow-xl hover:border-orange-200 transition-all group ${selectedTopic?.id === t.id ? 'border-orange-400 ring-2 ring-orange-200' : 'border-gray-100'}`}>
                                    <div className="flex items-start justify-between mb-3">
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${CATEGORY_COLORS[t.category] ?? 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                                            {t.category}
                                        </span>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full capitalize ${DIFF_COLORS[t.difficulty]}`}>
                                            {t.difficulty}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-gray-900 text-sm mb-2 leading-snug group-hover:text-orange-600 transition-colors">{t.topic}</h3>
                                    <p className="text-[11px] text-gray-400 leading-relaxed">{t.hint}</p>
                                    <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select</span>
                                        <i className={`fa-solid fa-circle-check text-sm ${selectedTopic?.id === t.id ? 'text-orange-500' : 'text-gray-200 group-hover:text-orange-300'}`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ══ PREP VIEW ═══════════════════════════════════════════════════════════ */}
                {view === 'prep' && selectedTopic && (
                    <div className="animate-fadeIn max-w-2xl mx-auto">
                        <div className="text-center mb-8">
                            <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-2">Phase 1</p>
                            <h2 className="text-2xl md:text-4xl font-extrabold text-gray-900">Preparation Time</h2>
                            <p className="text-gray-400 text-sm mt-2">Structure your 3 key points before speaking.</p>
                        </div>

                        {/* Topic card */}
                        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm mb-6">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Your Topic</p>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">{selectedTopic.topic}</h3>
                            <p className="text-sm text-gray-400">{selectedTopic.hint}</p>
                            <div className="mt-3 flex gap-2">
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${CATEGORY_COLORS[selectedTopic.category] ?? 'bg-gray-50 text-gray-600 border-gray-100'}`}>{selectedTopic.category}</span>
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize ${DIFF_COLORS[selectedTopic.difficulty]}`}>{selectedTopic.difficulty}</span>
                            </div>
                        </div>

                        {/* Timer */}
                        <div className="bg-white rounded-3xl p-10 border border-gray-100 shadow-xl text-center mb-6">
                            <div className={`text-7xl font-mono font-black tracking-tighter mb-3 ${prepLeft <= 30 ? 'text-red-500 animate-pulse' : 'text-gray-900'}`}>
                                {fmt(prepLeft)}
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-4">
                                <div className="h-full bg-orange-500 transition-all duration-1000" style={{ width: `${(prepLeft / PREP_TIME) * 100}%` }} />
                            </div>
                            <p className="text-sm text-gray-400 font-medium">Use this time to structure your speech.</p>
                        </div>

                        {/* Prep guide */}
                        <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 mb-8">
                            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-4">Suggested Structure</h4>
                            <div className="space-y-3">
                                {[
                                    { phase: 'Introduction (30s)', tip: 'Define the topic briefly and state your stand.' },
                                    { phase: 'Main Point 1 (1 min)', tip: 'First argument with a real-world example.' },
                                    { phase: 'Main Point 2 (1 min)', tip: 'Second perspective or supporting data.' },
                                    { phase: 'Conclusion (30s)', tip: 'Positive summary and key takeaway.' },
                                ].map((s, i) => (
                                    <div key={i} className="flex gap-3">
                                        <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">{i + 1}</span>
                                        <div>
                                            <p className="text-xs font-bold text-gray-800">{s.phase}</p>
                                            <p className="text-[11px] text-gray-400">{s.tip}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={handleStartSpeech}
                                className="flex-1 py-4 bg-gray-900 hover:bg-black text-white rounded-full font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2">
                                <i className="fa-solid fa-microphone" /> Start Speech Now
                            </button>
                            <button onClick={() => { setPrepUsed(PREP_TIME - prepLeft); setView('intro'); }}
                                className="px-6 py-4 bg-white border border-gray-200 text-gray-600 hover:text-gray-900 rounded-full font-bold text-sm transition-all">
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* ══ SPEECH VIEW ═════════════════════════════════════════════════════════ */}
                {view === 'speech' && selectedTopic && (
                    <div className="animate-fadeIn">
                        <div className="text-center mb-8">
                            <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-2">Phase 2</p>
                            <h2 className="text-2xl md:text-4xl font-extrabold text-gray-900">Speech Delivery</h2>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 items-start">
                            {/* Left: timer + topic */}
                            <div className="space-y-5">
                                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl text-center">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Topic</p>
                                    <h3 className="font-bold text-gray-900 text-lg mb-6">{selectedTopic.topic}</h3>
                                    <div className={`text-7xl font-mono font-black tracking-tighter mb-3 ${speechLeft <= 30 ? 'text-red-500 animate-pulse' : speechLeft <= 60 ? 'text-orange-500' : 'text-gray-900'}`}>
                                        {fmt(speechLeft)}
                                    </div>
                                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-4">
                                        <div className="h-full bg-orange-500 transition-all duration-1000" style={{ width: `${(speechLeft / SPEECH_TIME) * 100}%` }} />
                                    </div>
                                    <p className="text-xs text-gray-400 font-medium mb-6">Speak clearly and confidently.</p>

                                    {/* Mic */}
                                    {canRecord ? (
                                        <button
                                            onClick={recording ? stopRecording : startRecording}
                                            className={`w-full py-3 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all ${recording ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                                            <i className={`fa-solid ${recording ? 'fa-stop' : 'fa-microphone'}`} />
                                            {recording ? 'Stop Recording' : 'Start Recording'}
                                        </button>
                                    ) : (
                                        <p className="text-xs text-gray-400">Microphone not available.</p>
                                    )}
                                </div>

                                <button onClick={handleSpeechEnd}
                                    className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-full font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2">
                                    <i className="fa-solid fa-flag-checkered" /> End Speech &amp; Evaluate
                                </button>
                            </div>

                            {/* Right: speech guide */}
                            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-5 flex items-center gap-2">
                                    <i className="fa-solid fa-lightbulb text-orange-500" /> Speech Structure Guide
                                </h4>
                                <div className="space-y-4">
                                    {[
                                        { icon: 'fa-play', color: 'bg-blue-50 text-blue-600', title: 'Introduction', time: '~30 sec', tip: 'Greet assessors. Define the topic in one clear sentence. State your main stand.' },
                                        { icon: 'fa-layer-group', color: 'bg-orange-50 text-orange-600', title: 'Main Points', time: '~2 min', tip: 'Cover 2–3 strong arguments. Use real examples, facts, or current events to support each.' },
                                        { icon: 'fa-flag', color: 'bg-green-50 text-green-600', title: 'Conclusion', time: '~30 sec', tip: 'Summarise your points positively. End with a constructive or motivational closing statement.' },
                                    ].map((s, i) => (
                                        <div key={i} className={`${s.color} rounded-2xl p-4 border border-transparent`}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <i className={`fa-solid ${s.icon} text-xs`} />
                                                <span className="text-xs font-bold uppercase tracking-widest">{s.title}</span>
                                                <span className="ml-auto text-[10px] font-bold opacity-70">{s.time}</span>
                                            </div>
                                            <p className="text-[11px] opacity-80 leading-relaxed">{s.tip}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 p-4 bg-orange-50 rounded-2xl border border-orange-100">
                                    <h5 className="text-xs font-bold text-orange-800 mb-2">Quick Dos</h5>
                                    <ul className="space-y-1">
                                        {['Maintain eye contact with assessors', 'Speak at a steady, medium pace', 'Use simple clear language', 'Give real-world examples'].map((d, i) => (
                                            <li key={i} className="text-[11px] text-orange-700 flex gap-2">
                                                <span>✓</span>{d}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ══ EVAL VIEW ═══════════════════════════════════════════════════════════ */}
                {view === 'eval' && selectedTopic && (
                    <div className="animate-fadeIn max-w-2xl mx-auto">
                        <div className="text-center mb-10">
                            <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-2">Self Evaluation</p>
                            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">Rate Your Performance</h2>
                            <p className="text-gray-400 text-sm">Be honest — accurate self-assessment is the first step to improvement.</p>
                        </div>

                        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl mb-6">
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Topic Attempted</p>
                            <p className="font-bold text-gray-900 text-lg mb-6">{selectedTopic.topic}</p>
                            <div className="space-y-6">
                                {([
                                    { key: 'confidence', label: 'Confidence', icon: 'fa-bolt' },
                                    { key: 'clarity', label: 'Clarity of Speech', icon: 'fa-comment-dots' },
                                    { key: 'content', label: 'Content & Knowledge', icon: 'fa-book-open' },
                                    { key: 'knowledge', label: 'Depth of Knowledge', icon: 'fa-brain' },
                                    { key: 'timeManagement', label: 'Time Management', icon: 'fa-clock' },
                                ] as { key: keyof EvalScores; label: string; icon: string }[]).map(({ key, label, icon }) => (
                                    <div key={key}>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                                <i className={`fa-solid ${icon} text-orange-500 w-4`} /> {label}
                                            </label>
                                            <span className={`text-sm font-black px-3 py-0.5 rounded-full ${scores[key] >= 8 ? 'bg-green-50 text-green-700' : scores[key] >= 5 ? 'bg-orange-50 text-orange-700' : 'bg-red-50 text-red-600'}`}>
                                                {scores[key]}/10
                                            </span>
                                        </div>
                                        <input type="range" min={1} max={10} value={scores[key]}
                                            onChange={e => setScores(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                                            className="w-full h-2 rounded-full appearance-none bg-gray-100 accent-orange-500 cursor-pointer" />
                                        <div className="flex justify-between text-[10px] text-gray-300 font-bold mt-1">
                                            <span>Poor</span><span>Average</span><span>Excellent</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button onClick={handleSubmitEval}
                            className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-full font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2">
                            <i className="fa-solid fa-paper-plane" /> Submit &amp; Get Feedback
                        </button>
                    </div>
                )}

                {/* ══ RESULT VIEW ═════════════════════════════════════════════════════════ */}
                {view === 'result' && selectedTopic && feedback && (
                    <div className="animate-fadeIn max-w-4xl mx-auto">
                        <div className="text-center mb-10">
                            <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-2">Session Complete</p>
                            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-2">Lecturette Analysis</h2>
                            <p className="text-gray-400 text-sm">Topic: <strong className="text-gray-700">{selectedTopic.topic}</strong></p>
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            {[
                                { label: 'Prep Used', value: prepUsedDisplay, icon: 'fa-hourglass-half' },
                                { label: 'Speech Duration', value: speechUsedDisplay, icon: 'fa-microphone' },
                                { label: 'Avg Score', value: `${avgScore}/10`, icon: 'fa-star' },
                                { label: 'Difficulty', value: selectedTopic.difficulty.charAt(0).toUpperCase() + selectedTopic.difficulty.slice(1), icon: 'fa-gauge' },
                            ].map((s, i) => (
                                <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
                                    <i className={`fa-solid ${s.icon} text-orange-500 text-xl mb-2`} />
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{s.label}</p>
                                    <p className="text-lg font-black text-gray-900">{s.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Score breakdown */}
                        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm mb-6">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6">Score Breakdown</h3>
                            <div className="space-y-4">
                                {([
                                    { key: 'confidence', label: 'Confidence' },
                                    { key: 'clarity', label: 'Clarity' },
                                    { key: 'content', label: 'Content' },
                                    { key: 'knowledge', label: 'Knowledge' },
                                    { key: 'timeManagement', label: 'Time Mgmt' },
                                ] as { key: keyof EvalScores; label: string }[]).map(({ key, label }) => (
                                    <div key={key} className="flex items-center gap-4">
                                        <span className="text-xs font-bold text-gray-500 w-24 flex-shrink-0">{label}</span>
                                        <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden">
                                            <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${scores[key] * 10}%` }} />
                                        </div>
                                        <span className="text-sm font-black text-gray-900 w-8 text-right">{scores[key]}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* AI Feedback */}
                        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm mb-8">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <i className="fa-solid fa-robot text-orange-500" /> AI-Style Feedback
                            </h3>
                            <div className="space-y-4">
                                <div className="p-5 bg-green-50 rounded-2xl border border-green-100">
                                    <p className="text-[10px] font-bold text-green-700 uppercase tracking-widest mb-2 flex items-center gap-1.5"><i className="fa-solid fa-thumbs-up" /> Strength</p>
                                    <p className="text-sm text-green-800 leading-relaxed">{feedback.strength}</p>
                                </div>
                                <div className="p-5 bg-orange-50 rounded-2xl border border-orange-100">
                                    <p className="text-[10px] font-bold text-orange-700 uppercase tracking-widest mb-2 flex items-center gap-1.5"><i className="fa-solid fa-arrow-up-right-dots" /> Area to Improve</p>
                                    <p className="text-sm text-orange-800 leading-relaxed">{feedback.improve}</p>
                                </div>
                                <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100">
                                    <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-2 flex items-center gap-1.5"><i className="fa-solid fa-layer-group" /> Speech Structure</p>
                                    <p className="text-sm text-blue-800 leading-relaxed">{feedback.structure}</p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button onClick={() => { setSelectedTopic(null); setView('intro'); }}
                                className="flex-1 py-4 bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 rounded-full font-bold text-sm transition-all text-center">
                                <i className="fa-solid fa-rotate-right mr-2" /> Practice Another Topic
                            </button>
                            <Link href="/practice"
                                className="flex-1 py-4 bg-gray-900 hover:bg-black text-white rounded-full font-bold text-sm transition-all text-center flex items-center justify-center gap-2">
                                <i className="fa-solid fa-grid-2" /> Back to Practice Arena
                            </Link>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}
