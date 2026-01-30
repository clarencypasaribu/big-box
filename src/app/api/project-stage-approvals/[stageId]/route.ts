import { NextResponse } from "next/server";

import { createSupabaseServiceClient } from "@/utils/supabase-service";

function getBearerToken(request: Request) {
  const header = request.headers.get("authorization") || request.headers.get("Authorization");
  if (!header) return null;
  const [, token] = header.split(" ");
  return token || null;
}

function hasSupabaseAuthCookie(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  return cookieHeader.includes("sb-") || cookieHeader.includes("supabase-auth-token");
}

import { createSupabaseServerClient } from "@/utils/supabase-server";

async function getUserId(request: Request) {
  const token = getBearerToken(request);
  if (token) {
    const supabase = await createSupabaseServiceClient({ allowWrite: true });
    const { data, error } = await supabase.auth.getUser(token);
    if (!error && data.user?.id) return data.user.id;
  }

  // Use the new server client which respects cookies
  try {
    const supabase = await createSupabaseServerClient({ allowWrite: true });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ stageId: string }> }
) {
  try {
    const { stageId: rawStageId } = await context.params;
    const stageId = String(rawStageId ?? "").trim();
    const body = await request.json();
    const projectId = String(body.projectId ?? "").trim();
    const status = String(body.status ?? "").trim();

    if (!projectId || !stageId || !status) {
      return NextResponse.json(
        { message: "Project, stage, and status are required." },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServiceClient({ allowWrite: true });
    const userId = await getUserId(request);
    const { data: existing } = await supabase
      .from("project_stage_approvals")
      .select("requested_by,approved_by")
      .eq("project_id", projectId)
      .eq("stage_id", stageId)
      .maybeSingle();

    const payload = {
      project_id: projectId,
      stage_id: stageId,
      status,
      requested_by: existing?.requested_by ?? body.requestedBy ?? userId ?? null,
      approved_by: body.approvedBy ?? userId ?? existing?.approved_by ?? null,
      approved_at: status === "Approved" ? new Date().toISOString() : null,
      comment: body.comment !== undefined ? String(body.comment).trim() : null, // Explicitly handle comment update
    };

    const { data, error } = await supabase
      .from("project_stage_approvals")
      .upsert(payload, { onConflict: "project_id,stage_id" })
      .select("id,project_id,stage_id,status,requested_by,approved_by,created_at,approved_at")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    // --- Notification Logic ---
    const comment = body.comment ? String(body.comment).trim() : null;

    if (status === "Approved" && payload.requested_by) {
      // Notify the requester
      await supabase.from("notifications").insert({
        user_id: payload.requested_by,
        title: "Stage Approval Accepted",
        message: `Your stage approval request for project has been APPROVED.`,
        type: "STAGE_APPROVED",
        link: `/projects/${projectId}?tab=approvals`
      });

      // Check if all stages are approved to mark project as Completed
      const { data: allApprovals } = await supabase
        .from("project_stage_approvals")
        .select("stage_id, status")
        .eq("project_id", projectId);

      const requiredStages = ["stage-1", "stage-2", "stage-3", "stage-4", "stage-5"];
      const approvedStages = new Set(
        (allApprovals || [])
          .filter((a: { status: string; stage_id: string }) => a.status === "Approved")
          .map((a: { status: string; stage_id: string }) => a.stage_id)
      );

      const allDone = requiredStages.every((id) => approvedStages.has(id));

      if (allDone) {
        await supabase
          .from("projects")
          .update({ status: "Completed", progress: 100 })
          .eq("id", projectId);
      }
    } else if (status === "Rejected") {
      // Broadcast rejection to ALL project members (except the PM themselves)
      const { data: members } = await supabase
        .from("project_members")
        .select("member_id")
        .eq("project_id", projectId);

      const notifications = (members || [])
        .filter((m: { member_id: string }) => m.member_id !== userId) // Don't notify the rejector
        .map((m: { member_id: string }) => ({
          user_id: m.member_id,
          title: "Stage Approval Rejected",
          message: `The stage approval request for project has been REJECTED.${comment ? ` Reason: "${comment}"` : ""}`,
          type: "STAGE_REJECTED",
          link: `/projects/${projectId}?tab=approvals`, // Ensure link is valid for members
          created_at: new Date().toISOString() // Explicitly set created_at for immediate visibility
        }));

      if (notifications.length > 0) {
        await supabase.from("notifications").insert(notifications);
      }
    }
    // --------------------------

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ message: "Failed to update approval." }, { status: 500 });
  }
}
