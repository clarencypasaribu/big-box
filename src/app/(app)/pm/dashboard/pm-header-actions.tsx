"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { NotificationsClient } from "@/app/(app)/member/dashboard/notifications-client";

export function PMHeaderActions() {
    const [unreadCount, setUnreadCount] = useState<number>(0);

    useEffect(() => {
        async function fetchCount() {
            try {
                const res = await fetch("/api/notifications");
                if (!res.ok) return;
                const body = await res.json().catch(() => ({}));
                const data = body.data || [];
                if (Array.isArray(data)) {
                    const total = data.length;
                    const unread = data.filter((n) => n?.is_read === false || n?.is_read === undefined || n?.is_read === null).length;
                    setUnreadCount(unread > 0 ? unread : total);
                } else {
                    setUnreadCount(0);
                }
            } catch {
                // ignore count fetch errors; popover will still load full list
            }
        }
        fetchCount();
    }, []);

    const badgeLabel = unreadCount > 9 ? "9+" : unreadCount > 0 ? unreadCount.toString() : null;

    return (
        <div className="flex w-full items-center justify-end gap-3">
            {/* Notification Bell */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon"
                        className="relative h-11 w-11 shrink-0 rounded-full border-slate-200 text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                    >
                        <Bell className="size-5" />
                        {badgeLabel ? (
                            <span className="absolute -right-1 -top-1 min-w-[16px] rounded-full bg-rose-600 px-[5px] text-center text-[9px] font-bold leading-4 text-white shadow-sm">
                                {badgeLabel}
                            </span>
                        ) : null}
                        <span className="sr-only">Notifications</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-[380px] overflow-hidden rounded-xl border-slate-200 p-0 shadow-xl">
                    <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-3">
                        <h4 className="font-semibold text-slate-900">Latest updates</h4>
                        <p className="text-xs text-slate-500">Project, task, dan risiko yang perlu perhatianmu.</p>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto p-2">
                        <NotificationsClient variant="clean" onlyToday={false} showFooterLink={false} limit={10} />
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
