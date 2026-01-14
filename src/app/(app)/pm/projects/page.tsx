import { AlarmClock, AlertTriangle, Folder, LayoutDashboard } from "lucide-react";
import Link from "next/link";

import { ProjectsClient, type ProjectRow } from "@/app/(app)/pm/projects/projects-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createSupabaseAdminClient } from "@/utils/supabase-admin";

type Stat = {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent: string;
};

const stats: Stat[] = [
  { label: "Total Projects", value: 42, icon: Folder, accent: "bg-indigo-50 text-indigo-600" },
  { label: "Upcoming Deadlines", value: 8, icon: AlarmClock, accent: "bg-amber-50 text-amber-600" },
  { label: "At Risk", value: 3, icon: AlertTriangle, accent: "bg-rose-50 text-rose-600" },
];

async function loadProjects(): Promise<ProjectRow[]> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("projects")
      .select("id,name,code,location,status,progress,lead,icon_bg,description,updated_at,created_at")
      .order("updated_at", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      return [];
    }

    return (
      data?.map((row: any) => ({
        id: row.id ?? null,
        name: row.name ?? "Untitled Project",
        code: row.code ?? "",
        location: row.location ?? "",
        status:
          row.status === "Cloud" ||
          row.status === "On-Premise" ||
          row.status === "Hybrid" ||
          row.status === "At Risk" ||
          row.status === "In Progress" ||
          row.status === "Completed"
            ? row.status
            : "In Progress",
        progress: typeof row.progress === "number" ? row.progress : 0,
        lead: row.lead ?? "Unassigned",
        updated: row.updated_at ?? row.created_at ?? null,
        description: row.description ?? "",
        iconBg: row.icon_bg ?? "bg-indigo-100 text-indigo-700",
      })) ?? []
    );
  } catch (error) {
    console.warn("Failed to load projects on server:", error);
    return [];
  }
}

export default async function PMProjectsPage() {
  const projects = await loadProjects();

  const navItems = [
    { label: "Dashboard", href: "/pm/dashboard", icon: Folder, active: false },
    { label: "Projects", href: "/pm/projects", icon: Folder, active: true },
    { label: "Approvals", href: "/pm/approvals", icon: AlarmClock, active: false },
    { label: "Risks & Blockers", href: "/pm/risks", icon: AlertTriangle, active: false },
  ];

  return (
    <div className="min-h-screen bg-[#f7f7f9] text-slate-900">
      <div className="mx-auto flex max-w-screen-2xl gap-6 px-4 py-8 lg:px-8">
        <aside className="hidden w-[230px] flex-col justify-between rounded-xl border border-slate-200 bg-white px-5 py-6 md:flex">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-full bg-[#e8defe] text-[#4d2ba3]">
                <LayoutDashboard className="size-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#4d2ba3]">
                  Logo
                </p>
                <p className="text-sm font-semibold text-slate-900">Control</p>
              </div>
            </div>

            <nav className="space-y-1.5 text-sm font-semibold">
              {navItems.map(({ label, href, icon: Icon, active }) => (
                <Link
                  key={label}
                  href={href}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 transition ${
                    active ? "bg-[#e8defe] text-[#2f1c70]" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="size-4" />
                  <span className="flex-1 text-left">{label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        <main className="flex-1 space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold text-slate-900">Project Management</h1>
              <p className="text-slate-600">CRUD projects langsung dari halaman ini.</p>
            </div>
            <Button asChild className="h-11 bg-[#256eff] text-white hover:bg-[#1c55c7]">
              <Link href="/pm/projects/new">+ New Project</Link>
            </Button>
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
