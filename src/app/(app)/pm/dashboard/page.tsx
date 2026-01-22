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
import { PMSidebar } from "@/app/(app)/pm/_components/sidebar";
import { getCurrentUserProfile } from "@/utils/current-user";
import { createSupabaseServiceClient } from "@/utils/supabase-service";
import { ChartData, ProjectDistributionChart } from "@/app/(app)/pm/approvals/project-distribution-chart";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Notification = {
  title: string;
  message: string;
  time: string;
  tone: "info" | "warning" | "critical";
  timestamp?: number;
};

const stageDefinitions = [
  { id: "stage-1", code: "F1", title: "Initiation", aliases: ["F1", "Initiation"] },
  { id: "stage-2", code: "F2", title: "Planning", aliases: ["F2", "Planning"] },
  { id: "stage-3", code: "F3", title: "Execution", aliases: ["F3", "Execution"] },
  { id: "stage-4", code: "F4", title: "Monitoring", aliases: ["F4", "Monitoring"] },
  { id: "stage-5", code: "F5", title: "Closure", aliases: ["F5", "Closure"] },
];

const stageOrder = stageDefinitions.map((stage) => stage.id);

function normalizeStageId(stageId?: string | null) {
  const input = (stageId ?? "").toLowerCase();
  if (!input) return stageOrder[0];
  const match = stageDefinitions.find(
    (stage) =>
      stage.id === stageId ||
      stage.code.toLowerCase() === input ||
      stage.aliases.some((alias) => input.includes(alias.toLowerCase()))
  );
  return match?.id ?? stageOrder[0];
}

function timeAgo(dateStr?: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

async function loadDashboardStats(): Promise<{
  chartData: ChartData[];
  portfolioHealth: number;
  notifications: Notification[];
}> {
  const hasSupabaseEnv =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!hasSupabaseEnv) return { chartData: [], portfolioHealth: 0, notifications: [] };

  try {
    const supabase = await createSupabaseServiceClient();
    const [
      { data: projects },
      { data: approvals },
      { data: blockers },
      { data: tasks },
    ] = await Promise.all([
      supabase.from("projects").select("id,name,progress,created_at"),
      supabase.from("project_stage_approvals").select("project_id,stage_id,status,created_at,requested_by,stage:stage_id(code, title)"),
      supabase.from("blockers").select("description,created_at,status,pm_id,reporter_name").neq("status", "Resolved").order("created_at", { ascending: false }).limit(5),
      supabase.from("tasks").select("title,created_at,due_date,project_id,assignee"),
    ]);

    // Fetch details for users who requested approval
    const requesterIds = Array.from(new Set((approvals ?? []).map(a => a.requested_by).filter(Boolean))) as string[];
    let userMap: Record<string, string> = {};

    if (requesterIds.length > 0) {
      const { data: users } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", requesterIds);

      userMap = (users ?? []).reduce((acc, u) => {
        acc[u.id] = u.full_name || u.email || "Unknown User";
        return acc;
      }, {} as Record<string, string>);
    }

    // 1. Chart Data
    const approvalsByProject = (approvals ?? []).reduce<Record<string, any[]>>((acc, row) => {
      const list = acc[row.project_id] ?? [];
      list.push(row);
      acc[row.project_id] = list;
      return acc;
    }, {});

    const stageCounts: Record<string, number> = {};
    stageDefinitions.forEach((def) => {
      stageCounts[def.code] = 0;
    });

    (projects ?? []).forEach((project) => {
      const stageApprovals = approvalsByProject[project.id] ?? [];
      const approvalsMap = new Map<string, string>();

      stageApprovals.forEach((row) => {
        approvalsMap.set(normalizeStageId(row.stage_id), row.status ?? "Pending");
      });

      let currentStageId = stageOrder[0];
      for (const stage of stageOrder) {
        const status = approvalsMap.get(stage);
        if (status === "Approved") continue;
        currentStageId = stage;
        break;
      }

      const meta = stageDefinitions.find((s) => s.id === currentStageId);
      if (meta && stageCounts[meta.code] !== undefined) {
        stageCounts[meta.code]++;
      }
    });

    const chartData = stageDefinitions.map((def) => ({
      label: def.code,
      subLabel: def.title,
      value: stageCounts[def.code] ?? 0,
    }));

    // 2. Portfolio Health
    const totalProjects = projects?.length ?? 0;
    const totalProgress = (projects ?? []).reduce((acc, p) => acc + (p.progress ?? 0), 0);
    const portfolioHealth = totalProjects > 0 ? Math.round(totalProgress / totalProjects) : 0;

    // 3. Notifications
    const notifications: Notification[] = [];

    // Add Blockers to Notifications
    (blockers ?? []).forEach((blocker) => {
      const reporter = blocker.reporter_name || "A team member";
      notifications.push({
        title: "Blocker Reported",
        message: `${reporter} reported: "${blocker.description?.substring(0, 50) + (blocker.description?.length > 50 ? "..." : "") || "No description"}"`,
        time: timeAgo(blocker.created_at),
        tone: "critical",
        timestamp: new Date(blocker.created_at).getTime(),
      });
    });

    // Add Pending Approvals to Notifications
    (approvals ?? []).filter(a => a.status === "Pending" || a.status === "In Review").forEach((approval) => {
      // Find project name
      const proj = projects?.find(p => p.id === approval.project_id);
      const stageCode = stageDefinitions.find(s => s.id === normalizeStageId(approval.stage_id))?.code ?? "Stage";
      const requesterName = approval.requested_by ? userMap[approval.requested_by] : "A member";

      notifications.push({
        title: "Approval Requested",
        message: `${requesterName} requested approval for ${proj?.name ?? "Unknown Project"} (${stageCode}).`,
        time: timeAgo(approval.created_at),
        tone: "warning",
        timestamp: new Date(approval.created_at).getTime(),
      });
    });

    // Add New Projects to Notifications
    (projects ?? []).forEach(proj => {
      notifications.push({
        title: "New Project",
        message: `${proj.name} has been initiated.`,
        time: timeAgo(proj.created_at),
        tone: "info",
        timestamp: new Date(proj.created_at).getTime(),
      });
    });

    // Add Task Notifications
    const now = new Date();
    (tasks ?? []).forEach((task) => {
      const createdAt = new Date(task.created_at);
      const proj = projects?.find(p => p.id === task.project_id);

      // New Task Created (within last 7 days)
      if (now.getTime() - createdAt.getTime() < 7 * 24 * 60 * 60 * 1000) {
        notifications.push({
          title: "New Task Added",
          message: `${task.assignee || "A team member"} added task "${task.title}" to ${proj?.name || "a project"}.`,
          time: timeAgo(task.created_at),
          tone: "info",
          timestamp: createdAt.getTime(),
        });
      }

      // Deadline Approaching
      if (task.due_date) {
        const dueDate = new Date(task.due_date);
        const diffHours = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

        // If due within next 3 days 
        if (diffHours > -24 && diffHours < 72) {
          notifications.push({
            title: "Deadline Approaching",
            message: `Task "${task.title}" (${task.assignee || "Unassigned"}) is due ${timeAgo(task.due_date) === "0d ago" ? "today" : "soon"}.`,
            time: timeAgo(task.due_date),
            tone: "warning",
            timestamp: dueDate.getTime(),
          });
        }
      }
    });

    // Sort by time desc and take top 10
    const sortedNotifications = notifications
      .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))
      .slice(0, 10);

    return { chartData, portfolioHealth, notifications: sortedNotifications };
  } catch (error) {
    console.error("Failed to load dashboard data:", error);
    return { chartData: [], portfolioHealth: 0, notifications: [] };
  }
}

export default async function PMDashboardPage() {
  const profile = await getCurrentUserProfile();
  const { chartData, portfolioHealth, notifications } = await loadDashboardStats();

  let blockerCount = 0;
  if (profile.id) {
    try {
      const supabase = await createSupabaseServiceClient();
      const { count } = await supabase
        .from("blockers")
        .select("id", { count: "exact", head: true })
        .eq("status", "Open");
      blockerCount = count ?? 0;
    } catch {
      blockerCount = 0;
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f7f9] text-slate-900">
      <div className="mx-auto flex max-w-screen-2xl gap-6 px-4 py-8 lg:px-8">
        <PMSidebar currentPath="/pm/dashboard" profile={profile} />

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
            <ProjectDistributionChart data={chartData} />

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
                    <p className="text-4xl font-semibold text-rose-600">{blockerCount}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 border-slate-200 text-slate-700"
                      asChild
                    >
                      <Link href="/pm/risks">
                        View Blocker Details
                        <ArrowUpRight className="size-4" />
                      </Link>
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
                      Calculated
                    </Badge>
                    <p className="text-4xl font-semibold text-slate-900">{portfolioHealth}%</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl">Notifications</CardTitle>
              <Badge variant="outline" className="bg-slate-50 text-slate-700">
                Recent
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <Separator className="border-dashed" />
              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <div className="py-4 text-center text-sm text-slate-500">No new notifications.</div>
                ) : (
                  notifications.map((note, idx) => {
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
                        key={`${note.title}-${idx}`}
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
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
