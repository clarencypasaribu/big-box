"use client";

import Link from "next/link";
import { ChevronRight, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProjectAttention = {
    id: string;
    name: string;
    code: string;
    stage: string;
    status: string;
    hasPendingApproval: boolean;
    overdueTasks: number;
};

interface ProjectsAttentionTableProps {
    projects: ProjectAttention[];
}

export function ProjectsAttentionTable({ projects }: ProjectsAttentionTableProps) {
    const hasIssues = projects.some(p => p.hasPendingApproval || p.overdueTasks > 0);

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">Projects Requiring Attention</h2>
                    <p className="text-xs text-slate-500">Top projects that need your review</p>
                </div>
                <Link
                    href="/pm/projects"
                    className="flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                >
                    View all projects
                    <ChevronRight className="h-4 w-4" />
                </Link>
            </div>

            {!hasIssues && projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                        <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <p className="text-sm font-medium text-slate-600">No projects require attention</p>
                    <p className="text-xs text-slate-400">All projects are on track</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                                <th className="py-3 pr-4 text-left font-semibold">Project</th>
                                <th className="px-4 py-3 text-left font-semibold">Stage</th>
                                <th className="px-4 py-3 text-left font-semibold">Status</th>
                                <th className="px-4 py-3 text-center font-semibold">Pending Approval</th>
                                <th className="px-4 py-3 text-center font-semibold">Overdue Tasks</th>
                                <th className="py-3 pl-4 text-right font-semibold"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {projects.slice(0, 3).map((project) => (
                                <tr
                                    key={project.id}
                                    className="group border-b border-slate-50 transition-colors hover:bg-slate-50/60"
                                >
                                    <td className="py-3 pr-4">
                                        <div className="font-semibold text-slate-900">{project.name}</div>
                                        <div className="text-xs text-slate-400">{project.code}</div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">{project.stage}</td>
                                    <td className="px-4 py-3">
                                        <span className={cn(
                                            "inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold",
                                            project.status === "At Risk" ? "bg-amber-100 text-amber-700" :
                                                project.status === "Delayed" ? "bg-rose-100 text-rose-700" :
                                                    "bg-slate-100 text-slate-700"
                                        )}>
                                            {project.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {project.hasPendingApproval ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700">
                                                <AlertCircle className="h-3 w-3" />
                                                Yes
                                            </span>
                                        ) : (
                                            <span className="text-xs text-slate-400">No</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {project.overdueTasks > 0 ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                                                <Clock className="h-3 w-3" />
                                                {project.overdueTasks}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-slate-400">0</span>
                                        )}
                                    </td>
                                    <td className="py-3 pl-4 text-right">
                                        <Link
                                            href="/pm/approvals"
                                            className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 opacity-0 transition-opacity group-hover:opacity-100 hover:text-indigo-700"
                                        >
                                            View
                                            <ChevronRight className="h-4 w-4" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
