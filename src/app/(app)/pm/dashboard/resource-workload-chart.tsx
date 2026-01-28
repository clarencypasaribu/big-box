"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type WorkloadItem = {
    assignee: string;
    toDo: number;
    inProgress: number;
};

export function ResourceWorkloadChart({ data }: { data: WorkloadItem[] }) {
    const maxTasks = Math.max(...data.map((d) => d.toDo + d.inProgress), 1);

    if (data.length === 0) {
        return (
            <Card className="border-slate-200/60 bg-gradient-to-br from-white to-slate-50/50 shadow-lg">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold text-slate-800">
                        Resource Workload
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex h-52 flex-col items-center justify-center gap-3">
                    <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-50 to-purple-100">
                        <svg className="size-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <p className="text-sm font-medium text-slate-500">No workload data available</p>
                    <p className="text-xs text-slate-400">Assign tasks to team members to see workload</p>
                </CardContent>
            </Card>
        );
    }

    const sortedData = [...data]
        .sort((a, b) => (b.toDo + b.inProgress) - (a.toDo + a.inProgress))
        .slice(0, 6);

    return (
        <Card className="border-slate-200/60 bg-gradient-to-br from-white to-slate-50/50 shadow-lg transition-shadow hover:shadow-xl">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-slate-800">
                    Resource Workload
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {sortedData.map((item, index) => {
                        const total = item.toDo + item.inProgress;
                        const toDoPercent = (item.toDo / maxTasks) * 100;
                        const inProgressPercent = (item.inProgress / maxTasks) * 100;

                        return (
                            <div key={index} className="group">
                                <div className="mb-1.5 flex items-center justify-between">
                                    <span className="text-sm font-medium text-slate-700 truncate max-w-[140px]">
                                        {item.assignee || "Unassigned"}
                                    </span>
                                    <span className="text-sm font-bold text-slate-800">
                                        {total} <span className="font-normal text-slate-400 text-xs">tasks</span>
                                    </span>
                                </div>

                                <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner">
                                    <div className="absolute inset-0 flex">
                                        {item.inProgress > 0 && (
                                            <div
                                                className="h-full rounded-l-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500 ease-out"
                                                style={{ width: `${inProgressPercent}%` }}
                                            />
                                        )}
                                        {item.toDo > 0 && (
                                            <div
                                                className="h-full bg-gradient-to-r from-slate-300 to-slate-400 transition-all duration-500 ease-out"
                                                style={{
                                                    width: `${toDoPercent}%`,
                                                    borderRadius: item.inProgress === 0 ? '9999px 0 0 9999px' : '0',
                                                }}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="mt-5 flex items-center justify-center gap-6 border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-2">
                        <div className="size-3 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 shadow-sm" />
                        <span className="text-xs font-medium text-slate-600">In Progress</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="size-3 rounded-full bg-gradient-to-r from-slate-300 to-slate-400 shadow-sm" />
                        <span className="text-xs font-medium text-slate-600">To Do</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
