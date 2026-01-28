"use client";

import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { NotificationsClient } from "@/app/(app)/member/dashboard/notifications-client";

export function PMHeaderActions() {
    return (
        <div className="flex w-full items-center justify-end gap-3">
            {/* Search Bar */}
            <div className="relative w-full max-w-xs lg:max-w-sm">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                    className="h-11 rounded-md border-slate-200 bg-slate-100/60 pl-10 text-sm"
                    placeholder="Search for anything..."
                    type="search"
                />
            </div>

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
