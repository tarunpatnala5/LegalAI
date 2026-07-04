"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence, useMotionValueEvent, useScroll } from "framer-motion";
import {
    Home, MessageSquare, PlusCircle, Library, Calendar,
    Settings, Scale, LogOut, LogIn, Users, Bell, Sun, Moon,
} from "lucide-react";
import toast from "react-hot-toast";
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

    useEffect(() => {
        const timer = setTimeout(() => setHasAnimated(true), 600);
        return () => clearTimeout(timer);
    }, []);

    useMotionValueEvent(scrollY, "change", (latest) => {
        const diff = latest - lastScrollY.current;
        if (diff > 8 && latest > 80) setNavVisible(false);
        else if (diff < -4) setNavVisible(true);
        lastScrollY.current = latest;
    });

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
            } catch { setNotifications([]); }
        };
        checkSchedules();
        const interval = setInterval(checkSchedules, 30000);
        return () => clearInterval(interval);
    }, [isLoggedIn]);

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

    /* ═══════════════════════════════════════════════════
       SHARED GLASS STYLE — Quick Share inspired
       Compact, centered, frosted-glass pill
       ═══════════════════════════════════════════════════ */
    const glassPill = {
        background: theme === "dark" ? "rgba(28,28,30,0.82)" : "rgba(255,255,255,0.82)",
        backdropFilter: "blur(40px) saturate(1.6)",
        WebkitBackdropFilter: "blur(40px) saturate(1.6)",
        border: theme === "dark" ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.06)",
        boxShadow: theme === "dark"
            ? "0 4px 20px rgba(0,0,0,0.5)"
            : "0 2px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
    };

    /* ═══════════════════════════════════════════════════
       DESKTOP TOP BAR — Quick Share pill style
       Compact centered floating pill, capsule active bg
       ═══════════════════════════════════════════════════ */
    const DesktopNav = () => (
        <motion.header
            initial={hasAnimated ? false : { y: -60, opacity: 0 }}
            animate={{ y: navVisible ? 0 : -80, opacity: navVisible ? 1 : 0 }}
            transition={appleSpring}
            className="hidden lg:flex fixed top-4 left-1/2 -translate-x-1/2 z-50 items-center gap-1 px-2.5 py-1.5"
            style={{ borderRadius: 9999, ...glassPill }}
        >
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 px-3 py-1.5 shrink-0">
                <Scale className="w-[18px] h-[18px] shrink-0" style={{ color: "var(--accent)" }} />
                <span className="font-display font-semibold text-[14px] tracking-tight whitespace-nowrap" style={{ color: "var(--foreground)" }}>
                    Legal AI
                </span>
            </Link>

            <div className="w-px h-4 mx-1 shrink-0" style={{ background: "var(--separator)" }} />

            {/* Nav items — capsule active state like Quick Share */}
            <nav className="flex items-center">
                {allDesktopItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="relative flex items-center gap-1.5 px-3 py-1.5 text-[13px] transition-all duration-200 whitespace-nowrap"
                            style={{
                                color: isActive ? (theme === "dark" ? "var(--foreground)" : "var(--foreground)") : "var(--muted-foreground)",
                                fontWeight: isActive ? 600 : 400,
                            }}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="desktopActivePill"
                                    className="absolute inset-0"
                                    style={{
                                        borderRadius: 9999,
                                        background: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)",
                                    }}
                                    transition={appleSpring}
                                />
                            )}
                            <Icon className="w-[15px] h-[15px] relative z-10" strokeWidth={isActive ? 2 : 1.5} />
                            <span className="relative z-10">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="w-px h-4 mx-1 shrink-0" style={{ background: "var(--separator)" }} />

            {/* Right: theme, bell, user */}
            <div className="flex items-center gap-0.5">
                <button onClick={toggleTheme} className="p-2 rounded-full transition-colors" style={{ color: "var(--muted-foreground)" }}
                    aria-label={theme === "dark" ? "Light mode" : "Dark mode"}>
                    {theme === "dark" ? <Sun className="w-4 h-4" strokeWidth={1.5} /> : <Moon className="w-4 h-4" strokeWidth={1.5} />}
                </button>

                {isLoggedIn && (
                    <div ref={notificationsRef} className="relative">
                        <button onClick={() => setNotificationsOpen(p => !p)} className="p-2 rounded-full relative" style={{ color: "var(--muted-foreground)" }} aria-label="Notifications">
                            <Bell className="w-4 h-4" strokeWidth={1.5} />
                            {notifications.length > 0 && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: "var(--destructive)" }} />}
                        </button>
                        <AnimatePresence>
                            {notificationsOpen && (
                                <motion.div variants={fadeInDown} initial="hidden" animate="visible" exit="hidden"
                                    className="absolute right-0 top-full mt-3 w-72 overflow-hidden"
                                    style={{
                                        borderRadius: 16, ...glassPill,
                                        background: theme === "dark" ? "rgba(44,44,46,0.95)" : "rgba(255,255,255,0.95)",
                                    }}>
                                    <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--separator)" }}>
                                        <h3 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Upcoming Events</h3>
                                    </div>
                                    <div className="max-h-56 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="px-4 py-5 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>No upcoming events</div>
                                        ) : notifications.map(n => (
                                            <div key={n.id} className="px-4 py-2.5" style={{ borderBottom: "1px solid var(--separator)" }}>
                                                <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{n.case_name}</div>
                                                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                                                    {new Date(n.court_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {isLoggedIn ? (
                    <button onClick={() => router.push("/settings")}
                        className="ml-0.5 flex items-center gap-2 pl-0.5 pr-2.5 py-0.5 shrink-0"
                        style={{ borderRadius: 9999, border: "1px solid var(--separator)" }}>
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-white font-medium text-[10px] shrink-0" style={{ background: "var(--accent)" }}>
                            {initials}
                        </div>
                        <span className="text-[12px] font-medium hidden xl:block whitespace-nowrap" style={{ color: "var(--foreground)" }}>
                            {user?.full_name?.split(" ")[0]}
                        </span>
                    </button>
                ) : (
                    <Link href="/auth/login"
                        className="ml-0.5 flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-white whitespace-nowrap shrink-0"
                        style={{ borderRadius: 9999, background: "var(--accent)" }}>
                        <LogIn className="w-3.5 h-3.5" /> Sign In
                    </Link>
                )}
            </div>
        </motion.header>
    );

    /* ═══════════════════════════════════════════════════
       MOBILE TOP BAR — sticky (not fixed) frosted glass bar.
       Sticky keeps it permanently in normal document flow, so
       page content can never render underneath/behind it — no
       manual spacer height to keep in sync anymore.
       ═══════════════════════════════════════════════════ */
    const MobileTopBar = () => (
        <div
            className="lg:hidden sticky top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14"
            style={{
                paddingTop: "env(safe-area-inset-top)",
                background: theme === "dark" ? "rgba(0,0,0,0.72)" : "rgba(255,255,255,0.72)",
                backdropFilter: "blur(40px) saturate(1.6)",
                WebkitBackdropFilter: "blur(40px) saturate(1.6)",
                borderBottom: theme === "dark" ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.04)",
            }}
        >
            <Link href="/" className="flex items-center gap-2">
                <Scale className="w-5 h-5 shrink-0" style={{ color: "var(--accent)" }} />
                <span className="font-display font-semibold text-[15px] whitespace-nowrap" style={{ color: "var(--foreground)" }}>Legal AI</span>
            </Link>
            <div className="flex items-center gap-1">
                <button onClick={toggleTheme} className="p-2 rounded-full" style={{ color: "var(--muted-foreground)" }} aria-label="Toggle theme">
                    {theme === "dark" ? <Sun className="w-[18px] h-[18px]" strokeWidth={1.5} /> : <Moon className="w-[18px] h-[18px]" strokeWidth={1.5} />}
                </button>
                {isLoggedIn && (
                    <div ref={notificationsRef} className="relative">
                        <button onClick={() => setNotificationsOpen(p => !p)} className="p-2 rounded-full relative" style={{ color: "var(--muted-foreground)" }} aria-label="Notifications">
                            <Bell className="w-[18px] h-[18px]" strokeWidth={1.5} />
                            {notifications.length > 0 && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: "var(--destructive)" }} />}
                        </button>
                    </div>
                )}
                {isLoggedIn ? (
                    <button onClick={() => router.push("/settings")} className="w-7 h-7 rounded-full flex items-center justify-center text-white font-medium text-[10px] shrink-0" style={{ background: "var(--accent)" }}>
                        {initials}
                    </button>
                ) : (
                    <Link href="/auth/login" className="p-2 rounded-full" style={{ color: "var(--accent)" }}>
                        <LogIn className="w-[18px] h-[18px]" strokeWidth={1.5} />
                    </Link>
                )}
            </div>
        </div>
    );

    /* ═══════════════════════════════════════════════════
       MOBILE BOTTOM BAR — single unified pill.
       All items live in one solid, content-sized pill (not
       stretched edge-to-edge). The active item gets a solid
       gray capsule behind it, like the highlight visible
       behind the active tab in the reference screenshots.
       ═══════════════════════════════════════════════════ */
    const MobileBottomBar = () => {
        const mobileItems = [
            navItems[0], // Home
            navItems[1], // Chat
            navItems[2], // New Case
            navItems[3], // Library
        ];

        return (
            <>
                {/* Full-width, edge-to-edge native-style tab bar (iOS/GitHub app pattern) */}
                <nav
                    className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch"
                    style={{
                        paddingBottom: "env(safe-area-inset-bottom)",
                        background: theme === "dark" ? "#1c1c1e" : "#ffffff",
                        borderTop: theme === "dark" ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)",
                        boxShadow: theme === "dark" ? "0 -2px 16px rgba(0,0,0,0.35)" : "0 -2px 16px rgba(0,0,0,0.05)",
                    }}
                >
                    {mobileItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.href}
                                onClick={() => { setMobileMoreOpen(false); router.push(item.href); }}
                                className="relative flex-1 flex flex-col items-center justify-center gap-0.5"
                                style={{
                                    height: 56,
                                    color: isActive ? "var(--accent)" : (theme === "dark" ? "rgba(235,235,240,0.5)" : "rgba(60,60,67,0.6)"),
                                }}
                                aria-label={item.name}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="mobileActivePill"
                                        className="absolute"
                                        style={{
                                            top: 5,
                                            width: 40,
                                            height: 22,
                                            borderRadius: 8,
                                            background: theme === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)",
                                        }}
                                        transition={{ type: "spring", stiffness: 420, damping: 32 }}
                                    />
                                )}
                                <Icon className="w-[22px] h-[22px] relative z-10" strokeWidth={isActive ? 2.2 : 1.6} />
                                <span className="text-[10px] font-medium relative z-10 leading-tight">{item.name}</span>
                            </button>
                        );
                    })}

                    {/* Account avatar — separate circular button, opens the More sheet
                        (Settings, Schedule, Admin, Sign out/in), mirroring the
                        profile-avatar bubble at the end of the reference tab bar. */}
                    <button
                        onClick={() => setMobileMoreOpen(p => !p)}
                        className="flex flex-col items-center justify-center px-4"
                        style={{ height: 56 }}
                        aria-label="Account"
                    >
                        <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-semibold transition-colors"
                            style={{
                                background: mobileMoreOpen
                                    ? "var(--accent)"
                                    : (theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)"),
                                color: mobileMoreOpen
                                    ? "#fff"
                                    : (theme === "dark" ? "rgba(235,235,240,0.7)" : "rgba(60,60,67,0.7)"),
                                border: theme === "dark" ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.08)",
                            }}
                        >
                            {isLoggedIn ? initials : <Users className="w-4 h-4" strokeWidth={1.8} />}
                        </div>
                    </button>
                </nav>
                {/* More sheet */}
                <AnimatePresence>
                    {mobileMoreOpen && (
                        <>
                            <motion.div
                                variants={backdropFade}
                                initial="hidden" animate="visible" exit="exit"
                                className="lg:hidden fixed inset-0 z-40"
                                style={{
                                    background: "rgba(0,0,0,0.25)",
                                    backdropFilter: "blur(16px)",
                                    WebkitBackdropFilter: "blur(16px)",
                                }}
                                onClick={() => setMobileMoreOpen(false)}
                            />
                            <motion.div
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "100%" }}
                                transition={{ type: "spring", stiffness: 320, damping: 30 }}
                                className="lg:hidden fixed bottom-0 left-0 right-0 z-50"
                                style={{
                                    borderRadius: "20px 20px 0 0",
                                    paddingBottom: "max(20px, env(safe-area-inset-bottom))",
                                    background: theme === "dark" ? "rgba(44,44,46,0.95)" : "rgba(255,255,255,0.95)",
                                    backdropFilter: "blur(40px) saturate(1.6)",
                                    WebkitBackdropFilter: "blur(40px) saturate(1.6)",
                                    border: theme === "dark" ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.04)",
                                    boxShadow: "0 -2px 20px rgba(0,0,0,0.1)",
                                }}
                            >
                                {/* Drag handle */}
                                <div className="flex justify-center py-3">
                                    <div className="w-8 h-1 rounded-full" style={{ background: "var(--separator)" }} />
                                </div>
                                <div className="px-4 pb-4 space-y-0.5">
                                    {[settingsItem, { name: "Schedule", href: "/schedule", icon: Calendar }, ...(user?.is_admin ? [adminItem] : [])].map((item) => {
                                        const isActive = pathname === item.href;
                                        const Icon = item.icon;
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => setMobileMoreOpen(false)}
                                                className="flex items-center gap-3 px-4 py-3 transition-colors"
                                                style={{
                                                    borderRadius: 12,
                                                    background: isActive ? "var(--muted)" : "transparent",
                                                    color: isActive ? "var(--accent)" : "var(--foreground)",
                                                }}
                                            >
                                                <Icon className="w-5 h-5" strokeWidth={1.5} />
                                                <span className="text-[15px]">{item.name}</span>
                                            </Link>
                                        );
                                    })}
                                    {isLoggedIn && (
                                        <>
                                            <div className="my-1.5" style={{ borderTop: "1px solid var(--separator)" }} />
                                            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3" style={{ borderRadius: 12, color: "var(--destructive)" }}>
                                                <LogOut className="w-5 h-5" strokeWidth={1.5} />
                                                <span className="text-[15px]">Sign Out</span>
                                            </button>
                                        </>
                                    )}
                                    {!isLoggedIn && (
                                        <>
                                            <div className="my-1.5" style={{ borderTop: "1px solid var(--separator)" }} />
                                            <Link href="/auth/login" onClick={() => setMobileMoreOpen(false)} className="w-full flex items-center gap-3 px-4 py-3" style={{ borderRadius: 12, color: "var(--accent)" }}>
                                                <LogIn className="w-5 h-5" strokeWidth={1.5} />
                                                <span className="text-[15px]">Sign In</span>
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
            <MobileTopBar />
            <MobileBottomBar />
        </>
    );
}
{ }