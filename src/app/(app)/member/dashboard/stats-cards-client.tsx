"use client";

import { useCallback, useEffect, useMemo, useState, type ElementType } from "react";
import { CheckSquare, Clock3, FileClock, Folder } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ProjectRef = {
    id: string;
    name: string;
};

type Stat = {
    label: string;
    value: number;
    icon: ElementType;
    accent: string;
};

const baseStats: Omit<Stat, "value">[] = [
    { label: "Total Projects", icon: Folder, accent: "bg-[#f1e7ff]" },
    { label: "Completed Tasks", icon: CheckSquare, accent: "bg-[#fce9fd]" },
    { label: "Due Today", icon: Clock3, accent: "bg-[#e8f1ff]" },
];



export function StatsCardsClient({ projects }: { projects: ProjectRef[] }) {
    const [stats, setStats] = useState<Stat[]>(baseStats.map(s => ({ ...s, value: 0 })));
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!projects.length) {
            setLoading(false);
            return;
        }

        try {
            // Fetch Tasks
            const allTasks: any[] = [];

            for (const project of projects as any[]) {
                if (!project.id) continue;
                const res = await fetch(`/api/project-tasks?projectId=${project.id}`);
                if (res.ok) {
                    const body = await res.json();
                    if (Array.isArray(body.data)) {
                        allTasks.push(...body.data);
                    }
                }
            }

            let completedTasks = 0;
            let dueToday = 0;
            const todayStr = new Date().toISOString().split("T")[0];

            allTasks.forEach(task => {
                const status = (task.status ?? "").toLowerCase();
                const isDone = status === "done" || status === "completed";

                if (isDone) completedTasks++;

                if (task.due_date && !isDone) {
                    const dueDateStr = task.due_date.split("T")[0];
                    if (dueDateStr === todayStr) dueToday++;
                }
            });

            const pendingTasks = allTasks.length - completedTasks;

            setStats([
                { label: "Total Projects", icon: Folder, accent: "bg-[#f1e7ff]", value: projects.length },
                { label: "Completed Tasks", icon: CheckSquare, accent: "bg-[#fce9fd]", value: completedTasks },
                { label: "Due Today", icon: Clock3, accent: "bg-[#e8f1ff]", value: dueToday },
            ]);

        } catch (error) {
            console.error("Failed to fetch dashboard stats:", error);
        } finally {
            setLoading(false);
        }
    }, [projects]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const emptyState = useMemo(() => projects.length === 0, [projects.length]);

    if (emptyState) {
        return (
            <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
                No projects to display.
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-3">
            {stats.map((stat) => (
                <Card key={stat.label} className="border-slate-200 shadow-sm">
                    <CardContent className="flex items-center gap-4 p-5">
                        <div className={cn("grid size-12 place-items-center rounded-full", stat.accent)}>
                            <stat.icon className="size-5 text-slate-800" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">{stat.label}</p>
                            <p className="text-2xl font-semibold text-slate-900">
                                {loading ? "-" : stat.value}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
