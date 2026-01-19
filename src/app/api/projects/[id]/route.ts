import { NextRequest, NextResponse } from "next/server";

import { createSupabaseServiceClient } from "../../../../utils/supabase-service";

export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  const { id } = context.params;
  if (!id) {
    return NextResponse.json({ message: "Project id wajib ada" }, { status: 400 });
  }

  try {
    const body = await request.json();

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

    const supabase = await createSupabaseServiceClient();
    const { data, error } = await supabase.from("projects").update(payload).or(`uuid.eq.${id},code.eq.${id}`).select().maybeSingle();

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

export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  const { id } = context.params;
  if (!id) {
    return NextResponse.json({ message: "Project id wajib ada" }, { status: 400 });
  }

  try {
    const supabase = await createSupabaseServiceClient();
    const { error } = await supabase.from("projects").delete().or(`uuid.eq.${id},code.eq.${id}`);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ message: "Gagal menghapus project" }, { status: 500 });
  }
}
