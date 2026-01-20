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

async function getUserId(request: Request) {
  const token = getBearerToken(request);
  if (token) {
    const supabase = await createSupabaseServiceClient({ allowWrite: true });
    const { data, error } = await supabase.auth.getUser(token);
    if (!error && data.user?.id) return data.user.id;
  }

  if (!hasSupabaseAuthCookie(request)) return null;

  try {
    const supabase = await createSupabaseServiceClient({ allowWrite: true });
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
        { message: "Project, stage, dan status wajib diisi" },
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
    };

    const { data, error } = await supabase
      .from("project_stage_approvals")
      .upsert(payload, { onConflict: "project_id,stage_id" })
      .select("id,project_id,stage_id,status,requested_by,approved_by,created_at,approved_at")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ message: "Gagal memperbarui approval" }, { status: 500 });
  }
}
