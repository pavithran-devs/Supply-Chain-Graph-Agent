import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

function TypingIndicator() {
    return (
        <div className="flex items-end gap-2 mb-4">
            <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
                <Bot size={14} className="text-white" />
            </div>
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1 items-center h-4">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
        </div>
    );
}

function Message({ msg }) {
    const isUser = msg.role === 'user';
    return (
        <div className={`flex items-end gap-2 mb-4 ${isUser ? 'flex-row-reverse' : ''}`}>
            {!isUser && (
                <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0 mb-0.5">
                    <Bot size={14} className="text-white" />
                </div>
            )}
            {isUser && (
                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-gray-600 mb-0.5">
                    U
                </div>
            )}
            <div
                className={`max-w-[80%] text-sm px-4 py-3 rounded-2xl leading-relaxed whitespace-pre-wrap ${isUser
                    ? 'bg-gray-900 text-white rounded-br-sm'
                    : 'bg-white border border-gray-100 shadow-sm text-gray-800 rounded-bl-sm'
                    }`}
            >
                {msg.content}
            </div>
        </div>
    );
}

export default function ChatPanel() {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: 'Hi! I can help you analyze the **Order to Cash** process.\n\nAsk me anything about customers, orders, deliveries, billings, or products in the graph.',
        },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const sendMessage = async () => {
        const query = input.trim();
        if (!query || loading) return;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: query }]);
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE}/ask`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query }),
            });
            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            const data = await res.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
        } catch (err) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `⚠️ Error: ${err.message}. Make sure the backend is running on port 8000.`,
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="flex flex-col h-full bg-white border-l border-gray-100 shadow-card">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100">
                <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-0.5">Chat with Graph</p>
                <h2 className="text-sm font-semibold text-gray-800">Order to Cash</h2>
                <div className="flex items-center gap-2 mt-2">
                    <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center">
                        <Bot size={12} className="text-white" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-700 leading-none">Dodge AI</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Graph Agent</p>
                    </div>
                    <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live
                    </span>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4">
                {messages.map((msg, i) => (
                    <Message key={i} msg={msg} />
                ))}
                {loading && <TypingIndicator />}
                <div ref={messagesEndRef} />
            </div>

            {/* Suggested prompts */}
            {messages.length <= 1 && (
                <div className="px-4 pb-2 flex gap-2 flex-wrap">
                    {[
                        'List all customers',
                        'What products are in Order 740549?',
                        'Show deliveries for billing 91150187',
                    ].map(p => (
                        <button
                            key={p}
                            onClick={() => { setInput(p); }}
                            className="text-[11px] bg-gray-50 border border-gray-200 rounded-full px-3 py-1 text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                            {p}
                        </button>
                    ))}
                </div>
            )}

            {/* Input */}
            <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                <div className="flex items-end gap-2 bg-gray-50 rounded-xl border border-gray-200 px-3 py-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <textarea
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask anything about the graph…"
                        rows={1}
                        className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 resize-none outline-none leading-relaxed"
                        style={{ maxHeight: 120 }}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!input.trim() || loading}
                        className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                        <Send size={13} />
                    </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5 text-center">
                    Shift+Enter for new line · Enter to send
                </p>
            </div>
        </div>
    );
}
