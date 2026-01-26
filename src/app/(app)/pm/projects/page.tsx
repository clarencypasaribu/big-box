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
        progress: typeof row.progress === "number" ? row.progress : 0,
        lead: row.lead ?? "Unassigned",
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
