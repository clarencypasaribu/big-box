import { RisksDashboardClient } from "@/app/(app)/pm/risks/risks-dashboard-client";
import { getCurrentUserProfile } from "@/utils/current-user";

import { createSupabaseServiceClient } from "@/utils/supabase-service";

type RiskCounts = {
  active: number;
  critical: number;
  resolved: number;
};

async function loadRiskStats(): Promise<RiskCounts> {
  const supabase = await createSupabaseServiceClient();

  const { data: blockers } = await supabase
    .from("blockers")
    .select("status,created_at,updated_at");

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const activeBlockers = blockers?.filter((b) => b.status === "Open") ?? [];
  const resolvedBlockers = blockers?.filter((b) => b.status === "Resolved") ?? [];

  // Logic for Critical: Open blockers older than 3 days
  const criticalThreshold = new Date();
  criticalThreshold.setDate(now.getDate() - 3);
  const criticalBlockers = activeBlockers.filter((b) => new Date(b.created_at) < criticalThreshold);

  const resolvedToday = resolvedBlockers.filter((b) => {
    const updated = new Date(b.updated_at);
    return updated >= today;
  });

  // Calculate trends (mock logic for "today" vs "yesterday" as we only have current snapshot, 
  // but for resolved we know exact count today)

  return {
    active: activeBlockers.length,
    critical: criticalBlockers.length,
    resolved: resolvedToday.length,
  };
}

async function loadBlockers(pmId: string) {
  if (!pmId) return [];

  const supabase = await createSupabaseServiceClient();
  const { data: blockers } = await supabase
    .from("blockers")
    .select(
      "id,task_id,task_title,project_id,project_name,title,product,reason,notes,reporter_name,status,created_at"
    )
    .eq("pm_id", pmId)
    .order("created_at", { ascending: false });

  if (!blockers || blockers.length === 0) return [];

  // Fetch files
  const blockerIds = blockers.map(b => b.id);
  const { data: files } = await supabase
    .from("files")
    .select("id,name,size,type,entity_id")
    .in("entity_id", blockerIds)
    .eq("entity_type", "blocker");

  // Transform for client
  return blockers.map((blocker: any, index: number) => ({
    id: blocker.id,
    code: `#BLK-${new Date(blocker.created_at).getFullYear()}-${String(index + 100).padStart(3, "0")}`,
    title: blocker.title || blocker.reason || blocker.task_title || "Untitled Blocker",
    description: blocker.notes || blocker.reason || "No description provided.",
    project: blocker.project_name || "Unknown Project",
    product: blocker.product || "Other",
    reporter: blocker.reporter_name || "Unknown",
    assignee: "Unassigned",
    status: blocker.status || "Open",
    reportDate: new Date(blocker.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    attachments: files?.filter((f) => f.entity_id === blocker.id).map((f) => ({
      id: f.id,
      name: f.name,
      size: f.size ? `${Math.round(f.size / 1024)} KB` : "0 KB",
      type: f.type
    })) ?? [],
  }));
}

async function loadTeamMembers() {
  const supabase = await createSupabaseServiceClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .or("role.eq.Team Member,role.eq.team_member,role.eq.team member")
    .order("full_name");

  return data?.map((p: any) => ({
    id: p.id,
    name: p.full_name || "Unknown",
    role: p.role || "Team Member",
    activeTasks: 0, // Placeholder
  })) || [];
}

export default async function PMRisksPage() {
  const profile = await getCurrentUserProfile();
  const stats = await loadRiskStats();
  const blockers = await loadBlockers(profile.id || "");
  const teamMembers = await loadTeamMembers();

  return (
    <main className="space-y-6">
      <RisksDashboardClient counts={stats} blockers={blockers as any} teamMembers={teamMembers} />
    </main>
  );
}
