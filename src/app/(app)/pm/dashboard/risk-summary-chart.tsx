"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type RiskSummaryData = {
    open: number;
    assigned: number;
    resolved: number;
};

export function RiskSummaryChart({ data }: { data: RiskSummaryData }) {
    const total = data.open + data.assigned + data.resolved;
    const maxValue = Math.max(data.open, data.assigned, data.resolved, 1);

    if (total === 0) {
        return (
            <Card className="border-slate-200/60 bg-gradient-to-br from-white to-slate-50/50 shadow-lg">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold text-slate-800">
                        Risk & Blocker Summary
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex h-52 flex-col items-center justify-center gap-3">
                    <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-50 to-green-100">
                        <svg className="size-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-sm font-medium text-slate-500">No blockers reported</p>
                    <p className="text-xs text-slate-400">All projects running smoothly!</p>
                </CardContent>
            </Card>
        );
    }

    const bars = [
        {
            label: "Open",
            value: data.open,
            gradient: "from-rose-400 to-red-500",
            bgLight: "bg-rose-50",
            textColor: "text-rose-600"
        },
        {
            label: "Assigned",
            value: data.assigned,
            gradient: "from-amber-400 to-orange-500",
            bgLight: "bg-amber-50",
            textColor: "text-amber-600"
        },
        {
            label: "Resolved",
            value: data.resolved,
            gradient: "from-emerald-400 to-green-500",
            bgLight: "bg-emerald-50",
            textColor: "text-emerald-600"
        },
    ];

    return (
        <Card className="border-slate-200/60 bg-gradient-to-br from-white to-slate-50/50 shadow-lg transition-shadow hover:shadow-xl">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-slate-800">
                        Risk & Blocker Summary
                    </CardTitle>
                    <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                        {total} total
                    </span>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex h-44 items-end justify-around gap-6 px-4">
                    {bars.map((bar) => {
                        const heightPercent = Math.max((bar.value / maxValue) * 100, bar.value > 0 ? 8 : 0);
                        return (
                            <div key={bar.label} className="flex flex-1 flex-col items-center gap-3 group">
                                {/* Value label */}
                                <div className={`px-3 py-1 rounded-full ${bar.bgLight} transition-transform group-hover:scale-110`}>
                                    <span className={`text-xl font-bold ${bar.textColor}`}>{bar.value}</span>
                                </div>

                                {/* Bar */}
                                <div className="relative flex h-28 w-full items-end justify-center">
                                    <div className="w-full max-w-16 h-full rounded-xl bg-slate-100/80 overflow-hidden shadow-inner">
                                        <div
                                            className={`w-full rounded-xl bg-gradient-to-t ${bar.gradient} transition-all duration-700 ease-out shadow-lg group-hover:opacity-90`}
                                            style={{
                                                height: `${heightPercent}%`,
                                                marginTop: 'auto',
                                                position: 'absolute',
                                                bottom: 0,
                                                left: 0,
                                                right: 0,
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Label */}
                                <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-800 transition-colors">
                                    {bar.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
