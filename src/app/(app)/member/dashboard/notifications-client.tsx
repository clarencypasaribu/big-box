"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
    Bell,
    CheckCircle2,
    AlertTriangle,
    Clock,
    Briefcase,
    MessageSquare,
    ShieldAlert,
    Siren,
    ListTodo,
    UserX,
    TrendingDown,
    Activity,
    Info
} from "lucide-react";
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
    const pathname = usePathname();

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

    // Helper to determine styling based on type/content
    function getNotificationStyle(notif: Notification) {
        const type = notif.type;
        const msg = notif.message.toLowerCase();

        // --- PM SPECIFIC CATEGORIES ---

        // A. Project Alert (Status Change / Deadline) - ORANGE/ROSE
        if (type === "PROJECT_ALERT") {
            return {
                icon: <Activity className="size-5 text-orange-600" />,
                bg: "bg-orange-100",
                border: "border-orange-100"
            };
        }

        // B. Risk Alert (Blockers) - RED
        if (type === "RISK_ALERT") {
            return {
                icon: <ShieldAlert className="size-5 text-rose-600" />,
                bg: "bg-rose-100",
                border: "border-rose-100"
            };
        }

        // C. Task Aggregate (Overdue count) - AMBER
        if (type === "TASK_AGGREGATE") {
            return {
                icon: <ListTodo className="size-5 text-amber-600" />,
                bg: "bg-amber-100",
                border: "border-amber-100"
            };
        }

        // D. Member Issue - PURPLE
        if (type === "MEMBER_ISSUE") {
            return {
                icon: <UserX className="size-5 text-purple-600" />,
                bg: "bg-purple-100",
                border: "border-purple-100"
            };
        }

        // --- STANDARD CATEGORIES ---

        // 1. Assignments (Blue)
        if (type === "NEW_ASSIGNMENT") {
            return {
                icon: <Briefcase className="size-5 text-blue-600" />,
                bg: "bg-blue-100",
                border: "border-blue-100" // For card border if needed, generally border-slate-100 is fine
            };
        }

        // 2. Reminders (Amber/Red)
        if (type === "REMINDER" || type === "DEADLINE_APPROACHING") {
            if (msg.includes("overdue")) {
                return {
                    icon: <AlertTriangle className="size-5 text-rose-600" />,
                    bg: "bg-rose-100",
                    border: "border-rose-100"
                };
            }
            // Due Today / Tomorrow / Approach
            return {
                icon: <Clock className="size-5 text-amber-600" />,
                bg: "bg-amber-100",
                border: "border-amber-100"
            };
        }

        // 3. Interactions (Green)
        if (type === "TASK_COMMENT" || type.includes("Message")) {
            return {
                icon: <MessageSquare className="size-5 text-emerald-600" />,
                bg: "bg-emerald-100",
                border: "border-emerald-100"
            };
        }

        // 4. Project Info (Slate/Gray)
        if (type === "PROJECT_INFO") {
            return {
                icon: <Info className="size-5 text-slate-600" />,
                bg: "bg-slate-100",
                border: "border-slate-100"
            };
        }

        // Fallback / Generic
        if (type.includes("APPROV") || type === "success") {
            return {
                icon: <CheckCircle2 className="size-5 text-emerald-600" />,
                bg: "bg-emerald-100",
                border: "border-emerald-100"
            };
        }

        return {
            icon: <Bell className="size-5 text-indigo-600" />,
            bg: "bg-indigo-100",
            border: "border-indigo-100"
        };
    }

    const visibleNotifications = useMemo(() => {
        let filtered = notifications;

        if (onlyToday) {
            const now = new Date();
            filtered = notifications.filter((notif) => {
                const date = new Date(notif.created_at);
                return (
                    date.getFullYear() === now.getFullYear() &&
                    date.getMonth() === now.getMonth() &&
                    date.getDate() === now.getDate()
                );
            });
        }
        return filtered;
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

    // Helper to adjust links based on role context
    function getAdjustedLink(originalLink?: string) {
        if (!originalLink) return undefined;

        const isMemberContext = !pathname.startsWith("/pm");
        let link = originalLink;

        if (isMemberContext) {
            // Rewrite PM-specific links to Member equivalents
            if (link.startsWith("/pm/risks") || link.includes("blocker")) {
                // Members see blockers on their dashboard
                return "/member/dashboard";
            }
            if (link.startsWith("/pm/projects/")) {
                return link.replace("/pm/projects/", "/member/project/");
            }
            if (link.startsWith("/projects/")) {
                return link.replace("/projects/", "/member/project/");
            }
            if (link.startsWith("/pm")) {
                // Fallback for other PM links - redirect to member dashboard to avoid 404/403
                return "/member/dashboard";
            }
        } else {
            // PM Context
            if (link.startsWith("/projects/")) {
                return link.replace("/projects/", "/pm/projects/");
            }
        }

        return link;
    }

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
                    <p className="py-4 text-center text-sm text-slate-500">Loading...</p>
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
                                    const style = getNotificationStyle(notif);
                                    const link = getAdjustedLink(notif.link);

                                    return (
                                        <div
                                            key={notif.id}
                                            onClick={() => link && router.push(link)}
                                            className={cn(
                                                "group relative flex items-start gap-4 rounded-xl border border-slate-100 p-4 transition-all hover:bg-slate-50 hover:shadow-sm",
                                                !notif.is_read ? "bg-indigo-50/30" : "bg-white",
                                                link && "cursor-pointer"
                                            )}
                                        >
                                            <div className={cn(
                                                "grid size-10 shrink-0 place-items-center rounded-full transition-colors",
                                                style.bg
                                            )}>
                                                {style.icon}
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className="font-semibold text-slate-900 leading-tight">{notif.title}</p>
                                                    <span className="text-xs font-medium text-slate-400 whitespace-nowrap pt-0.5">
                                                        {formatTimeAgo(notif.created_at)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-600 leading-relaxed max-w-[90%]">
                                                    {notif.message}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                ) : (
                    displayedNotifications.map((notif) => {
                        const style = getNotificationStyle(notif);
                        const link = getAdjustedLink(notif.link);

                        return (
                            <div
                                key={notif.id}
                                onClick={() => link && router.push(link)}
                                className={cn(
                                    "group relative flex items-start gap-4 rounded-xl border border-slate-100 p-4 transition-all hover:bg-slate-50 hover:shadow-sm",
                                    !notif.is_read ? "bg-indigo-50/30" : "bg-white",
                                    link && "cursor-pointer"
                                )}
                            >
                                <div className={cn(
                                    "grid size-10 shrink-0 place-items-center rounded-full transition-colors",
                                    style.bg
                                )}>
                                    {style.icon}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="font-semibold text-slate-900 leading-tight">{notif.title}</p>
                                        <span className="text-xs font-medium text-slate-400 whitespace-nowrap pt-0.5">
                                            {formatTimeAgo(notif.created_at)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 leading-relaxed max-w-[90%]">
                                        {notif.message}
                                    </p>
                                </div>
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
