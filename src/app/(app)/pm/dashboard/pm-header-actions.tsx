"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { NotificationsClient } from "@/app/(app)/member/dashboard/notifications-client";

export function PMHeaderActions() {
    return (
        <div className="flex w-full items-center justify-end gap-3">


            {/* Notification Bell */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" className="h-11 w-11 shrink-0 rounded-full border-slate-200 text-slate-500 hover:text-indigo-600">
                        <Bell className="size-5" />
                        <span className="sr-only">Notifications</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-[380px] p-0 shadow-xl overflow-hidden rounded-xl border-slate-200">
                    <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-3">
                        <h4 className="font-semibold text-slate-900">Today's Updates</h4>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto p-2">
                        <NotificationsClient variant="clean" onlyToday={true} showFooterLink={false} limit={10} />
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
