"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence, useMotionValueEvent, useScroll } from "framer-motion";
import {
    Home, MessageSquare, PlusCircle, Library, Calendar,
    Settings, Scale, LogOut, LogIn, Users, Bell, Sun, Moon, Search, X,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import api from "@/lib/api";
import { appleSpring, fadeInDown, backdropFade, scaleIn } from "@/lib/motion";

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

    /* ── Desktop Navbar ───────────────────────────────── */
    const DesktopNav = () => (
        <motion.header
            initial={{ y: -100, opacity: 0 }}
            animate={{
                y: navVisible ? 0 : -100,
                opacity: navVisible ? 1 : 0,
            }}
            transition={appleSpring}
            className="hidden lg:flex fixed top-5 left-1/2 -translate-x-1/2 z-50 items-center gap-1 px-2 py-1.5 glass-surface"
            style={{ borderRadius: "var(--radius-2xl)" }}
        >
            {/* Logo */}
            <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2 mr-2"
            >
                <Scale className="w-5 h-5" style={{ color: "var(--accent)" }} />
                <span className="font-display font-semibold text-[15px] tracking-tight" style={{ color: "var(--foreground)" }}>
                    Legal AI
                </span>
            </Link>

            {/* Separator */}
            <div className="w-px h-6" style={{ background: "var(--separator)" }} />

            {/* Nav Items */}
            <nav className="flex items-center gap-0.5 mx-1">
                {allDesktopItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "relative flex items-center gap-2 px-3.5 py-2 rounded-full text-[13px] font-normal transition-all duration-200",
                                isActive
                                    ? "font-medium"
                                    : "hover:opacity-80"
                            )}
                            style={{
                                color: isActive ? "var(--accent)" : "var(--muted-foreground)",
                            }}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeNavBg"
                                    className="absolute inset-0 rounded-full"
                                    style={{
                                        background: theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)",
                                    }}
                                    transition={appleSpring}
                                />
                            )}
                            <Icon className="w-4 h-4 relative z-10" strokeWidth={isActive ? 2 : 1.5} />
                            <span className="relative z-10 whitespace-nowrap">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Separator */}
            <div className="w-px h-6" style={{ background: "var(--separator)" }} />

            {/* Right actions */}
            <div className="flex items-center gap-0.5 ml-1">
                {/* Search (placeholder) */}
                <button
                    className="p-2 rounded-full transition-colors duration-150"
                    style={{ color: "var(--muted-foreground)" }}
                    aria-label="Search"
                >
                    <Search className="w-4 h-4" strokeWidth={1.5} />
                </button>

                {/* Theme toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full transition-colors duration-150"
                    style={{ color: "var(--muted-foreground)" }}
                    aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                >
                    {theme === "dark" ? <Sun className="w-4 h-4" strokeWidth={1.5} /> : <Moon className="w-4 h-4" strokeWidth={1.5} />}
                </button>

                {/* Notifications */}
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
                                <span
                                    className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                                    style={{ background: "var(--destructive)" }}
                                />
                            )}
                        </button>

                        <AnimatePresence>
                            {notificationsOpen && (
                                <motion.div
                                    variants={fadeInDown}
                                    initial="hidden"
                                    animate="visible"
                                    exit="hidden"
                                    className="absolute right-0 top-full mt-3 w-80 glass-surface-elevated overflow-hidden"
                                    style={{ borderRadius: "var(--radius-xl)" }}
                                >
                                    <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--separator)" }}>
                                        <h3 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                                            Upcoming Events
                                        </h3>
                                        <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Next 24 hours</p>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="px-5 py-6 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
                                                No upcoming events
                                            </div>
                                        ) : (
                                            notifications.map(n => (
                                                <div
                                                    key={n.id}
                                                    className="px-5 py-3 transition-colors duration-150"
                                                    style={{ borderBottom: "1px solid var(--separator)" }}
                                                >
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

                {/* User / Login */}
                {isLoggedIn ? (
                    <button
                        onClick={() => router.push("/settings")}
                        className="ml-1 flex items-center gap-2 pl-1 pr-3 py-1 rounded-full transition-all duration-200"
                        style={{
                            border: "1px solid var(--separator)",
                        }}
                    >
                        <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white font-medium text-xs"
                            style={{ background: "var(--accent)" }}
                        >
                            {initials}
                        </div>
                        <span className="text-[13px] font-medium hidden xl:block" style={{ color: "var(--foreground)" }}>
                            {user?.full_name?.split(" ")[0]}
                        </span>
                    </button>
                ) : (
                    <Link
                        href="/auth/login"
                        className="ml-1 flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium text-white transition-all duration-200"
                        style={{ background: "var(--accent)" }}
                    >
                        <LogIn className="w-3.5 h-3.5" />
                        Sign In
                    </Link>
                )}
            </div>
        </motion.header>
    );

    /* ── Mobile Bottom Nav ────────────────────────────── */
    const MobileNav = () => {
        const mobileItems = [
            navItems[0], // Home
            navItems[1], // Chat
            navItems[2], // New Case
            navItems[3], // Library
            { name: "More", href: "#more", icon: Settings },
        ];

        return (
            <>
                {/* Mobile top bar — minimal */}
                <div
                    className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-5 h-14 glass-surface"
                    style={{ borderBottom: "1px solid var(--separator)" }}
                >
                    <Link href="/" className="flex items-center gap-2">
                        <Scale className="w-5 h-5" style={{ color: "var(--accent)" }} />
                        <span className="font-display font-semibold text-[15px]" style={{ color: "var(--foreground)" }}>
                            Legal AI
                        </span>
                    </Link>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={toggleTheme}
                            className="p-2.5 rounded-full"
                            style={{ color: "var(--muted-foreground)" }}
                            aria-label="Toggle theme"
                        >
                            {theme === "dark" ? <Sun className="w-[18px] h-[18px]" strokeWidth={1.5} /> : <Moon className="w-[18px] h-[18px]" strokeWidth={1.5} />}
                        </button>

                        {isLoggedIn && (
                            <div ref={notificationsRef} className="relative">
                                <button
                                    onClick={() => setNotificationsOpen(prev => !prev)}
                                    className="p-2.5 rounded-full relative"
                                    style={{ color: "var(--muted-foreground)" }}
                                    aria-label="Notifications"
                                >
                                    <Bell className="w-[18px] h-[18px]" strokeWidth={1.5} />
                                    {notifications.length > 0 && (
                                        <span
                                            className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full"
                                            style={{ background: "var(--destructive)" }}
                                        />
                                    )}
                                </button>
                            </div>
                        )}

                        {isLoggedIn ? (
                            <button
                                onClick={() => router.push("/settings")}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-xs"
                                style={{ background: "var(--accent)" }}
                            >
                                {initials}
                            </button>
                        ) : (
                            <Link
                                href="/auth/login"
                                className="p-2.5 rounded-full"
                                style={{ color: "var(--accent)" }}
                            >
                                <LogIn className="w-[18px] h-[18px]" strokeWidth={1.5} />
                            </Link>
                        )}
                    </div>
                </div>

                {/* Bottom floating tab bar */}
                <motion.nav
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    transition={appleSpring}
                    className="lg:hidden fixed bottom-4 left-4 right-4 z-50 glass-surface flex items-center justify-around"
                    style={{
                        borderRadius: "var(--radius-2xl)",
                        paddingBottom: "max(4px, env(safe-area-inset-bottom))",
                        paddingTop: "4px",
                    }}
                >
                    {mobileItems.map((item) => {
                        const isMore = item.href === "#more";
                        const isActive = isMore ? mobileMoreOpen : (pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href)));
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
                                className="flex flex-col items-center justify-center py-2 px-3 min-w-[56px] min-h-[48px] transition-colors duration-150"
                                style={{
                                    color: isActive ? "var(--accent)" : "var(--muted-foreground)",
                                }}
                                aria-label={item.name}
                            >
                                <Icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2 : 1.5} />
                                <span className="text-[10px] mt-0.5 font-medium">{item.name}</span>
                            </button>
                        );
                    })}
                </motion.nav>

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
                                style={{ background: "rgba(0,0,0,0.4)" }}
                                onClick={() => setMobileMoreOpen(false)}
                            />
                            <motion.div
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "100%" }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass-surface-elevated"
                                style={{
                                    borderRadius: "var(--radius-2xl) var(--radius-2xl) 0 0",
                                    paddingBottom: "max(24px, env(safe-area-inset-bottom))",
                                }}
                            >
                                {/* Drag indicator */}
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
                                                className={cn(
                                                    "flex items-center gap-4 px-4 py-3.5 rounded-xl transition-colors duration-150"
                                                )}
                                                style={{
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
                                                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-colors duration-150"
                                                style={{ color: "var(--destructive)" }}
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
                                                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-colors duration-150"
                                                style={{ color: "var(--accent)" }}
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
