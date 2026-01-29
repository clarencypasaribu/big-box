"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type ProjectHealthData = {
    onTrack: number;
    atRisk: number;
    delayed: number;
};

export function ProjectHealthChart({ data }: { data: ProjectHealthData }) {
    const total = data.onTrack + data.atRisk + data.delayed;

    if (total === 0) {
        return (
            <Card className="border-slate-200/60 bg-gradient-to-br from-white to-slate-50/50 shadow-lg">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold text-slate-800">
                        Project Health Status
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex h-52 flex-col items-center justify-center gap-3">
                    <div className="flex size-16 items-center justify-center rounded-full bg-slate-100">
                        <svg className="size-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <p className="text-sm font-medium text-slate-500">No project data available</p>
                </CardContent>
            </Card>
        );
    }

    const segments = useMemo(() => {
        return [
            {
                label: "On Track",
                value: data.onTrack,
                percent: (data.onTrack / total) * 100,
                colorStart: "#34d399",
                colorEnd: "#10b981",
                bg: "bg-emerald-500",
            },
            {
                label: "At Risk",
                value: data.atRisk,
                percent: (data.atRisk / total) * 100,
                colorStart: "#fbbf24",
                colorEnd: "#f59e0b",
                bg: "bg-amber-500",
            },
            {
                label: "Delayed",
                value: data.delayed,
                percent: (data.delayed / total) * 100,
                colorStart: "#fb7185",
                colorEnd: "#ef4444",
                bg: "bg-rose-500",
            },
        ];
    }, [data, total]);

    const [hoverIdx, setHoverIdx] = useState<number | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const circumference = 251.3;
    let offsetAcc = 0;

    const handleMouseMove = (e: React.MouseEvent) => {
        // Get cursor position relative to the SVG container is tricky, 
        // relying on page/client coordinates works best for fixed/portal tooltips,
        // but simple absolute positioning relative to the card/container works well too.
        // We'll use relative coordinates to the container div.
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    return (
        <Card className="border-slate-200/60 bg-gradient-to-br from-white to-slate-50/50 shadow-lg transition-shadow hover:shadow-xl group/card relative overflow-hidden">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-slate-800">
                    Project Health Status
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between gap-8">
                    {/* Donut Chart Container */}
                    <div
                        className="relative"
                        onMouseMove={handleMouseMove}
                        onMouseLeave={() => setHoverIdx(null)}
                    >
                        <svg
                            width="180"
                            height="180"
                            viewBox="0 0 100 100"
                            className="drop-shadow-md cursor-crosshair"
                        >
                            {/* Background circle */}
                            <circle
                                cx="50"
                                cy="50"
                                r="40"
                                fill="none"
                                stroke="#f1f5f9"
                                strokeWidth="12"
                            />
                            {/* Segments */}
                            <g className="transform -rotate-90 origin-center">
                                {segments.map((seg, idx) => {
                                    const dash = (seg.percent / 100) * circumference;
                                    const dashOffset = -offsetAcc;
                                    offsetAcc += dash;
                                    const gradId = `grad-${idx}`;
                                    return (
                                        <g key={seg.label}>
                                            <defs>
                                                <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" stopColor={seg.colorStart} />
                                                    <stop offset="100%" stopColor={seg.colorEnd} />
                                                </linearGradient>
                                            </defs>
                                            <circle
                                                cx="50"
                                                cy="50"
                                                r="40"
                                                fill="transparent"
                                                stroke={`url(#${gradId})`}
                                                strokeWidth={hoverIdx === idx ? "14" : "12"}
                                                strokeDasharray={`${dash} ${circumference}`}
                                                strokeDashoffset={dashOffset}
                                                strokeLinecap="round"
                                                className="transition-all duration-200 ease-out"
                                                onMouseEnter={() => setHoverIdx(idx)}
                                            />
                                        </g>
                                    );
                                })}
                            </g>
                        </svg>
                        {/* Center content */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-bold bg-gradient-to-br from-slate-700 to-slate-900 bg-clip-text text-transparent">
                                {total}
                            </span>
                            <span className="text-xs font-medium text-slate-500">Projects</span>
                        </div>

                        {/* Floating Tooltip */}
                        {hoverIdx !== null && segments[hoverIdx] && (
                            <div
                                className="pointer-events-none absolute z-50 rounded-lg border border-slate-200 bg-white p-3 shadow-xl ring-1 ring-slate-100 transition-opacity duration-150"
                                style={{
                                    left: mousePos.x,
                                    top: mousePos.y,
                                    transform: 'translate(10px, 10px)', // Offset from cursor
                                    minWidth: "140px"
                                }}
                            >
                                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                                    {segments[hoverIdx].label}
                                </p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xl font-bold text-slate-900">
                                        {segments[hoverIdx].value}
                                    </span>
                                    <span className="text-xs font-medium text-slate-500">
                                        ({segments[hoverIdx].percent.toFixed(1)}%)
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Legend */}
                    <div className="flex flex-col gap-4">
                        {segments.map((item, idx) => (
                            <div key={item.label} className="group flex items-center gap-3">
                                <div
                                    className={`size-3.5 rounded-full ${item.bg} shadow-sm ring-2 ring-white cursor-pointer transition-transform group-hover:scale-110`}
                                    onMouseEnter={() => setHoverIdx(idx)}
                                    role="button"
                                    tabIndex={0}
                                />
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
                                        {item.label}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-bold text-slate-800">{item.value}</span>
                                        <span className="text-xs font-medium text-slate-400">
                                            ({item.percent.toFixed(0)}%)
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Explanatory Text */}
                <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-center">
                    {data.delayed > 0 ? (
                        <p className="text-sm text-slate-600">
                            <span className="font-semibold text-rose-600">{data.delayed} project{data.delayed > 1 ? 's' : ''}</span> delayed due to overdue tasks or blockers
                        </p>
                    ) : data.atRisk > 0 ? (
                        <p className="text-sm text-slate-600">
                            <span className="font-semibold text-amber-600">{data.atRisk} project{data.atRisk > 1 ? 's' : ''}</span> at risk of missing deadlines
                        </p>
                    ) : (
                        <p className="text-sm text-emerald-600 font-medium">
                            ✓ All projects are progressing as planned
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
