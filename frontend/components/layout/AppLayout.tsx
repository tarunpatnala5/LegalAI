"use client";

import { usePathname } from "next/navigation";
import FloatingNavbar from "@/components/layout/FloatingNavbar";

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

            {/* Spacer — guarantees content never overlaps the fixed mobile top bar (h-14 = 56px) */}
            <div className="lg:hidden" style={{ height: 56 }} aria-hidden="true" />
            <div className="hidden lg:block" style={{ height: 72 }} aria-hidden="true" />

            <main className="w-full max-w-screen-xl mx-auto px-5 sm:px-8 lg:px-16 pt-4 lg:pt-6 pb-32 lg:pb-16">
                {children}
            </main>
        </div>
    );
}
