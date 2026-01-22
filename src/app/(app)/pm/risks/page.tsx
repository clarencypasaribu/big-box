import { AlertTriangle, Bell, Filter, LayoutDashboard, Search, ShieldAlert } from "lucide-react";

import { PMSidebar } from "@/app/(app)/pm/_components/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RisksClient } from "@/app/(app)/pm/risks/risks-client";
import { getCurrentUserProfile } from "@/utils/current-user";

import { createSupabaseServiceClient } from "@/utils/supabase-service";

type RiskStat = {
  label: string;
  value: number;
  trend: string;
  trendColor: string;
  icon: React.ElementType;
  accent: string;
  accentIcon: string;
};

async function loadRiskStats() {
  const supabase = await createSupabaseServiceClient();

  const { data: blockers } = await supabase
    .from("blockers")
    .select("status,created_at,updated_at");

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const activeBlockers = blockers?.filter((b) => b.status === "Open") ?? [];
  const resolvedBlockers = blockers?.filter((b) => b.status === "Resolved") ?? [];

  // Logic for Critical: Open blockers older than 3 days
  const criticalThreshold = new Date();
  criticalThreshold.setDate(now.getDate() - 3);
  const criticalBlockers = activeBlockers.filter((b) => new Date(b.created_at) < criticalThreshold);

  const resolvedToday = resolvedBlockers.filter((b) => {
    const updated = new Date(b.updated_at);
    return updated >= today;
  });

  // Calculate trends (mock logic for "today" vs "yesterday" as we only have current snapshot, 
  // but for resolved we know exact count today)

  return [
    {
      label: "Total Active Blocker",
      value: activeBlockers.length,
      trend: `${activeBlockers.length} active`,
      trendColor: "text-rose-600",
      icon: ShieldAlert,
      accent: "bg-rose-50 text-rose-600",
      accentIcon: "text-rose-600",
    },
    {
      label: "Critical Risks",
      value: criticalBlockers.length,
      trend: `${criticalBlockers.length} > 3 days`,
      trendColor: "text-amber-600",
      icon: AlertTriangle,
      accent: "bg-amber-50 text-amber-600",
      accentIcon: "text-amber-600",
    },
    {
      label: "Resolved Today",
      value: resolvedToday.length,
      trend: `+${resolvedToday.length} closed`,
      trendColor: "text-emerald-600",
      icon: LayoutDashboard,
      accent: "bg-emerald-50 text-emerald-600",
      accentIcon: "text-emerald-600",
    },
  ];
}

async function loadBlockers(pmId: string) {
  if (!pmId) return [];

  const supabase = await createSupabaseServiceClient();
  const { data: blockers } = await supabase
    .from("blockers")
    .select(
      "id,task_id,task_title,project_id,project_name,title,product,reason,notes,reporter_name,status,created_at"
    )
    .eq("pm_id", pmId)
    .order("created_at", { ascending: false });

  if (!blockers || blockers.length === 0) return [];

  // Fetch files
  const blockerIds = blockers.map(b => b.id);
  const { data: files } = await supabase
    .from("files")
    .select("id,name,size,type,entity_id")
    .in("entity_id", blockerIds)
    .eq("entity_type", "blocker");

  // Transform for client
  return blockers.map((blocker: any, index: number) => ({
    id: blocker.id,
    code: `#BLK-${new Date(blocker.created_at).getFullYear()}-${String(index + 100).padStart(3, "0")}`,
    title: blocker.title || blocker.reason || blocker.task_title || "Untitled Blocker",
    description: blocker.notes || blocker.reason || "No description provided.",
    project: blocker.project_name || "Unknown Project",
    product: blocker.product || "Other",
    reporter: blocker.reporter_name || "Unknown",
    assignee: "Unassigned",
    status: blocker.status || "Open",
    reportDate: new Date(blocker.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    attachments: files?.filter((f) => f.entity_id === blocker.id).map((f) => ({
      id: f.id,
      name: f.name,
      size: f.size ? `${Math.round(f.size / 1024)} KB` : "0 KB",
      type: f.type
    })) ?? [],
  }));
}

async function loadTeamMembers() {
  const supabase = await createSupabaseServiceClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .or("role.eq.Team Member,role.eq.team_member,role.eq.team member")
    .order("full_name");

  return data?.map((p: any) => ({
    id: p.id,
    name: p.full_name || "Unknown",
    role: p.role || "Team Member",
    activeTasks: 0, // Placeholder
  })) || [];
}

export default async function PMRisksPage() {
  const profile = await getCurrentUserProfile();
  const stats = await loadRiskStats();
  const blockers = await loadBlockers(profile.id || "");
  const teamMembers = await loadTeamMembers();

  return (
    <div className="min-h-screen bg-[#f7f7f9] text-slate-900">
      <div className="mx-auto flex max-w-screen-2xl gap-6 px-4 py-8 lg:px-8">
        <PMSidebar currentPath="/pm/risks" profile={profile} />

        <main className="flex-1 space-y-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1.5">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Risk & Blocker Highlight</h1>
              <p className="text-base text-slate-500">
                Monitor laporan blocker, mitigasi risiko critical, dan assign team member.
              </p>
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

          <RisksClient initialData={blockers as any} teamMembers={teamMembers} />
        </main>
      </div>
    </div>
  );
}
