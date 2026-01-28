"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type ChartData = {
    label: string;
    subLabel?: string;
    value: number;
    onTrack?: number;
    atRisk?: number;
    delayed?: number;
};

export function ProjectDistributionChart({ data }: { data: ChartData[] }) {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    const maxValue = Math.max(...data.map(d => d.value), 1);

    return (
        <Card className="border-slate-200/60 shadow-md">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold text-slate-800">
                        Project Distribution
                    </CardTitle>
                    <span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-bold text-violet-700">
                        {total} Projects
                    </span>
                </div>
            </CardHeader>
            <CardContent className="pt-2">
                <div className="space-y-3">
                    {data.map((item, index) => {
                        const barWidth = item.value > 0 ? Math.max((item.value / maxValue) * 100, 12) : 0;
                        const hasHealthData = item.onTrack !== undefined;

                        return (
                            <div key={index} className="flex items-center gap-3">
                                {/* Stage Label */}
                                <div className="w-20 shrink-0">
                                    <span className="text-sm font-bold text-slate-700">{item.label}</span>
                                    {item.subLabel && (
                                        <span className="ml-1 text-xs text-slate-400 hidden sm:inline">
                                            {item.subLabel}
                                        </span>
                                    )}
                                </div>

                                {/* Simple Bar */}
                                <div className="relative h-8 flex-1 overflow-hidden rounded-md bg-slate-100">
                                    {item.value > 0 && (
                                        <div
                                            className="absolute inset-y-0 left-0 flex items-center rounded-md bg-gradient-to-r from-violet-500 to-purple-500 px-3 transition-all duration-500"
                                            style={{ width: `${barWidth}%` }}
                                        >
                                            <span className="text-sm font-bold text-white">{item.value}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Health Dots (simple indicator) */}
                                {hasHealthData && item.value > 0 && (
                                    <div className="flex shrink-0 gap-1">
                                        {(item.onTrack ?? 0) > 0 && (
                                            <div className="flex items-center gap-0.5">
                                                <div className="size-2 rounded-full bg-emerald-500" />
                                                <span className="text-xs text-slate-500">{item.onTrack}</span>
                                            </div>
                                        )}
                                        {(item.atRisk ?? 0) > 0 && (
                                            <div className="flex items-center gap-0.5">
                                                <div className="size-2 rounded-full bg-amber-500" />
                                                <span className="text-xs text-slate-500">{item.atRisk}</span>
                                            </div>
                                        )}
                                        {(item.delayed ?? 0) > 0 && (
                                            <div className="flex items-center gap-0.5">
                                                <div className="size-2 rounded-full bg-rose-500" />
                                                <span className="text-xs text-slate-500">{item.delayed}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
