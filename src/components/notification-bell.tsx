"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CalendarClock, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { NotificationsClient } from "@/app/(app)/member/dashboard/notifications-client";

type Notification = {
    id: string;
    title: string;
    message: string;
    type: string;
    created_at: string;
    is_read: boolean;
};

type DeadlineReminder = {
    id: string;
    type: "project" | "stage";
    title: string;
    projectName: string;
    deadline: string;
    daysLeft: number;
    isOverdue: boolean;
    urgency: "overdue" | "urgent" | "warning" | "normal";
};

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [reminders, setReminders] = useState<DeadlineReminder[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const [notifRes, reminderRes] = await Promise.all([
                    fetch("/api/notifications?limit=20"),
                    fetch("/api/member/deadline-reminders"),
                ]);

                if (notifRes.ok) {
                    const data = await notifRes.json();
                    setNotifications(data.data ?? []);
                }

                if (reminderRes.ok) {
                    const data = await reminderRes.json();
                    setReminders(data.data ?? []);
                }
            } catch (error) {
                console.error("Failed to fetch notifications:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [open]);

    // Helper to check if date is today
    const isToday = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    // Only count unread notifications from TODAY
    const unreadCount = notifications.filter((n) => !n.is_read && isToday(n.created_at)).length;
    const urgentReminders = reminders.filter((r) => r.urgency !== "normal").length;
    const totalBadge = unreadCount + urgentReminders;

    const formatDaysLeft = (daysLeft: number) => {
        if (daysLeft < 0) return `Overdue by ${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? "s" : ""}`;
        if (daysLeft === 0) return "Due today!";
        if (daysLeft === 1) return "Due tomorrow";
        return `${daysLeft} days left`;
    };

    const urgencyStyles: Record<DeadlineReminder["urgency"], string> = {
        overdue: "bg-rose-50 border-rose-200 text-rose-700",
        urgent: "bg-rose-50 border-rose-200 text-rose-600",
        warning: "bg-amber-50 border-amber-200 text-amber-700",
        normal: "bg-slate-50 border-slate-200 text-slate-600",
    };

    const urgencyIcon: Record<DeadlineReminder["urgency"], React.ReactNode> = {
        overdue: <AlertTriangle className="size-4 text-rose-500" />,
        urgent: <Clock className="size-4 text-rose-500" />,
        warning: <Clock className="size-4 text-amber-500" />,
        normal: <CalendarClock className="size-4 text-slate-400" />,
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative size-10 rounded-full hover:bg-slate-100 text-red-600"
                >
                    <Bell className="size-5" />
                    {totalBadge > 0 && (
                        <span className="absolute right-0 top-0 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white shadow-sm">
                            {totalBadge > 9 ? "9+" : totalBadge}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent
                align="end"
                className="w-[380px] p-0 shadow-xl overflow-hidden rounded-xl border-slate-200"
            >
                {/* Header - matching PM dashboard */}
                <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-3">
                    <h4 className="font-semibold text-slate-900">Today&apos;s Updates</h4>
                </div>

                {/* Deadline Reminders Section (if any) */}
                {reminders.length > 0 && (
                    <div className="border-b border-slate-100 p-3">
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            🔔 Deadline Reminders
                        </p>
                        <div className="space-y-2">
                            {reminders.slice(0, 5).map((reminder) => (
                                <div
                                    key={reminder.id}
                                    className={cn(
                                        "flex items-start gap-3 rounded-lg border p-2.5 transition-colors",
                                        urgencyStyles[reminder.urgency]
                                    )}
                                >
                                    <div className="mt-0.5">{urgencyIcon[reminder.urgency]}</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold truncate">{reminder.title}</p>
                                        <p className="text-[11px] truncate opacity-80">{reminder.projectName}</p>
                                        <p className={cn(
                                            "mt-1 text-[10px] font-medium",
                                            reminder.isOverdue ? "text-rose-600" : ""
                                        )}>
                                            {reminder.isOverdue ? "🚨 " : "⏰ "}
                                            {formatDaysLeft(reminder.daysLeft)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Notifications Content - using NotificationsClient for consistency with PM */}
                <div className="max-h-[400px] overflow-y-auto p-2">
                    <NotificationsClient variant="clean" onlyToday={true} showFooterLink={false} limit={10} />
                </div>


            </PopoverContent>
        </Popover>
    );
}
