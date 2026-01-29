"use client";

import { useMemo, useState, type ElementType } from "react";
import { AlarmClock, AlertTriangle, Folder, Search } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProjectsClient, type ProjectRow } from "@/app/(app)/pm/projects/projects-client";

type ProjectStats = {
  total: number;
  upcomingDeadlines: number;
  atRisk: number;
};

type StatCard = {
  label: string;
  value: number;
  icon: ElementType;
  accent: string;
};

export function ProjectsDashboardClient({
  initialProjects,
  stats,
  leads = [],
  members = [],
}: {
  initialProjects: ProjectRow[];
  stats: ProjectStats;
  leads?: string[];
  members?: string[];
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const statCards: StatCard[] = useMemo(
    () => [
      { label: "Total Projects", value: stats.total, icon: Folder, accent: "bg-indigo-50 text-indigo-600" },
      { label: "At Risk", value: stats.atRisk, icon: AlertTriangle, accent: "bg-rose-50 text-rose-600" },
    ],
    [stats]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold text-slate-900">Project Management</h1>
          <p className="text-slate-600">Manage projects directly from this page.</p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-lg border-slate-200 bg-white pl-10 text-sm ring-offset-white focus-visible:ring-indigo-600"
            placeholder="Search by project name or ID"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {statCards.map((stat) => (
          <Card key={stat.label} className="border-slate-200 shadow-sm">
            <CardContent className="flex items-center justify-between gap-4 p-5">
              <div className="space-y-1">
                <p className="text-sm text-slate-600">{stat.label}</p>
                <p className="text-3xl font-semibold text-slate-900">{stat.value}</p>
              </div>
              <div className={`grid size-12 place-items-center rounded-lg ${stat.accent}`}>
                <stat.icon className="size-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ProjectsClient
        initialProjects={initialProjects}
        initialLeads={leads}
        initialMembers={members}
        searchQuery={searchQuery}
      />
    </div>
  );
}
