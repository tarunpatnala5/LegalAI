"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, FileText, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/motion";

interface CaseDetail {
    id: number;
    filename: string;
    uploaded_at: string;
    target_language: string;
    translated_content: string;
}

const POLLING_INTERVAL = 5000; // 5 s — re-fetch while translation is pending

export default function DocumentViewerPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [doc, setDoc] = useState<CaseDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

    const isPending = (content: string) =>
        !content || content.startsWith("Translating…") || content.startsWith("Translation failed");

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;

        const fetch = async () => {
            try {
                const res = await api.get(`/cases/${id}`);
                setDoc(res.data);
                if (isPending(res.data.translated_content)) {
                    // Poll again after interval
                    timer = setTimeout(fetch, POLLING_INTERVAL);
                }
            } catch {
                // ignore — may have been deleted
            } finally {
                setLoading(false);
            }
        };

        fetch();
        return () => clearTimeout(timer);
    }, [id]);

    const handleDownload = async () => {
        if (!doc) return;
        setDownloading(true);
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
        } catch {
            alert("Download failed. Please try again.");
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 gap-2 text-[15px]" style={{ color: "var(--muted-foreground)" }}>
                <Loader2 className="animate-spin" size={18} /> Loading document\u2026
            </div>
        );
    }

    if (!doc) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4" style={{ color: "var(--muted-foreground)" }}>
                <p className="text-[15px]">Document not found.</p>
                <button
                    onClick={() => router.back()}
                    className="text-[14px] font-medium transition-opacity duration-150 hover:opacity-70"
                    style={{ color: "var(--accent)" }}
                >
                    \u2190 Go back
                </button>
            </div>
        );
    }

    const pending = isPending(doc.translated_content);

    return (
        <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="max-w-3xl mx-auto"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-lg transition-colors duration-150"
                        style={{ color: "var(--muted-foreground)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--muted)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                        <ArrowLeft size={18} strokeWidth={1.5} />
                    </button>
                    <div className="flex items-center gap-2.5">
                        <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center"
                            style={{ background: "rgba(255,59,48,0.06)" }}
                        >
                            <FileText size={16} strokeWidth={1.5} style={{ color: "#ff3b30" }} />
                        </div>
                        <div>
                            <h1 className="font-semibold text-[15px] leading-tight" style={{ color: "var(--foreground)" }}>
                                {doc.filename}
                            </h1>
                            <p className="text-[12px]" style={{ color: "var(--muted-foreground)" }}>
                                Translated to{" "}
                                <span className="font-medium" style={{ color: "var(--accent)" }}>{doc.target_language}</span>
                                {" \u00b7 "}
                                {new Date(doc.uploaded_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>

                {!pending && (
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleDownload}
                        disabled={downloading}
                        className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-white transition-colors duration-200 disabled:opacity-60"
                        style={{
                            background: "var(--accent)",
                            borderRadius: "var(--radius-full)",
                        }}
                    >
                        {downloading ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <Download size={14} strokeWidth={1.5} />
                        )}
                        Download Translation
                    </motion.button>
                )}
            </div>

            {/* Content box */}
            <div
                className="p-8"
                style={{
                    background: "var(--card)",
                    border: "1px solid var(--card-border)",
                    borderRadius: "var(--radius-xl)",
                    boxShadow: "var(--shadow-sm)",
                }}
            >
                {pending ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(0,113,227,0.08)" }}>
                            <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent)" }} />
                        </div>
                        <div className="text-center">
                            <p className="text-[15px] font-medium" style={{ color: "var(--foreground)" }}>
                                Translation in progress\u2026
                            </p>
                            <p className="text-[13px] mt-1" style={{ color: "var(--muted-foreground)" }}>
                                This page will automatically refresh once ready.
                            </p>
                        </div>
                    </div>
                ) : (
                    <pre
                        className="whitespace-pre-wrap text-[14px] leading-relaxed"
                        style={{
                            fontFamily: "var(--font-sf-text)",
                            color: "var(--foreground)",
                        }}
                    >
                        {doc.translated_content}
                    </pre>
                )}
            </div>
        </motion.div>
    );
}
