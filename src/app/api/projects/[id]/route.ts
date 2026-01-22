import { NextRequest, NextResponse } from "next/server";

import { createSupabaseServiceClient } from "../../../../utils/supabase-service";

async function resolveMemberIds(supabase: Awaited<ReturnType<typeof createSupabaseServiceClient>>, members: string[]) {
  const names = members.filter((member) => member && !member.includes("@"));
  const emails = members.filter((member) => member && member.includes("@"));
  const ids = new Set<string>();
  const matchedNames = new Set<string>();

  if (names.length) {
    const { data } = await supabase
      .from("profiles")
      .select("id,full_name")
      .in("full_name", names);
    data?.forEach((row) => {
      if (row.id) ids.add(row.id);
      if (row.full_name) matchedNames.add(row.full_name);
    });
  }

  if (emails.length) {
    const { data } = await supabase
      .from("profiles")
      .select("id,email")
      .in("email", emails);
    data?.forEach((row) => {
      if (row.id) ids.add(row.id);
    });
  }

  const unresolved = names.filter((name) => !matchedNames.has(name));
  for (const name of unresolved) {
    const { data } = await supabase
      .from("profiles")
      .select("id,full_name")
      .ilike("full_name", `%${name}%`)
      .limit(1);
    const match = data?.[0];
    if (match?.id) {
      ids.add(match.id);
    }
  }

  return Array.from(ids);
}

async function syncProjectMembers(
  supabase: Awaited<ReturnType<typeof createSupabaseServiceClient>>,
  projectId: string,
  members: string[],
  projectName: string
) {
  const memberIds = await resolveMemberIds(supabase, members);
  const { data: existing } = await supabase
    .from("project_members")
    .select("member_id")
    .eq("project_id", projectId);

  const existingIds = new Set((existing ?? []).map((row) => row.member_id).filter(Boolean));
  const desiredIds = new Set(memberIds);

  const toInsert = memberIds
    .filter((id) => !existingIds.has(id))
    .map((id) => ({ project_id: projectId, member_id: id, role: "member" }));

  const toDelete = Array.from(existingIds).filter((id) => !desiredIds.has(id));

  if (toInsert.length) {
    await supabase.from("project_members").upsert(toInsert, {
      onConflict: "project_id,member_id",
    });

    // Notify new members
    const notifications = toInsert.map((m) => ({
      user_id: m.member_id,
      title: "Added to Project",
      message: `You have been added to project "${projectName}".`,
      type: "PROJECT_ASSIGNED",
      link: `/projects/${projectId}`,
    }));
    await supabase.from("notifications").insert(notifications);
  }

  if (toDelete.length) {
    await supabase
      .from("project_members")
      .delete()
      .eq("project_id", projectId)
      .in("member_id", toDelete);
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await context.params;
    const normalizeId = (value?: string | null) => {
      const raw = (value ?? "").trim();
      if (!raw || raw === "undefined" || raw === "null") return "";
      return raw;
    };
    const rawParam = paramId ?? "";
    const url = new URL(request.url);
    const queryId = url.searchParams.get("id") ?? url.searchParams.get("code") ?? "";
    const targetId = normalizeId(rawParam) || normalizeId(queryId);
    if (!targetId) {
      return NextResponse.json({ message: "Project id wajib ada" }, { status: 400 });
    }

    const supabase = await createSupabaseServiceClient({ allowWrite: true });
    const { data, error } = await supabase
      .from("projects")
      .select(
        "id,code,name,location,status,progress,lead,icon_bg,description,start_date,end_date,team_members,updated_at,created_at"
      )
      .or(`id.eq.${targetId},code.eq.${targetId}`)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json({ message: "Project tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ message: "Gagal memuat project" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await context.params;
    const body = await request.json();
    const normalizeId = (value?: string | null) => {
      const raw = (value ?? "").trim();
      if (!raw || raw === "undefined" || raw === "null") return "";
      return raw;
    };
    const rawParam = paramId ?? "";
    const fallbackId = typeof body.id === "string" ? body.id : "";
    const fallbackCode = typeof body.code === "string" ? body.code : "";
    const targetId = normalizeId(rawParam) || normalizeId(fallbackId) || normalizeId(fallbackCode);
    if (!targetId) {
      return NextResponse.json({ message: "Project id wajib ada" }, { status: 400 });
    }

    const payload = {
      name: String(body.name ?? "").trim(),
      code: body.code ? String(body.code).trim() : null,
      location: body.location ? String(body.location).trim() : null,
      status: body.status ?? "In Progress",
      progress: typeof body.progress === "number" ? body.progress : Number(body.progress ?? 0),
      lead: body.lead ? String(body.lead).trim() : null,
      icon_bg: body.iconBg ? String(body.iconBg) : null,
      description: body.description ? String(body.description) : null,
      start_date: body.startDate ? String(body.startDate) : null,
      end_date: body.endDate ? String(body.endDate) : null,
      team_members: Array.isArray(body.teamMembers)
        ? body.teamMembers.map((m: string) => String(m))
        : null,
    };

    if (!payload.name) {
      return NextResponse.json({ message: "Nama project wajib diisi" }, { status: 400 });
    }

    const supabase = await createSupabaseServiceClient({ allowWrite: true });
    const { data, error } = await supabase
      .from("projects")
      .update(payload)
      .or(`id.eq.${targetId},code.eq.${targetId}`)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json({ message: "Project tidak ditemukan atau bukan milikmu" }, { status: 404 });
    }

    if (data && Array.isArray(body.teamMembers)) {
      await syncProjectMembers(
        supabase,
        data.id,
        body.teamMembers.map((member: string) => String(member)),
        data.name
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ message: "Gagal mengubah project" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await context.params;
    const normalizeId = (value?: string | null) => {
      const raw = (value ?? "").trim();
      if (!raw || raw === "undefined" || raw === "null") return "";
      return raw;
    };
    const rawParam = paramId ?? "";
    const url = new URL(request.url);
    const queryId = url.searchParams.get("id") ?? url.searchParams.get("code") ?? "";
    let bodyId = "";
    try {
      const body = await request.json();
      bodyId =
        normalizeId(typeof body?.id === "string" ? body.id : "") ||
        normalizeId(typeof body?.code === "string" ? body.code : "");
    } catch {
      bodyId = "";
    }
    const targetId = normalizeId(rawParam) || normalizeId(queryId) || bodyId;
    if (!targetId) {
      return NextResponse.json({ message: "Project id wajib ada" }, { status: 400 });
    }

    const supabase = await createSupabaseServiceClient({ allowWrite: true });
    const { error } = await supabase
      .from("projects")
      .delete()
      .or(`id.eq.${targetId},code.eq.${targetId}`);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ message: "Gagal menghapus project" }, { status: 500 });
  }
}
