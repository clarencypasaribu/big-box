"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type ProjectRef = {
    id?: string;
    name: string;
};

type DayData = {
    label: string;
    date: string;
    count: number;
    isToday: boolean;
};

function formatDateLabel(date: Date): string {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days[date.getDay()];
}

function formatDateShort(date: Date): string {
    return `${date.getDate()}/${date.getMonth() + 1}`;
}

function isSameDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

export function DeadlineChart({ projects }: { projects: ProjectRef[] }) {
    const [chartData, setChartData] = useState<DayData[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchDeadlines = useCallback(async () => {
        if (projects.length === 0) {
            setChartData([]);
            setLoading(false);
            return;
        }

        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Generate next 7 days
            const days: DayData[] = [];
            for (let i = 0; i < 7; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() + i);
                days.push({
                    label: i === 0 ? "Today" : formatDateLabel(date),
                    date: date.toISOString().split("T")[0],
                    count: 0,
                    isToday: i === 0,
                });
            }

            // Fetch tasks from all projects
            const projectIds = projects.map(p => p.id).filter(Boolean);
            const allTasks: any[] = [];

            for (const projectId of projectIds) {
                const res = await fetch(`/api/project-tasks?projectId=${projectId}`);
                if (res.ok) {
                    const body = await res.json();
                    if (Array.isArray(body.data)) {
                        allTasks.push(...body.data);
                    }
                }
            }

            // Count tasks by due date
            allTasks.forEach(task => {
                if (!task.due_date) return;
                const status = (task.status ?? "").toLowerCase();
                if (status === "done" || status === "completed") return; // Skip done tasks

                const dueDate = task.due_date.split("T")[0];
                const dayIndex = days.findIndex(d => d.date === dueDate);
                if (dayIndex !== -1) {
                    days[dayIndex].count++;
                }
            });

            setChartData(days);
        } catch (error) {
            console.error("Failed to fetch deadline data:", error);
        } finally {
            setLoading(false);
        }
    }, [projects]);

    useEffect(() => {
        fetchDeadlines();
    }, [fetchDeadlines]);

    const maxCount = Math.max(...chartData.map(d => d.count), 1);
    const totalUpcoming = chartData.reduce((sum, d) => sum + d.count, 0);

    return (
        <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-slate-800">
                        Upcoming Deadlines
                    </CardTitle>
                    {totalUpcoming > 0 && (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                            {totalUpcoming} due
                        </span>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex h-40 items-center justify-center">
                        <div className="size-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
                    </div>
                ) : chartData.length === 0 ? (
                    <div className="flex h-40 items-center justify-center text-sm text-slate-400">
                        No projects to track
                    </div>
                ) : (
                    <div className="flex h-40 items-end justify-between gap-3 pt-6 pb-2">
                        <TooltipProvider>
                            {chartData.map((day, index) => {
                                // Scale height logic
                                const effectiveMax = Math.max(...chartData.map(d => d.count), 3);
                                const percentage = Math.min((day.count / effectiveMax) * 100, 100);

                                const isActive = day.count > 0;

                                // Bar Color Logic
                                let barColor = "bg-slate-300"; // Darker gray for clear visibility
                                if (day.isToday) barColor = "bg-indigo-500 shadow-sm shadow-indigo-200";
                                else if (day.count >= 2) barColor = "bg-rose-500 shadow-sm shadow-rose-200"; // High load -> Rose
                                else if (day.count === 1) barColor = "bg-amber-500"; // Single task -> Bold Amber

                                // Height logic: min 8px for empty
                                const barHeight = isActive ? `${percentage}%` : '8px';

                                return (
                                    <Tooltip key={index}>
                                        <TooltipTrigger asChild>
                                            <div className="group relative flex flex-1 cursor-default flex-col items-center justify-end gap-2 h-full">
                                                {/* Number on TOP */}
                                                <div className={cn(
                                                    "text-xs font-semibold transition-all mb-auto mt-auto pb-1 flex flex-col items-center",
                                                    isActive ? "text-slate-700" : "text-transparent"
                                                )}>
                                                    {day.count}
                                                </div>

                                                {/* The Bar */}
                                                <div
                                                    className={cn("w-full max-w-[24px] rounded-t-sm transition-all duration-500 ease-out", barColor)}
                                                    style={{ height: barHeight }}
                                                />

                                                {/* Label */}
                                                <span className={cn(
                                                    "text-[10px] font-medium tracking-wide",
                                                    day.isToday ? "text-indigo-600 font-bold" : "text-slate-400"
                                                )}>
                                                    {day.label}
                                                </span>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">
                                            <p className="font-semibold">{day.count} tasks due</p>
                                            <p className="text-xs text-slate-400">
                                                {new Date(day.date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                );
                            })}
                        </TooltipProvider>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
