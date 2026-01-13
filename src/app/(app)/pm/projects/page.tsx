import {
  AlarmClock,
  AlertTriangle,
  Eye,
  Filter,
  Folder,
  LayoutDashboard,
  Search,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/utils/supabase";

type Stat = {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent: string;
};

type ProjectRow = {
  name: string;
  code?: string;
  location: string;
  status:
    | "Cloud"
    | "On-Premise"
    | "Hybrid"
    | "At Risk"
    | "In Progress"
    | "Completed";
  progress: number;
  lead: string;
  updated: string;
  iconBg: string;
  icon?: React.ElementType;
};

const stats: Stat[] = [
  { label: "Total Projects", value: 42, icon: Folder, accent: "bg-indigo-50 text-indigo-600" },
  { label: "Upcoming Deadlines", value: 8, icon: AlarmClock, accent: "bg-amber-50 text-amber-600" },
  { label: "At Risk", value: 3, icon: AlertTriangle, accent: "bg-rose-50 text-rose-600" },
];

const statusColor: Record<ProjectRow["status"], string> = {
  Cloud: "bg-amber-50 text-amber-700",
  "On-Premise": "bg-blue-50 text-blue-700",
  Hybrid: "bg-emerald-50 text-emerald-700",
  "At Risk": "bg-purple-50 text-purple-700",
  "In Progress": "bg-amber-50 text-amber-700",
  Completed: "bg-emerald-50 text-emerald-700",
};

async function loadProjects(): Promise<ProjectRow[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("id,name,code,location,status,progress,lead,updated,iconBg");

  if (error) {
    // Gracefully fallback when table not found or other issues.
    if (
      error.message?.toLowerCase().includes("could not find the table") ||
      error.code === "42P01"
    ) {
      console.warn("Table 'projects' not found. Showing sample data.");
      return [];
    }
    console.warn("Failed to load projects:", error.message);
    return [];
  }

  return (
    data?.map((row) => ({
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
      updated: row.updated ?? "",
      iconBg: row.iconBg ?? "bg-indigo-100 text-indigo-700",
    })) ?? []
  );
}

const fallbackProjects: ProjectRow[] = [
  {
    name: "Website Redesign",
    code: "PRJ-2028",
    location: "",
    status: "Cloud",
    progress: 70,
    lead: "Sarah Jenkins",
    updated: "23 Oct 2025",
    iconBg: "bg-indigo-100 text-indigo-700",
  },
  {
    name: "Alpha Logistic Core",
    location: "us-east",
    status: "On-Premise",
    progress: 50,
    lead: "Sarah Jenkins",
    updated: "23 Oct 2025",
    iconBg: "bg-indigo-100 text-indigo-700",
  },
  {
    name: "Alpha Logistic Core",
    location: "us-east",
    status: "Hybrid",
    progress: 80,
    lead: "Sarah Jenkins",
    updated: "23 Oct 2025",
    iconBg: "bg-indigo-100 text-indigo-700",
  },
  {
    name: "Alpha Logistic Core",
    location: "us-east",
    status: "At Risk",
    progress: 70,
    lead: "Sarah Jenkins",
    updated: "23 Oct 2025",
    iconBg: "bg-indigo-100 text-indigo-700",
  },
  {
    name: "Alpha Logistic Core",
    location: "us-east",
    status: "In Progress",
    progress: 70,
    lead: "Sarah Jenkins",
    updated: "23 Oct 2025",
    iconBg: "bg-indigo-100 text-indigo-700",
    icon: LayoutDashboard,
  },
  {
    name: "Alpha Logistic Core",
    location: "us-east",
    status: "In Progress",
    progress: 50,
    lead: "Sarah Jenkins",
    updated: "23 Oct 2025",
    iconBg: "bg-amber-100 text-amber-700",
  },
  {
    name: "Alpha Logistic Core",
    location: "us-east",
    status: "Completed",
    progress: 100,
    lead: "Sarah Jenkins",
    updated: "23 Oct 2025",
    iconBg: "bg-emerald-100 text-emerald-700",
  },
];

export default async function PMProjectsPage() {
  const liveProjects = await loadProjects();
  const projects = liveProjects.length ? liveProjects : fallbackProjects;

  const navItems = [
    { label: "Dashboard", href: "/pm/dashboard", icon: LayoutDashboard, active: false },
    { label: "Projects", href: "/pm/projects", icon: Folder, active: true },
    { label: "Approvals", href: "/pm/approvals", icon: AlarmClock, active: false },
    { label: "Risks & Blockers", href: "/pm/risks", icon: AlertTriangle, active: false },
    { label: "Users", href: "/pm/users", icon: Eye, active: false },
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
              <p className="text-slate-600">Monitor project statuses, deadlines, and risks.</p>
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

          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 md:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="h-11 rounded-md border-slate-200 bg-slate-50 pl-10 text-sm"
                    placeholder="Search"
                  />
                </div>
                <Button
                  variant="outline"
                  className="h-11 rounded-md border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                >
                  <Filter className="size-4" />
                  Filter
                </Button>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <div className="grid grid-cols-[1.5fr,1fr,1fr,1fr,1fr,0.6fr] bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <div>Project Name</div>
                <div>Status</div>
                <div>Progress</div>
                <div>Lead</div>
                <div>Last Updated</div>
                <div className="text-center">Action</div>
              </div>
              <div className="divide-y divide-slate-200">
                {projects.map((project, idx) => (
                  <div
                    key={`${project.name}-${idx}`}
                    className="grid grid-cols-[1.5fr,1fr,1fr,1fr,1fr,0.6fr] items-center px-5 py-4 text-sm text-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`grid size-10 place-items-center rounded-lg ${project.iconBg}`}>
                        {project.icon ? (
                          <project.icon className="size-5" />
                        ) : (
                          <Folder className="size-5" />
                        )}
                      </span>
                      <div className="leading-tight">
                        <p className="font-semibold">{project.name}</p>
                        <p className="text-xs text-slate-500">
                          {project.code ? `ID: ${project.code}` : project.location}
                        </p>
                      </div>
                    </div>
                    <div>
                      <Badge className={`rounded-md ${statusColor[project.status]}`}>
                        {project.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 flex-1 rounded-full bg-slate-200">
                        <div
                          className="h-2 rounded-full bg-[#c72525]"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-700">
                        {project.progress}%
                      </span>
                    </div>
                    <div className="text-sm font-medium text-slate-800">{project.lead}</div>
                    <div className="text-sm text-slate-600">{project.updated}</div>
                    <div className="text-center text-slate-600">
                      <Eye className="mx-auto size-5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
