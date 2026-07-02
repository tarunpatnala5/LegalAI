"use client";

import { Moon, Sun, Bell, User, LogOut, Mail, Lock, Pencil, X, Check, Loader2, Trash2, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/theme-context";
import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/motion";

export default function SettingsPage() {
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const { user, logout, refreshUser } = useAuth();
    const [notifications, setNotifications] = useState(true);
    const [editOpen, setEditOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteInput, setDeleteInput] = useState("");
    const [deletingAccount, setDeletingAccount] = useState(false);

    const [form, setForm] = useState({
        full_name: user?.full_name || "",
        email: user?.email || "",
        current_password: "",
        new_password: "",
        confirm_password: "",
    });

    const handleLogout = () => {
        logout();
        router.push("/auth/login");
    };

    const handleDeleteAccount = async () => {
        if (deleteInput !== "DELETE") {
            toast.error("Type DELETE to confirm");
            return;
        }
        setDeletingAccount(true);
        try {
            await api.delete("/auth/me");
            toast.success("Account deleted");
            logout();
            router.push("/auth/login");
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Failed to delete account");
        } finally {
            setDeletingAccount(false);
        }
    };

    const openEdit = () => {
        setForm({
            full_name: user?.full_name || "",
            email: user?.email || "",
            current_password: "",
            new_password: "",
            confirm_password: "",
        });
        setEditOpen(true);
    };

    const handleSave = async () => {
        if (form.new_password && form.new_password !== form.confirm_password) {
            toast.error("New passwords do not match");
            return;
        }
        if (form.new_password && form.new_password.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }
        setSaving(true);
        try {
            await api.put("/auth/profile", {
                full_name: form.full_name || undefined,
                email: form.email !== user?.email ? form.email : undefined,
                current_password: form.current_password || undefined,
                new_password: form.new_password || undefined,
            });
            toast.success("Profile updated successfully!");
            await refreshUser();
            setEditOpen(false);
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Failed to update profile");
        } finally {
            setSaving(false);
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
        <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="max-w-2xl mx-auto space-y-6"
        >
            <h1 className="font-display text-[28px] font-semibold" style={{ color: "var(--foreground)" }}>
                Settings
            </h1>

            <div
                style={{
                    background: "var(--card)",
                    border: "1px solid var(--card-border)",
                    borderRadius: "var(--radius-xl)",
                    boxShadow: "var(--shadow-sm)",
                    overflow: "hidden",
                }}
            >
                {/* Account Profile */}
                <div className="px-5 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div
                                className="w-9 h-9 rounded-full flex items-center justify-center"
                                style={{ background: "rgba(0,113,227,0.08)" }}
                            >
                                <User size={18} strokeWidth={1.5} style={{ color: "var(--accent)" }} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-[15px]" style={{ color: "var(--foreground)" }}>Account Profile</h3>
                                <p className="text-[13px]" style={{ color: "var(--muted-foreground)" }}>
                                    {user ? `${user.full_name} \u00b7 ${user.email}` : "Manage your personal information"}
                                </p>
                            </div>
                        </div>
                        {user && (
                            <button
                                onClick={openEdit}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium transition-colors duration-150"
                                style={{
                                    color: "var(--accent)",
                                    background: "rgba(0,113,227,0.06)",
                                    borderRadius: "var(--radius-md)",
                                }}
                            >
                                <Pencil size={12} strokeWidth={1.5} /> Edit
                            </button>
                        )}
                    </div>

                    {/* Inline Edit Form */}
                    {editOpen && (
                        <div className="mt-5 pt-5 space-y-4" style={{ borderTop: "1px solid var(--separator)" }}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[12px] font-medium mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2" size={14} strokeWidth={1.5} style={{ color: "var(--muted-foreground)" }} />
                                        <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className="w-full pl-9 pr-3 py-2.5 text-[14px] outline-none transition-all duration-200" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} placeholder="Full Name" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[12px] font-medium mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2" size={14} strokeWidth={1.5} style={{ color: "var(--muted-foreground)" }} />
                                        <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full pl-9 pr-3 py-2.5 text-[14px] outline-none transition-all duration-200" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} placeholder="Email" />
                                    </div>
                                </div>
                            </div>
                            <div style={{ borderTop: "1px solid var(--separator)" }} className="pt-4">
                                <p className="text-[12px] font-medium mb-3" style={{ color: "var(--muted-foreground)" }}>Change Password</p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {[
                                        { label: "Current Password", key: "current_password" },
                                        { label: "New Password", key: "new_password" },
                                        { label: "Confirm New", key: "confirm_password" },
                                    ].map(({ label, key }) => (
                                        <div key={key}>
                                            <label className="text-[11px] font-medium mb-1 block" style={{ color: "var(--muted-foreground)" }}>{label}</label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2" size={13} strokeWidth={1.5} style={{ color: "var(--muted-foreground)" }} />
                                                <input type="password" value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className="w-full pl-9 pr-3 py-2.5 text-[14px] outline-none transition-all duration-200" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    onClick={() => setEditOpen(false)}
                                    className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium transition-colors duration-150"
                                    style={{ color: "var(--foreground)", background: "var(--muted)", borderRadius: "var(--radius-md)" }}
                                >
                                    <X size={13} /> Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-white disabled:opacity-60 transition-colors duration-150"
                                    style={{ background: "var(--accent)", borderRadius: "var(--radius-md)" }}
                                >
                                    {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Save Changes
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ borderTop: "1px solid var(--separator)" }} />

                {/* Notifications */}
                <div className="px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div
                            className="w-9 h-9 rounded-full flex items-center justify-center"
                            style={{ background: "rgba(175,82,222,0.08)" }}
                        >
                            <Bell size={18} strokeWidth={1.5} style={{ color: "#af52de" }} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-[15px]" style={{ color: "var(--foreground)" }}>Notifications</h3>
                            <p className="text-[13px]" style={{ color: "var(--muted-foreground)" }}>Case updates and reminders</p>
                        </div>
                    </div>
                    {/* Apple-style toggle */}
                    <button
                        onClick={() => setNotifications(!notifications)}
                        className="relative w-[51px] h-[31px] rounded-full transition-colors duration-300 p-0.5"
                        style={{ background: notifications ? "var(--accent)" : "var(--muted)" }}
                        role="switch"
                        aria-checked={notifications}
                    >
                        <div
                            className="w-[27px] h-[27px] bg-white rounded-full transition-transform duration-300"
                            style={{
                                transform: notifications ? "translateX(20px)" : "translateX(0px)",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                            }}
                        />
                    </button>
                </div>

                <div style={{ borderTop: "1px solid var(--separator)" }} />

                {/* Appearance */}
                <div className="px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div
                            className="w-9 h-9 rounded-full flex items-center justify-center"
                            style={{ background: "rgba(255,149,0,0.08)" }}
                        >
                            <Moon size={18} strokeWidth={1.5} style={{ color: "#ff9500" }} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-[15px]" style={{ color: "var(--foreground)" }}>Appearance</h3>
                            <p className="text-[13px]" style={{ color: "var(--muted-foreground)" }}>Toggle Dark/Light Mode</p>
                        </div>
                    </div>
                    {/* Segmented control */}
                    <div className="flex p-0.5" style={{ background: "var(--muted)", borderRadius: "var(--radius-sm)" }}>
                        <button
                            onClick={() => setTheme("light")}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium transition-all duration-200"
                            style={{
                                background: theme === "light" ? "var(--card)" : "transparent",
                                color: theme === "light" ? "var(--foreground)" : "var(--muted-foreground)",
                                borderRadius: "var(--radius-xs)",
                                boxShadow: theme === "light" ? "var(--shadow-sm)" : "none",
                            }}
                        >
                            <Sun size={12} /> Light
                        </button>
                        <button
                            onClick={() => setTheme("dark")}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium transition-all duration-200"
                            style={{
                                background: theme === "dark" ? "var(--card)" : "transparent",
                                color: theme === "dark" ? "var(--foreground)" : "var(--muted-foreground)",
                                borderRadius: "var(--radius-xs)",
                                boxShadow: theme === "dark" ? "var(--shadow-sm)" : "none",
                            }}
                        >
                            <Moon size={12} /> Dark
                        </button>
                    </div>
                </div>

                {/* Logout */}
                {user && (
                    <>
                        <div style={{ borderTop: "1px solid var(--separator)" }} />
                        <button
                            className="w-full px-5 py-4 flex items-center gap-4 transition-colors duration-150 text-left"
                            style={{ color: "var(--destructive)" }}
                            onClick={handleLogout}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,59,48,0.04)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                        >
                            <div
                                className="w-9 h-9 rounded-full flex items-center justify-center"
                                style={{ background: "rgba(255,59,48,0.08)" }}
                            >
                                <LogOut size={18} strokeWidth={1.5} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-[15px]">Log Out</h3>
                                <p className="text-[13px] opacity-70">Sign out of your account</p>
                            </div>
                        </button>
                    </>
                )}

                {/* Delete Account — not shown for admin */}
                {user && !user.is_admin && (
                    <>
                        <div style={{ borderTop: "1px solid var(--separator)" }} />
                        <div className="px-5 py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div
                                        className="w-9 h-9 rounded-full flex items-center justify-center"
                                        style={{ background: "rgba(255,59,48,0.08)" }}
                                    >
                                        <Trash2 size={18} strokeWidth={1.5} style={{ color: "var(--destructive)" }} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-[15px]" style={{ color: "var(--destructive)" }}>Delete Account</h3>
                                        <p className="text-[13px]" style={{ color: "var(--muted-foreground)" }}>Permanently remove your account and all data</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setShowDeleteConfirm(!showDeleteConfirm); setDeleteInput(""); }}
                                    className="px-3 py-1.5 text-[13px] font-medium transition-colors duration-150"
                                    style={{
                                        color: "var(--destructive)",
                                        background: "rgba(255,59,48,0.06)",
                                        borderRadius: "var(--radius-md)",
                                    }}
                                >
                                    {showDeleteConfirm ? "Cancel" : "Delete"}
                                </button>
                            </div>

                            {showDeleteConfirm && (
                                <div className="mt-5 pt-5 space-y-4" style={{ borderTop: "1px solid var(--separator)" }}>
                                    <div
                                        className="flex items-start gap-3 p-4"
                                        style={{
                                            background: "rgba(255,59,48,0.04)",
                                            border: "1px solid rgba(255,59,48,0.1)",
                                            borderRadius: "var(--radius-lg)",
                                        }}
                                    >
                                        <AlertTriangle size={16} strokeWidth={1.5} className="mt-0.5 shrink-0" style={{ color: "var(--destructive)" }} />
                                        <p className="text-[13px] leading-relaxed" style={{ color: "var(--destructive)" }}>
                                            This will <strong>permanently delete</strong> your account, all your cases, chat history, and schedules. This action <strong>cannot be undone</strong>.
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-[12px] font-medium mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>
                                            Type <span className="font-mono font-semibold" style={{ color: "var(--destructive)" }}>DELETE</span> to confirm
                                        </label>
                                        <input
                                            value={deleteInput}
                                            onChange={e => setDeleteInput(e.target.value)}
                                            placeholder="DELETE"
                                            className="w-full px-3 py-2.5 text-[14px] font-mono outline-none transition-all duration-200"
                                            style={{
                                                background: "var(--muted)",
                                                border: "1px solid rgba(255,59,48,0.15)",
                                                borderRadius: "var(--radius-md)",
                                                color: "var(--foreground)",
                                            }}
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleDeleteAccount}
                                            disabled={deletingAccount || deleteInput !== "DELETE"}
                                            className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                                            style={{
                                                background: "var(--destructive)",
                                                borderRadius: "var(--radius-md)",
                                            }}
                                        >
                                            {deletingAccount ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                            Permanently Delete Account
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </motion.div>
    );
}
