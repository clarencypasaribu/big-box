import { PMHeaderActions } from "@/app/(app)/pm/dashboard/pm-header-actions";
import { getCurrentUserProfile } from "@/utils/current-user";
import { createSupabaseServiceClient } from "@/utils/supabase-service";
import { ChartData, ProjectDistributionChart } from "@/app/(app)/pm/approvals/project-distribution-chart";
import { ProjectHealthChart, ProjectHealthData } from "@/app/(app)/pm/dashboard/project-health-chart";
import { NeedsAttentionCard, NeedsAttentionItem } from "@/app/(app)/pm/dashboard/needs-attention-card";

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
  const input = (stageId ?? "").toLowerCase().trim();
  if (!input) return stageOrder[0];
  const match = stageDefinitions.find(
    (stage) =>
      stage.id === stageId ||
      stage.code.toLowerCase() === input ||
      input.includes(stage.code.toLowerCase()) ||
      stage.aliases.some((alias) => input.includes(alias.toLowerCase()))
  );
  return match?.id ?? stageOrder[0];
}

type DashboardData = {
  chartData: ChartData[];
  projectHealth: ProjectHealthData;
  needsAttention: NeedsAttentionItem[];
  totalProjects: number;
};

async function loadDashboardStats(): Promise<DashboardData> {
  const hasSupabaseEnv =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const emptyData: DashboardData = {
    chartData: [],
    projectHealth: { onTrack: 0, atRisk: 0, delayed: 0 },
    needsAttention: [],
    totalProjects: 0,
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
      supabase.from("projects").select("id,name,code,progress,status,created_at,start_date,end_date,updated_at"),
      supabase.from("project_stage_approvals").select("project_id,stage_id,status,created_at,requested_by"),
      supabase.from("blockers").select("id,status,project_id"),
      supabase.from("tasks").select("id,title,status,project_id,assignee,due_date"),
    ]);

    const totalProjects = projects?.length ?? 0;
    const now = new Date();

    // Build approval/blocker/task maps
    const approvalsByProject = (approvals ?? []).reduce<Record<string, any[]>>((acc, row) => {
      const list = acc[row.project_id] ?? [];
      list.push(row);
      acc[row.project_id] = list;
      return acc;
    }, {});

    const projectBlockerCounts = (allBlockers ?? []).reduce<Record<string, number>>((acc, b) => {
      if (b.status === "Open") {
        acc[b.project_id] = (acc[b.project_id] ?? 0) + 1;
      }
      return acc;
    }, {});

    // Overdue tasks per project
    const overdueTasksByProject = (tasks ?? []).reduce<Record<string, number>>((acc, t) => {
      if (t.due_date && new Date(t.due_date) < now && t.status?.toLowerCase() !== "done" && t.status?.toLowerCase() !== "completed") {
        acc[t.project_id] = (acc[t.project_id] ?? 0) + 1;
      }
      return acc;
    }, {});

    // Pending approvals per project
    const pendingApprovalsByProject = (approvals ?? []).reduce<Record<string, { stageId: string; stageName: string }[]>>((acc, row) => {
      if (row.status === "Pending" || row.status === "Requested") {
        const list = acc[row.project_id] ?? [];
        const stageMeta = stageDefinitions.find(s => s.id === normalizeStageId(row.stage_id));
        list.push({ stageId: row.stage_id, stageName: stageMeta?.title ?? row.stage_id });
        acc[row.project_id] = list;
      }
      return acc;
    }, {});

    // Stage counts for distribution chart
    const stageCounts: Record<string, number> = {};
    const stageHealth: Record<string, { onTrack: number; atRisk: number; delayed: number }> = {};
    stageDefinitions.forEach((def) => {
      stageCounts[def.code] = 0;
      stageHealth[def.code] = { onTrack: 0, atRisk: 0, delayed: 0 };
    });

    // Health status
    let onTrack = 0;
    let atRisk = 0;
    let delayed = 0;

    // Process each project
    const projectDetails: {
      id: string;
      name: string;
      code: string;
      stage: string;
      stageCode: string;
      status: string;
      hasPendingApproval: boolean;
      overdueTasks: number;
      hasBlockers: boolean;
      updatedAt: Date;
      healthStatus: "onTrack" | "atRisk" | "delayed";
    }[] = [];

    (projects ?? []).forEach((project) => {
      const stageApprovals = approvalsByProject[project.id] ?? [];
      const approvalsMap = new Map<string, string>();
      stageApprovals.forEach((row) => approvalsMap.set(normalizeStageId(row.stage_id), row.status ?? "Pending"));

      let currentStageId = stageOrder[stageOrder.length - 1];
      let foundPending = false;
      for (const stage of stageOrder) {
        const status = approvalsMap.get(stage);
        if (status === "Approved") continue;
        currentStageId = stage;
        foundPending = true;
        break;
      }
      if (!foundPending) {
        currentStageId = stageOrder[stageOrder.length - 1];
      }
      // Fallback gunakan progress numeric jika tidak ada approvals
      if (!stageApprovals.length && typeof project.progress === "number") {
        const idx = Math.min(
          stageOrder.length - 1,
          Math.max(0, Math.floor((project.progress / 100) * stageOrder.length))
        );
        currentStageId = stageOrder[idx];
      }

      const meta = stageDefinitions.find((s) => s.id === currentStageId);
      if (meta && stageCounts[meta.code] !== undefined) {
        stageCounts[meta.code]++;
      }

      // Health status
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
      const projectStatus = project.status ?? "In Progress";

      let healthStatus: "onTrack" | "atRisk" | "delayed" = "onTrack";
      if (hasOpenBlockers || (projectStatus === "Not Started" && startDate && now > startDate)) {
        delayed++;
        healthStatus = "delayed";
        if (meta) stageHealth[meta.code].delayed++;
      } else if (projectStatus === "Pending" || progress < expectedProgress - 15) {
        atRisk++;
        healthStatus = "atRisk";
        if (meta) stageHealth[meta.code].atRisk++;
      } else {
        onTrack++;
        if (meta) stageHealth[meta.code].onTrack++;
      }

      const hasPendingApproval = (pendingApprovalsByProject[project.id]?.length ?? 0) > 0;
      const overdueTasks = overdueTasksByProject[project.id] ?? 0;

      projectDetails.push({
        id: project.id,
        name: project.name ?? "Untitled",
        code: project.code ?? project.id,
        stage: meta ? `${meta.code} - ${meta.title}` : "F1 - Initiation",
        stageCode: meta?.code ?? "F1",
        status: projectStatus,
        hasPendingApproval,
        overdueTasks,
        hasBlockers: hasOpenBlockers,
        updatedAt: project.updated_at ? new Date(project.updated_at) : new Date(project.created_at ?? now),
        healthStatus,
      });
    });

    // Build Needs Attention items (max 5, sorted by priority)
    const needsAttention: NeedsAttentionItem[] = [];

    // 1. Pending approvals
    Object.entries(pendingApprovalsByProject).forEach(([projectId, stages]) => {
      const project = projectDetails.find(p => p.id === projectId);
      if (project && stages.length > 0) {
        needsAttention.push({
          id: `approval-${projectId}`,
          type: "approval",
          title: project.name,
          subtitle: stages[0].stageName,
          link: `/pm/approvals`,
        });
      }
    });

    // 2. Overdue tasks
    Object.entries(overdueTasksByProject).forEach(([projectId, count]) => {
      if (count > 0) {
        const project = projectDetails.find(p => p.id === projectId);
        if (project) {
          needsAttention.push({
            id: `overdue-${projectId}`,
            type: "overdue",
            title: project.name,
            subtitle: "",
            link: `/pm/projects/${projectId}`,
            count,
          });
        }
      }
    });

    // 3. Projects at risk
    projectDetails.filter(p => p.healthStatus === "delayed" || p.healthStatus === "atRisk").forEach(project => {
      const existing = needsAttention.find(n => n.id.includes(project.id));
      if (!existing) {
        needsAttention.push({
          id: `risk-${project.id}`,
          type: "risk",
          title: project.name,
          subtitle: project.healthStatus === "delayed" ? "Delayed" : "At Risk",
          link: `/pm/risks`,
          count: 1,
        });
      }
    });

    // 4. Stale projects (no update for 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    projectDetails.filter(p => p.updatedAt < sevenDaysAgo).forEach(project => {
      const existing = needsAttention.find(n => n.id.includes(project.id));
      if (!existing) {
        needsAttention.push({
          id: `stale-${project.id}`,
          type: "stale",
          title: project.name,
          subtitle: "No recent updates",
          link: `/pm/projects/${project.id}`,
        });
      }
    });

    // Sort by priority and limit to 5
    const priorityOrder = { approval: 0, overdue: 1, risk: 2, stale: 3 };
    needsAttention.sort((a, b) => priorityOrder[a.type] - priorityOrder[b.type]);

    // Chart data
    const chartData = stageDefinitions.map((def) => ({
      label: def.code,
      subLabel: def.title,
      value: stageCounts[def.code] ?? 0,
      onTrack: stageHealth[def.code]?.onTrack ?? 0,
      atRisk: stageHealth[def.code]?.atRisk ?? 0,
      delayed: stageHealth[def.code]?.delayed ?? 0,
    }));

    const projectHealth: ProjectHealthData = { onTrack, atRisk, delayed };

    return {
      chartData,
      projectHealth,
      needsAttention: needsAttention.slice(0, 5),
      totalProjects,
    };
  } catch (error) {
    console.error("Failed to load dashboard data:", error);
    return emptyData;
  }
}

export default async function PMDashboardPage() {
  await getCurrentUserProfile();
  const { chartData, projectHealth, needsAttention, totalProjects } = await loadDashboardStats();

  return (
    <main className="space-y-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-4xl font-semibold text-slate-900 whitespace-nowrap">
          Project Control Tower
        </h1>
        <PMHeaderActions />
      </header>

      {/* 1. Needs Attention - only renders if items exist */}
      {needsAttention.length > 0 && <NeedsAttentionCard items={needsAttention} />}

      {/* 3. Project Health Status */}
      <ProjectHealthChart data={projectHealth} />

      {/* Project Distribution - conditional (≥3 projects) */}
      {totalProjects >= 3 && <ProjectDistributionChart data={chartData} />}
    </main>
  );
}
