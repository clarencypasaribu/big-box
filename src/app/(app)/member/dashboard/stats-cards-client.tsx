"use client";

import { useCallback, useEffect, useMemo, useState, type ElementType } from "react";
import { CheckSquare, Clock3, FileClock, Folder } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ProjectRef = {
    name: string;
};

type StoredCard = {
    id: string;
    done?: boolean;
    dueDate?: string;
};

type StoredColumn = {
    id: string;
    title: string;
    status: "Completed" | "Active" | "Testing" | "Pending";
    cards: StoredCard[];
};

type Stat = {
    label: string;
    value: number;
    icon: ElementType;
    accent: string;
};

const baseStats: Omit<Stat, "value">[] = [
    { label: "Total Projects", icon: Folder, accent: "bg-[#f1e7ff]" },
    { label: "Completed Task", icon: CheckSquare, accent: "bg-[#fce9fd]" },
    { label: "Due Today", icon: Clock3, accent: "bg-[#e8f1ff]" },
    { label: "Pending Overview", icon: FileClock, accent: "bg-[#fdeff0]" },
];

function storageKey(projectName: string) {
    return `member-project:v2:${projectName}`;
}

function parseDueDate(value?: string) {
    if (!value) return null;
    const trimmed = value.trim();
    if (!trimmed) return null;

    const parts = trimmed.split("/");
    if (parts.length === 3 && parts.every((part) => /^\d+$/.test(part))) {
        const [monthRaw, dayRaw, yearRaw] = parts;
        const month = Number(monthRaw);
        const day = Number(dayRaw);
        let year = Number(yearRaw);
        if (yearRaw.length === 2) year += 2000;
        if (month < 1 || month > 12 || day < 1 || day > 31) return null;
        const date = new Date(year, month - 1, day);
        if (Number.isNaN(date.getTime())) return null;
        return date;
    }

    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
}

function isSameDay(a: Date, b: Date) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

export function StatsCardsClient({ projects }: { projects: ProjectRef[] }) {
    const [stats, setStats] = useState<Stat[]>(() =>
        baseStats.map((stat) => ({ ...stat, value: 0 }))
    );

    const recomputeStats = useCallback(() => {
        if (typeof window === "undefined") return;
        const today = new Date();
        let completedTasks = 0;
        let pendingTasks = 0;
        let dueToday = 0;

        projects.forEach((project) => {
            const raw = window.localStorage.getItem(storageKey(project.name));
            if (!raw) return;
            try {
                const parsed = JSON.parse(raw) as StoredColumn[];
                if (!Array.isArray(parsed)) return;
                parsed.forEach((column) => {
                    if (!Array.isArray(column.cards)) return;
                    column.cards.forEach((card) => {
                        const isDone = Boolean(card.done) || column.status === "Completed";
                        if (isDone) {
                            completedTasks += 1;
                        } else {
                            pendingTasks += 1;
                        }
                        const dueDate = parseDueDate(card.dueDate);
                        if (dueDate && isSameDay(dueDate, today)) {
                            dueToday += 1;
                        }
                    });
                });
            } catch {
                return;
            }
        });

        const nextValues = [projects.length, completedTasks, dueToday, pendingTasks];
        setStats((prev) =>
            prev.map((stat, index) => ({
                ...stat,
                value: nextValues[index] ?? 0,
            }))
        );
    }, [projects]);

    useEffect(() => {
        recomputeStats();
    }, [recomputeStats]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const handleStorage = () => recomputeStats();
        const handleVisibility = () => {
            if (document.visibilityState === "visible") recomputeStats();
        };
        window.addEventListener("storage", handleStorage);
        document.addEventListener("visibilitychange", handleVisibility);
        return () => {
            window.removeEventListener("storage", handleStorage);
            document.removeEventListener("visibilitychange", handleVisibility);
        };
    }, [recomputeStats]);

    const emptyState = useMemo(() => projects.length === 0, [projects.length]);

    if (emptyState) {
        return (
            <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
                No projects to display.
            </div>
        );
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
                <Card key={stat.label} className="border-slate-200 shadow-sm">
                    <CardContent className="flex items-center gap-4 p-5">
                        <div className={cn("grid size-12 place-items-center rounded-full", stat.accent)}>
                            <stat.icon className="size-5 text-slate-800" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">{stat.label}</p>
                            <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
