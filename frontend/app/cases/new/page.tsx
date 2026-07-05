"use client";

import { useState } from "react";
import { UploadCloud, FileText, Check, Languages, X, Loader2 } from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/motion";

const LANGUAGES = [
    "English", "Hindi", "Bengali", "Telugu", "Marathi", "Tamil", "Urdu", "Gujarati",
    "Kannada", "Malayalam", "Odia", "Punjabi", "Assamese", "Maithili", "Santali",
    "Kashmiri", "Nepali", "Konkani", "Sindhi", "Dogri", "Manipuri", "Bodo", "Sanskrit"
];

export default function NewCasePage() {
    const [file, setFile] = useState<File | null>(null);
    const [language, setLanguage] = useState("Hindi");
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("language", language);

        try {
            await api.post("/cases/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            toast.success("Case file uploaded successfully!");
            setFile(null);
        } catch (error) {
            toast.error("Upload failed. Please try again.");
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="max-w-xl mx-auto"
        >
            <div className="mb-8">
                <h1
                    className="font-display text-[28px] font-semibold"
                    style={{ color: "var(--foreground)" }}
                >
                    Upload New Case
                </h1>
                <p className="text-[15px] mt-1" style={{ color: "var(--muted-foreground)" }}>
                    Upload case documents (PDF) for AI analysis and translation.
                </p>
            </div>

            <div
                className="p-8 space-y-6"
                style={{
                    background: "var(--card)",
                    border: "1px solid var(--card-border)",
                    borderRadius: "var(--radius-xl)",
                    boxShadow: "var(--shadow-sm)",
                }}
            >
                {/* File Drop Zone */}
                <div
                    className="p-10 flex flex-col items-center justify-center transition-all duration-200 cursor-pointer group"
                    style={{
                        border: "1px dashed var(--separator)",
                        borderRadius: "var(--radius-lg)",
                        background: "var(--muted)",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--separator)"; }}
                >
                    <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center w-full">
                        <div
                            className="w-14 h-14 flex items-center justify-center mb-4"
                            style={{
                                background: file ? "rgba(52,199,89,0.1)" : "rgba(0,113,227,0.08)",
                                borderRadius: "var(--radius-xl)",
                            }}
                        >
                            {file ? (
                                <FileText size={28} strokeWidth={1.5} style={{ color: "#34c759" }} />
                            ) : (
                                <UploadCloud size={28} strokeWidth={1.5} style={{ color: "var(--accent)" }} />
                            )}
                        </div>
                        {file ? (
                            <div className="text-center">
                                <p className="text-[15px] font-semibold" style={{ color: "var(--foreground)" }}>
                                    {file.name}
                                </p>
                                <p className="text-[13px] mt-1" style={{ color: "var(--muted-foreground)" }}>
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                                <button
                                    onClick={(e) => { e.preventDefault(); setFile(null); }}
                                    className="flex items-center gap-1 mx-auto mt-2 text-[12px] font-medium transition-opacity duration-150 hover:opacity-70"
                                    style={{ color: "var(--destructive)" }}
                                >
                                    <X size={12} /> Remove
                                </button>
                            </div>
                        ) : (
                            <div className="text-center">
                                <p className="text-[15px] font-medium" style={{ color: "var(--foreground)" }}>
                                    Click to upload or drag and drop
                                </p>
                                <p className="text-[13px] mt-1" style={{ color: "var(--muted-foreground)" }}>
                                    PDF files only (Max 10MB)
                                </p>
                            </div>
                        )}
                    </label>
                </div>

                {/* Language Selection */}
                <div>
                    <label className="flex items-center gap-2 text-[13px] font-medium mb-2" style={{ color: "var(--foreground)" }}>
                        <Languages size={14} strokeWidth={1.5} style={{ color: "var(--muted-foreground)" }} />
                        Target Translation Language
                    </label>
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full px-4 py-3 text-[15px] outline-none transition-all duration-200 appearance-none cursor-pointer"
                        style={{
                            background: "var(--muted)",
                            borderRadius: "var(--radius-md)",
                            border: "1px solid transparent",
                            color: "var(--foreground)",
                        }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = "transparent"; }}
                    >
                        {LANGUAGES.map(lang => (
                            <option key={lang} value={lang}>{lang}</option>
                        ))}
                    </select>
                </div>

                {/* Submit */}
                <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className="w-full py-3.5 text-[15px] font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    style={{
                        background: "var(--accent)",
                        borderRadius: "var(--radius-full)",
                    }}
                >
                    {uploading ? (
                        <>
                            <Loader2 size={18} className="animate-spin" /> Uploading...
                        </>
                    ) : (
                        <>
                            <Check size={18} strokeWidth={2} /> Process Case File
                        </>
                    )}
                </motion.button>
            </div>
        </motion.div>
    );
}
