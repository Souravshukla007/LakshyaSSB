'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type ChatMessage = {
    role: 'user' | 'assistant';
    content: string;
};

const QUICK_ACTIONS = [
    'NDA Eligibility',
    'How to Fill PIQ',
    'SSB Interview Tips',
    'WAT Practice Tips',
    'Lecturette Topics',
    'Evaluate My SRT Answer',
];

const WELCOME_MESSAGE = "Hello! I'm LakshyaSSB AI Mentor.\nAsk me anything about SSB preparation.";

export default function LakshyaAIMentor() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        let isMounted = true;
        
        // 1. Check auth status first
        fetch('/api/auth/status')
            .then(res => res.ok ? res.json() : null)
            .then(data => { 
                if (isMounted) {
                    const loggedIn = !!data?.isLoggedIn;
                    setIsLoggedIn(loggedIn);
                    
                    // 2. If logged in, fetch history
                    if (loggedIn) {
                        fetch('/api/chat/history')
                            .then(r => r.ok ? r.json() : null)
                            .then(historyData => {
                                if (isMounted && historyData?.messages) {
                                    if (historyData.messages.length > 0) {
                                        setMessages(historyData.messages);
                                    } else {
                                        setMessages([{ role: 'assistant', content: WELCOME_MESSAGE }]);
                                    }
                                }
                            });
                    }
                } 
            })
            .catch(() => null);

        return () => { isMounted = false; };
    }, []);

    useEffect(() => {
        // Only trigger fallback welcome message if explicitly not logged in and no messages
        if (isOpen && messages.length === 0 && isLoggedIn === false) {
            setMessages([{ role: 'assistant', content: WELCOME_MESSAGE }]);
        }
    }, [isOpen, messages.length, isLoggedIn]);

    useEffect(() => {
        if (!scrollRef.current) return;
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, isLoading]);

    const canShowQuickActions = useMemo(
        () => messages.length <= 1 && !isLoading,
        [messages.length, isLoading]
    );

    const handleNewChat = () => {
        setIsLoading(false);
        setInput('');
        setMessages([{ role: 'assistant', content: WELCOME_MESSAGE }]);
    };

    const sendMessage = async (rawText?: string) => {
        const text = (rawText ?? input).trim();
        if (!text || isLoading) return;

        const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: text }];
        setMessages(nextMessages);
        setInput('');
        setIsLoading(true);

        try {
            const history = nextMessages.slice(-5).map((m) => ({ role: m.role, content: m.content }));
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, history }),
            });

            const data = await res.json();

            if (!res.ok) {
                const reason = data?.reason;
                let errorMsg = 'I could not generate a response right now. Please try again.';

                if (reason === 'quota_exceeded') {
                    const retryIn = data?.retryAfterSeconds;
                    errorMsg = retryIn
                        ? `AI quota limit reached. Please retry in about ${Math.ceil(retryIn)} seconds.`
                        : 'AI quota limit reached. Please try again in a moment.';
                } else if (reason === 'free_limit_reached') {
                    errorMsg = data.error; 
                } else if (reason === 'model_not_found') {
                    errorMsg = 'AI service is temporarily unavailable. Please try again later.';
                } else if (data?.error) {
                    errorMsg = data.error;
                }

                setMessages((prev) => [...prev, { role: 'assistant', content: errorMsg }]);
                return;
            }

            const reply = data?.reply || 'I could not generate a response right now. Please try again.';
            setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: 'I am facing a temporary network issue. Please try again in a moment.',
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Floating launcher */}
            <div className="fixed bottom-6 right-6 z-[80] group">
                <button
                    onClick={() => {
                        if (isLoggedIn === false) {
                            alert("Please login first to unlock the LakshyaSSB AI Mentor.");
                            router.push('/auth');
                            return;
                        }
                        setIsOpen((v) => !v);
                    }}
                    className="w-14 h-14 rounded-full bg-white shadow-2xl border-2 border-brand-orange hover:shadow-brand-orange/30 hover:scale-105 transition-all duration-300 flex items-center justify-center overflow-hidden"
                    aria-label="Ask Lakshya AI Mentor"
                >
                    <img src="/chatBot_logo/chat_lakshya.png" alt="Lakshya AI Mentor" className="w-[90%] h-[90%] object-contain rounded-full" />
                </button>
                <div className="hidden sm:block pointer-events-none absolute right-16 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-brand-dark text-white text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
                    Ask Lakshya AI Mentor
                </div>
            </div>

            {/* Chat window */}
            <div
                className={`fixed z-[79] bottom-24 left-2 right-2 sm:left-auto sm:right-6 transform transition-all duration-300 ${
                    isOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
                }`}
            >
                <div className="w-full sm:w-[360px] h-[72vh] sm:h-[560px] max-h-[620px] bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-100 bg-white/95 backdrop-blur-sm flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-brand-dark">LakshyaSSB AI Mentor</h3>
                            <p className="text-[11px] text-gray-500">Ask anything about SSB preparation</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleNewChat}
                                className="w-8 h-8 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                                aria-label="Start new chat"
                                title="New chat"
                            >
                                <i className="fa-solid fa-pen-to-square text-xs" />
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-8 h-8 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                                aria-label="Close chatbot"
                                title="Close"
                            >
                                <i className="fa-solid fa-xmark" />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 bg-[#FFFBF7] bg-grid-pattern">
                        <div className="space-y-3">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {msg.role === 'assistant' && (
                                        <div className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center overflow-hidden mr-2 shrink-0 bg-white">
                                            <img src="/chatBot_logo/chat_lakshya.png" alt="AI Mentor" className="w-[90%] h-[90%] object-contain" />
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                                            msg.role === 'user'
                                                ? 'bg-brand-dark text-white rounded-br-md'
                                                : 'bg-gray-100 text-gray-800 rounded-bl-md'
                                        }`}
                                    >
                                        {msg.content}
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex justify-start items-end">
                                    <div className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center overflow-hidden mr-2 shrink-0 bg-white">
                                        <img src="/chatBot_logo/chat_lakshya.png" alt="AI Mentor" className="w-[90%] h-[90%] object-contain" />
                                    </div>
                                    <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
                                        <div className="flex items-center gap-1">
                                            <span className="typing-dot" />
                                            <span className="typing-dot typing-dot-delay-1" />
                                            <span className="typing-dot typing-dot-delay-2" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick actions */}
                    {canShowQuickActions && (
                        <div className="px-3 pt-2 pb-1 border-t border-gray-100 bg-white">
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                                {QUICK_ACTIONS.map((action) => (
                                    <button
                                        key={action}
                                        onClick={() => sendMessage(action)}
                                        className="shrink-0 px-3 py-1.5 rounded-full border border-gray-200 text-xs font-semibold text-gray-700 hover:border-brand-orange hover:text-brand-orange hover:bg-brand-orange/5 transition-colors"
                                    >
                                        {action}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input */}
                    <div className="p-3 border-t border-gray-100 bg-white">
                        <div className="flex items-center gap-2">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        sendMessage();
                                    }
                                }}
                                placeholder="Ask about SSB, PIQ, NDA eligibility..."
                                className="flex-1 h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
                            />
                            <button
                                onClick={() => sendMessage()}
                                disabled={isLoading}
                                className="h-11 px-4 rounded-xl bg-brand-dark text-white hover:bg-black transition-colors disabled:opacity-50"
                                aria-label="Send message"
                            >
                                <i className="fa-solid fa-arrow-up" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
