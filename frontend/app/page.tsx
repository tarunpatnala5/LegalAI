"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Calendar, BookOpen, AlertCircle, Search, ExternalLink, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { staggerContainer, staggerItem, fadeInUp } from "@/lib/motion";

interface Judgment {
  title: string;
  text: string;
  link: string;
  date: string;
  category: string;
}

export default function Home() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [judgments, setJudgments] = useState<Judgment[]>([]);
  const [filteredJudgments, setFilteredJudgments] = useState<Judgment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [upcomingCount, setUpcomingCount] = useState<number | null>(null);
  const [pendingDraftsCount, setPendingDraftsCount] = useState<number | null>(null);

  const fetchJudgments = async () => {
    try {
      const response = await api.get("/judgments/live");
      setJudgments(response.data);
      setFilteredJudgments(response.data);
    } catch (error) {
      console.error("Failed to fetch judgments:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const [scheduleRes, casesRes] = await Promise.all([
        api.get("/schedule/upcoming?days=7"),
        api.get("/cases/"),
      ]);
      setUpcomingCount(scheduleRes.data.length);
      const pending = casesRes.data.filter((c: any) =>
        (c.translated_content ?? "").toLowerCase().includes("pending") ||
        c.status === "pending"
      );
      setPendingDraftsCount(pending.length);
    } catch {
      setUpcomingCount(null);
      setPendingDraftsCount(null);
    }
  };

  useEffect(() => {
    fetchJudgments();
    const interval = setInterval(fetchJudgments, 300000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchDashboardStats();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredJudgments(judgments);
    } else {
      const lowerQuery = searchQuery.toLowerCase();
      const filtered = judgments.filter(item =>
        item.category.toLowerCase().includes(lowerQuery) ||
        item.title.toLowerCase().includes(lowerQuery) ||
        item.text.toLowerCase().includes(lowerQuery)
      );
      setFilteredJudgments(filtered);
    }
  }, [searchQuery, judgments]);

  const handleNewCase = () => {
    if (!isLoggedIn) {
      router.push("/auth/login?returnTo=/cases/new");
    } else {
      router.push("/cases/new");
    }
  };

  const getCategoryStyle = (category: string) => {
    switch (category) {
      case "Criminal":
        return { background: "rgba(255,59,48,0.08)", color: "#ff3b30" };
      case "Civil":
        return { background: "rgba(52,199,89,0.08)", color: "#34c759" };
      default:
        return { background: "var(--muted)", color: "var(--muted-foreground)" };
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Hero */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1
            className="font-display text-[28px] sm:text-[34px] font-semibold tracking-tight"
            style={{ color: "var(--foreground)" }}
          >
            Legal Assistant Dashboard
          </h1>
          <p className="text-[15px] mt-1" style={{ color: "var(--muted-foreground)" }}>
            Real-time updates from Supreme Court of India
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleNewCase}
          className="flex items-center gap-2 px-5 py-2.5 text-[14px] font-medium text-white transition-colors duration-200"
          style={{
            background: "var(--accent)",
            borderRadius: "var(--radius-full)",
          }}
        >
          <Plus size={16} strokeWidth={2} />
          New Case Analysis
        </motion.button>
      </motion.div>

      {/* Stat Cards */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {[
          {
            icon: BookOpen,
            label: "Live Judgments",
            value: judgments.length,
            tint: "rgba(0,113,227,0.08)",
            iconColor: "var(--accent)",
            subtitle: "Updates this month",
          },
          {
            icon: Calendar,
            label: "Upcoming Hearings",
            value: isLoggedIn ? (upcomingCount === null ? "\u2014" : upcomingCount) : null,
            tint: "rgba(175,82,222,0.08)",
            iconColor: "#af52de",
            subtitle: isLoggedIn ? "Scheduled for next 7 days" : "",
            link: isLoggedIn ? "/schedule" : undefined,
            loginRequired: !isLoggedIn,
          },
          {
            icon: AlertCircle,
            label: "Pending Drafts",
            value: isLoggedIn ? (pendingDraftsCount === null ? "\u2014" : pendingDraftsCount) : null,
            tint: "rgba(255,149,0,0.08)",
            iconColor: "#ff9500",
            subtitle: isLoggedIn ? "Cases requiring attention" : "",
            link: isLoggedIn ? "/library" : undefined,
            loginRequired: !isLoggedIn,
          },
        ].map((card, i) => (
          <motion.div
            key={i}
            variants={staggerItem}
            className="p-6 transition-shadow duration-200"
            style={{
              background: "var(--card)",
              border: "1px solid var(--card-border)",
              borderRadius: "var(--radius-xl)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: card.tint }}
              >
                <card.icon size={18} style={{ color: card.iconColor }} strokeWidth={1.5} />
              </div>
              <span className="text-[14px] font-medium" style={{ color: "var(--foreground)" }}>
                {card.label}
              </span>
            </div>
            <div className="font-display text-[34px] font-semibold" style={{ color: "var(--foreground)" }}>
              {card.loginRequired ? (
                <span className="text-[15px] font-normal" style={{ color: "var(--muted-foreground)" }}>Login to view</span>
              ) : card.value}
            </div>
            {card.subtitle && (
              <p className="text-[12px] mt-1" style={{ color: "var(--muted-foreground)" }}>
                {card.subtitle}
              </p>
            )}
            {card.link && (
              <Link
                href={card.link}
                className="text-[12px] font-medium mt-2 inline-block transition-opacity duration-150 hover:opacity-70"
                style={{ color: card.iconColor }}
              >
                View details
              </Link>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* Latest Verdicts Section */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2
              className="font-display text-[22px] font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              Latest Supreme Court Verdicts
            </h2>
            <span
              className="text-[11px] font-medium px-2.5 py-1"
              style={{
                background: "var(--muted)",
                color: "var(--muted-foreground)",
                borderRadius: "var(--radius-full)",
              }}
            >
              Live Feed
            </span>
          </div>
          <div className="relative w-full sm:w-auto">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2"
              size={15}
              strokeWidth={1.5}
              style={{ color: "var(--muted-foreground)" }}
            />
            <input
              type="text"
              placeholder="Search verdicts..."
              className="w-full sm:w-64 pl-10 pr-4 py-2.5 text-[14px] outline-none transition-all duration-200"
              style={{
                background: "var(--muted)",
                borderRadius: "var(--radius-full)",
                color: "var(--foreground)",
                border: "1px solid transparent",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.background = "var(--card)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "transparent";
                e.currentTarget.style.background = "var(--muted)";
              }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-24" style={{ borderRadius: "var(--radius-lg)" }} />
            ))
          ) : (
            filteredJudgments.map((item, index) => (
              <motion.a
                key={index}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                variants={staggerItem}
                whileHover={{ scale: 1.005, y: -1 }}
                transition={{ duration: 0.2 }}
                className="group block p-5 transition-all duration-200 cursor-pointer"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--card-border)",
                  borderRadius: "var(--radius-lg)",
                  boxShadow: "var(--shadow-sm)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "var(--shadow-md)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                }}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-[16px] font-semibold leading-snug group-hover:opacity-80 transition-opacity duration-150 line-clamp-1"
                      style={{ color: "var(--foreground)" }}
                    >
                      {item.title}
                    </h3>
                    <p
                      className="text-[14px] mt-1.5 line-clamp-2 leading-relaxed"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {item.text}
                    </p>
                    <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <span className="text-[12px] font-medium" style={{ color: "var(--accent)" }}>
                        Read Judgment
                      </span>
                      <ExternalLink size={11} style={{ color: "var(--accent)" }} />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span
                      className="text-[12px] px-2.5 py-1 font-medium"
                      style={{
                        background: "var(--muted)",
                        color: "var(--muted-foreground)",
                        borderRadius: "var(--radius-sm)",
                      }}
                    >
                      {item.date}
                    </span>
                    <span
                      className="text-[11px] px-2.5 py-0.5 font-medium"
                      style={{
                        ...getCategoryStyle(item.category),
                        borderRadius: "var(--radius-full)",
                      }}
                    >
                      {item.category}
                    </span>
                  </div>
                </div>
              </motion.a>
            ))
          )}
          {!loading && filteredJudgments.length === 0 && (
            <div className="text-center py-16" style={{ color: "var(--muted-foreground)" }}>
              <p className="text-[15px]">No judgments found based on your search.</p>
            </div>
          )}
        </motion.div>
      </section>
    </div>
  );
}
