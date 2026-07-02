"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Share2, Printer, Bookmark } from "lucide-react";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/motion";

interface Verdict {
    id: number;
    title: string;
    summary: string;
    effective_date: string;
    details: string;
}

export default function VerdictPage() {
    const params = useParams();
    const router = useRouter();
    const [verdict, setVerdict] = useState<Verdict | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVerdict = async () => {
            try {
                const response = await api.get("/verdicts/recent");
                const found = response.data.find((v: Verdict) => v.id === Number(params.id));
                setVerdict(found || null);
            } catch (error) {
                console.error("Error fetching verdict", error);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) fetchVerdict();
    }, [params.id]);

    if (loading) return (
        <div className="text-center py-16 text-[15px]" style={{ color: "var(--muted-foreground)" }}>
            Loading case details...
        </div>
    );

    if (!verdict) return (
        <div className="text-center py-16 text-[15px]" style={{ color: "var(--destructive)" }}>
            Verdict not found
        </div>
    );

    const actionBtnStyle = {
        color: "var(--muted-foreground)",
    };

    return (
        <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="max-w-3xl mx-auto space-y-6"
        >
            <button
                onClick={() => router.back()}
                className="flex items-center gap-1 text-[14px] font-medium transition-opacity duration-150 hover:opacity-70"
                style={{ color: "var(--accent)" }}
            >
                <ArrowLeft size={16} strokeWidth={1.5} /> Back to Dashboard
            </button>

            <div
                className="p-8"
                style={{
                    background: "var(--card)",
                    border: "1px solid var(--card-border)",
                    borderRadius: "var(--radius-xl)",
                    boxShadow: "var(--shadow-sm)",
                }}
            >
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <span
                            className="inline-block px-3 py-1 text-[11px] font-semibold mb-3"
                            style={{
                                background: "rgba(0,113,227,0.06)",
                                color: "var(--accent)",
                                borderRadius: "var(--radius-full)",
                            }}
                        >
                            Supreme Court Judgement
                        </span>
                        <h1
                            className="font-display text-[24px] sm:text-[28px] font-semibold leading-tight"
                            style={{ color: "var(--foreground)" }}
                        >
                            {verdict.title}
                        </h1>
                        <div className="flex items-center gap-3 mt-3 text-[13px]" style={{ color: "var(--muted-foreground)" }}>
                            <span className="flex items-center gap-1">
                                <Calendar size={13} strokeWidth={1.5} />
                                {verdict.effective_date}
                            </span>
                            <span>\u00b7</span>
                            <span>Case ID: SC-{verdict.id}-2024</span>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        {[
                            { icon: Bookmark, label: "Bookmark" },
                            { icon: Printer, label: "Print" },
                            { icon: Share2, label: "Share" },
                        ].map(({ icon: Icon, label }) => (
                            <button
                                key={label}
                                className="p-2.5 rounded-lg transition-colors duration-150"
                                style={actionBtnStyle}
                                title={label}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--muted)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                            >
                                <Icon size={18} strokeWidth={1.5} />
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <h3 className="text-[16px] font-semibold mb-2" style={{ color: "var(--foreground)" }}>Summary</h3>
                        <p
                            className="text-[14px] leading-relaxed p-5"
                            style={{
                                color: "var(--foreground)",
                                background: "var(--muted)",
                                borderRadius: "var(--radius-lg)",
                            }}
                        >
                            {verdict.summary}
                        </p>
                    </div>

                    <div>
                        <h3 className="text-[16px] font-semibold mb-2" style={{ color: "var(--foreground)" }}>Full Details</h3>
                        <p
                            className="text-[14px] leading-relaxed whitespace-pre-line"
                            style={{ color: "var(--muted-foreground)" }}
                        >
                            {verdict.details}
                            <br /><br />
                            The court, having heard the arguments from both sides, observed that the fundamental question of law revolves around the interpretation of the statute in question.
                            Precedents were cited, but distinguishing factors in the current case necessitate a fresh perspective...
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
