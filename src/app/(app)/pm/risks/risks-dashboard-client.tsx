"use client";

import { useMemo, useState, type ElementType } from "react";
import { AlertTriangle, LayoutDashboard, Search, ShieldAlert } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RisksClient, type RiskRow, type TeamMember } from "@/app/(app)/pm/risks/risks-client";

type RiskCounts = {
  active: number;
  critical: number;
  resolved: number;
};

type RiskStat = {
  label: string;
  value: number;
  trend: string;
  trendColor: string;
  icon: ElementType;
  accent: string;
};

export function RisksDashboardClient({
  counts,
  blockers,
  teamMembers,
  title = "Risk & Blocker Highlight",
  subtitle = "Monitor blocker reports, mitigate critical risks, and assign team members.",
}: {
  counts: RiskCounts;
  blockers: RiskRow[];
  teamMembers: TeamMember[];
  title?: string;
  subtitle?: string;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const stats: RiskStat[] = useMemo(
    () => [
      {
        label: "Total Active Blocker",
        value: counts.active,
        trend: "",
        trendColor: "text-rose-600",
        icon: ShieldAlert,
        accent: "bg-rose-50 text-rose-600",
      },
      {
        label: "Critical Risks",
        value: counts.critical,
        trend: "",
        trendColor: "text-amber-600",
        icon: AlertTriangle,
        accent: "bg-amber-50 text-amber-600",
      },
      {
        label: "Resolved Today",
        value: counts.resolved,
        trend: "",
        trendColor: "text-emerald-600",
        icon: LayoutDashboard,
        accent: "bg-emerald-50 text-emerald-600",
      },
    ],
    [counts]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="text-base text-slate-500">{subtitle}</p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search blocker..."
            className="h-10 rounded-lg border-slate-200 bg-white pl-10 text-sm ring-offset-white focus-visible:ring-indigo-600"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="rounded-xl border-slate-200 transition-all hover:shadow-md">
            <CardContent className="flex items-center justify-between gap-4 p-5">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                  <span className={`text-xs font-semibold ${stat.trendColor}`}>{stat.trend}</span>
                </div>
              </div>
              <div className={`grid size-12 place-items-center rounded-xl bg-opacity-50 ${stat.accent}`}>
                <stat.icon className="size-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <RisksClient initialData={blockers} teamMembers={teamMembers} searchQuery={searchQuery} />
    </div>
  );
}
