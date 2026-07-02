"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Eye, EyeOff, Lock, Mail, User, Scale } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/motion";

const schema = z.object({
    full_name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormData) => {
        setLoading(true);
        try {
            const res = await api.post("/auth/register", {
                email: data.email,
                password: data.password,
                full_name: data.full_name
            });

            await login(res.data.access_token);
            toast.success("Welcome! Your account has been created.");
            router.push("/");
        } catch (error: any) {
            console.error("Registration Error:", error);
            const detail = error.response?.data?.detail;
            let errorMessage = "Registration failed. Try again.";

            if (typeof detail === "string") {
                errorMessage = detail;
            } else if (Array.isArray(detail)) {
                errorMessage = detail.map((err: any) => err.msg).join(", ");
            }

            toast.error(errorMessage);
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
                        <Scale size={28} className="text-white" strokeWidth={1.5} />
                    </div>
                    <h1 className="font-display text-[28px] font-semibold" style={{ color: "var(--foreground)" }}>
                        Create Account
                    </h1>
                    <p className="text-[15px] mt-2" style={{ color: "var(--muted-foreground)" }}>
                        Join the future of Legal Analytics
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-[13px] font-medium mb-2" style={{ color: "var(--foreground)" }}>Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2" size={16} strokeWidth={1.5} style={{ color: "var(--muted-foreground)" }} />
                            <input type="text" {...register("full_name")} className="w-full pl-10 pr-4 py-3 text-[15px] outline-none transition-all duration-200" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} placeholder="John Doe" />
                        </div>
                        {errors.full_name && <p className="text-[12px] mt-1.5" style={{ color: "var(--destructive)" }}>{errors.full_name.message}</p>}
                    </div>

                    <div>
                        <label className="block text-[13px] font-medium mb-2" style={{ color: "var(--foreground)" }}>Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2" size={16} strokeWidth={1.5} style={{ color: "var(--muted-foreground)" }} />
                            <input type="email" {...register("email")} className="w-full pl-10 pr-4 py-3 text-[15px] outline-none transition-all duration-200" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} placeholder="lawyer@example.com" />
                        </div>
                        {errors.email && <p className="text-[12px] mt-1.5" style={{ color: "var(--destructive)" }}>{errors.email.message}</p>}
                    </div>

                    <div>
                        <label className="block text-[13px] font-medium mb-2" style={{ color: "var(--foreground)" }}>Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2" size={16} strokeWidth={1.5} style={{ color: "var(--muted-foreground)" }} />
                            <input type={showPassword ? "text" : "password"} {...register("password")} className="w-full pl-10 pr-10 py-3 text-[15px] outline-none transition-all duration-200" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} placeholder="Minimum 8 characters" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5" style={{ color: "var(--muted-foreground)" }}>
                                {showPassword ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                            </button>
                        </div>
                        {errors.password && <p className="text-[12px] mt-1.5" style={{ color: "var(--destructive)" }}>{errors.password.message}</p>}
                    </div>

                    <div>
                        <label className="block text-[13px] font-medium mb-2" style={{ color: "var(--foreground)" }}>Confirm Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2" size={16} strokeWidth={1.5} style={{ color: "var(--muted-foreground)" }} />
                            <input type={showPassword ? "text" : "password"} {...register("confirmPassword")} className="w-full pl-10 pr-4 py-3 text-[15px] outline-none transition-all duration-200" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} placeholder="Re-enter your password" />
                        </div>
                        {errors.confirmPassword && <p className="text-[12px] mt-1.5" style={{ color: "var(--destructive)" }}>{errors.confirmPassword.message}</p>}
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 text-[15px] font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200 mt-6"
                        style={{ background: "var(--accent)", borderRadius: "var(--radius-full)" }}
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : "Create Account"}
                    </motion.button>
                </form>

                <p className="text-center text-[14px] mt-8" style={{ color: "var(--muted-foreground)" }}>
                    Already have an account?{" "}
                    <Link href="/auth/login" className="font-semibold transition-opacity duration-150 hover:opacity-70" style={{ color: "var(--accent)" }}>
                        Sign In
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
