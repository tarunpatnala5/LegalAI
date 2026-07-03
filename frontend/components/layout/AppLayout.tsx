"use client";

import { usePathname } from "next/navigation";
import FloatingNavbar from "@/components/layout/FloatingNavbar";
import { motion, AnimatePresence } from "framer-motion";
import { pageTransition } from "@/lib/motion";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const isAuthPage = pathname?.startsWith("/auth");

    if (isAuthPage) {
        return (
            <div className="min-h-screen" style={{ background: "var(--background)" }}>
                {children}
            </div>
        );
    }

    return (
        <div
            className="min-h-screen"
            style={{ background: "var(--background)", color: "var(--foreground)" }}
        >
            <FloatingNavbar />

            {/* Main content — generous spacing, centered */}
            <main className="w-full max-w-screen-xl mx-auto px-5 sm:px-8 lg:px-16 pt-24 lg:pt-[120px] pb-28 lg:pb-16">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={pathname}
                        variants={pageTransition}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}
