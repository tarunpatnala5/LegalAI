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
                Main content spacing:
                Mobile:  pt-20 = 80px  (clears 56px h-14 top bar + 24px gap)
                Desktop: pt-24 = 96px  (clears floating navbar)
                Bottom:  pb-32 = 128px mobile (clears floating bottom pill)
                         pb-16 = 64px  desktop
            */}
            <main
                style={{
                    paddingTop: "clamp(80px, 12vw, 96px)",
                }}
                className="w-full max-w-screen-xl mx-auto px-5 sm:px-8 lg:px-16 lg:!pt-24 pb-32 lg:pb-16"
            >
                {children}
            </main>
        </div>
    );
}
