"use client";

import { Plus, ShieldAlert, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link"; // Assuming these will link to functional pages/modals later

export function DashboardQuickActions() {
    return (
        <TooltipProvider delayDuration={300}>
            <div className="flex items-center gap-2">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button size="sm" className="h-9 gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm" asChild>
                            <Link href="/member/tasks/new">
                                <Plus className="size-4" />
                                <span className="hidden sm:inline">Add Task</span>
                            </Link>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Create a new task</TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button size="sm" variant="outline" className="h-9 gap-1.5 border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 hover:border-rose-300" asChild>
                            <Link href="/member/blockers/new">
                                <ShieldAlert className="size-4" />
                                <span className="hidden sm:inline">Report Blocker</span>
                            </Link>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Report an issue or blocker</TooltipContent>
                </Tooltip>

                {/* Optional Comment/Update Action */}
                {/* 
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button size="sm" variant="ghost" className="size-9 p-0 text-slate-500 hover:text-indigo-600">
                             <MessageSquarePlus className="size-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Post a quick update</TooltipContent>
                </Tooltip>
                */}
            </div>
        </TooltipProvider>
    );
}
