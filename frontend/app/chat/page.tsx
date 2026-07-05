"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Send, FileText, Bot, User, Paperclip, Plus, MessageSquare, Loader2, Calendar as CalendarIcon, Trash2, Menu, X, LogIn } from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { appleSoftSpring, scaleIn, backdropFade } from "@/lib/motion";

interface Message {
    role: "user" | "assistant";
    content: string;
    document_name?: string;
}

interface Session {
    id: number;
    title: string;
    created_at: string;
}

export default function ChatPage() {
    const router = useRouter();
    const { isLoggedIn } = useAuth();
    const { theme } = useTheme();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [mobileSessionsOpen, setMobileSessionsOpen] = useState(false);
    const [confirmDeleteSessionId, setConfirmDeleteSessionId] = useState<number | null>(null);
    const [deletingSession, setDeletingSession] = useState(false);
    const [schedulingIndex, setSchedulingIndex] = useState<number | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isLoggedIn) {
            fetchSessions();
        }
    }, [isLoggedIn]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, [messages]);

    const fetchSessions = async () => {
        try {
            const res = await api.get("/chat/sessions");
            setSessions(res.data);
        } catch (error) {
            console.error("Failed to fetch sessions", error);
        }
    };

    const loadSession = async (sessionId: number) => {
        setLoading(true);
        setCurrentSessionId(sessionId);
        setMobileSessionsOpen(false);
        try {
            const res = await api.get(`/chat/sessions/${sessionId}`);
            setMessages(res.data.map((m: any) => ({
                role: m.role,
                content: m.content,
                document_name: m.document_name
            })));
        } catch (error) {
            toast.error("Failed to load conversation");
        } finally {
            setLoading(false);
        }
    };

    const handleNewSession = () => {
        setCurrentSessionId(null);
        setMessages([]);
        setInput("");
        setPendingFile(null);
        setLoading(false);
        setMobileSessionsOpen(false);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

        setTimeout(() => {
            textareaRef.current?.focus();
        }, 50);

        toast.dismiss();
        toast.success("New conversation started");
    };

    const handleSend = async () => {
        if (!input.trim() && !pendingFile) return;

        let activeSessionId = currentSessionId;

        if (pendingFile) {
            setLoading(true);
            try {
                if (!activeSessionId) {
                    const res = await api.post("/chat/sessions", { title: "New Document Analysis" });
                    activeSessionId = res.data.id;
                    setCurrentSessionId(activeSessionId);
                }

                const formData = new FormData();
                formData.append("file", pendingFile);
                formData.append("session_id", activeSessionId!.toString());

                await api.post("/chat/upload", formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });

                setPendingFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
                toast.success("Document attached to context");

                if (activeSessionId) loadSession(activeSessionId);

            } catch (error) {
                toast.error("Failed to upload file");
                setLoading(false);
                return;
            }
        }

        if (!input.trim()) {
            setLoading(false);
            return;
        }

        const userMsg: Message = { role: "user", content: input };
        setMessages(prev => [...prev, userMsg]);
        const currentInput = input;
        setInput("");
        setLoading(true);

        try {
            const res = await api.post("/chat/message", {
                session_id: activeSessionId,
                message: currentInput
            });

            const botMsg: Message = { role: "assistant", content: res.data.response };
            setMessages(prev => [...prev, botMsg]);

            if (!activeSessionId && res.data.session_id) {
                setCurrentSessionId(res.data.session_id);
                fetchSessions();
            }
        } catch (error) {
            toast.error("Failed to send message");
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setPendingFile(file);
    };

    const handleQuickSchedule = async (eventData: any, idx: number) => {
        if (!isLoggedIn) {
            toast.error("Please login to add events to your calendar");
            router.push("/auth/login?returnTo=/chat");
            return;
        }
        setSchedulingIndex(idx);
        try {
            const [year, month, day] = (eventData.date as string).split('-').map(Number);
            const timeParts = (eventData.time || "10:00").split(':').map(Number);
            const localDate = new Date(year, month - 1, day, timeParts[0], timeParts[1] || 0, 0);
            const dateTimeStr = localDate.toISOString();

            await api.post("/schedule/", {
                case_name: eventData.title,
                court_date: dateTimeStr,
                reminder_date: dateTimeStr
            });
            toast.success("Event added to Schedule");
        } catch (error) {
            toast.error("Failed to schedule event");
        } finally {
            setSchedulingIndex(null);
        }
    };

    const handleDeleteSession = async (e: React.MouseEvent, sessionId: number) => {
        e.stopPropagation();
        setConfirmDeleteSessionId(sessionId);
    };

    const confirmDeleteSession = async () => {
        if (confirmDeleteSessionId === null) return;
        setDeletingSession(true);
        try {
            await api.delete(`/chat/sessions/${confirmDeleteSessionId}`);
            setSessions(prev => prev.filter(s => s.id !== confirmDeleteSessionId));
            if (currentSessionId === confirmDeleteSessionId) {
                handleNewSession();
            }
            toast.success("Conversation deleted");
        } catch (error) {
            toast.error("Failed to delete conversation");
        } finally {
            setDeletingSession(false);
            setConfirmDeleteSessionId(null);
        }
    };

    const renderMessageContent = (content: string, idx: number) => {
        const jsonBlockRegex = /```json\s*(\{\s*"action":\s*"schedule"[\s\S]*?\})\s*```/;
        const match = content.match(jsonBlockRegex);

        if (match) {
            const textPart = content.replace(jsonBlockRegex, "").trim();
            let eventData = null;
            try {
                eventData = JSON.parse(match[1]);
            } catch (e) { }

            return (
                <div>
                    <div className="whitespace-pre-wrap">{textPart}</div>
                    {eventData && (
                        <div
                            className="mt-4 p-4 max-w-sm"
                            style={{
                                background: "var(--muted)",
                                borderRadius: 12,
                                border: "1px solid var(--separator)",
                            }}
                        >
                            <div className="flex items-center gap-2 mb-2 text-[13px] font-semibold" style={{ color: "var(--accent)" }}>
                                <CalendarIcon size={15} strokeWidth={1.5} />
                                <span>Event</span>
                            </div>
                            <div className="text-[13px] space-y-1 mb-3">
                                <div className="font-medium" style={{ color: "var(--foreground)" }}>{eventData.title}</div>
                                <div style={{ color: "var(--muted-foreground)" }}>{eventData.date} at {eventData.time}</div>
                            </div>
                            <button
                                onClick={() => handleQuickSchedule(eventData, idx)}
                                disabled={schedulingIndex === idx}
                                className="w-full py-2 text-[13px] font-medium text-white transition-colors duration-200 disabled:opacity-70 flex items-center justify-center gap-2"
                                style={{
                                    background: "var(--accent)",
                                    borderRadius: 8,
                                }}
                            >
                                {schedulingIndex === idx ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" /> Adding...
                                    </>
                                ) : (
                                    "Add to Calendar"
                                )}
                            </button>
                        </div>
                    )}
                </div>
            );
        }
        return <div className="whitespace-pre-wrap">{content}</div>;
    };

    /* Sessions sidebar — used on both desktop and mobile drawer */
    const sessionsPanel = (
        <div className="flex flex-col h-full" style={{ background: "var(--card)" }}>
            <div className="p-4 flex items-center gap-3 shrink-0" style={{ borderBottom: "1px solid var(--separator)" }}>
                <span className="font-semibold text-[14px] lg:block hidden" style={{ color: "var(--foreground)" }}>Conversations</span>
                <button
                    onClick={handleNewSession}
                    className="flex-1 lg:flex-none flex items-center justify-center gap-2 py-2.5 px-4 text-[13px] font-medium text-white transition-colors duration-200 min-h-[44px]"
                    style={{
                        background: "var(--accent)",
                        borderRadius: 12,
                    }}
                >
                    <Plus size={15} strokeWidth={2} /> New Chat
                </button>
                <button
                    onClick={() => setMobileSessionsOpen(false)}
                    className="lg:hidden p-2.5 -mr-2"
                    style={{ color: "var(--muted-foreground)", borderRadius: 8 }}
                    aria-label="Close"
                >
                    <X size={18} />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5 min-h-0">
                {!isLoggedIn ? (
                    <div className="flex flex-col items-center justify-center h-full py-10 px-4 text-center gap-3">
                        <LogIn size={28} style={{ color: "var(--muted-foreground)", opacity: 0.4 }} />
                        <p className="text-[13px]" style={{ color: "var(--muted-foreground)" }}>
                            Login to save and view your chat history
                        </p>
                        <button
                            onClick={() => router.push("/auth/login?returnTo=/chat")}
                            className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-white transition-colors duration-200"
                            style={{ background: "var(--accent)", borderRadius: 20 }}
                        >
                            <LogIn size={13} />
                            Login
                        </button>
                    </div>
                ) : (
                    <>
                        {sessions.map(session => (
                            <div key={session.id} className="group relative">
                                <button
                                    onClick={() => loadSession(session.id)}
                                    className="w-full text-left p-3 text-[13px] truncate flex items-center gap-2.5 transition-colors duration-150 pr-12 min-h-[44px]"
                                    style={{
                                        borderRadius: 10,
                                        background: currentSessionId === session.id ? "var(--muted)" : "transparent",
                                        color: currentSessionId === session.id ? "var(--accent)" : "var(--muted-foreground)",
                                        fontWeight: currentSessionId === session.id ? 500 : 400,
                                    }}
                                    onMouseEnter={(e) => { if (currentSessionId !== session.id) e.currentTarget.style.background = "var(--muted)"; }}
                                    onMouseLeave={(e) => { if (currentSessionId !== session.id) e.currentTarget.style.background = "transparent"; }}
                                >
                                    <MessageSquare size={14} className="shrink-0" strokeWidth={1.5} />
                                    <span className="truncate">{session.title}</span>
                                </button>
                                <button
                                    onClick={(e) => handleDeleteSession(e, session.id)}
                                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 min-w-[36px] min-h-[36px] flex items-center justify-center lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-150"
                                    style={{ color: "var(--muted-foreground)", borderRadius: 8 }}
                                    title="Delete Conversation"
                                    aria-label="Delete conversation"
                                    onMouseEnter={(e) => { e.currentTarget.style.color = "var(--destructive)"; e.currentTarget.style.background = "rgba(255,59,48,0.06)"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted-foreground)"; e.currentTarget.style.background = "transparent"; }}
                                >
                                    <Trash2 size={14} strokeWidth={1.5} />
                                </button>
                            </div>
                        ))}
                        {sessions.length === 0 && (
                            <div className="text-center py-10 text-[13px] px-4" style={{ color: "var(--muted-foreground)" }}>
                                No history yet. Start a new chat above.
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );

    return (
        <div
            className="flex flex-col lg:flex-row gap-0 lg:gap-4 overflow-hidden h-[calc(100svh-11rem)] lg:h-[calc(100dvh-12rem)]"
            style={{
                borderRadius: 16,
            }}
        >
            {/* Delete Conversation Confirmation Modal */}
            <AnimatePresence>
                {confirmDeleteSessionId !== null && (
                    <>
                        <motion.div
                            variants={backdropFade}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="fixed inset-0 z-[60]"
                            style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" }}
                            onClick={() => setConfirmDeleteSessionId(null)}
                        />
                        <motion.div
                            variants={scaleIn}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
                            onClick={(e) => e.target === e.currentTarget && setConfirmDeleteSessionId(null)}
                        >
                            <div
                                className="max-w-sm w-full p-6"
                                style={{
                                    background: "var(--card)",
                                    border: "1px solid var(--card-border)",
                                    borderRadius: 20,
                                    boxShadow: "var(--shadow-xl)",
                                }}
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(255,59,48,0.08)" }}>
                                        <Trash2 size={18} style={{ color: "var(--destructive)" }} />
                                    </div>
                                    <h2 className="text-[17px] font-semibold" style={{ color: "var(--foreground)" }}>Delete Conversation?</h2>
                                </div>
                                <p className="text-[14px] mb-6" style={{ color: "var(--muted-foreground)" }}>
                                    Are you sure you want to delete <strong style={{ color: "var(--foreground)" }}>{sessions.find(s => s.id === confirmDeleteSessionId)?.title}</strong>? This action cannot be undone.
                                </p>
                                <div className="flex gap-2 justify-end">
                                    <button
                                        onClick={() => setConfirmDeleteSessionId(null)}
                                        disabled={deletingSession}
                                        className="px-4 py-2 text-[13px] font-medium transition-colors duration-150 disabled:opacity-60"
                                        style={{ color: "var(--foreground)", background: "var(--muted)", borderRadius: 10 }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmDeleteSession}
                                        disabled={deletingSession}
                                        className="px-4 py-2 text-[13px] font-medium text-white flex items-center gap-2 transition-colors duration-150 disabled:opacity-70"
                                        style={{ background: "var(--destructive)", borderRadius: 10 }}
                                    >
                                        {deletingSession ? (
                                            <Loader2 size={13} className="animate-spin" />
                                        ) : (
                                            <Trash2 size={13} />
                                        )}
                                        {deletingSession ? "Deleting..." : "Delete"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Mobile: overlay sidebar — NOT full width, 75% with blur backdrop */}
            <AnimatePresence>
                {mobileSessionsOpen && (
                    <>
                        <motion.div
                            variants={backdropFade}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="fixed inset-0 z-40 lg:hidden"
                            style={{
                                background: "rgba(0,0,0,0.3)",
                                backdropFilter: "blur(12px)",
                                WebkitBackdropFilter: "blur(12px)",
                            }}
                            onClick={() => setMobileSessionsOpen(false)}
                            aria-hidden
                        />
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={appleSoftSpring}
                            className="fixed inset-y-0 left-0 z-50 lg:hidden flex flex-col"
                            style={{
                                width: "min(280px, 75vw)",
                                boxShadow: "var(--shadow-xl)",
                                borderRight: "1px solid var(--separator)",
                            }}
                        >
                            {sessionsPanel}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar */}
            <div
                className="hidden lg:flex w-64 shrink-0 overflow-hidden flex-col"
                style={{
                    background: "var(--card)",
                    border: "1px solid var(--card-border)",
                    borderRadius: 16,
                }}
            >
                {sessionsPanel}
            </div>

            {/* Main Chat Area */}
            <div
                className="flex-1 min-w-0 flex flex-col overflow-hidden relative"
                style={{
                    background: "var(--card)",
                    border: "1px solid var(--card-border)",
                    borderRadius: 16,
                }}
            >
                {/* Mobile: header with menu */}
                <div
                    className="lg:hidden flex items-center gap-2 px-4 py-3 shrink-0"
                    style={{ borderBottom: "1px solid var(--separator)" }}
                >
                    <button
                        onClick={() => setMobileSessionsOpen(true)}
                        className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center"
                        style={{ color: "var(--muted-foreground)", borderRadius: 8 }}
                        aria-label="Open conversations"
                    >
                        <Menu size={20} strokeWidth={1.5} />
                    </button>
                    <span className="text-[14px] font-medium truncate" style={{ color: "var(--foreground)" }}>
                        {currentSessionId ? sessions.find(s => s.id === currentSessionId)?.title ?? "Chat" : "New Chat"}
                    </span>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-8 py-6 space-y-5 min-h-0">
                    {messages.length === 0 ? (
                        <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center px-4">
                            <div
                                className="w-14 h-14 flex items-center justify-center mb-4"
                                style={{ background: "var(--muted)", borderRadius: 14 }}
                            >
                                <Bot size={28} strokeWidth={1.5} style={{ color: "var(--muted-foreground)" }} />
                            </div>
                            <p className="text-[15px]" style={{ color: "var(--foreground)" }}>
                                Select a conversation or start a new one to begin drafting.
                            </p>
                            <button
                                onClick={() => setMobileSessionsOpen(true)}
                                className="lg:hidden mt-3 text-[13px] font-medium transition-opacity duration-150 hover:opacity-70"
                                style={{ color: "var(--accent)" }}
                            >
                                Open conversations
                            </button>
                        </div>
                    ) : (
                        messages.map((msg, idx) => (
                            <div key={idx} className={cn("flex gap-3 max-w-3xl", msg.role === "user" ? "ml-auto flex-row-reverse" : "")}>
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1"
                                    style={{
                                        background: msg.role === "assistant" ? "var(--muted)" : "var(--accent)",
                                        color: msg.role === "assistant" ? "var(--muted-foreground)" : "white",
                                    }}
                                >
                                    {msg.role === "assistant" ? <Bot size={16} strokeWidth={1.5} /> : <User size={16} strokeWidth={1.5} />}
                                </div>
                                <div
                                    className="p-4 text-[14px] leading-relaxed max-w-[85%] sm:max-w-[80%] break-words"
                                    style={{
                                        background: msg.role === "assistant" ? "var(--muted)" : "rgba(0,113,227,0.06)",
                                        borderRadius: msg.role === "assistant"
                                            ? "16px 16px 16px 4px"
                                            : "16px 16px 4px 16px",
                                        color: "var(--foreground)",
                                    }}
                                >
                                    {msg.document_name && (
                                        <div
                                            className="flex items-center gap-2 mb-3 pb-3 text-[12px] font-medium"
                                            style={{
                                                borderBottom: "1px solid var(--separator)",
                                                color: "var(--accent)",
                                            }}
                                        >
                                            <FileText size={13} strokeWidth={1.5} />
                                            <span className="truncate">Reference: {msg.document_name}</span>
                                        </div>
                                    )}
                                    {renderMessageContent(msg.content, idx)}
                                </div>
                            </div>
                        ))
                    )}
                    {loading && (
                        <div className="flex gap-3 max-w-3xl">
                            <div
                                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                                style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
                            >
                                <Bot size={16} strokeWidth={1.5} />
                            </div>
                            <div
                                className="p-4 flex items-center gap-1.5"
                                style={{
                                    background: "var(--muted)",
                                    borderRadius: "16px 16px 16px 4px",
                                }}
                            >
                                {[0, 150, 300].map((delay) => (
                                    <span
                                        key={delay}
                                        className="w-1.5 h-1.5 rounded-full animate-bounce"
                                        style={{
                                            background: "var(--muted-foreground)",
                                            animationDelay: `${delay}ms`,
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                    <div ref={scrollRef} />
                </div>

                {/* Input Area — upload icon vertically centered with textarea */}
                <div
                    className="px-4 sm:px-6 py-3 shrink-0"
                    style={{
                        borderTop: "1px solid var(--separator)",
                        paddingBottom: "max(12px, env(safe-area-inset-bottom))",
                    }}
                >
                    <div className="flex gap-2 max-w-3xl mx-auto items-center">
                        <input
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={loading}
                            className="p-2.5 transition-colors duration-150 disabled:opacity-50 w-10 h-10 flex items-center justify-center shrink-0 relative"
                            style={{
                                borderRadius: 10,
                                color: pendingFile ? "var(--accent)" : "var(--muted-foreground)",
                                background: pendingFile ? "rgba(0,113,227,0.06)" : "transparent",
                            }}
                            title="Attach PDF Context"
                            aria-label="Attach PDF"
                        >
                            <Paperclip size={18} strokeWidth={1.5} />
                            {pendingFile && (
                                <span
                                    className="absolute top-1 right-1 w-2 h-2 rounded-full"
                                    style={{ background: "var(--destructive)" }}
                                />
                            )}
                        </button>

                        <div className="flex-1 min-w-0 relative">
                            {pendingFile && (
                                <div
                                    className="absolute -top-7 left-3 text-[11px] font-medium px-2 py-0.5 flex items-center gap-1 max-w-full truncate"
                                    style={{
                                        background: "rgba(0,113,227,0.06)",
                                        color: "var(--accent)",
                                        borderRadius: "6px 6px 0 0",
                                    }}
                                >
                                    <FileText size={10} className="shrink-0" /> <span className="truncate">{pendingFile.name}</span>
                                </div>
                            )}
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                placeholder={pendingFile ? "Add a message with your file..." : "Draft a notice for... or Ask about IPC Section..."}
                                className="w-full px-4 py-3 text-[14px] outline-none resize-none max-h-28 min-h-[44px]"
                                style={{
                                    background: "var(--muted)",
                                    borderRadius: pendingFile ? "0 20px 20px 20px" : 20,
                                    border: "1px solid transparent",
                                    color: "var(--foreground)",
                                }}
                                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.background = "var(--card)"; }}
                                onBlur={(e) => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.background = "var(--muted)"; }}
                                rows={1}
                            />
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSend}
                            disabled={(!input.trim() && !pendingFile) || loading}
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200 shrink-0"
                            style={{ background: "var(--accent)" }}
                            aria-label="Send"
                        >
                            <Send size={16} strokeWidth={2} />
                        </motion.button>
                    </div>
                </div>
            </div>
        </div>
    );
}
