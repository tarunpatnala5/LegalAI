"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Users, Shield, MessageSquare, FolderOpen, Calendar, Trash2 } from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem, fadeInUp, scaleIn, backdropFade } from "@/lib/motion";

interface UserDetail {
    id: number;
    email: string;
    full_name: string;
    is_admin: boolean;
    is_active: boolean;
    created_at: string;
    chat_sessions: number;
    cases: number;
    schedules: number;
}

export default function AdminUsersPage() {
    const { user, isLoggedIn, isLoading } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState<UserDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

    useEffect(() => {
        if (!isLoading) {
            if (!isLoggedIn || !user?.is_admin) {
                toast.error("Admin access required");
                router.push("/");
                return;
            }
            fetchUsers();
        }
    }, [isLoading, isLoggedIn, user]);

    const fetchUsers = async () => {
        try {
            const res = await api.get("/auth/users");
            setUsers(res.data);
        } catch {
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };


    const handleDelete = async (id: number) => {
        if (id === user?.id) {
            toast.error("You cannot delete your own account");
            return;
        }
        setDeletingId(id);
        try {
            await api.delete(`/auth/users/${id}`);
            toast.success("User deleted successfully");
            setUsers(prev => prev.filter(u => u.id !== id));
        } catch {
            toast.error("Failed to delete user");
        } finally {
            setDeletingId(null);
            setConfirmDeleteId(null);
        }
    };

    if (isLoading || loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-6 h-6 rounded-full animate-spin" style={{ border: "2px solid var(--accent)", borderTopColor: "transparent" }} />
            </div>
        );
    }

    return (
        <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="max-w-6xl mx-auto space-y-6"
        >
            {/* Confirm delete modal */}
            <AnimatePresence>
                {confirmDeleteId !== null && (
                    <>
                        <motion.div
                            variants={backdropFade}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="fixed inset-0 z-50"
                            style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" }}
                            onClick={() => setConfirmDeleteId(null)}
                        />
                        <motion.div
                            variants={scaleIn}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                            onClick={(e) => e.target === e.currentTarget && setConfirmDeleteId(null)}
                        >
                            <div
                                className="w-full max-w-sm p-6"
                                style={{
                                    background: "var(--card)",
                                    border: "1px solid var(--card-border)",
                                    borderRadius: "var(--radius-xl)",
                                    boxShadow: "var(--shadow-xl)",
                                }}
                            >
                                <h2 className="text-[17px] font-semibold mb-2" style={{ color: "var(--foreground)" }}>Delete User?</h2>
                                <p className="text-[14px] mb-6" style={{ color: "var(--muted-foreground)" }}>
                                    This will permanently delete <strong style={{ color: "var(--foreground)" }}>{users.find(u => u.id === confirmDeleteId)?.full_name}</strong> and all their data. This action cannot be undone.
                                </p>
                                <div className="flex gap-2 justify-end">
                                    <button
                                        onClick={() => setConfirmDeleteId(null)}
                                        className="px-4 py-2 text-[13px] font-medium transition-colors duration-150"
                                        style={{ color: "var(--foreground)", background: "var(--muted)", borderRadius: "var(--radius-md)" }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleDelete(confirmDeleteId)}
                                        disabled={deletingId === confirmDeleteId}
                                        className="px-4 py-2 text-[13px] font-medium text-white disabled:opacity-60 flex items-center gap-2 transition-colors duration-150"
                                        style={{ background: "var(--destructive)", borderRadius: "var(--radius-md)" }}
                                    >
                                        {deletingId === confirmDeleteId ? (
                                            <div className="w-3.5 h-3.5 rounded-full animate-spin" style={{ border: "2px solid white", borderTopColor: "transparent" }} />
                                        ) : (
                                            <Trash2 size={13} />
                                        )}
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-[28px] font-semibold flex items-center gap-3" style={{ color: "var(--foreground)" }}>
                        <Users style={{ color: "var(--accent)" }} size={26} strokeWidth={1.5} />
                        User Management
                    </h1>
                </div>
                <span
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold"
                    style={{
                        background: "rgba(175,82,222,0.06)",
                        color: "#af52de",
                        borderRadius: "var(--radius-full)",
                    }}
                >
                    <Shield size={13} strokeWidth={1.5} /> Admin View
                </span>
            </div>

            {/* Stats row */}
            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-2 sm:grid-cols-4 gap-3"
            >
                {[
                    { label: "Total Users", value: users.length, tint: "rgba(0,113,227,0.08)", color: "var(--accent)" },
                    { label: "Admins", value: users.filter(u => u.is_admin).length, tint: "rgba(175,82,222,0.08)", color: "#af52de" },
                    { label: "Total Chats", value: users.reduce((a, u) => a + u.chat_sessions, 0), tint: "rgba(52,199,89,0.08)", color: "#34c759" },
                    { label: "Total Cases", value: users.reduce((a, u) => a + u.cases, 0), tint: "rgba(255,149,0,0.08)", color: "#ff9500" },
                ].map(stat => (
                    <motion.div
                        key={stat.label}
                        variants={staggerItem}
                        className="p-4"
                        style={{
                            background: "var(--card)",
                            border: "1px solid var(--card-border)",
                            borderRadius: "var(--radius-xl)",
                            boxShadow: "var(--shadow-sm)",
                        }}
                    >
                        <div className="font-display text-[28px] font-semibold" style={{ color: "var(--foreground)" }}>
                            {stat.value}
                        </div>
                        <div className="text-[12px] mt-1" style={{ color: "var(--muted-foreground)" }}>{stat.label}</div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Users — card rows */}
            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="space-y-2"
            >
                {users.map((u) => (
                    <motion.div
                        key={u.id}
                        variants={staggerItem}
                        className="flex items-center gap-4 p-4 transition-all duration-200"
                        style={{
                            background: "var(--card)",
                            border: "1px solid var(--card-border)",
                            borderRadius: "var(--radius-lg)",
                            boxShadow: "var(--shadow-sm)",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}
                    >
                        {/* Avatar */}
                        <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-[12px] shrink-0"
                            style={{ background: u.is_admin ? "#af52de" : "var(--accent)" }}
                        >
                            {u.full_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-[14px] font-medium truncate" style={{ color: "var(--foreground)" }}>
                                    {u.full_name}
                                </span>
                                {u.is_admin && (
                                    <span
                                        className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5"
                                        style={{
                                            background: "rgba(175,82,222,0.08)",
                                            color: "#af52de",
                                            borderRadius: "var(--radius-full)",
                                        }}
                                    >
                                        <Shield size={9} /> Admin
                                    </span>
                                )}
                            </div>
                            <span className="text-[12px] font-mono" style={{ color: "var(--muted-foreground)" }}>{u.email}</span>
                        </div>

                        {/* Stats */}
                        <div className="hidden sm:flex items-center gap-4 text-[12px]" style={{ color: "var(--muted-foreground)" }}>
                            <span className="flex items-center gap-1" title="Chat sessions">
                                <MessageSquare size={12} style={{ color: "var(--accent)" }} />{u.chat_sessions}
                            </span>
                            <span className="flex items-center gap-1" title="Cases">
                                <FolderOpen size={12} style={{ color: "#34c759" }} />{u.cases}
                            </span>
                            <span className="flex items-center gap-1" title="Schedules">
                                <Calendar size={12} style={{ color: "#ff9500" }} />{u.schedules}
                            </span>
                        </div>

                        {/* Joined date */}
                        <span className="hidden md:block text-[12px] shrink-0" style={{ color: "var(--muted-foreground)" }}>
                            {u.created_at ? new Date(u.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "\u2014"}
                        </span>

                        {/* Actions */}
                        <div className="shrink-0">
                            {u.id === user?.id ? (
                                <span className="text-[12px] font-medium" style={{ color: "var(--muted-foreground)" }}>You</span>
                            ) : (
                                <button
                                    onClick={() => setConfirmDeleteId(u.id)}
                                    className="p-2 rounded-lg transition-colors duration-150"
                                    style={{ color: "var(--muted-foreground)" }}
                                    title="Delete user"
                                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,59,48,0.06)"; e.currentTarget.style.color = "var(--destructive)"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--muted-foreground)"; }}
                                >
                                    <Trash2 size={15} strokeWidth={1.5} />
                                </button>
                            )}
                        </div>
                    </motion.div>
                ))}
            </motion.div>
        </motion.div>
    );
}
