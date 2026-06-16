"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { MessageSquare, X, Send } from "lucide-react";

const BRIDGE_URL = "https://aclementchat.easyappz.com/chat";
const AGENT_NAME = "Augustine Clement Assistant";
const GREETING =
    "Hello! Welcome to Augustine Clement Solicitors!👋. I'm Clem, your virtual receptionist. I can help with information about our Family Law and Civil Litigation services. How can I assist you today?";

const BOT_AVATAR =
    "https://www.shutterstock.com/image-vector/happy-robot-3d-ai-character-600nw-2464455965.jpg";
const USER_AVATAR =
    "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

interface Message {
    id: string;
    text: string;
    type: "bot" | "user";
    time: string;
}

function generateSessionId(): string {
    return (
        "sess_" +
        Math.random().toString(36).substr(2, 12) +
        "_" +
        Date.now()
    );
}

function getSessionId(): string {
    const existing = sessionStorage.getItem("augustine_clement_session");
    if (existing) return existing;
    const id = generateSessionId();
    sessionStorage.setItem("augustine_clement_session", id);
    return id;
}

function formatTime(): string {
    return new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function ChatMessage({ msg }: { msg: Message }) {
    const isBot = msg.type === "bot";

    return (
        <div
            className={`flex flex-col gap-0.5 max-w-[80%] animate-[msgIn_0.2s_ease] ${isBot ? "self-start" : "self-end"
                }`}
        >
            <div
                className={`flex items-end gap-2 ${isBot ? "flex-row" : "flex-row-reverse"
                    }`}
            >
                <img
                    src={isBot ? BOT_AVATAR : USER_AVATAR}
                    alt={isBot ? "Bot avatar" : "User avatar"}
                    className="w-7 h-7 rounded-full object-cover shrink-0 border-2 border-background shadow-sm"
                />
                <div
                    className={`px-2.5 py-1.5 rounded-[10px] text-sm leading-[1.4] ${isBot
                        ? "bg-white text-gray-900 border border-gray-200 rounded-bl-[4px] shadow-sm"
                        : "bg-navy text-white rounded-br-[4px]"
                        }`}
                >
                    {msg.text}
                </div>
            </div>
            <span
                className={`text-[11px] text-muted-foreground px-1 ${isBot ? "" : "text-right"
                    }`}
            >
                {msg.time}
            </span>
        </div>
    );
}

function TypingIndicator() {
    return (
        <div className="self-start flex items-center gap-[5px] px-3.5 py-2.5 bg-white border border-gray-200 rounded-[14px] rounded-bl-[4px] shadow-sm">
            <span className="w-[7px] h-[7px] rounded-full bg-gray-400 animate-[typing_1.2s_infinite]" />
            <span className="w-[7px] h-[7px] rounded-full bg-gray-400 animate-[typing_1.2s_infinite_0.2s]" />
            <span className="w-[7px] h-[7px] rounded-full bg-gray-400 animate-[typing_1.2s_infinite_0.4s]" />
        </div>
    );
}

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [inputValue, setInputValue] = useState("");

    const greeted = useRef(false);
    const sessionId = useRef("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Initialise session ID on mount (client-side only)
    useEffect(() => {
        sessionId.current = getSessionId();
    }, []);

    // Auto-scroll to the latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    // Focus the textarea when the chat opens
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => textareaRef.current?.focus(), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const addMessage = useCallback(
        (text: string, type: "bot" | "user") => {
            const msg: Message = {
                id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                text,
                type,
                time: formatTime(),
            };
            setMessages((prev) => [...prev, msg]);
        },
        [],
    );

    const sendMessage = useCallback(
        async (text: string) => {
            const trimmed = text.trim();
            if (!trimmed) return;

            addMessage(trimmed, "user");
            setInputValue("");
            setIsSending(true);
            setIsTyping(true);

            // Reset textarea height
            if (textareaRef.current) {
                textareaRef.current.style.height = "auto";
            }

            try {
                const res = await fetch(BRIDGE_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: trimmed, sessionId: sessionId.current }),
                });
                const data = await res.json();
                setIsTyping(false);
                addMessage(
                    data.reply ||
                    "I'm sorry, I couldn't process that. Please try again.",
                    "bot",
                );
            } catch {
                setIsTyping(false);
                addMessage(
                    "I'm having trouble connecting right now. Please contact us at info@augustineclement.com",
                    "bot",
                );
            }

            setIsSending(false);
            textareaRef.current?.focus();
        },
        [addMessage],
    );

    const handleToggle = useCallback(() => {
        setIsOpen((prev) => {
            const willOpen = !prev;
            if (willOpen && !greeted.current) {
                greeted.current = true;
                setTimeout(() => addMessage(GREETING, "bot"), 400);
            }
            return willOpen;
        });
    }, [addMessage]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(inputValue);
            }
        },
        [inputValue, sendMessage],
    );

    const handleInput = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            setInputValue(e.target.value);
            const el = e.target;
            el.style.height = "auto";
            el.style.height = `${Math.min(el.scrollHeight, 100)}px`;
        },
        [],
    );

    return (
        <>
            {/* ── Keyframe animations ── */}
            <style>{`
        @keyframes msgIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes typing {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30%            { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>

            {/* ── Floating toggle button ── */}
            <button
                id="augustine-clement-chat-btn"
                onClick={handleToggle}
                aria-label={isOpen ? "Close chat" : "Open chat"}
                className="fixed bottom-6 right-6 z-[99999] w-[60px] h-[60px] rounded-full bg-gold text-white border-none cursor-pointer shadow-glow flex items-center justify-center transition-transform duration-200 hover:scale-105"
            >
                {isOpen ? (
                    <X className="w-7 h-7" />
                ) : (
                    <MessageSquare className="w-7 h-7" />
                )}
            </button>

            {/* ── Chat window ── */}
            <div
                id="augustine-clement-chat-window"
                role="dialog"
                aria-label="Chat with Augustine Clement Assistant"
                className={`fixed bottom-[90px] right-6 z-[99998] w-[360px] h-[520px] rounded-2xl bg-white border border-gray-200 shadow-xl flex flex-col overflow-hidden origin-bottom-right transition-all duration-250 max-[420px]:w-[calc(100vw-20px)] max-[420px]:right-2.5 max-[420px]:bottom-[90px] max-[420px]:h-[70vh] ${isOpen
                    ? "scale-100 translate-y-0 opacity-100 pointer-events-auto"
                    : "scale-[0.85] translate-y-5 opacity-0 pointer-events-none"
                    }`}
            >
                {/* ── Header ── */}
                <div className="bg-navy px-[18px] py-4 flex items-center gap-3 shrink-0">
                    <div className="w-[38px] h-[38px] rounded-full bg-white/20 flex items-center justify-center shrink-0 overflow-hidden">
                        <img
                            src={BOT_AVATAR}
                            alt="Augustine Clement Assistant"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="flex-1">
                        <div className="text-white text-[15px] font-semibold leading-tight">
                            {AGENT_NAME}
                        </div>
                        <div className="text-white/80 text-xs flex items-center gap-[5px]">
                            <span className="w-[7px] h-[7px] rounded-full bg-[#4ade80] inline-block" />
                            Online
                        </div>
                    </div>
                </div>

                {/* ── Messages ── */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5 bg-gray-50 [scrollbar-width:thin]">
                    {messages.map((msg) => (
                        <ChatMessage key={msg.id} msg={msg} />
                    ))}
                    {isTyping && <TypingIndicator />}
                    <div ref={messagesEndRef} />
                </div>

                {/* ── Disclaimer ── */}
                <div id="cm-chat-disclaimer" className="text-center py-1.5 bg-white text-[11px] text-gray-500 border-t border-gray-200">⚖️ This assistant provides general information only and does not constitute legal advice.</div>

                {/* ── Input area ── */}
                <div className="px-3.5 py-3 bg-white border-t border-gray-200 flex gap-2 items-end shrink-0">
                    <textarea
                        ref={textareaRef}
                        value={inputValue}
                        onChange={handleInput}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message..."
                        rows={1}
                        className="flex-1 border-[1.5px] border-gray-200 bg-white rounded-[10px] px-[13px] py-2.5 text-sm resize-none outline-none max-h-[100px] min-h-[42px] leading-[1.4] text-gray-900 transition-colors duration-200 focus:border-gold placeholder:text-gray-400 font-[inherit]"
                    />
                    <button
                        id="augustine-clement-chat-send"
                        onClick={() => sendMessage(inputValue)}
                        disabled={isSending}
                        aria-label="Send message"
                        className="w-10 h-10 rounded-[10px] bg-gold text-white border-none cursor-pointer flex items-center justify-center shrink-0 transition-opacity duration-200 hover:bg-gold-hover active:scale-[0.93] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="w-[18px] h-[18px]" />
                    </button>
                </div>

                {/* ── Footer ── */}
                <div className="text-center py-1.5 bg-white text-[11px] text-gray-500 border-t border-gray-200">
                    Powered by{" "}
                    <a
                        href="https://optimizewithai.net/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gold no-underline hover:underline"
                    >
                        OptimizewithAI
                    </a>
                </div>
            </div>
        </>
    );
}