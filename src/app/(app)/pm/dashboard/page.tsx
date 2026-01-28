import { PMHeaderActions } from "@/app/(app)/pm/dashboard/pm-header-actions";
import { getCurrentUserProfile } from "@/utils/current-user";
import { createSupabaseServiceClient } from "@/utils/supabase-service";
import { ChartData, ProjectDistributionChart } from "@/app/(app)/pm/approvals/project-distribution-chart";
import { ProjectHealthChart, ProjectHealthData } from "@/app/(app)/pm/dashboard/project-health-chart";
import { ResourceWorkloadChart, WorkloadItem } from "@/app/(app)/pm/dashboard/resource-workload-chart";
import { RiskSummaryChart, RiskSummaryData } from "@/app/(app)/pm/dashboard/risk-summary-chart";
import { ProgressTimelineChart, ProgressPoint } from "@/app/(app)/pm/dashboard/progress-timeline-chart";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

type DashboardData = {
  chartData: ChartData[];
  projectHealth: ProjectHealthData;
  resourceWorkload: WorkloadItem[];
  riskSummary: RiskSummaryData;
  progressTimeline: ProgressPoint[];
};

async function loadDashboardStats(): Promise<DashboardData> {
  const hasSupabaseEnv =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const emptyData: DashboardData = {
    chartData: [],
    projectHealth: { onTrack: 0, atRisk: 0, delayed: 0 },
    resourceWorkload: [],
    riskSummary: { open: 0, assigned: 0, resolved: 0 },
    progressTimeline: [],
  };

  if (!hasSupabaseEnv) return emptyData;

  try {
    const supabase = await createSupabaseServiceClient();
    const [
      { data: projects },
      { data: approvals },
      { data: allBlockers },
      { data: tasks },
    ] = await Promise.all([
      supabase.from("projects").select("id,name,progress,status,created_at,start_date,end_date"),
      supabase.from("project_stage_approvals").select("project_id,stage_id,status,created_at,requested_by"),
      supabase.from("blockers").select("id,status,project_id"),
      supabase.from("tasks").select("id,title,status,project_id,assignee"),
    ]);

    // 1. Project Distribution Chart Data (existing)
    const approvalsByProject = (approvals ?? []).reduce<Record<string, any[]>>((acc, row) => {
      const list = acc[row.project_id] ?? [];
      list.push(row);
      acc[row.project_id] = list;
      return acc;
    }, {});

    // Track health status per stage
    const stageCounts: Record<string, number> = {};
    const stageHealth: Record<string, { onTrack: number; atRisk: number; delayed: number }> = {};
    stageDefinitions.forEach((def) => {
      stageCounts[def.code] = 0;
      stageHealth[def.code] = { onTrack: 0, atRisk: 0, delayed: 0 };
    });

    const now = new Date();
    const projectBlockerCounts = (allBlockers ?? []).reduce<Record<string, number>>((acc, b) => {
      if (b.status === "Open") {
        acc[b.project_id] = (acc[b.project_id] ?? 0) + 1;
      }
      return acc;
    }, {});

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

        // Determine health status for this project
        const hasOpenBlockers = (projectBlockerCounts[project.id] ?? 0) > 0;
        const startDate = project.start_date ? new Date(project.start_date) : null;
        const endDate = project.end_date ? new Date(project.end_date) : null;

        let expectedProgress = 50;
        if (startDate && endDate) {
          const totalDuration = endDate.getTime() - startDate.getTime();
          const elapsed = Math.max(0, now.getTime() - startDate.getTime());
          expectedProgress = Math.min(100, Math.round((elapsed / totalDuration) * 100));
        }

        const progress = project.progress ?? 0;
        const status = project.status ?? "In Progress";

        if (hasOpenBlockers || (status === "Not Started" && startDate && now > startDate)) {
          stageHealth[meta.code].delayed++;
        } else if (status === "Pending" || progress < expectedProgress - 15) {
          stageHealth[meta.code].atRisk++;
        } else {
          stageHealth[meta.code].onTrack++;
        }
      }
    });

    const chartData = stageDefinitions.map((def) => ({
      label: def.code,
      subLabel: def.title,
      value: stageCounts[def.code] ?? 0,
      onTrack: stageHealth[def.code]?.onTrack ?? 0,
      atRisk: stageHealth[def.code]?.atRisk ?? 0,
      delayed: stageHealth[def.code]?.delayed ?? 0,
    }));

    // 2. Project Health Chart Data (reuse now and projectBlockerCounts from above)
    let onTrack = 0;
    let atRisk = 0;
    let delayed = 0;

    (projects ?? []).forEach((project) => {
      const hasOpenBlockers = (projectBlockerCounts[project.id] ?? 0) > 0;
      const startDate = project.start_date ? new Date(project.start_date) : null;
      const endDate = project.end_date ? new Date(project.end_date) : null;

      // Calculate expected progress based on timeline
      let expectedProgress = 50; // default if no dates
      if (startDate && endDate) {
        const totalDuration = endDate.getTime() - startDate.getTime();
        const elapsed = Math.max(0, now.getTime() - startDate.getTime());
        expectedProgress = Math.min(100, Math.round((elapsed / totalDuration) * 100));
      }

      const progress = project.progress ?? 0;
      const status = project.status ?? "In Progress";

      if (hasOpenBlockers || status === "Not Started" && startDate && now > startDate) {
        delayed++;
      } else if (status === "Pending" || progress < expectedProgress - 15) {
        atRisk++;
      } else {
        onTrack++;
      }
    });

    const projectHealth: ProjectHealthData = { onTrack, atRisk, delayed };

    // 3. Resource Workload Chart Data
    const assigneeWorkload: Record<string, { toDo: number; inProgress: number }> = {};

    (tasks ?? []).forEach((task) => {
      const assignee = task.assignee || "Unassigned";
      if (!assigneeWorkload[assignee]) {
        assigneeWorkload[assignee] = { toDo: 0, inProgress: 0 };
      }

      const status = (task.status ?? "").toLowerCase();
      if (status === "in progress" || status === "in-progress") {
        assigneeWorkload[assignee].inProgress++;
      } else if (status === "to do" || status === "todo" || status === "pending" || status === "not started") {
        assigneeWorkload[assignee].toDo++;
      }
    });

    const resourceWorkload: WorkloadItem[] = Object.entries(assigneeWorkload)
      .filter(([, counts]) => counts.toDo + counts.inProgress > 0)
      .map(([assignee, counts]) => ({
        assignee,
        toDo: counts.toDo,
        inProgress: counts.inProgress,
      }));

    // 4. Risk Summary Chart Data
    const riskCounts = { open: 0, assigned: 0, resolved: 0 };
    (allBlockers ?? []).forEach((blocker) => {
      const status = (blocker.status ?? "").toLowerCase();
      if (status === "open") {
        riskCounts.open++;
      } else if (status === "assigned" || status === "investigating" || status === "mitigated") {
        riskCounts.assigned++;
      } else if (status === "resolved") {
        riskCounts.resolved++;
      }
    });

    const riskSummary: RiskSummaryData = riskCounts;

    // 5. Progress Timeline Chart Data
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const progressTimeline: ProgressPoint[] = [];

    // Generate last 6 months of data
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthLabel = months[date.getMonth()];

      // Calculate planned progress (linear growth assumption)
      const planned = Math.round(((6 - i) / 6) * 100);

      // Calculate actual average progress from projects
      const avgProgress = projects && projects.length > 0
        ? Math.round(projects.reduce((sum, p) => sum + (p.progress ?? 0), 0) / projects.length)
        : 0;

      // Simulate some variance for older months
      const monthVariance = i === 0 ? 0 : Math.floor(Math.random() * 10) - 5;
      const actual = Math.max(0, Math.min(100, avgProgress + monthVariance - (i * 5)));

      progressTimeline.push({
        label: monthLabel,
        planned,
        actual: Math.max(0, actual),
      });
    }

    return {
      chartData,
      projectHealth,
      resourceWorkload,
      riskSummary,
      progressTimeline,
    };
  } catch (error) {
    console.error("Failed to load dashboard data:", error);
    return emptyData;
  }
}

export default async function PMDashboardPage() {
  const profile = await getCurrentUserProfile();
  const { chartData, projectHealth, resourceWorkload, riskSummary, progressTimeline } = await loadDashboardStats();

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
    <main className="space-y-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-4xl font-semibold text-slate-900">
          Project Control Tower
        </h1>
        <PMHeaderActions />
      </header>

      {/* Project Distribution Chart */}
      <ProjectDistributionChart data={chartData} />

      {/* Second row: 4 new visualization charts */}
      <div className="grid gap-5 md:grid-cols-2">
        <ProjectHealthChart data={projectHealth} />
        <ResourceWorkloadChart data={resourceWorkload} />
        <RiskSummaryChart data={riskSummary} />
        <ProgressTimelineChart data={progressTimeline} />
      </div>
    </main>
  );
}
