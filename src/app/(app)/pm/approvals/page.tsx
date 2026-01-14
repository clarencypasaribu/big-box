import Link from "next/link";
import { AlarmClock, CheckCircle2, Eye, Filter, Folder, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SidebarProfile } from "@/components/sidebar-profile";
import { getCurrentUserProfile } from "@/utils/current-user";

type Stat = {
  label: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  accent: string;
};

type ApprovalRow = {
  name: string;
  code?: string;
  location: string;
  status: "Ready" | "Pending";
  progress: number;
  stage: string;
  updated: string;
  iconBg: string;
};

const navItems = [
  { label: "Dashboard", href: "/pm/dashboard" },
  { label: "Projects", href: "/pm/projects" },
  { label: "Approvals", href: "/pm/approvals", active: true },
  { label: "Risks & Blockers", href: "/pm/risks" },
  { label: "Users", href: "/pm/users" },
];

const stats: Stat[] = [
  { label: "Ready for review", value: 42, icon: CheckCircle2, accent: "bg-emerald-50 text-emerald-700" },
  { label: "Task Pending", value: 8, icon: AlarmClock, accent: "bg-amber-50 text-amber-700" },
  { label: "Avg. Velocity", value: "4.2 days", icon: AlarmClock, accent: "bg-indigo-50 text-indigo-700" },
];

const statusColor: Record<ApprovalRow["status"], string> = {
  Ready: "bg-emerald-50 text-emerald-700",
  Pending: "bg-amber-50 text-amber-700",
};

const approvals: ApprovalRow[] = [
  {
    name: "Website Redesign",
    code: "PRJ-2028",
    location: "",
    status: "Ready",
    progress: 100,
    stage: "F1 - Initiation",
    updated: "23 Oct 2025",
    iconBg: "bg-indigo-100 text-indigo-700",
  },
  {
    name: "Alpha Logistic Core",
    location: "us-east",
    status: "Pending",
    progress: 75,
    stage: "F2 - Planning",
    updated: "23 Oct 2025",
    iconBg: "bg-indigo-100 text-indigo-700",
  },
  {
    name: "Alpha Logistic Core",
    location: "us-east",
    status: "Ready",
    progress: 100,
    stage: "F3 - Execution",
    updated: "23 Oct 2025",
    iconBg: "bg-indigo-100 text-indigo-700",
  },
  {
    name: "Alpha Logistic Core",
    location: "us-east",
    status: "Ready",
    progress: 100,
    stage: "F3 - Execution",
    updated: "23 Oct 2025",
    iconBg: "bg-indigo-100 text-indigo-700",
  },
  {
    name: "Alpha Logistic Core",
    location: "us-east",
    status: "Pending",
    progress: 75,
    stage: "F3 - Execution",
    updated: "23 Oct 2025",
    iconBg: "bg-indigo-100 text-indigo-700",
  },
  {
    name: "Alpha Logistic Core",
    location: "us-east",
    status: "Pending",
    progress: 75,
    stage: "F3 - Execution",
    updated: "23 Oct 2025",
    iconBg: "bg-amber-100 text-amber-700",
  },
  {
    name: "Alpha Logistic Core",
    location: "us-east",
    status: "Ready",
    progress: 100,
    stage: "F3 - Execution",
    updated: "23 Oct 2025",
    iconBg: "bg-emerald-100 text-emerald-700",
  },
];

export default async function PMApprovalsPage() {
  const profile = await getCurrentUserProfile();
  return (
    <div className="min-h-screen bg-[#f7f7f9] text-slate-900">
      <div className="mx-auto flex max-w-screen-2xl gap-6 px-4 py-8 lg:px-8">
        <aside className="hidden w-[230px] flex-col justify-between rounded-xl border border-slate-200 bg-white px-5 py-6 md:flex">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-full bg-[#e8defe] text-[#4d2ba3]">
                <span className="text-lg font-semibold">LOGO</span>
              </div>
            </div>

            <nav className="space-y-1.5 text-sm font-semibold">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 transition ${
                    item.active ? "bg-[#e8defe] text-[#2f1c70]" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span className="flex-1 text-left">{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          <SidebarProfile profile={profile} />
        </aside>

        <main className="flex-1 space-y-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold text-slate-900">State Gate Overview</h1>
            <p className="text-slate-600">Pantau approval readiness, pending tasks, dan velocity.</p>
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
                <div>Current Stage</div>
                <div>Last Updated</div>
                <div className="text-center">Action</div>
              </div>
              <div className="divide-y divide-slate-200">
                {approvals.map((project, idx) => (
                  <div
                    key={`${project.name}-${idx}`}
                    className="grid grid-cols-[1.5fr,1fr,1fr,1fr,1fr,0.6fr] items-center px-5 py-4 text-sm text-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`grid size-10 place-items-center rounded-lg ${project.iconBg}`}>
                        <Folder className="size-5" />
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
                          className={`h-2 rounded-full ${
                            project.status === "Ready" ? "bg-emerald-500" : "bg-amber-400"
                          }`}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-700">
                        {project.progress}%
                      </span>
                    </div>
                    <div className="text-sm font-medium text-slate-800">{project.stage}</div>
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
