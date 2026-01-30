import { ProjectsDashboardClient } from "@/app/(app)/pm/projects/projects-dashboard-client";
import { type ProjectRow } from "@/app/(app)/pm/projects/projects-client";
import { createSupabaseServiceClient } from "@/utils/supabase-service";

async function loadProjects(): Promise<ProjectRow[]> {
  const stageDefinitions = [
    { id: "stage-1", code: "F1", title: "Initiation", aliases: ["F1", "Initiation"] },
    { id: "stage-2", code: "F2", title: "Planning", aliases: ["F2", "Planning"] },
    { id: "stage-3", code: "F3", title: "Execution", aliases: ["F3", "Execution"] },
    { id: "stage-4", code: "F4", title: "Monitoring", aliases: ["F4", "Monitoring"] },
    { id: "stage-5", code: "F5", title: "Closure", aliases: ["F5", "Closure"] },
  ];
  const stageProgressOrder = stageDefinitions.map((s) => s.id);
  const stageWeight = 100 / stageProgressOrder.length;
  const labelMap: Record<string, string> = {
    "stage-1": "F1 - Initiation",
    "stage-2": "F2 - Planning",
    "stage-3": "F3 - Execution",
    "stage-4": "F4 - Monitoring",
    "stage-5": "F5 - Closure",
  };
  function normalizeStageId(stageId?: string | null) {
    const input = (stageId ?? "").toLowerCase().trim();
    if (!input) return stageProgressOrder[0];
    const match = stageDefinitions.find(
      (stage) =>
        stage.id === stageId ||
        stage.code.toLowerCase() === input ||
        input.includes(stage.code.toLowerCase()) ||
        stage.aliases.some((alias) => input.includes(alias.toLowerCase()))
    );
    return match?.id ?? stageProgressOrder[0];
  }

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
        acc[key].push({
          ...row,
          stage_id: normalizeStageId(row.stage_id),
        });
        return acc;
      }, {});
    }

    // Progress derived dari stage approval (F1-F5 = 20% masing-masing)
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
            .map((a) => normalizeStageId(a.stage_id));
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
          const normalized = approvals.map((a) => ({ ...a, stage_id: normalizeStageId(a.stage_id) }));
          const pendingStage = stageProgressOrder.find((stageId) => {
            const status = normalized.find((a) => a.stage_id === stageId)?.status;
            return String(status).toLowerCase() !== "approved";
          });
          let currentStage = pendingStage ?? stageProgressOrder[stageProgressOrder.length - 1];

          if (!approvals.length) {
            currentStage = stageProgressOrder[0];
          }

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
  const supabase = await createSupabaseServiceClient();

  // Parallel fetch: projects, blockers, profiles
  const [projects, { data: riskyProjects }, { data: profiles }] = await Promise.all([
    loadProjects(),
    supabase.from("blockers").select("project_id").eq("status", "Open"),
    supabase.from("profiles").select("id, full_name, email, role").order("full_name")
  ]);

  const now = new Date();
  const in7Days = new Date();
  in7Days.setDate(now.getDate() + 7);

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

  // Process profiles
  const leads: string[] = [];
  const members: string[] = [];

  (profiles ?? []).forEach((p: any) => {
    const name = p.full_name || p.email || "Unknown";
    const role = (p.role || "").toLowerCase().trim();

    if (role === "project manager" || role === "project_manager" || role === "pm") {
      leads.push(name);
    } else if (role === "team member" || role === "team_member") {
      members.push(name);
    }
  });

  // Remove duplicates and sort
  const uniqueLeads = Array.from(new Set(leads)).sort();
  const uniqueMembers = Array.from(new Set(members)).sort();

  return (
    <main className="space-y-6">
      <ProjectsDashboardClient
        initialProjects={projects}
        stats={stats}
        leads={uniqueLeads}
        members={uniqueMembers}
      />
    </main>
  );
}
