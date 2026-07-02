"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff, Lock, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/motion";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token") || "";

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    useEffect(() => {
        if (!token) {
            toast.error("Invalid reset link");
            router.push("/auth/forgot-password");
        }
    }, [token, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
        if (password !== confirmPassword) { toast.error("Passwords do not match"); return; }

        setLoading(true);
        try {
            await api.post("/auth/reset-password", { token, new_password: password });
            setDone(true);
            toast.success("Password reset successfully!");
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Reset failed. Link may have expired.");
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        background: "var(--muted)",
        borderRadius: "var(--radius-md)",
        border: "1px solid transparent",
        color: "var(--foreground)",
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        e.currentTarget.style.borderColor = "var(--accent)";
        e.currentTarget.style.background = "var(--card)";
    };
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        e.currentTarget.style.borderColor = "transparent";
        e.currentTarget.style.background = "var(--muted)";
    };

    if (done) {
        return (
            <div className="min-h-screen flex items-center justify-center p-5" style={{ background: "var(--background)" }}>
                <motion.div
                    variants={fadeInUp}
                    initial="hidden"
                    animate="visible"
                    className="max-w-[400px] w-full p-10 text-center space-y-5"
                    style={{
                        background: "var(--card)",
                        border: "1px solid var(--card-border)",
                        borderRadius: "var(--radius-2xl)",
                        boxShadow: "var(--shadow-lg)",
                    }}
                >
                    <div
                        className="w-14 h-14 flex items-center justify-center mx-auto"
                        style={{ background: "rgba(52,199,89,0.1)", borderRadius: "var(--radius-xl)" }}
                    >
                        <CheckCircle2 size={28} style={{ color: "#34c759" }} strokeWidth={1.5} />
                    </div>
                    <h1 className="font-display text-[24px] font-semibold" style={{ color: "var(--foreground)" }}>
                        Password Reset!
                    </h1>
                    <p className="text-[15px]" style={{ color: "var(--muted-foreground)" }}>
                        Your password has been updated successfully.
                    </p>
                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => router.push("/auth/login")}
                        className="w-full py-3.5 text-[15px] font-semibold text-white transition-colors duration-200"
                        style={{ background: "var(--accent)", borderRadius: "var(--radius-full)" }}
                    >
                        Go to Login
                    </motion.button>
                </motion.div>
            </div>
        );
    }

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
                        style={{ background: "var(--accent)", borderRadius: "var(--radius-xl)" }}
                    >
                        <Lock size={28} className="text-white" strokeWidth={1.5} />
                    </div>
                    <h1 className="font-display text-[24px] font-semibold" style={{ color: "var(--foreground)" }}>
                        Set New Password
                    </h1>
                    <p className="text-[15px] mt-2" style={{ color: "var(--muted-foreground)" }}>
                        Enter your new password below
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-[13px] font-medium mb-2" style={{ color: "var(--foreground)" }}>New Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2" size={16} strokeWidth={1.5} style={{ color: "var(--muted-foreground)" }} />
                            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-10 py-3 text-[15px] outline-none transition-all duration-200" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} placeholder="Minimum 8 characters" required />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5" style={{ color: "var(--muted-foreground)" }}>
                                {showPassword ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[13px] font-medium mb-2" style={{ color: "var(--foreground)" }}>Confirm Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2" size={16} strokeWidth={1.5} style={{ color: "var(--muted-foreground)" }} />
                            <input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 text-[15px] outline-none transition-all duration-200" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} placeholder="Re-enter your password" required />
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 text-[15px] font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-colors duration-200 mt-6"
                        style={{ background: "var(--accent)", borderRadius: "var(--radius-full)" }}
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : "Update Password"}
                    </motion.button>
                    <p className="text-center text-[14px]" style={{ color: "var(--muted-foreground)" }}>
                        <Link href="/auth/login" className="font-medium transition-opacity duration-150 hover:opacity-70" style={{ color: "var(--accent)" }}>
                            Back to Login
                        </Link>
                    </p>
                </form>
            </motion.div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-6 h-6 rounded-full animate-spin" style={{ border: "2px solid var(--accent)", borderTopColor: "transparent" }} />
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}
