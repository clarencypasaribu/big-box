import { PMHeaderActions } from "@/app/(app)/pm/dashboard/pm-header-actions";
import { getCurrentUserProfile } from "@/utils/current-user";
import { createSupabaseServiceClient } from "@/utils/supabase-service";
import { ChartData, ProjectDistributionChart } from "@/app/(app)/pm/approvals/project-distribution-chart";
import { ProjectHealthChart, ProjectHealthData } from "@/app/(app)/pm/dashboard/project-health-chart";
import { ResourceWorkloadChart, WorkloadItem } from "@/app/(app)/pm/dashboard/resource-workload-chart";
import { RiskSummaryChart, RiskSummaryData } from "@/app/(app)/pm/dashboard/risk-summary-chart";
import { ProgressTimelineChart, ProgressPoint } from "@/app/(app)/pm/dashboard/progress-timeline-chart";
import Link from "next/link";

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
  projectTable: {
    id: string;
    name: string;
    code: string;
    status: string;
    progress: number;
    stage: string;
    blockers: number;
    updatedAt: string;
  }[];
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
    projectTable: [],
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

    const projectTable = (projects ?? [])
      .map((project) => {
        const stageApprovals = approvalsByProject[project.id] ?? [];
        const approvalsMap = new Map<string, string>();
        stageApprovals.forEach((row) => approvalsMap.set(normalizeStageId(row.stage_id), row.status ?? "Pending"));
        let currentStageId = stageOrder[0];
        for (const stage of stageOrder) {
          const status = approvalsMap.get(stage);
          if (status === "Approved") continue;
          currentStageId = stage;
          break;
        }
        const stageMeta = stageDefinitions.find((s) => s.id === currentStageId);
        let maxApprovedIndex = -1;
        stageOrder.forEach((stage, idx) => {
          if ((approvalsMap.get(stage) ?? "").toLowerCase() === "approved") {
            maxApprovedIndex = Math.max(maxApprovedIndex, idx);
          }
        });
        const progress =
          maxApprovedIndex >= 0
            ? Math.min(100, Math.round(((maxApprovedIndex + 1) / stageOrder.length) * 100))
            : 0;

        return {
          id: project.id,
          name: project.name ?? "Untitled",
          code: project.code ?? project.id,
          status: project.status ?? "In Progress",
          progress,
          stage: stageMeta ? `${stageMeta.code} - ${stageMeta.title}` : "F1 - Initiation",
          blockers: projectBlockerCounts[project.id] ?? 0,
          updatedAt: project.updated_at ?? project.created_at ?? new Date().toISOString(),
        };
      })
      .sort((a, b) => b.blockers - a.blockers || b.progress - a.progress)
      .slice(0, 5);

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
    const avgProgress =
      projects && projects.length > 0
        ? Math.round(projects.reduce((sum, p) => sum + (p.progress ?? 0), 0) / projects.length)
        : 0;
    const totalOpenBlockers = Object.values(projectBlockerCounts).reduce((sum, val) => sum + (val ?? 0), 0);
    const blockerPenalty = Math.min(20, totalOpenBlockers * 2); // reduce expected trend if many blockers
    const projectsByMonth = (projects ?? []).reduce<Record<string, number>>((acc, p: any) => {
      const date = p.created_at ? new Date(p.created_at) : null;
      if (!date || Number.isNaN(date.getTime())) return acc;
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    // Generate last 6 months of data
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthLabel = months[date.getMonth()];
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const projectCount = projectsByMonth[monthKey] ?? 0;

      const progressRatio = (6 - i) / 6; // 1/6 ... 1
      const planned = Math.round(progressRatio * 100);

      // Actual is anchored to current average progress and fades back in time, adjusted for blockers.
      const target = Math.max(0, Math.min(100, avgProgress - blockerPenalty * 0.25));
      const historicalFade = 1 - Math.pow(progressRatio, 1.5); // older months lower
      const actual = Math.max(
        0,
        Math.min(100, Math.round(target * progressRatio + target * 0.15 * historicalFade))
      );

      progressTimeline.push({
        label: monthLabel,
        planned,
        actual,
        projectCount,
      });
    }

    return {
      chartData,
      projectHealth,
      resourceWorkload,
      riskSummary,
      progressTimeline,
      projectTable,
    };
  } catch (error) {
    console.error("Failed to load dashboard data:", error);
    return emptyData;
  }
}

export default async function PMDashboardPage() {
  const profile = await getCurrentUserProfile();
  const { chartData, projectHealth, resourceWorkload, riskSummary, progressTimeline, projectTable } = await loadDashboardStats();

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

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Key Projects</p>
            <p className="text-lg font-semibold text-slate-900">Quick view of priority projects</p>
          </div>
          <Link
            href="/pm/projects"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            View all projects →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-slate-800">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Project</th>
                <th className="px-4 py-3 text-left">Stage</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Progress</th>
                <th className="px-4 py-3 text-left">Blockers</th>
                <th className="px-4 py-3 text-left">Updated</th>
                <th className="px-4 py-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {projectTable.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-5 text-center text-slate-500">
                    No project data yet.
                  </td>
                </tr>
              ) : (
                projectTable.map((project) => (
                  <tr key={project.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{project.name}</div>
                      <div className="text-xs text-slate-500">{project.code}</div>
                    </td>
                    <td className="px-4 py-3">{project.stage}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                        {project.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 rounded-full bg-slate-200">
                          <div
                            className="h-2 rounded-full bg-indigo-600"
                            style={{ width: `${Math.min(100, Math.max(0, project.progress))}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-700">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${project.blockers > 0 ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
                        {project.blockers} blocker{project.blockers === 1 ? "" : "s"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(project.updatedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/pm/projects/${encodeURIComponent(project.id)}`} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
