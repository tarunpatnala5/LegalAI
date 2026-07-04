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
                Mobile: the top bar is `sticky` (see FloatingNavbar), so it lives
                in normal document flow and always pushes page content down by
                its own real height — no manual spacer to keep in sync, and no
                risk of content rendering underneath it.

                Desktop: the nav is a centered floating pill using `fixed`
                positioning (it doesn't span full width, so it can't be sticky
                the same way), so it still needs an explicit spacer below it.
            */}
            <div className="hidden lg:block" style={{ height: 80 }} aria-hidden="true" />

            <main className="w-full max-w-screen-xl mx-auto px-5 sm:px-8 lg:px-16 pt-4 lg:pt-6 pb-28 lg:pb-16">
                {children}
            </main>
        </div>
    );
}
