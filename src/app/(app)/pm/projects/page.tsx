import { ProjectsDashboardClient } from "@/app/(app)/pm/projects/projects-dashboard-client";
import { type ProjectRow } from "@/app/(app)/pm/projects/projects-client";
import { createSupabaseServiceClient } from "@/utils/supabase-service";

async function loadProjects(): Promise<ProjectRow[]> {
  try {
    const supabase = await createSupabaseServiceClient();
    const { data, error } = await supabase
      .from("projects")
      .select(
        "id,code,name,location,status,progress,lead,icon_bg,description,start_date,end_date,team_members,updated_at,created_at"
      )
      .order("updated_at", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      return [];
    }

    const projectIds = (data ?? []).map((row: any) => row.id).filter(Boolean);
    let approvalsByProject: Record<string, any[]> = {};
    if (projectIds.length) {
      const { data: approvals } = await supabase
        .from("project_stage_approvals")
        .select("project_id,stage_id,status")
        .in("project_id", projectIds);
      approvalsByProject = (approvals ?? []).reduce<Record<string, any[]>>((acc, row) => {
        const key = row.project_id;
        acc[key] = acc[key] ?? [];
        acc[key].push(row);
        return acc;
      }, {});
    }

    // Progress derived dari stage approval (F1-F5 = 20% masing-masing)
    const stageProgressOrder = ["stage-1", "stage-2", "stage-3", "stage-4", "stage-5"];
    const stageWeight = 100 / stageProgressOrder.length;

    return (
      data?.map((row: any) => ({
        id: typeof row.id === "string" && row.id.trim() ? row.id : row.code ?? null,
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
        progress: (() => {
          const approvals: any[] = approvalsByProject[row.id] ?? [];
          const completedStages = approvals
            .filter((a) => String(a.status).toLowerCase() === "approved")
            .map((a) => a.stage_id);
          if (!completedStages.length) return 0;
          const maxIndex = completedStages
            .map((id) => stageProgressOrder.indexOf(id))
            .reduce((max, idx) => (idx > max ? idx : max), -1);
          if (maxIndex < 0) return 0;
          return Math.min(100, Math.round((maxIndex + 1) * stageWeight));
        })(),
        lead: row.lead ?? "Unassigned",
        stageLabel: (() => {
          const approvals: any[] = approvalsByProject[row.id] ?? [];
          const pendingStage = stageProgressOrder.find((stageId) => {
            const status = approvals.find((a) => a.stage_id === stageId)?.status;
            return String(status).toLowerCase() !== "approved";
          });
          const currentStage = pendingStage ?? stageProgressOrder[stageProgressOrder.length - 1];
          const labelMap: Record<string, string> = {
            "stage-1": "F1 - Initiation",
            "stage-2": "F2 - Planning",
            "stage-3": "F3 - Execution",
            "stage-4": "F4 - Monitoring",
            "stage-5": "F5 - Closure",
          };
          return labelMap[currentStage] ?? currentStage;
        })(),
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
  const now = new Date();
  const in7Days = new Date();
  in7Days.setDate(now.getDate() + 7);

  // Fetch projects with open blockers
  const supabase = await createSupabaseServiceClient();
  const { data: riskyProjects } = await supabase
    .from("blockers")
    .select("project_id")
    .eq("status", "Open");

  const distinctRiskyProjectIds = new Set(riskyProjects?.map((r: any) => r.project_id));

  const totalProjects = projects.length;
  const upcomingDeadlines = projects.filter((p) => {
    if (!p.endDate) return false;
    const end = new Date(p.endDate);
    if (Number.isNaN(end.getTime())) return false;
    return end >= now && end <= in7Days;
  }).length; 
  const atRisk = projects.filter((p) => distinctRiskyProjectIds.has(p.id)).length;

  const stats = {
    total: totalProjects,
    upcomingDeadlines,
    atRisk,
  };

  return (
    <main className="space-y-6">
      <ProjectsDashboardClient initialProjects={projects} stats={stats} />
    </main>
  );
}
