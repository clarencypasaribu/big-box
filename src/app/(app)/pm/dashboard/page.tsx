import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Folder,
  LayoutDashboard,
  Search,
  Users,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { SidebarProfile } from "@/components/sidebar-profile";
import { getCurrentUserProfile } from "@/utils/current-user";

type StageData = {
  stage: string;
  label: string;
  value: number;
};

type Notification = {
  title: string;
  message: string;
  time: string;
  tone: "info" | "warning" | "critical";
};

const navItems: {
  label: string;
  icon: React.ElementType;
  href: string;
  active?: boolean;
}[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/pm/dashboard", active: true },
  { label: "Projects", icon: Folder, href: "/pm/projects" },
  { label: "Approvals", icon: ClipboardList, href: "/pm/approvals" },
  { label: "Risks & Blockers", icon: AlertOctagon, href: "/pm/risks" },
  { label: "Users", icon: Users, href: "/pm/users" },
];

const stageData: StageData[] = [
  { stage: "F1", label: "Initiation", value: 14 },
  { stage: "F2", label: "Planning", value: 72 },
  { stage: "F3", label: "Execution", value: 70 },
  { stage: "F4", label: "SJSJSJ", value: 68 },
  { stage: "F5", label: "SNSMSN", value: 128 },
];

const notifications: Notification[] = [
  {
    title: "Reminder for your meetings",
    message: "Daily sync with F4/F5 owners and risk champions.",
    time: "9m ago",
    tone: "info",
  },
  {
    title: "New project assigned",
    message: "Onboard sponsor and set intake checklist for Phoenix Revamp.",
    time: "14m ago",
    tone: "warning",
  },
  {
    title: "Deadline approaching",
    message: "Execution milestone review due this afternoon for Atlas Core.",
    time: "29m ago",
    tone: "critical",
  },
];

export default async function PMDashboardPage() {
  const profile = await getCurrentUserProfile();
  const maxStageValue = Math.max(...stageData.map((stage) => stage.value));

  return (
    <div className="min-h-screen bg-[#f7f7f9] text-slate-900">
      <div className="mx-auto flex max-w-screen-2xl gap-6 px-4 py-8 lg:px-8">
        <aside className="flex min-h-[90vh] w-[230px] flex-col justify-between rounded-xl border border-slate-200 bg-white px-5 py-6">
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
              {navItems.map(({ label, icon: Icon, active, href }) => (
                <Link
                  key={label}
                  href={href}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                    active
                      ? "bg-[#e8defe] text-[#2f1c70]"
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <Icon className="size-4" />
                  <span className="flex-1 text-left">{label}</span>
                </Link>
              ))}
            </nav>
          </div>

          <SidebarProfile profile={profile} />
        </aside>

        <main className="flex-1 space-y-6">
          <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <h1 className="text-4xl font-semibold text-slate-900">
              Project Control Tower
            </h1>
            <div className="relative w-full max-w-xs lg:max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="h-11 rounded-md border-slate-200 bg-slate-100/60 pl-10 text-sm"
                placeholder="Search for anything..."
                type="search"
              />
            </div>
          </header>

          <div className="grid gap-5 xl:grid-cols-[2fr,1fr]">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="flex-row items-center justify-between gap-3">
                <CardTitle className="text-xl">
                  Project Distribution By Stage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6">
                  <div className="absolute inset-0 flex flex-col justify-evenly px-2">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div
                        key={`grid-${index}`}
                        className="h-px w-full border-b border-dashed border-slate-300/80"
                      />
                    ))}
                  </div>
                  <div className="relative flex h-64 items-end gap-6">
                    {stageData.map((stage) => {
                      const height = (stage.value / maxStageValue) * 100;
                      return (
                        <div
                          key={stage.stage}
                          className="flex flex-1 flex-col items-center justify-end gap-2 text-center"
                        >
                          <div className="text-sm font-semibold text-slate-700">
                            {stage.value}
                          </div>
                          <div className="flex h-44 w-full items-end">
                            <div
                              style={{ height: `${height}%` }}
                              className="w-full rounded-md bg-[#b35af3]"
                            />
                          </div>
                          <div className="text-[11px] font-semibold text-slate-700">
                            {stage.stage}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {stage.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="grid size-12 place-items-center rounded-md bg-rose-50 text-rose-500">
                    <AlertTriangle className="size-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-semibold text-slate-900">
                      Attention Needed
                    </p>
                    <p className="text-sm text-slate-600">
                      Projects are currently blocked or at high risk
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-4xl font-semibold text-rose-600">3</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 border-slate-200 text-slate-700"
                    >
                      View Blocker Details
                      <ArrowUpRight className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="grid size-12 place-items-center rounded-md bg-emerald-50 text-emerald-600">
                    <Activity className="size-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-semibold text-slate-900">
                      Portfolio Health
                    </p>
                    <p className="text-sm text-slate-600">
                      Overall portfolio health score.
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className="mb-1 bg-emerald-50 text-emerald-700">
                      +12% vs last month
                    </Badge>
                    <p className="text-4xl font-semibold text-slate-900">94%</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl">Notifications</CardTitle>
              <Badge variant="outline" className="bg-slate-50 text-slate-700">
                Today
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <Separator className="border-dashed" />
              <div className="space-y-3">
                {notifications.map((note) => {
                  const toneStyles: Record<
                    Notification["tone"],
                    { bg: string; text: string; icon: React.ElementType }
                  > = {
                    info: {
                      bg: "bg-emerald-50",
                      text: "text-emerald-600",
                      icon: CheckCircle2,
                    },
                    warning: {
                      bg: "bg-amber-50",
                      text: "text-amber-600",
                      icon: Clock3,
                    },
                    critical: {
                      bg: "bg-rose-50",
                      text: "text-rose-600",
                      icon: AlertOctagon,
                    },
                  };
                  const Icon = toneStyles[note.tone].icon;

                  return (
                    <div
                      key={note.title}
                      className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
                    >
                      <div
                        className={cn(
                          "grid size-10 place-items-center rounded-full",
                          toneStyles[note.tone].bg,
                          toneStyles[note.tone].text
                        )}
                      >
                        <Icon className="size-4" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-semibold text-slate-900">
                          {note.title}
                        </p>
                        <p className="text-sm text-slate-600">{note.message}</p>
                      </div>
                      <span className="text-xs font-semibold text-slate-500">
                        {note.time}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
