"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Mail, KeyRound } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/motion";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post("/auth/forgot-password", { email });
            setSent(true);
            toast.success("Reset instructions sent!");
        } catch {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-5" style={{ background: "var(--background)" }}>
            <motion.div
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                className="max-w-[400px] w-full p-10"
                style={{
                    background: "var(--card)",
                    border: "1px solid var(--card-border)",
                    borderRadius: "var(--radius-2xl)",
                    boxShadow: "var(--shadow-lg)",
                }}
            >
                <div className="text-center mb-8">
                    <div
                        className="w-14 h-14 flex items-center justify-center mx-auto mb-5"
                        style={{ background: "var(--muted)", borderRadius: "var(--radius-xl)" }}
                    >
                        <KeyRound size={28} strokeWidth={1.5} style={{ color: "var(--foreground)" }} />
                    </div>
                    <h1 className="font-display text-[24px] font-semibold" style={{ color: "var(--foreground)" }}>
                        Forgot Password
                    </h1>
                    <p className="text-[15px] mt-2" style={{ color: "var(--muted-foreground)" }}>
                        Enter your registered email to receive a reset link
                    </p>
                </div>

                {sent ? (
                    <div className="text-center space-y-5">
                        <div
                            className="p-5"
                            style={{
                                background: "rgba(52,199,89,0.06)",
                                border: "1px solid rgba(52,199,89,0.15)",
                                borderRadius: "var(--radius-lg)",
                            }}
                        >
                            <p className="text-[15px] font-medium" style={{ color: "#34c759" }}>
                                Reset link sent!
                            </p>
                            <p className="text-[13px] mt-1.5" style={{ color: "var(--muted-foreground)" }}>
                                Check your inbox. If SMTP is not configured, the link appears in the server logs.
                            </p>
                        </div>
                        <Link
                            href="/auth/login"
                            className="text-[14px] font-medium transition-opacity duration-150 hover:opacity-70 inline-block"
                            style={{ color: "var(--accent)" }}
                        >
                            Back to Login
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-[13px] font-medium mb-2" style={{ color: "var(--foreground)" }}>
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2" size={16} strokeWidth={1.5} style={{ color: "var(--muted-foreground)" }} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-3 text-[15px] outline-none transition-all duration-200"
                                    style={{
                                        background: "var(--muted)",
                                        borderRadius: "var(--radius-md)",
                                        border: "1px solid transparent",
                                        color: "var(--foreground)",
                                    }}
                                    onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.background = "var(--card)"; }}
                                    onBlur={(e) => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.background = "var(--muted)"; }}
                                    placeholder="lawyer@example.com"
                                />
                            </div>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 text-[15px] font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-colors duration-200"
                            style={{ background: "var(--accent)", borderRadius: "var(--radius-full)" }}
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : "Send Reset Link"}
                        </motion.button>
                        <p className="text-center text-[14px]" style={{ color: "var(--muted-foreground)" }}>
                            <Link href="/auth/login" className="font-medium transition-opacity duration-150 hover:opacity-70" style={{ color: "var(--accent)" }}>
                                Back to Login
                            </Link>
                        </p>
                    </form>
                )}
            </motion.div>
        </div>
    );
}
