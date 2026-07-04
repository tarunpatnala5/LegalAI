"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence, useMotionValueEvent, useScroll } from "framer-motion";
import {
    Home, MessageSquare, PlusCircle, Library, Calendar,
    Settings, Scale, LogOut, LogIn, Users, Bell, Sun, Moon, X, MoreHorizontal,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import api from "@/lib/api";
import { appleSpring, fadeInDown, backdropFade } from "@/lib/motion";

interface ScheduleEvent {
    id: number;
    case_name: string;
    court_date: string;
    notification_enabled: boolean;
}

const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Chat", href: "/chat", icon: MessageSquare },
    { name: "New Case", href: "/cases/new", icon: PlusCircle },
    { name: "Library", href: "/library", icon: Library },
    { name: "Schedule", href: "/schedule", icon: Calendar },
];

const settingsItem = { name: "Settings", href: "/settings", icon: Settings };
const adminItem = { name: "Users", href: "/admin/users", icon: Users };

export default function FloatingNavbar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isLoggedIn, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const [navVisible, setNavVisible] = useState(true);
    const [hasAnimated, setHasAnimated] = useState(false);
    const [notifications, setNotifications] = useState<ScheduleEvent[]>([]);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
    const notificationsRef = useRef<HTMLDivElement>(null);
    const notifiedEvents = useRef(new Set<number>());

    const { scrollY } = useScroll();
    const lastScrollY = useRef(0);

    const initials = user?.full_name
        ? user.full_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
        : "?";

    /* ── Mark initial animation as done after mount ───── */
    useEffect(() => {
        const timer = setTimeout(() => setHasAnimated(true), 600);
        return () => clearTimeout(timer);
    }, []);

    /* ── Scroll hide/show ─────────────────────────────── */
    useMotionValueEvent(scrollY, "change", (latest) => {
        const diff = latest - lastScrollY.current;
        if (diff > 8 && latest > 80) {
            setNavVisible(false);
        } else if (diff < -4) {
            setNavVisible(true);
        }
        lastScrollY.current = latest;
    });

    /* ── Notifications ────────────────────────────────── */
    useEffect(() => {
        if (!isLoggedIn) return;
        const checkSchedules = async () => {
            try {
                const res = await api.get("/schedule/");
                const events: ScheduleEvent[] = res.data;
                const now = new Date();
                const upcoming: ScheduleEvent[] = [];
                events.forEach(event => {
                    if (!event.notification_enabled) return;
                    const eventTime = new Date(event.court_date);
                    const timeDiff = eventTime.getTime() - now.getTime();
                    if (Math.abs(timeDiff) < 60000 && !notifiedEvents.current.has(event.id)) {
                        toast((t) => (
                            <div className="flex items-start gap-4">
                                <div className="p-2 rounded-full" style={{ background: "var(--muted)" }}>
                                    <Bell size={18} style={{ color: "var(--accent)" }} />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Scheduled Event</h4>
                                    <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                                        It&apos;s time for: <span className="font-medium" style={{ color: "var(--foreground)" }}>{event.case_name}</span>
                                    </p>
                                </div>
                            </div>
                        ), { duration: 5000, position: "top-center" });
                        notifiedEvents.current.add(event.id);
                    }
                    if (timeDiff > 0 && timeDiff < 24 * 60 * 60 * 1000) upcoming.push(event);
                });
                setNotifications(upcoming);
            } catch {
                setNotifications([]);
            }
        };
        checkSchedules();
        const interval = setInterval(checkSchedules, 30000);
        return () => clearInterval(interval);
    }, [isLoggedIn]);

    /* ── Click outside to close ───────────────────────── */
    useEffect(() => {
        const handleClickOutside = (e: Event) => {
            if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
                setNotificationsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, []);

    const handleLogout = () => {
        logout();
        toast.success("Logged out successfully");
        router.push("/");
        setMobileMoreOpen(false);
    };

    const allDesktopItems = [
        ...navItems,
        settingsItem,
        ...(user?.is_admin ? [adminItem] : []),
    ];

    /* ── Desktop Navbar — Netflix TV style ────────────── */
    const DesktopNav = () => (
        <motion.header
            initial={hasAnimated ? false : { y: -100, opacity: 0 }}
            animate={{
                y: navVisible ? 0 : -100,
                opacity: navVisible ? 1 : 0,
            }}
            transition={appleSpring}
            className="hidden lg:flex fixed top-5 left-1/2 -translate-x-1/2 z-50 items-center gap-1 px-3 py-2"
            style={{
                borderRadius: 22,
                background: theme === "dark" ? "rgba(28,28,30,0.78)" : "rgba(255,255,255,0.78)",
                backdropFilter: "blur(60px) saturate(1.8)",
                WebkitBackdropFilter: "blur(60px) saturate(1.8)",
                border: theme === "dark" ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(0,0,0,0.08)",
                boxShadow: theme === "dark"
                    ? "0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)"
                    : "0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
            }}
        >
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 px-3 py-1.5 mr-1 shrink-0">
                <Scale className="w-5 h-5 shrink-0" style={{ color: "var(--accent)" }} />
                <span className="font-display font-semibold text-[15px] tracking-tight whitespace-nowrap" style={{ color: "var(--foreground)" }}>
                    Legal AI
                </span>
            </Link>

            <div className="w-px h-5 shrink-0" style={{ background: "var(--separator)" }} />

            {/* Nav Items — Netflix TV style */}
            <nav className="flex items-center gap-0.5 mx-1">
                {allDesktopItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="relative px-3.5 py-1.5 text-[13px] transition-all duration-200 whitespace-nowrap"
                            style={{
                                color: isActive ? "var(--foreground)" : "var(--muted-foreground)",
                                fontWeight: isActive ? 600 : 400,
                            }}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeNavPill"
                                    className="absolute inset-0"
                                    style={{
                                        borderRadius: 12,
                                        background: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)",
                                    }}
                                    transition={appleSpring}
                                />
                            )}
                            <span className="relative z-10">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="w-px h-5 shrink-0" style={{ background: "var(--separator)" }} />

            {/* Right actions */}
            <div className="flex items-center gap-0.5 ml-1">
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full transition-colors duration-150"
                    style={{ color: "var(--muted-foreground)" }}
                    aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                >
                    {theme === "dark" ? <Sun className="w-4 h-4" strokeWidth={1.5} /> : <Moon className="w-4 h-4" strokeWidth={1.5} />}
                </button>

                {isLoggedIn && (
                    <div ref={notificationsRef} className="relative">
                        <button
                            onClick={() => setNotificationsOpen(prev => !prev)}
                            className="p-2 rounded-full transition-colors duration-150 relative"
                            style={{ color: "var(--muted-foreground)" }}
                            aria-label="Notifications"
                        >
                            <Bell className="w-4 h-4" strokeWidth={1.5} />
                            {notifications.length > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: "var(--destructive)" }} />
                            )}
                        </button>

                        <AnimatePresence>
                            {notificationsOpen && (
                                <motion.div
                                    variants={fadeInDown}
                                    initial="hidden"
                                    animate="visible"
                                    exit="hidden"
                                    className="absolute right-0 top-full mt-3 w-80 overflow-hidden"
                                    style={{
                                        borderRadius: 16,
                                        background: theme === "dark" ? "rgba(44,44,46,0.92)" : "rgba(255,255,255,0.92)",
                                        backdropFilter: "blur(60px) saturate(1.8)",
                                        WebkitBackdropFilter: "blur(60px) saturate(1.8)",
                                        border: theme === "dark" ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.06)",
                                        boxShadow: "var(--shadow-xl)",
                                    }}
                                >
                                    <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--separator)" }}>
                                        <h3 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Upcoming Events</h3>
                                        <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Next 24 hours</p>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="px-5 py-6 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>No upcoming events</div>
                                        ) : (
                                            notifications.map(n => (
                                                <div key={n.id} className="px-5 py-3" style={{ borderBottom: "1px solid var(--separator)" }}>
                                                    <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{n.case_name}</div>
                                                    <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                                                        {new Date(n.court_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {isLoggedIn ? (
                    <button
                        onClick={() => router.push("/settings")}
                        className="ml-1 flex items-center gap-2 pl-1 pr-3 py-1 shrink-0 transition-all duration-200"
                        style={{ borderRadius: 14, border: "1px solid var(--separator)" }}
                    >
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-medium text-xs shrink-0" style={{ background: "var(--accent)" }}>
                            {initials}
                        </div>
                        <span className="text-[13px] font-medium hidden xl:block whitespace-nowrap" style={{ color: "var(--foreground)" }}>
                            {user?.full_name?.split(" ")[0]}
                        </span>
                    </button>
                ) : (
                    <Link
                        href="/auth/login"
                        className="ml-1 flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-white transition-all duration-200 whitespace-nowrap shrink-0"
                        style={{ borderRadius: 14, background: "var(--accent)" }}
                    >
                        <LogIn className="w-3.5 h-3.5" />
                        Sign In
                    </Link>
                )}
            </div>
        </motion.header>
    );

    /* ── Mobile Nav ───────────────────────────────────── */
    const MobileNav = () => {
        const mobileItems = [
            navItems[0], // Home
            navItems[1], // Chat
            navItems[2], // New Case
            navItems[3], // Library
            { name: "More", href: "#more", icon: MoreHorizontal },
        ];

        return (
            <>
                {/* Mobile top bar — edge-to-edge frosted glass */}
                <div
                    className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-5 h-14"
                    style={{
                        background: theme === "dark" ? "rgba(0,0,0,0.72)" : "rgba(255,255,255,0.72)",
                        backdropFilter: "blur(60px) saturate(1.8)",
                        WebkitBackdropFilter: "blur(60px) saturate(1.8)",
                        borderBottom: theme === "dark" ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.06)",
                    }}
                >
                    <Link href="/" className="flex items-center gap-2">
                        <Scale className="w-5 h-5 shrink-0" style={{ color: "var(--accent)" }} />
                        <span className="font-display font-semibold text-[15px] whitespace-nowrap" style={{ color: "var(--foreground)" }}>
                            Legal AI
                        </span>
                    </Link>
                    <div className="flex items-center gap-1">
                        <button onClick={toggleTheme} className="p-2.5 rounded-full" style={{ color: "var(--muted-foreground)" }} aria-label="Toggle theme">
                            {theme === "dark" ? <Sun className="w-[18px] h-[18px]" strokeWidth={1.5} /> : <Moon className="w-[18px] h-[18px]" strokeWidth={1.5} />}
                        </button>
                        {isLoggedIn && (
                            <div ref={notificationsRef} className="relative">
                                <button onClick={() => setNotificationsOpen(prev => !prev)} className="p-2.5 rounded-full relative" style={{ color: "var(--muted-foreground)" }} aria-label="Notifications">
                                    <Bell className="w-[18px] h-[18px]" strokeWidth={1.5} />
                                    {notifications.length > 0 && <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full" style={{ background: "var(--destructive)" }} />}
                                </button>
                            </div>
                        )}
                        {isLoggedIn ? (
                            <button onClick={() => router.push("/settings")} className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-xs shrink-0" style={{ background: "var(--accent)" }}>
                                {initials}
                            </button>
                        ) : (
                            <Link href="/auth/login" className="p-2.5 rounded-full" style={{ color: "var(--accent)" }}>
                                <LogIn className="w-[18px] h-[18px]" strokeWidth={1.5} />
                            </Link>
                        )}
                    </div>
                </div>

                {/*
                    Bottom tab bar — Apple Music style
                    Floating rounded bar with each tab as a visible individual circle.
                    Active tab gets accent-tinted circle with animated layoutId.
                */}
                <nav
                    className="lg:hidden fixed bottom-4 left-4 right-4 z-50 flex items-center justify-around px-2 py-2"
                    style={{
                        borderRadius: 28,
                        background: theme === "dark" ? "rgba(28,28,30,0.85)" : "rgba(255,255,255,0.85)",
                        backdropFilter: "blur(60px) saturate(1.8)",
                        WebkitBackdropFilter: "blur(60px) saturate(1.8)",
                        border: theme === "dark" ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(0,0,0,0.06)",
                        boxShadow: theme === "dark"
                            ? "0 8px 32px rgba(0,0,0,0.6)"
                            : "0 4px 24px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.04)",
                    }}
                >
                    {mobileItems.map((item) => {
                        const isMore = item.href === "#more";
                        const isActive = isMore
                            ? mobileMoreOpen
                            : (pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href)));
                        const Icon = item.icon;

                        return (
                            <button
                                key={item.href}
                                onClick={() => {
                                    if (isMore) {
                                        setMobileMoreOpen(prev => !prev);
                                    } else {
                                        setMobileMoreOpen(false);
                                        router.push(item.href);
                                    }
                                }}
                                className="relative flex flex-col items-center justify-center"
                                style={{
                                    width: 56,
                                    height: 56,
                                    color: isActive ? "var(--accent)" : "var(--muted-foreground)",
                                }}
                                aria-label={item.name}
                            >
                                {/* Each tab has a visible circle — active gets colored, inactive gets subtle */}
                                <div
                                    className="absolute flex items-center justify-center transition-all duration-300"
                                    style={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: 18,
                                        background: isActive
                                            ? (theme === "dark" ? "rgba(0,113,227,0.2)" : "rgba(0,113,227,0.1)")
                                            : (theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)"),
                                        border: isActive
                                            ? (theme === "dark" ? "1.5px solid rgba(0,113,227,0.3)" : "1.5px solid rgba(0,113,227,0.15)")
                                            : (theme === "dark" ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.04)"),
                                    }}
                                />
                                {/* Animated highlight ring that slides between active tabs */}
                                {isActive && (
                                    <motion.div
                                        layoutId="mobileActiveRing"
                                        className="absolute"
                                        style={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: 18,
                                            border: theme === "dark" ? "2px solid rgba(0,113,227,0.5)" : "2px solid rgba(0,113,227,0.25)",
                                        }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 400,
                                            damping: 30,
                                        }}
                                    />
                                )}
                                <Icon className="w-[22px] h-[22px] relative z-10" strokeWidth={isActive ? 2 : 1.5} />
                                <span className="text-[9px] mt-0.5 font-medium relative z-10">{item.name}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* Mobile "More" sheet */}
                <AnimatePresence>
                    {mobileMoreOpen && (
                        <>
                            <motion.div
                                variants={backdropFade}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="lg:hidden fixed inset-0 z-40"
                                style={{
                                    background: "rgba(0,0,0,0.3)",
                                    backdropFilter: "blur(20px)",
                                    WebkitBackdropFilter: "blur(20px)",
                                }}
                                onClick={() => setMobileMoreOpen(false)}
                            />
                            <motion.div
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "100%" }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="lg:hidden fixed bottom-0 left-0 right-0 z-50"
                                style={{
                                    borderRadius: "20px 20px 0 0",
                                    paddingBottom: "max(24px, env(safe-area-inset-bottom))",
                                    background: theme === "dark" ? "rgba(44,44,46,0.92)" : "rgba(255,255,255,0.92)",
                                    backdropFilter: "blur(60px) saturate(1.8)",
                                    WebkitBackdropFilter: "blur(60px) saturate(1.8)",
                                    border: theme === "dark" ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.06)",
                                    boxShadow: "0 -4px 32px rgba(0,0,0,0.15)",
                                }}
                            >
                                <div className="flex justify-center py-3">
                                    <div className="w-9 h-1 rounded-full" style={{ background: "var(--separator)" }} />
                                </div>
                                <div className="px-4 pb-4 space-y-1">
                                    {[settingsItem, { name: "Schedule", href: "/schedule", icon: Calendar }, ...(user?.is_admin ? [adminItem] : [])].map((item) => {
                                        const isActive = pathname === item.href;
                                        const Icon = item.icon;
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => setMobileMoreOpen(false)}
                                                className="flex items-center gap-4 px-4 py-3.5 transition-colors duration-150"
                                                style={{
                                                    borderRadius: 12,
                                                    background: isActive ? "var(--muted)" : "transparent",
                                                    color: isActive ? "var(--accent)" : "var(--foreground)",
                                                }}
                                            >
                                                <Icon className="w-5 h-5" strokeWidth={1.5} />
                                                <span className="text-[15px] font-normal">{item.name}</span>
                                            </Link>
                                        );
                                    })}

                                    {isLoggedIn && (
                                        <>
                                            <div className="my-2" style={{ borderTop: "1px solid var(--separator)" }} />
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-4 px-4 py-3.5 transition-colors duration-150"
                                                style={{ borderRadius: 12, color: "var(--destructive)" }}
                                            >
                                                <LogOut className="w-5 h-5" strokeWidth={1.5} />
                                                <span className="text-[15px] font-normal">Sign Out</span>
                                            </button>
                                        </>
                                    )}
                                    {!isLoggedIn && (
                                        <>
                                            <div className="my-2" style={{ borderTop: "1px solid var(--separator)" }} />
                                            <Link
                                                href="/auth/login"
                                                onClick={() => setMobileMoreOpen(false)}
                                                className="w-full flex items-center gap-4 px-4 py-3.5 transition-colors duration-150"
                                                style={{ borderRadius: 12, color: "var(--accent)" }}
                                            >
                                                <LogIn className="w-5 h-5" strokeWidth={1.5} />
                                                <span className="text-[15px] font-normal">Sign In</span>
                                            </Link>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </>
        );
    };

    return (
        <>
            <DesktopNav />
            <MobileNav />
        </>
    );
}
