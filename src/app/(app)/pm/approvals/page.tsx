import { AlarmClock, CheckCircle2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { PMSidebar } from "@/app/(app)/pm/_components/sidebar";
import { ApprovalRow, ApprovalsClient } from "@/app/(app)/pm/approvals/approvals-client";

import { getCurrentUserProfile } from "@/utils/current-user";
import { createSupabaseServiceClient } from "@/utils/supabase-service";

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

function stageLabel(stageId?: string | null) {
  const normalized = normalizeStageId(stageId);
  const meta = stageDefinitions.find((stage) => stage.id === normalized);
  return meta ? `${meta.code} - ${meta.title}` : "Fx - Stage";
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

async function loadApprovalsFromDb(): Promise<{
  approvals: ApprovalRow[];
  error?: string | null;
}> {
  const hasSupabaseEnv =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!hasSupabaseEnv) {
    return { approvals: [], error: "Supabase env belum diset, melewati fetch approvals." };
  }

  try {
    const supabase = await createSupabaseServiceClient({ allowWrite: true });

    const [
      { data: projects, error: projectsError },
      { data: approvals, error: approvalsError },
      { data: tasks, error: tasksError },
    ] = await Promise.all([
      supabase
        .from("projects")
        .select("id,code,name,location,team_members,lead,updated_at,created_at")
        .order("updated_at", { ascending: false }),
      supabase
        .from("project_stage_approvals")
        .select("project_id,stage_id,status,requested_by,approved_by,approved_at,created_at"),
      supabase.from("tasks").select("id,project_id,status"),
    ]);

    const errMessage = projectsError?.message || approvalsError?.message || tasksError?.message || null;

    const profileIds = new Set<string>();
    (approvals ?? []).forEach((row) => {
      if (row.requested_by) profileIds.add(row.requested_by);
      if (row.approved_by) profileIds.add(row.approved_by);
    });

    let profileMap: Record<string, string> = {};
    if (profileIds.size) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id,full_name,email")
        .in("id", Array.from(profileIds));
      profileMap = (profiles ?? []).reduce<Record<string, string>>((acc, row) => {
        acc[row.id] = row.full_name || row.email || row.id;
        return acc;
      }, {});
    }

    const approvalsByProject = (approvals ?? []).reduce<Record<string, any[]>>((acc, row) => {
      const list = acc[row.project_id] ?? [];
      list.push(row);
      acc[row.project_id] = list;
      return acc;
    }, {});

    const tasksByProject = (tasks ?? []).reduce<Record<string, number>>((acc, row) => {
      acc[row.project_id] = (acc[row.project_id] || 0) + 1;
      return acc;
    }, {});



    const approvalsMapped = (projects ?? [])
      .filter((project) => (tasksByProject[project.id] ?? 0) > 0) // Filter projects without tasks
      .map((project) => {
        const stageApprovals = approvalsByProject[project.id] ?? [];
        const normalizedStatuses = stageApprovals.map((row) => ({
          stageId: normalizeStageId(row.stage_id),
          status: row.status ?? "Pending",
          requestedBy: row.requested_by,
          approvedBy: row.approved_by,
        }));

        const approvalsMap = new Map<string, string>();
        normalizedStatuses.forEach((row) => {
          approvalsMap.set(row.stageId, row.status);
        });

        let currentStageId = stageOrder[0];
        // Find the first stage that is NOT approved
        for (const stage of stageOrder) {
          const status = approvalsMap.get(stage);
          if (status === "Approved") {
            continue;
          }
          // If we hit a stage that is Pending, In Review, or Missing (undefined), that is our current stage
          currentStageId = stage;
          break;
        }

        const stageText = stageLabel(currentStageId);

        const approvers = new Set<string>();
        normalizedStatuses.forEach((row) => {
          if (row.requestedBy && profileMap[row.requestedBy]) approvers.add(profileMap[row.requestedBy]);
          if (row.approvedBy && profileMap[row.approvedBy]) approvers.add(profileMap[row.approvedBy]);
        });

        (project.team_members ?? []).forEach((member: string) => {
          if (member) approvers.add(String(member));
        });

        const team = Array.from(approvers.size ? approvers : new Set(["Belum ada approver"]));

        return {
          id: project.id,
          name: project.name ?? "Untitled Project",
          code: project.code ?? undefined,
          location: project.location ?? "",
          stage: stageText,
          updated: formatDate(project.updated_at ?? project.created_at),
          team,
          pm: project.lead ?? null,
        } satisfies ApprovalRow;
      });



    return { approvals: approvalsMapped, error: errMessage };
  } catch (error) {
    return {
      approvals: [],
      error: error instanceof Error ? error.message : "Gagal memuat approvals",
    };
  }
}

export default async function PMApprovalsPage() {
  const profile = await getCurrentUserProfile();
  const { approvals, error } = await loadApprovalsFromDb();

  return (
    <div className="min-h-screen bg-[#f7f7f9] text-slate-900">
      <div className="mx-auto flex max-w-screen-2xl gap-6 px-4 py-8 lg:px-8">
        <PMSidebar currentPath="/pm/approvals" profile={profile} />

        <main className="flex-1 space-y-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold text-slate-900">State Gate Overview</h1>
            <p className="text-slate-600">Pantau approval readiness, pending tasks, dan velocity.</p>
          </div>





          {error ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Gagal memuat approvals: {error}
            </div>
          ) : null}

          <ApprovalsClient rows={approvals} />
        </main>
      </div>
    </div>
  );
}
