"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ProjectRef = {
    id?: string;
    name: string;
};

type TaskStatus = "todo" | "inProgress" | "done";

type WorkloadData = {
    todo: number;
    inProgress: number;
    done: number;
};

const statusColors: Record<TaskStatus, string> = {
    // Let's stick to a nice palette:
    todo: "#334155", // slate-700
    inProgress: "#3b82f6", // blue-500
    done: "#4ade80", // green-400
};

const statusLabels: Record<TaskStatus, string> = {
    todo: "To Do",
    inProgress: "In Progress",
    done: "Done",
};

// Helper for SVG path calculation
function getCoordinatesForPercent(percent: number) {
    // Start from -90deg (Top) instead of 0deg (Right)
    const angle = 2 * Math.PI * percent - Math.PI / 2;
    const x = Math.cos(angle);
    const y = Math.sin(angle);
    return [x, y];
}

function DonutChart({ data }: { data: WorkloadData }) {
    const [hovered, setHovered] = useState<TaskStatus | null>(null);
    const total = data.todo + data.inProgress + data.done;

    if (total === 0) {
        return (
            <div className="flex h-40 w-40 items-center justify-center rounded-full bg-slate-50 border border-slate-100">
                <span className="text-sm font-medium text-slate-400">No tasks</span>
            </div>
        );
    }

    // Data handling for segments
    const segments = [
        { key: "done" as TaskStatus, value: data.done, color: statusColors.done },
        { key: "inProgress" as TaskStatus, value: data.inProgress, color: statusColors.inProgress },
        { key: "todo" as TaskStatus, value: data.todo, color: statusColors.todo },
    ].filter(s => s.value > 0);

    let cumulativePercent = 0;

    return (
        <div className="relative h-48 w-48 group/chart">
            <svg viewBox="-1 -1 2 2" className="h-full w-full">
                {segments.map((segment) => {
                    const startPercent = cumulativePercent;
                    const slicePercent = segment.value / total;
                    cumulativePercent += slicePercent;

                    // Calculate path (Arc)
                    const [startX, startY] = getCoordinatesForPercent(startPercent);
                    const [endX, endY] = getCoordinatesForPercent(cumulativePercent);

                    // Large arc flag logic
                    const largeArcFlag = slicePercent > 0.5 ? 1 : 0;

                    const pathData = [
                        `M ${startX} ${startY}`, // Move
                        `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`, // Arc
                        `L 0 0`, // Line to center (optional for pie, but we mask it for donut)
                    ].join(" ");

                    // Calculate text position (center of arc)
                    // Angle needs to be adjusted same as getCoordinates
                    const midAngle = 2 * Math.PI * (startPercent + slicePercent / 2) - Math.PI / 2;
                    const textRadius = 0.75; // Placement radius (0-1)
                    const textX = Math.cos(midAngle) * textRadius;
                    const textY = Math.sin(midAngle) * textRadius;

                    const isHovered = hovered === segment.key;

                    return (
                        <g key={segment.key}
                            onMouseEnter={() => setHovered(segment.key)}
                            onMouseLeave={() => setHovered(null)}
                            className="cursor-pointer transition-all duration-300"
                        >
                            <path
                                d={pathData}
                                fill={segment.color}
                                className={cn(
                                    "transition-all duration-300 stroke-white stroke-[0.02]",
                                    isHovered ? "opacity-100 scale-105" : hovered ? "opacity-50" : "opacity-100" // Dim others
                                )}
                            />
                            {/* Percentage Text - No rotation, always upright */}
                            {slicePercent > 0.05 && (
                                <text
                                    x={textX}
                                    y={textY}
                                    fill="white"
                                    fontSize="0.12"
                                    fontWeight="bold"
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    className="pointer-events-none"
                                >
                                    {Math.round(slicePercent * 100)}%
                                </text>
                            )}
                        </g>
                    );
                })}
                {/* Donut Hole - White circle to mask center */}
                <circle cx="0" cy="0" r="0.6" fill="white" />
            </svg>

            {/* Hover Tooltip (Center or Overlay) */}
            {hovered && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="z-10 bg-white shadow-xl border border-slate-100 rounded-lg p-3 text-center min-w-[120px] animate-in fade-in zoom-in-95 duration-200">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            {statusLabels[hovered]}
                        </p>
                        <p className="text-xl font-bold text-slate-800">
                            {data[hovered]}
                            <span className="text-sm font-normal text-slate-400 ml-1">
                                ({Math.round((data[hovered] / total) * 100)}%)
                            </span>
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

export function WorkloadChart({ projects }: { projects: ProjectRef[] }) {
    const [data, setData] = useState<WorkloadData>({ todo: 0, inProgress: 0, done: 0 });
    const [loading, setLoading] = useState(true);

    const fetchTasks = useCallback(async () => {
        if (projects.length === 0) {
            setData({ todo: 0, inProgress: 0, done: 0 });
            setLoading(false);
            return;
        }

        try {
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

            const counts: WorkloadData = { todo: 0, inProgress: 0, done: 0 };
            allTasks.forEach(task => {
                const status = (task.status ?? "").toLowerCase();
                if (status === "done" || status === "completed") {
                    counts.done++;
                } else if (status === "in progress" || status === "in-progress") {
                    counts.inProgress++;
                } else {
                    counts.todo++;
                }
            });

            setData(counts);
        } catch (error) {
            console.error("Failed to fetch workload data:", error);
        } finally {
            setLoading(false);
        }
    }, [projects]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const total = data.todo + data.inProgress + data.done;

    return (
        <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-slate-800">
                    My Workload Distribution
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-4">
                    {loading ? (
                        <div className="flex h-48 w-48 items-center justify-center">
                            <div className="size-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
                        </div>
                    ) : (
                        <DonutChart data={data} />
                    )}

                    {/* Legend */}
                    <div className="flex flex-col gap-5 min-w-[140px]">
                        {(["inProgress", "todo", "done"] as TaskStatus[]).map((status) => (
                            <div key={status} className="flex items-start gap-3">
                                <div
                                    className="size-3.5 rounded-full mt-1 shrink-0"
                                    style={{ backgroundColor: statusColors[status] }}
                                />
                                <div>
                                    <p className="text-xs font-medium text-slate-500">
                                        {statusLabels[status]}
                                    </p>
                                    <p className="text-2xl font-bold text-slate-900 leading-tight">
                                        {data[status]}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
