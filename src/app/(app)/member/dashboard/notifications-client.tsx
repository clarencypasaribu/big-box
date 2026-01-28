"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Notification = {
    id: string;
    title: string;
    message: string;
    type: string;
    created_at: string;
    is_read: boolean;
    link?: string;
};

type NotificationsClientProps = {
    onlyToday?: boolean;
    limit?: number;
    showFooterLink?: boolean;
    groupByDate?: boolean;
    variant?: "card" | "clean";
};

export function NotificationsClient({
    onlyToday = true,
    limit = 5,
    showFooterLink = true,
    groupByDate = false,
    variant = "card",
}: NotificationsClientProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function fetchNotifications() {
            try {
                const res = await fetch("/api/notifications");
                if (res.ok) {
                    const body = await res.json();
                    setNotifications(body.data || []);
                }
            } catch (error) {
                console.error("Failed to fetch notifications", error);
            } finally {
                setLoading(false);
            }
        }

        fetchNotifications();
    }, []);

    function formatTimeAgo(dateString: string) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return "Just now";
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    }

    function getIcon(type: string) {
        if (type.includes("APPROV") || type === "success") return <CheckCircle2 className="size-5 text-emerald-600" />;
        if (type.includes("REJECT") || type.includes("HIGH") || type === "error") return <AlertTriangle className="size-5 text-rose-600" />;
        return <Bell className="size-5 text-indigo-600" />;
    }

    const visibleNotifications = useMemo(() => {
        if (!onlyToday) return notifications;
        const now = new Date();
        return notifications.filter((notif) => {
            const date = new Date(notif.created_at);
            return (
                date.getFullYear() === now.getFullYear() &&
                date.getMonth() === now.getMonth() &&
                date.getDate() === now.getDate()
            );
        });
    }, [notifications, onlyToday]);

    const displayedNotifications = useMemo(() => {
        if (!limit) return visibleNotifications;
        return visibleNotifications.slice(0, limit);
    }, [visibleNotifications, limit]);

    const groupedNotifications = useMemo(() => {
        if (!groupByDate) return [];
        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const startOfYesterday = new Date(startOfToday);
        startOfYesterday.setDate(startOfToday.getDate() - 1);

        const labelForDate = (date: Date) => {
            const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            if (startOfDate.getTime() === startOfToday.getTime()) return "Today";
            if (startOfDate.getTime() === startOfYesterday.getTime()) return "Yesterday";
            return date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
        };

        const groups = new Map<string, Notification[]>();
        displayedNotifications.forEach((notif) => {
            const label = labelForDate(new Date(notif.created_at));
            const items = groups.get(label) ?? [];
            items.push(notif);
            groups.set(label, items);
        });

        return Array.from(groups.entries()).map(([label, items]) => ({
            label,
            items,
        }));
    }, [displayedNotifications, groupByDate]);

    const headerLabel = groupByDate && groupedNotifications.length > 0 ? groupedNotifications[0].label : null;

    return (
        <div className={cn(
            "flex flex-col gap-3",
            variant === "card" && "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        )}>
            {variant === "card" && (
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">Notifications</h3>
                    {headerLabel ? (
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                            {headerLabel}
                        </span>
                    ) : null}
                </div>
            )}

            <div className="flex flex-col gap-3">
                {loading ? (
                    <p className="py-4 text-center text-sm text-slate-500">Loading notifications...</p>
                ) : displayedNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Bell className="mb-2 size-8 text-slate-200" />
                        <p className="text-sm text-slate-500">
                            {onlyToday ? "No notifications today" : "No notifications yet"}
                        </p>
                    </div>
                ) : groupByDate ? (
                    groupedNotifications.map((group) => (
                        <div key={group.label} className="space-y-3">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-4 first:mt-0">
                                {group.label}
                            </h4>
                            <div className="space-y-3">
                                {group.items.map((notif) => {
                                    const getNotifLink = () => {
                                        if (!notif.link) return null;
                                        return notif.link.replace(/^\/projects\//, "/member/project/");
                                    };
                                    const link = getNotifLink();

                                    return (
                                        <div
                                            key={notif.id}
                                            onClick={() => link && router.push(link)}
                                            className={cn(
                                                "group relative flex items-start gap-3 rounded-xl border border-slate-100 p-3 transition-all hover:bg-slate-50",
                                                !notif.is_read ? "bg-indigo-50/30" : "bg-white",
                                                link && "cursor-pointer"
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    "grid size-10 shrink-0 place-items-center rounded-full",
                                                    notif.type.includes("APPROV")
                                                        ? "bg-emerald-100"
                                                        : notif.type.includes("REJECT")
                                                            ? "bg-rose-100"
                                                            : "bg-indigo-100"
                                                )}
                                            >
                                                {getIcon(notif.type)}
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <p className="font-semibold text-slate-900">{notif.title}</p>
                                                    <span className="text-xs text-slate-400">{formatTimeAgo(notif.created_at)}</span>
                                                </div>
                                                <p className="text-sm text-slate-600">{notif.message}</p>
                                            </div>
                                            {!notif.is_read && (
                                                <div className="mt-2 size-2 rounded-full bg-indigo-500" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                ) : (
                    displayedNotifications.map((notif) => {
                        const getNotifLink = () => {
                            if (!notif.link) return null;
                            return notif.link.replace(/^\/projects\//, '/member/project/');
                        };
                        const link = getNotifLink();

                        return (
                            <div
                                key={notif.id}
                                onClick={() => link && router.push(link)}
                                className={cn(
                                    "group relative flex items-start gap-3 rounded-xl border border-slate-100 p-3 transition-all hover:bg-slate-50",
                                    !notif.is_read ? "bg-indigo-50/30" : "bg-white",
                                    link && "cursor-pointer"
                                )}
                            >
                                <div
                                    className={cn(
                                        "grid size-10 shrink-0 place-items-center rounded-full",
                                        notif.type.includes("APPROV") ? "bg-emerald-100" :
                                            notif.type.includes("REJECT") ? "bg-rose-100" :
                                                "bg-indigo-100"
                                    )}
                                >
                                    {getIcon(notif.type)}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold text-slate-900">{notif.title}</p>
                                        <span className="text-xs text-slate-400">{formatTimeAgo(notif.created_at)}</span>
                                    </div>
                                    <p className="text-sm text-slate-600">{notif.message}</p>
                                </div>
                                {!notif.is_read && (
                                    <div className="mt-2 size-2 rounded-full bg-indigo-500" />
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {showFooterLink && (
                <Button asChild variant="ghost" className="w-full text-indigo-600 hover:text-indigo-700">
                    <Link href="/member/notifications">View All Notifications</Link>
                </Button>
            )}
        </div>
    );
}
