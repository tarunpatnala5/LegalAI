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

            {/* Main content
                Mobile: pt-[72px] clears the 56px (h-14) fixed mobile top bar + 16px gap
                Desktop: pt-[100px] clears the floating navbar (~48px + top-5 offset + gap) */}
            <main className="w-full max-w-screen-xl mx-auto px-5 sm:px-8 lg:px-16 pt-[72px] lg:pt-[100px] pb-24 lg:pb-16">
                {children}
            </main>
        </div>
    );
}
