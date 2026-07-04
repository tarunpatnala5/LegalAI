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

            {/*
                Spacer approach for mobile top bar clearance.
                Mobile top bar = h-14 (56px), fixed at top-0.
                We use a 72px spacer (56px bar + 16px gap) + pt-4 (16px) in main = 88px total.
                Desktop floating nav ≈ 48px + 16px top offset = ~64px.
                We use 80px spacer + pt-6 (24px) = 104px total.
            */}
            <div className="lg:hidden" style={{ height: 72 }} aria-hidden="true" />
            <div className="hidden lg:block" style={{ height: 80 }} aria-hidden="true" />

            <main className="w-full max-w-screen-xl mx-auto px-5 sm:px-8 lg:px-16 pt-4 lg:pt-6 pb-28 lg:pb-16">
                {children}
            </main>
        </div>
    );
}
