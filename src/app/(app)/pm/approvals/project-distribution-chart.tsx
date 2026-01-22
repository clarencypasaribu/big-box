"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type ChartData = {
    label: string;
    subLabel?: string;
    value: number;
};

export function ProjectDistributionChart({ data }: { data: ChartData[] }) {
    const maxValue = Math.max(...data.map((d) => d.value), 1);

    return (
        <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-slate-900">
                    Project Distribution By Stage
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="mt-4 flex h-64 gap-2 sm:gap-4 text-xs">
                    {data.map((item, index) => {
                        const heightPercentage = (item.value / maxValue) * 100;
                        return (
                            <div key={index} className="group flex flex-1 flex-col items-center gap-2">
                                <div className="mb-1 font-semibold text-slate-700">{item.value}</div>
                                <div className="relative w-full flex-1 flex items-end rounded-t-lg bg-slate-50">
                                    {/* Background track (optional) */}
                                    <div
                                        className="w-full rounded-md bg-purple-500 transition-all duration-500 ease-out group-hover:bg-purple-600"
                                        style={{ height: `${heightPercentage}%` }}
                                    />
                                </div>
                                <div className="text-center">
                                    <div className="font-bold text-slate-900">{item.label}</div>
                                    {item.subLabel && (
                                        <div className="hidden text-[10px] text-slate-500 sm:block">
                                            {item.subLabel}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
