"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type ProgressPoint = {
    label: string;
    planned: number;
    actual: number;
};

export function ProgressTimelineChart({ data }: { data: ProgressPoint[] }) {
    if (data.length === 0) {
        return (
            <Card className="border-slate-200/60 bg-gradient-to-br from-white to-slate-50/50 shadow-lg">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold text-slate-800">
                        Progress vs Timeline
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex h-52 flex-col items-center justify-center gap-3">
                    <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-indigo-100">
                        <svg className="size-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                    <p className="text-sm font-medium text-slate-500">No progress data available</p>
                </CardContent>
            </Card>
        );
    }

    const chartHeight = 160;
    const chartWidth = 320;
    const padding = { left: 45, right: 20, top: 20, bottom: 35 };
    const innerWidth = chartWidth - padding.left - padding.right;
    const innerHeight = chartHeight - padding.top - padding.bottom;

    const pointSpacing = innerWidth / Math.max(data.length - 1, 1);

    const plannedPoints = data.map((d, i) => ({
        x: padding.left + i * pointSpacing,
        y: padding.top + innerHeight - (d.planned / 100) * innerHeight,
    }));

    const actualPoints = data.map((d, i) => ({
        x: padding.left + i * pointSpacing,
        y: padding.top + innerHeight - (d.actual / 100) * innerHeight,
    }));

    const createSmoothPath = (points: { x: number; y: number }[]) => {
        if (points.length < 2) return "";

        let path = `M ${points[0].x} ${points[0].y}`;

        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const cpx = (prev.x + curr.x) / 2;
            path += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
        }

        return path;
    };

    const plannedPath = createSmoothPath(plannedPoints);
    const actualPath = createSmoothPath(actualPoints);

    const actualAreaPath = `${actualPath} L ${actualPoints[actualPoints.length - 1].x} ${padding.top + innerHeight} L ${padding.left} ${padding.top + innerHeight} Z`;

    return (
        <Card className="border-slate-200/60 bg-gradient-to-br from-white to-slate-50/50 shadow-lg transition-shadow hover:shadow-xl">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-slate-800">
                    Progress vs Timeline
                </CardTitle>
            </CardHeader>
            <CardContent>
                <svg width="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="overflow-visible">
                    {/* Gradient definitions */}
                    <defs>
                        <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.02" />
                        </linearGradient>
                        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#7c3aed" />
                            <stop offset="100%" stopColor="#a78bfa" />
                        </linearGradient>
                    </defs>

                    {/* Y-axis grid lines */}
                    {[0, 25, 50, 75, 100].map((val) => {
                        const y = padding.top + innerHeight - (val / 100) * innerHeight;
                        return (
                            <g key={val}>
                                <line
                                    x1={padding.left}
                                    y1={y}
                                    x2={chartWidth - padding.right}
                                    y2={y}
                                    stroke="#e2e8f0"
                                    strokeWidth="1"
                                    strokeDasharray={val === 0 ? "0" : "4 4"}
                                />
                                <text
                                    x={padding.left - 8}
                                    y={y + 4}
                                    textAnchor="end"
                                    className="fill-slate-400 text-[10px] font-medium"
                                >
                                    {val}%
                                </text>
                            </g>
                        );
                    })}

                    {/* Area under actual line */}
                    <path
                        d={actualAreaPath}
                        fill="url(#areaGradient)"
                    />

                    {/* Planned line (dashed) */}
                    <path
                        d={plannedPath}
                        fill="none"
                        stroke="#94a3b8"
                        strokeWidth="2"
                        strokeDasharray="6 4"
                        strokeLinecap="round"
                        className="transition-all duration-500"
                    />

                    {/* Actual line */}
                    <path
                        d={actualPath}
                        fill="none"
                        stroke="url(#lineGradient)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="transition-all duration-500 drop-shadow-sm"
                    />

                    {/* Data points on actual line */}
                    {actualPoints.map((point, i) => (
                        <g key={i} className="group">
                            <circle
                                cx={point.x}
                                cy={point.y}
                                r="8"
                                fill="transparent"
                                className="cursor-pointer"
                            />
                            <circle
                                cx={point.x}
                                cy={point.y}
                                r="5"
                                fill="white"
                                stroke="#8b5cf6"
                                strokeWidth="2.5"
                                className="transition-all duration-200 drop-shadow-sm"
                            />
                        </g>
                    ))}

                    {/* X-axis labels */}
                    {data.map((d, i) => (
                        <text
                            key={i}
                            x={padding.left + i * pointSpacing}
                            y={chartHeight - 10}
                            textAnchor="middle"
                            className="fill-slate-500 text-[11px] font-medium"
                        >
                            {d.label}
                        </text>
                    ))}
                </svg>

                {/* Legend */}
                <div className="mt-4 flex items-center justify-center gap-8 border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center">
                            <div className="h-0.5 w-5 rounded bg-slate-400" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #94a3b8, #94a3b8 4px, transparent 4px, transparent 8px)' }} />
                        </div>
                        <span className="text-xs font-medium text-slate-600">Planned</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-1 w-5 rounded-full bg-gradient-to-r from-violet-600 to-violet-400" />
                        <span className="text-xs font-medium text-slate-600">Actual</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
