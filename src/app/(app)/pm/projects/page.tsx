import { AlarmClock, AlertTriangle, Folder } from "lucide-react";
import Link from "next/link";

import { ProjectsClient, type ProjectRow } from "@/app/(app)/pm/projects/projects-client";
import { PMSidebar } from "@/app/(app)/pm/_components/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createSupabaseServiceClient } from "@/utils/supabase-service";
import { getCurrentUserProfile } from "@/utils/current-user";

type Stat = {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent: string;
};

async function loadProjects(): Promise<ProjectRow[]> {
  try {
    const supabase = await createSupabaseServiceClient();
    const { data, error } = await supabase
      .from("projects")
      .select(
        "id,uuid,code,name,location,status,progress,lead,icon_bg,description,start_date,end_date,team_members,updated_at,created_at"
      )
      .order("updated_at", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      return [];
    }

    return (
      data?.map((row: any) => ({
        id: row.uuid ?? row.id ?? null,
        name: row.name ?? "Untitled Project",
        code: row.code ?? "",
        location: row.location ?? "",
        status:
          row.status === "In Progress" ||
          row.status === "Completed" ||
          row.status === "Not Started" ||
          row.status === "Pending"
            ? row.status
            : "In Progress",
        progress: typeof row.progress === "number" ? row.progress : 0,
        lead: row.lead ?? "Unassigned",
        updated: row.updated_at ?? row.created_at ?? null,
        description: row.description ?? "",
        iconBg: row.icon_bg ?? "bg-indigo-100 text-indigo-700",
        startDate: row.start_date ?? null,
        endDate: row.end_date ?? null,
        teamMembers: row.team_members ?? [],
      })) ?? []
    );
  } catch (error) {
    console.warn("Failed to load projects on server:", error);
    return [];
  }
}

export default async function PMProjectsPage() {
  const projects = await loadProjects();
  const profile = await getCurrentUserProfile();
  const now = new Date();
  const in7Days = new Date();
  in7Days.setDate(now.getDate() + 7);

  const totalProjects = projects.length;
  const upcomingDeadlines = projects.filter((p) => {
    if (!p.endDate) return false;
    const end = new Date(p.endDate);
    if (Number.isNaN(end.getTime())) return false;
    return end >= now && end <= in7Days;
  }).length;
  const atRisk = projects.filter((p) => p.status === "Pending").length;

  const stats: Stat[] = [
    { label: "Total Projects", value: totalProjects, icon: Folder, accent: "bg-indigo-50 text-indigo-600" },
    { label: "Upcoming Deadlines", value: upcomingDeadlines, icon: AlarmClock, accent: "bg-amber-50 text-amber-600" },
    { label: "At Risk", value: atRisk, icon: AlertTriangle, accent: "bg-rose-50 text-rose-600" },
  ];

  const navItems = [
    { label: "Dashboard", href: "/pm/dashboard", icon: Folder, active: false },
    { label: "Projects", href: "/pm/projects", icon: Folder, active: true },
    { label: "Approvals", href: "/pm/approvals", icon: AlarmClock, active: false },
    { label: "Risks & Blockers", href: "/pm/risks", icon: AlertTriangle, active: false },
  ];

  return (
    <div className="min-h-screen bg-[#f7f7f9] text-slate-900">
      <div className="mx-auto flex max-w-screen-2xl gap-6 px-4 py-8 lg:px-8">
        <PMSidebar currentPath="/pm/projects" profile={profile} />

        <main className="flex-1 space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold text-slate-900">Project Management</h1>
              <p className="text-slate-600">CRUD projects langsung dari halaman ini.</p>
            </div>
            <div aria-hidden className="h-11" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {stats.map((stat) => (
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

          <ProjectsClient initialProjects={projects} />
        </main>
      </div>
    </div>
  );
}
