"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Eye, EyeOff, Lock, Mail, Scale } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/motion";

const schema = z.object({
    email: z.string().min(1, "Email or username required"),
    password: z.string().min(1, "Password required"),
});

type FormData = z.infer<typeof schema>;

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const returnTo = searchParams.get("returnTo") ?? "/";
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormData) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("username", data.email);
            params.append("password", data.password);

            const res = await api.post("/auth/login", params, {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
            });

            await login(res.data.access_token);
            toast.success("Login successful");
            router.push(returnTo);
        } catch (error: any) {
            if (error.response?.status === 401) {
                toast.error("Invalid credentials");
            } else {
                toast.error("Login failed. Please try again.");
            }
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
                        style={{
                            background: "var(--accent)",
                            borderRadius: "var(--radius-xl)",
                        }}
                    >
                        <Scale size={28} className="text-white" strokeWidth={1.5} />
                    </div>
                    <h1
                        className="font-display text-[28px] font-semibold"
                        style={{ color: "var(--foreground)" }}
                    >
                        Welcome Back
                    </h1>
                    <p className="text-[15px] mt-2" style={{ color: "var(--muted-foreground)" }}>
                        Secure access to your Legal AI Assistant
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div>
                        <label className="block text-[13px] font-medium mb-2" style={{ color: "var(--foreground)" }}>
                            Email
                        </label>
                        <div className="relative">
                            <Mail
                                className="absolute left-3.5 top-1/2 -translate-y-1/2"
                                size={16}
                                strokeWidth={1.5}
                                style={{ color: "var(--muted-foreground)" }}
                            />
                            <input
                                {...register("email")}
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
                        {errors.email && <p className="text-[12px] mt-1.5" style={{ color: "var(--destructive)" }}>{errors.email.message}</p>}
                    </div>

                    <div>
                        <label className="block text-[13px] font-medium mb-2" style={{ color: "var(--foreground)" }}>
                            Password
                        </label>
                        <div className="relative">
                            <Lock
                                className="absolute left-3.5 top-1/2 -translate-y-1/2"
                                size={16}
                                strokeWidth={1.5}
                                style={{ color: "var(--muted-foreground)" }}
                            />
                            <input
                                type={showPassword ? "text" : "password"}
                                {...register("password")}
                                className="w-full pl-10 pr-10 py-3 text-[15px] outline-none transition-all duration-200"
                                style={{
                                    background: "var(--muted)",
                                    borderRadius: "var(--radius-md)",
                                    border: "1px solid transparent",
                                    color: "var(--foreground)",
                                }}
                                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.background = "var(--card)"; }}
                                onBlur={(e) => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.background = "var(--muted)"; }}
                                placeholder="Enter your password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5"
                                style={{ color: "var(--muted-foreground)" }}
                            >
                                {showPassword ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                            </button>
                        </div>
                        {errors.password && <p className="text-[12px] mt-1.5" style={{ color: "var(--destructive)" }}>{errors.password.message}</p>}
                        <div className="flex justify-end mt-2">
                            <Link
                                href="/auth/forgot-password"
                                className="text-[13px] font-medium transition-opacity duration-150 hover:opacity-70"
                                style={{ color: "var(--accent)" }}
                            >
                                Forgot password?
                            </Link>
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 text-[15px] font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200"
                        style={{
                            background: "var(--accent)",
                            borderRadius: "var(--radius-full)",
                        }}
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : "Sign In"}
                    </motion.button>
                </form>

                <p className="text-center text-[14px] mt-8" style={{ color: "var(--muted-foreground)" }}>
                    Don&apos;t have an account?{" "}
                    <Link
                        href="/auth/register"
                        className="font-semibold transition-opacity duration-150 hover:opacity-70"
                        style={{ color: "var(--accent)" }}
                    >
                        Register for free
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense>
            <LoginForm />
        </Suspense>
    );
}
