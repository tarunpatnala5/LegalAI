"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Search, Download, Trash2 } from "lucide-react";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem, fadeInUp, scaleIn, backdropFade } from "@/lib/motion";

interface CaseDoc {
    id: number;
    filename: string;
    uploaded_at: string;
    target_language: string;
}

export default function LibraryPage() {
    const [cases, setCases] = useState<CaseDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [deleteConfirm, setDeleteConfirm] = useState<CaseDoc | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [downloadLoading, setDownloadLoading] = useState<number | null>(null);
    const router = useRouter();

    useEffect(() => {
        fetchCases();
    }, []);

    const fetchCases = async () => {
        setLoading(true);
        try {
            const response = await api.get("/cases");
            setCases(response.data);
        } catch (error) {
            console.error("Failed to fetch cases:", error);
        } finally {
            setLoading(false);
        }
    };

    // Navigate to the translated content viewer
    const handleView = (doc: CaseDoc) => {
        router.push(`/library/${doc.id}`);
    };

    // Download the translated .txt file
    const handleDownload = async (doc: CaseDoc) => {
        setDownloadLoading(doc.id);
        try {
            const res = await api.get(`/cases/${doc.id}/download`, { responseType: "blob" });
            const url = URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement("a");
            a.href = url;
            const base = doc.filename.replace(/\.pdf$/i, "");
            a.download = `${base}_${doc.target_language}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Download failed:", err);
            alert("Download failed. Please try again.");
        } finally {
            setDownloadLoading(null);
        }
    };

    // Delete document
    const handleDelete = async (doc: CaseDoc) => {
        setDeletingId(doc.id);
        try {
            await api.delete(`/cases/${doc.id}`);
            setCases((prev) => prev.filter((c) => c.id !== doc.id));
            setDeleteConfirm(null);
        } catch (err) {
            console.error("Delete failed:", err);
            alert("Delete failed. Please try again.");
        } finally {
            setDeletingId(null);
        }
    };

    const filteredCases = cases.filter(
        (doc) =>
            doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.target_language.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="max-w-5xl mx-auto"
        >
            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteConfirm && (
                    <>
                        <motion.div
                            variants={backdropFade}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="fixed inset-0 z-50"
                            style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" }}
                            onClick={() => setDeleteConfirm(null)}
                        />
                        <motion.div
                            variants={scaleIn}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                            onClick={(e) => e.target === e.currentTarget && setDeleteConfirm(null)}
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
                                <div className="flex items-start gap-3 mb-4">
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                                        style={{ background: "rgba(255,59,48,0.08)" }}
                                    >
                                        <Trash2 size={18} style={{ color: "var(--destructive)" }} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-[15px]" style={{ color: "var(--foreground)" }}>
                                            Delete Document
                                        </h3>
                                        <p className="text-[13px] mt-1" style={{ color: "var(--muted-foreground)" }}>
                                            Are you sure you want to delete{" "}
                                            <span className="font-medium" style={{ color: "var(--foreground)" }}>
                                                {deleteConfirm.filename}
                                            </span>
                                            ? This cannot be undone.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <button
                                        onClick={() => setDeleteConfirm(null)}
                                        className="px-4 py-2 text-[13px] font-medium transition-colors duration-150"
                                        style={{
                                            color: "var(--foreground)",
                                            background: "var(--muted)",
                                            borderRadius: "var(--radius-md)",
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleDelete(deleteConfirm)}
                                        disabled={deletingId === deleteConfirm.id}
                                        className="px-4 py-2 text-[13px] font-medium text-white transition-colors duration-150 disabled:opacity-60"
                                        style={{
                                            background: "var(--destructive)",
                                            borderRadius: "var(--radius-md)",
                                        }}
                                    >
                                        {deletingId === deleteConfirm.id ? "Deleting\u2026" : "Delete"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <h1
                    className="font-display text-[28px] font-semibold"
                    style={{ color: "var(--foreground)" }}
                >
                    Case Library
                </h1>
                <div className="relative w-full sm:w-auto">
                    <Search
                        className="absolute left-3.5 top-1/2 -translate-y-1/2"
                        size={15}
                        strokeWidth={1.5}
                        style={{ color: "var(--muted-foreground)" }}
                    />
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search documents..."
                        className="w-full sm:w-64 pl-10 pr-4 py-2.5 text-[14px] outline-none transition-all duration-200"
                        style={{
                            background: "var(--muted)",
                            borderRadius: "var(--radius-full)",
                            border: "1px solid transparent",
                            color: "var(--foreground)",
                        }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.background = "var(--card)"; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.background = "var(--muted)"; }}
                    />
                </div>
            </div>

            {/* Card-style rows */}
            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="space-y-2"
            >
                {loading ? (
                    [1, 2, 3].map((i) => (
                        <div key={i} className="skeleton h-20" style={{ borderRadius: "var(--radius-lg)" }} />
                    ))
                ) : filteredCases.length === 0 ? (
                    <div className="text-center py-16" style={{ color: "var(--muted-foreground)" }}>
                        <FileText size={40} className="mx-auto mb-3 opacity-30" />
                        <p className="text-[15px]">No documents found.</p>
                    </div>
                ) : (
                    filteredCases.map((doc) => (
                        <motion.div
                            key={doc.id}
                            variants={staggerItem}
                            className="flex items-center gap-4 p-4 transition-all duration-200 cursor-pointer group"
                            style={{
                                background: "var(--card)",
                                border: "1px solid var(--card-border)",
                                borderRadius: "var(--radius-lg)",
                                boxShadow: "var(--shadow-sm)",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}
                            onClick={() => handleView(doc)}
                        >
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                style={{ background: "rgba(255,59,48,0.06)" }}
                            >
                                <FileText size={18} strokeWidth={1.5} style={{ color: "#ff3b30" }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[15px] font-medium truncate" style={{ color: "var(--foreground)" }}>
                                    {doc.filename}
                                </p>
                                <div className="flex items-center gap-3 mt-0.5">
                                    <span
                                        className="text-[11px] font-medium px-2 py-0.5"
                                        style={{
                                            background: "rgba(0,113,227,0.06)",
                                            color: "var(--accent)",
                                            borderRadius: "var(--radius-full)",
                                        }}
                                    >
                                        {doc.target_language}
                                    </span>
                                    <span className="text-[12px]" style={{ color: "var(--muted-foreground)" }}>
                                        {new Date(doc.uploaded_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDownload(doc); }}
                                    disabled={downloadLoading === doc.id}
                                    title="Download translated text"
                                    className="p-2 rounded-lg transition-colors duration-150 disabled:opacity-50"
                                    style={{ color: "var(--muted-foreground)" }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--muted)"; e.currentTarget.style.color = "var(--accent)"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--muted-foreground)"; }}
                                >
                                    {downloadLoading === doc.id ? (
                                        <span className="w-4 h-4 rounded-full animate-spin inline-block" style={{ border: "2px solid var(--accent)", borderTopColor: "transparent" }} />
                                    ) : (
                                        <Download size={16} strokeWidth={1.5} />
                                    )}
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm(doc); }}
                                    title="Delete document"
                                    className="p-2 rounded-lg transition-colors duration-150"
                                    style={{ color: "var(--muted-foreground)" }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,59,48,0.06)"; e.currentTarget.style.color = "var(--destructive)"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--muted-foreground)"; }}
                                >
                                    <Trash2 size={16} strokeWidth={1.5} />
                                </button>
                            </div>
                        </motion.div>
                    ))
                )}
            </motion.div>
        </motion.div>
    );
}
