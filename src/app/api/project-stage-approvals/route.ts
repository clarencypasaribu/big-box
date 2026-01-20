import { NextResponse } from "next/server";

import { createSupabaseServiceClient } from "@/utils/supabase-service";

function getBearerToken(request: Request) {
  const header = request.headers.get("authorization") || request.headers.get("Authorization");
  if (!header) return null;
  const [, token] = header.split(" ");
  return token || null;
}

async function getUserId(request: Request) {
  const token = getBearerToken(request);
  if (token) {
    const supabase = await createSupabaseServiceClient({ allowWrite: true });
    const { data, error } = await supabase.auth.getUser(token);
    if (!error && data.user?.id) return data.user.id;
  }

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId")?.trim();

    if (!projectId) {
      return NextResponse.json({ message: "Project id wajib ada" }, { status: 400 });
    }

    const supabase = await createSupabaseServiceClient({ allowWrite: true });
    const { data, error } = await supabase
      .from("project_stage_approvals")
      .select("id,project_id,stage_id,status,requested_by,approved_by,created_at,approved_at")
      .eq("project_id", projectId);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ message: "Gagal memuat approvals" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const projectId = String(body.projectId ?? "").trim();
    const stageId = String(body.stageId ?? "").trim();
    const status = String(body.status ?? "Pending").trim();

    if (!projectId || !stageId) {
      return NextResponse.json(
        { message: "Project dan stage wajib diisi" },
        { status: 400 }
      );
    }

    const userId = await getUserId(request);

    const supabase = await createSupabaseServiceClient({ allowWrite: true });
    const payload = {
      project_id: projectId,
      stage_id: stageId,
      status,
      requested_by: userId,
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
    return NextResponse.json({ message: "Gagal mengirim approval" }, { status: 500 });
  }
}
