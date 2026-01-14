import { NextRequest, NextResponse } from "next/server";

import { createSupabaseAdminClient } from "../../../../utils/supabase-admin";
import { createSupabaseServerClient } from "../../../../utils/supabase-server";

function getBearerToken(request: Request) {
  const header = request.headers.get("authorization") || request.headers.get("Authorization");
  if (!header) return null;
  const [, token] = header.split(" ");
  return token || null;
}

async function getUserId(request: Request) {
  const token = getBearerToken(request);
  if (token) {
    const supabaseAdmin = createSupabaseAdminClient();
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (!error && data.user?.id) return data.user.id;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ message: "Project id wajib ada" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const ownerId = await getUserId(request);
    if (!ownerId) {
      return NextResponse.json({ message: "Harus login untuk update project" }, { status: 401 });
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
    };

    if (!payload.name) {
      return NextResponse.json({ message: "Nama project wajib diisi" }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("projects")
      .update(payload)
      .eq("id", id)
      .eq("owner_id", ownerId)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json({ message: "Project tidak ditemukan atau bukan milikmu" }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ message: "Gagal mengubah project" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ message: "Project id wajib ada" }, { status: 400 });
  }

  try {
    const ownerId = await getUserId(request);
    if (!ownerId) {
      return NextResponse.json({ message: "Harus login untuk hapus project" }, { status: 401 });
    }

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id)
      .eq("owner_id", ownerId);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ message: "Gagal menghapus project" }, { status: 500 });
  }
}
