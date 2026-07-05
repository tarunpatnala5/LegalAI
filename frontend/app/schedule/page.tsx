"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Calendar as CalendarIcon, Clock, Plus, Bell, BellOff, Loader2, X, Trash2, ChevronLeft, ChevronRight, LogIn, Pencil, ChevronDown } from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import { fadeInUp, scaleIn, backdropFade, staggerContainer, staggerItem } from "@/lib/motion";

interface ScheduleEvent {
    id: number;
    case_name: string;
    court_date: string;
    reminder_date: string;
    status: string;
    notification_enabled: boolean;
}

type FilterType = 'all' | 'custom' | 'month';

type EventFormData = {
    case_name: string;
    court_date: string;
    time: string;
    status: string;
    notification_enabled: boolean;
};

/* ── Shared input styles for modals ────────────────────── */
const inputStyle = {
    background: "var(--muted)",
    borderRadius: "var(--radius-md)",
    border: "1px solid transparent",
    color: "var(--foreground)",
};
const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = "var(--accent)";
    e.currentTarget.style.background = "var(--card)";
};
const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = "transparent";
    e.currentTarget.style.background = "var(--muted)";
};

/* ── Reusable Apple toggle ─────────────────────────────── */
const AppleToggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button
        type="button"
        onClick={() => onChange(!checked)}
        className="relative w-[51px] h-[31px] rounded-full transition-colors duration-300 p-0.5"
        style={{ background: checked ? "var(--accent)" : "var(--muted)" }}
        role="switch"
        aria-checked={checked}
    >
        <div
            className="w-[27px] h-[27px] bg-white rounded-full transition-transform duration-300"
            style={{
                transform: checked ? "translateX(20px)" : "translateX(0px)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
            }}
        />
    </button>
);

/* ── Reusable modal form ───────────────────────────────── 
   NOTE: This (and AppleToggle) live at module scope, outside
   SchedulePage, on purpose. A component defined *inside* another
   component's function body gets a brand-new identity every time
   the parent re-renders (e.g. on every keystroke), which makes
   React unmount + remount it instead of just updating it — that
   was replaying the modal's open animation on every change.
   ───────────────────────────────────────────────────────── */
const EventForm = ({
    title,
    form,
    setForm,
    onSubmit,
    onClose,
    submitLabel,
    submitting,
}: {
    title: string;
    form: EventFormData;
    setForm: (f: EventFormData) => void;
    onSubmit: () => void;
    onClose: () => void;
    submitLabel: string;
    submitting: boolean;
}) => (
    <>
        <motion.div
            variants={backdropFade}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50"
            style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" }}
            onClick={onClose}
        />
        <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className="w-full max-w-md p-7 max-h-[90vh] overflow-y-auto"
                style={{
                    background: "var(--card)",
                    border: "1px solid var(--card-border)",
                    borderRadius: "var(--radius-xl)",
                    boxShadow: "var(--shadow-xl)",
                }}
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-display text-[20px] font-semibold" style={{ color: "var(--foreground)" }}>
                        {title}
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-md" style={{ color: "var(--muted-foreground)" }}>
                        <X size={18} strokeWidth={1.5} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Event Title</label>
                        <input
                            type="text"
                            value={form.case_name}
                            onChange={e => setForm({ ...form, case_name: e.target.value })}
                            className="w-full px-4 py-3 text-[14px] outline-none transition-all duration-200"
                            style={inputStyle}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            placeholder="e.g. Hearing vs State"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Date</label>
                            <input
                                type="date"
                                value={form.court_date}
                                onChange={e => setForm({ ...form, court_date: e.target.value })}
                                className="w-full px-3 py-3 text-[14px] outline-none transition-all duration-200"
                                style={inputStyle}
                                onFocus={handleFocus}
                                onBlur={handleBlur}
                            />
                        </div>
                        <div>
                            <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Time</label>
                            <input
                                type="time"
                                value={form.time}
                                onChange={e => setForm({ ...form, time: e.target.value })}
                                className="w-full px-3 py-3 text-[14px] outline-none transition-all duration-200"
                                style={inputStyle}
                                onFocus={handleFocus}
                                onBlur={handleBlur}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 items-end">
                        <div>
                            <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Status</label>
                            <div className="relative">
                                <select
                                    value={form.status}
                                    onChange={e => setForm({ ...form, status: e.target.value })}
                                    className="w-full px-3 py-3 text-[14px] outline-none transition-all duration-200 appearance-none cursor-pointer pr-8"
                                    style={inputStyle}
                                    onFocus={handleFocus}
                                    onBlur={handleBlur}
                                >
                                    <option value="Scheduled">Scheduled</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Closed">Closed</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--muted-foreground)" }} />
                            </div>
                        </div>
                        <div className="flex items-center justify-between pb-1">
                            <span className="text-[13px] font-medium" style={{ color: "var(--foreground)" }}>Notify Me</span>
                            <AppleToggle
                                checked={form.notification_enabled}
                                onChange={(v) => setForm({ ...form, notification_enabled: v })}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 mt-7">
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="flex-1 py-3 text-[14px] font-medium transition-colors duration-150 disabled:opacity-60"
                        style={{
                            color: "var(--foreground)",
                            background: "var(--muted)",
                            borderRadius: "var(--radius-md)",
                        }}
                    >
                        Cancel
                    </button>
                    <motion.button
                        whileHover={{ scale: submitting ? 1 : 1.01 }}
                        whileTap={{ scale: submitting ? 1 : 0.99 }}
                        onClick={onSubmit}
                        disabled={submitting}
                        className="flex-1 py-3 text-[14px] font-semibold text-white transition-colors duration-200 disabled:opacity-70 flex items-center justify-center gap-2"
                        style={{
                            background: "var(--accent)",
                            borderRadius: "var(--radius-md)",
                        }}
                    >
                        {submitting ? (
                            <>
                                <Loader2 size={15} className="animate-spin" />
                                {submitLabel === "Schedule Event" ? "Scheduling..." : "Saving..."}
                            </>
                        ) : (
                            submitLabel
                        )}
                    </motion.button>
                </div>
            </div>
        </motion.div>
    </>
);

export default function SchedulePage() {
    const router = useRouter();
    const { isLoggedIn } = useAuth();
    const [events, setEvents] = useState<ScheduleEvent[]>([]);
    const [filteredEvents, setFilteredEvents] = useState<ScheduleEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState({
        case_name: "",
        court_date: "",
        time: "",
        status: "Scheduled",
        notification_enabled: true
    });
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Form State
    const [newEvent, setNewEvent] = useState({
        case_name: "",
        court_date: "",
        time: "10:00",
        status: "Scheduled",
        notification_enabled: true
    });

    useEffect(() => {
        if (isLoggedIn) {
            fetchSchedules();
        } else {
            setLoading(false);
        }
    }, [isLoggedIn]);

    useEffect(() => {
        filterEvents();
    }, [events, filterType, selectedDate, currentMonth]);

    const fetchSchedules = async () => {
        try {
            const res = await api.get("/schedule/");
            setEvents(res.data);
            checkUpcomingDeadlines(res.data);
        } catch (error) {
            toast.error("Failed to load schedule");
        } finally {
            setLoading(false);
        }
    };

    const filterEvents = () => {
        let filtered = [...events];

        if (filterType === 'custom' && selectedDate) {
            filtered = events.filter(event => {
                const eventDate = new Date(event.court_date);
                return eventDate.toDateString() === selectedDate.toDateString();
            });
        } else if (filterType === 'month') {
            filtered = events.filter(event => {
                const eventDate = new Date(event.court_date);
                return eventDate.getMonth() === currentMonth.getMonth() &&
                    eventDate.getFullYear() === currentMonth.getFullYear();
            });
        }

        setFilteredEvents(filtered);
    };

    const checkUpcomingDeadlines = (events: ScheduleEvent[]) => {
        const now = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(now.getDate() + 7);

        const upcoming = events.filter(e => {
            if (!e.notification_enabled) return false;
            const reminderTarget = new Date(e.reminder_date || e.court_date);
            return reminderTarget > now && reminderTarget <= nextWeek;
        });

        if (upcoming.length > 0) {
            toast.custom((t) => (
                <div
                    className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full pointer-events-auto flex items-start gap-3 p-4`}
                    style={{
                        background: "var(--card)",
                        border: "1px solid var(--card-border)",
                        borderRadius: "var(--radius-lg)",
                        boxShadow: "var(--shadow-lg)",
                    }}
                >
                    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(255,149,0,0.08)" }}>
                        <Bell size={18} style={{ color: "#ff9500" }} strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold" style={{ color: "var(--foreground)" }}>
                            Upcoming Deadlines
                        </p>
                        <p className="text-[13px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                            You have {upcoming.length} active reminders for the next week.
                        </p>
                    </div>
                    <button
                        className="p-1 rounded-md transition-colors duration-150 shrink-0"
                        style={{ color: "var(--muted-foreground)" }}
                        onClick={() => toast.dismiss(t.id)}
                    >
                        <X size={16} strokeWidth={1.5} />
                    </button>
                </div>
            ), { duration: 5000 });
        }
    };

    const handleAddEvent = async () => {
        if (!newEvent.case_name || !newEvent.court_date) {
            toast.error("Please fill all fields");
            return;
        }

        setSubmitting(true);
        try {
            const [year, month, day] = newEvent.court_date.split('-').map(Number);
            const [hours, minutes] = newEvent.time.split(':').map(Number);
            const datetime = new Date(year, month - 1, day, hours, minutes, 0);

            await api.post("/schedule/", {
                case_name: newEvent.case_name,
                court_date: datetime.toISOString(),
                reminder_date: datetime.toISOString(),
                status: newEvent.status,
                notification_enabled: newEvent.notification_enabled
            });

            toast.success("Event Scheduled");
            setShowModal(false);
            const now = new Date();
            const hh = String(now.getHours()).padStart(2, '0');
            const mm = String(now.getMinutes()).padStart(2, '0');
            setNewEvent({ case_name: "", court_date: "", time: `${hh}:${mm}`, status: "Scheduled", notification_enabled: true });
            fetchSchedules();
        } catch (error: any) {
            if (error.response?.status === 401) {
                toast.error("Session expired. Please log in again.");
            } else {
                toast.error("Failed to add event");
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Ensure UTC: backend may return datetime without 'Z', causing browser to treat it as local time
    const toUtcDate = (s: string) => new Date(s.endsWith('Z') || s.includes('+') ? s : s + 'Z');

    const handleOpenEdit = (event: ScheduleEvent) => {
        const d = toUtcDate(event.court_date);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        setEditingEvent(event);
        setEditForm({
            case_name: event.case_name,
            court_date: dateStr,
            time: timeStr,
            status: event.status,
            notification_enabled: event.notification_enabled
        });
        setShowEditModal(true);
    };

    const handleUpdateEvent = async () => {
        if (!editingEvent || !editForm.case_name || !editForm.court_date) {
            toast.error("Please fill all fields");
            return;
        }
        setSubmitting(true);
        try {
            const [year, month, day] = editForm.court_date.split('-').map(Number);
            const [hours, minutes] = editForm.time.split(':').map(Number);
            const datetime = new Date(year, month - 1, day, hours, minutes, 0);

            await api.put(`/schedule/${editingEvent.id}`, {
                case_name: editForm.case_name,
                court_date: datetime.toISOString(),
                reminder_date: datetime.toISOString(),
                status: editForm.status,
                notification_enabled: editForm.notification_enabled
            });

            toast.success("Event updated");
            setShowEditModal(false);
            setEditingEvent(null);
            fetchSchedules();
        } catch (error: any) {
            if (error.response?.status === 401) {
                toast.error("Session expired. Please log in again.");
            } else {
                toast.error("Failed to update event");
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteEvent = async (id: number) => {
        setDeletingId(id);
        try {
            await api.delete(`/schedule/${id}`);
            toast.success("Event deleted");
            setEvents(events.filter(e => e.id !== id));
        } catch (error) {
            toast.error("Failed to delete event");
        } finally {
            setDeletingId(null);
            setConfirmDeleteId(null);
        }
    };

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date);
        setFilterType('custom');
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'In Progress': return { background: "rgba(0,113,227,0.08)", color: "var(--accent)" };
            case 'Closed': return { background: "var(--muted)", color: "var(--muted-foreground)" };
            case 'Scheduled':
            default:
                return { background: "rgba(255,149,0,0.08)", color: "#ff9500" };
        }
    };

    const getStatusBarColor = (status: string) => {
        switch (status) {
            case 'In Progress': return "var(--accent)";
            case 'Closed': return "var(--muted-foreground)";
            default: return "#ff9500";
        }
    };

    // Calendar Helper Functions
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        return { daysInMonth, startingDayOfWeek, year, month };
    };

    const hasEventsOnDate = (date: Date) => {
        return events.some(event => {
            const eventDate = new Date(event.court_date);
            return eventDate.toDateString() === date.toDateString();
        });
    };

    const renderCalendar = () => {
        const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
        const days = [];
        const today = new Date();

        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(<div key={`empty-${i}`} className="h-10" />);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isToday = date.toDateString() === today.toDateString();
            const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
            const hasEvents = hasEventsOnDate(date);

            days.push(
                <button
                    key={day}
                    onClick={() => handleDateSelect(date)}
                    className="h-10 flex items-center justify-center text-[13px] font-medium transition-all duration-200 relative"
                    style={{
                        borderRadius: "var(--radius-md)",
                        background: isSelected ? "var(--accent)" : isToday ? "rgba(0,113,227,0.06)" : "transparent",
                        color: isSelected ? "white" : isToday ? "var(--accent)" : "var(--foreground)",
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "var(--muted)"; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = isToday ? "rgba(0,113,227,0.06)" : "transparent"; }}
                >
                    {day}
                    {hasEvents && (
                        <span
                            className="absolute bottom-1 w-1 h-1 rounded-full"
                            style={{ background: isSelected ? "white" : "var(--accent)" }}
                        />
                    )}
                </button>
            );
        }

        return days;
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
        setCurrentMonth(prev => {
            const newDate = new Date(prev);
            if (direction === 'prev') {
                newDate.setMonth(prev.getMonth() - 1);
            } else {
                newDate.setMonth(prev.getMonth() + 1);
            }
            return newDate;
        });
    };


    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-6 h-6 rounded-full animate-spin" style={{ border: "2px solid var(--accent)", borderTopColor: "transparent" }} />
            </div>
        );
    }

    return (
        <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="max-w-6xl mx-auto"
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="font-display text-[28px] sm:text-[34px] font-semibold" style={{ color: "var(--foreground)" }}>
                        Schedule & Calendar
                    </h1>
                    <p className="text-[15px] mt-1" style={{ color: "var(--muted-foreground)" }}>
                        Manage court dates and important deadlines
                    </p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                        if (!isLoggedIn) {
                            toast.error("Please login to add events");
                            router.push("/auth/login?returnTo=/schedule");
                            return;
                        }
                        const now = new Date();
                        const hh = String(now.getHours()).padStart(2, '0');
                        const mm = String(now.getMinutes()).padStart(2, '0');
                        const preDate = selectedDate
                            ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
                            : '';
                        setNewEvent(prev => ({ ...prev, time: `${hh}:${mm}`, court_date: preDate }));
                        setShowModal(true);
                    }}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 text-[14px] font-medium text-white transition-colors duration-200"
                    style={{
                        background: "var(--accent)",
                        borderRadius: "var(--radius-full)",
                    }}
                >
                    <Plus size={16} strokeWidth={2} />
                    Add Event
                </motion.button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Calendar Section */}
                <div className="lg:col-span-2">
                    <div
                        className="p-6"
                        style={{
                            background: "var(--card)",
                            border: "1px solid var(--card-border)",
                            borderRadius: "var(--radius-xl)",
                            boxShadow: "var(--shadow-sm)",
                        }}
                    >
                        <div className="mb-5">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-semibold text-[17px]" style={{ color: "var(--foreground)" }}>Calendar</h2>
                                <button
                                    onClick={() => {
                                        const today = new Date();
                                        setCurrentMonth(today);
                                        setSelectedDate(today);
                                        setFilterType('custom');
                                    }}
                                    className="px-3 py-1 text-[11px] font-medium transition-opacity duration-150 hover:opacity-70"
                                    style={{
                                        background: "rgba(0,113,227,0.06)",
                                        color: "var(--accent)",
                                        borderRadius: "var(--radius-full)",
                                    }}
                                >
                                    Today
                                </button>
                            </div>

                            {/* Month/Year controls + arrows */}
                            <div className="flex items-end gap-2 mb-4">
                                <div className="flex-1 min-w-[110px]">
                                    <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--muted-foreground)" }}>Month</label>
                                    <select
                                        value={currentMonth.getMonth()}
                                        onChange={(e) => {
                                            const newDate = new Date(currentMonth);
                                            newDate.setMonth(parseInt(e.target.value));
                                            setCurrentMonth(newDate);
                                        }}
                                        className="w-full px-3 py-2.5 text-[13px] outline-none transition-all duration-200 appearance-none cursor-pointer"
                                        style={inputStyle}
                                        onFocus={handleFocus}
                                        onBlur={handleBlur}
                                    >
                                        {['January', 'February', 'March', 'April', 'May', 'June',
                                            'July', 'August', 'September', 'October', 'November', 'December'].map((month, idx) => (
                                                <option key={month} value={idx}>{month}</option>
                                            ))}
                                    </select>
                                </div>
                                <div className="flex-1 min-w-[80px]">
                                    <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--muted-foreground)" }}>Year</label>
                                    <select
                                        value={currentMonth.getFullYear()}
                                        onChange={(e) => {
                                            const newDate = new Date(currentMonth);
                                            newDate.setFullYear(parseInt(e.target.value));
                                            setCurrentMonth(newDate);
                                        }}
                                        className="w-full px-3 py-2.5 text-[13px] outline-none transition-all duration-200 appearance-none cursor-pointer"
                                        style={inputStyle}
                                        onFocus={handleFocus}
                                        onBlur={handleBlur}
                                    >
                                        {Array.from({ length: 101 }, (_, i) => 2000 + i).map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex gap-0.5">
                                    <button
                                        onClick={() => navigateMonth('prev')}
                                        className="w-10 h-10 flex items-center justify-center rounded-lg transition-colors duration-150"
                                        style={{ color: "var(--muted-foreground)" }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--muted)"; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                        title="Previous Month"
                                    >
                                        <ChevronLeft size={18} strokeWidth={1.5} />
                                    </button>
                                    <button
                                        onClick={() => navigateMonth('next')}
                                        className="w-10 h-10 flex items-center justify-center rounded-lg transition-colors duration-150"
                                        style={{ color: "var(--muted-foreground)" }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--muted)"; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                        title="Next Month"
                                    >
                                        <ChevronRight size={18} strokeWidth={1.5} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Calendar Grid */}
                        <div className="space-y-2">
                            {/* Weekday Headers */}
                            <div className="grid grid-cols-7 gap-0.5 mb-1">
                                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                                    <div key={day} className="h-8 flex items-center justify-center text-[11px] font-medium" style={{ color: "var(--muted-foreground)" }}>
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar Days */}
                            <div className="grid grid-cols-7 gap-0.5">
                                {renderCalendar()}
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="mt-5 pt-4 flex items-center gap-2 text-[12px]" style={{ borderTop: "1px solid var(--separator)", color: "var(--muted-foreground)" }}>
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent)" }} />
                            <span>Has Events</span>
                        </div>
                    </div>
                </div>

                {/* Events List */}
                <div className="lg:col-span-3">
                    <div
                        className="p-6"
                        style={{
                            background: "var(--card)",
                            border: "1px solid var(--card-border)",
                            borderRadius: "var(--radius-xl)",
                            boxShadow: "var(--shadow-sm)",
                        }}
                    >
                        {/* Header with filter reset */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
                            <h2 className="font-semibold text-[17px]" style={{ color: "var(--foreground)" }}>
                                {filterType === 'all' ? 'All Events' :
                                    filterType === 'custom' && selectedDate ?
                                        selectedDate.toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' }) :
                                        filterType === 'month' ?
                                            currentMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'Events'}
                            </h2>
                            {(filterType !== 'all' || selectedDate) && (
                                <button
                                    onClick={() => {
                                        setFilterType('all');
                                        setSelectedDate(null);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium transition-colors duration-150"
                                    style={{
                                        color: "var(--accent)",
                                        background: "rgba(0,113,227,0.06)",
                                        borderRadius: "var(--radius-full)",
                                    }}
                                >
                                    <CalendarIcon size={12} strokeWidth={1.5} />
                                    Show All Events
                                </button>
                            )}
                        </div>

                        {/* Events Display */}
                        <motion.div
                            variants={staggerContainer}
                            initial="hidden"
                            animate="visible"
                            className="space-y-2"
                        >
                            {!isLoggedIn && (
                                <div className="text-center py-12">
                                    <LogIn size={32} className="mx-auto mb-3" style={{ color: "var(--muted-foreground)", opacity: 0.4 }} />
                                    <p className="text-[14px] mb-4" style={{ color: "var(--muted-foreground)" }}>
                                        Login to see your scheduled events
                                    </p>
                                    <button
                                        onClick={() => router.push("/auth/login?returnTo=/schedule")}
                                        className="flex items-center gap-2 mx-auto px-5 py-2.5 text-[13px] font-medium text-white transition-colors duration-200"
                                        style={{ background: "var(--accent)", borderRadius: "var(--radius-full)" }}
                                    >
                                        <LogIn size={14} />
                                        Login
                                    </button>
                                </div>
                            )}
                            {isLoggedIn && filteredEvents.length === 0 && (
                                <div className="text-center py-12">
                                    <CalendarIcon size={32} className="mx-auto mb-3" style={{ color: "var(--muted-foreground)", opacity: 0.3 }} />
                                    <p className="text-[14px]" style={{ color: "var(--muted-foreground)" }}>
                                        {filterType === 'custom' && selectedDate
                                            ? `No events scheduled for ${selectedDate.toLocaleDateString('en-IN')}`
                                            : filterType === 'month'
                                                ? 'No events this month'
                                                : 'No upcoming events'}
                                    </p>
                                </div>
                            )}
                            {filteredEvents.map((event) => {
                                const date = toUtcDate(event.court_date);
                                return (
                                    <motion.div
                                        key={event.id}
                                        variants={staggerItem}
                                        className="relative p-4 pl-6 overflow-hidden group transition-all duration-200"
                                        style={{
                                            background: "var(--card)",
                                            border: "1px solid var(--card-border)",
                                            borderRadius: "var(--radius-lg)",
                                            boxShadow: "var(--shadow-sm)",
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}
                                    >
                                        {/* Left status bar */}
                                        <div
                                            className="absolute left-0 top-0 w-[3px] h-full"
                                            style={{
                                                background: getStatusBarColor(event.status),
                                                borderRadius: "var(--radius-lg) 0 0 var(--radius-lg)",
                                            }}
                                        />

                                        <div className="flex justify-between items-start gap-3">
                                            <h3 className="font-semibold text-[15px] line-clamp-1 flex-1" style={{ color: "var(--foreground)" }}>
                                                {event.case_name}
                                            </h3>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <span
                                                    className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                                                    style={{
                                                        ...getStatusStyle(event.status),
                                                        borderRadius: "var(--radius-full)",
                                                    }}
                                                >
                                                    {event.status}
                                                </span>
                                                {event.notification_enabled ?
                                                    <Bell size={13} strokeWidth={1.5} style={{ color: "#ff9500" }} /> :
                                                    <BellOff size={13} strokeWidth={1.5} style={{ color: "var(--muted-foreground)" }} />
                                                }
                                                <button
                                                    onClick={() => handleOpenEdit(event)}
                                                    className="p-1.5 rounded-md transition-colors duration-150"
                                                    style={{ color: "var(--muted-foreground)" }}
                                                    title="Edit Event"
                                                    onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.background = "rgba(0,113,227,0.06)"; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted-foreground)"; e.currentTarget.style.background = "transparent"; }}
                                                >
                                                    <Pencil size={13} strokeWidth={1.5} />
                                                </button>
                                                <button
                                                    onClick={() => setConfirmDeleteId(event.id)}
                                                    className="p-1.5 rounded-md transition-colors duration-150"
                                                    style={{ color: "var(--muted-foreground)" }}
                                                    title="Delete Event"
                                                    onMouseEnter={(e) => { e.currentTarget.style.color = "var(--destructive)"; e.currentTarget.style.background = "rgba(255,59,48,0.06)"; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted-foreground)"; e.currentTarget.style.background = "transparent"; }}
                                                >
                                                    <Trash2 size={13} strokeWidth={1.5} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 mt-2 text-[12px]" style={{ color: "var(--muted-foreground)" }}>
                                            <span className="flex items-center gap-1">
                                                <CalendarIcon size={12} strokeWidth={1.5} /> {date.toLocaleDateString('en-IN')}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock size={12} strokeWidth={1.5} /> {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                            </span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {confirmDeleteId !== null && (
                    <>
                        <motion.div
                            variants={backdropFade}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="fixed inset-0 z-50"
                            style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" }}
                            onClick={() => setConfirmDeleteId(null)}
                        />
                        <motion.div
                            variants={scaleIn}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                            onClick={(e) => e.target === e.currentTarget && setConfirmDeleteId(null)}
                        >
                            <div
                                className="w-full max-w-sm p-6"
                                style={{
                                    background: "var(--card)",
                                    border: "1px solid var(--card-border)",
                                    borderRadius: "var(--radius-xl)",
                                    boxShadow: "var(--shadow-xl)",
                                }}
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(255,59,48,0.08)" }}>
                                        <Trash2 size={18} style={{ color: "var(--destructive)" }} />
                                    </div>
                                    <h2 className="text-[17px] font-semibold" style={{ color: "var(--foreground)" }}>Delete Event?</h2>
                                </div>
                                <p className="text-[14px] mb-6" style={{ color: "var(--muted-foreground)" }}>
                                    Are you sure you want to delete <strong style={{ color: "var(--foreground)" }}>{events.find(e => e.id === confirmDeleteId)?.case_name}</strong>? This action cannot be undone.
                                </p>
                                <div className="flex gap-2 justify-end">
                                    <button
                                        onClick={() => setConfirmDeleteId(null)}
                                        disabled={deletingId === confirmDeleteId}
                                        className="px-4 py-2 text-[13px] font-medium transition-colors duration-150 disabled:opacity-60"
                                        style={{ color: "var(--foreground)", background: "var(--muted)", borderRadius: "var(--radius-md)" }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleDeleteEvent(confirmDeleteId)}
                                        disabled={deletingId === confirmDeleteId}
                                        className="px-4 py-2 text-[13px] font-medium text-white flex items-center gap-2 transition-colors duration-150 disabled:opacity-70"
                                        style={{ background: "var(--destructive)", borderRadius: "var(--radius-md)" }}
                                    >
                                        {deletingId === confirmDeleteId ? (
                                            <Loader2 size={13} className="animate-spin" />
                                        ) : (
                                            <Trash2 size={13} />
                                        )}
                                        {deletingId === confirmDeleteId ? "Deleting..." : "Delete"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Add Event Modal */}
            <AnimatePresence>
                {showModal && (
                    <EventForm
                        title="Add New Event"
                        form={newEvent}
                        setForm={setNewEvent}
                        onSubmit={handleAddEvent}
                        onClose={() => setShowModal(false)}
                        submitLabel="Schedule Event"
                        submitting={submitting}
                    />
                )}
            </AnimatePresence>

            {/* Edit Event Modal */}
            <AnimatePresence>
                {showEditModal && editingEvent && (
                    <EventForm
                        title="Edit Event"
                        form={editForm}
                        setForm={setEditForm}
                        onSubmit={handleUpdateEvent}
                        onClose={() => { setShowEditModal(false); setEditingEvent(null); }}
                        submitLabel="Save Changes"
                        submitting={submitting}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}
