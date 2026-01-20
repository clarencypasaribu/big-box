import { NextResponse } from "next/server";

import { createSupabaseServiceClient } from "@/utils/supabase-service";

export async function PATCH(
  request: Request,
  context: { params: { taskId: string } }
) {
  try {
    const taskId = String(context.params.taskId ?? "").trim();
    if (!taskId) {
      return NextResponse.json({ message: "Task id wajib ada" }, { status: 400 });
    }

    const body = await request.json();
    const payload = {
      title: body.title ? String(body.title).trim() : undefined,
      description: body.description ? String(body.description) : undefined,
      priority: body.priority ? String(body.priority) : undefined,
      status: body.status ? String(body.status) : undefined,
    };

    const supabase = await createSupabaseServiceClient({ allowWrite: true });
    const { data, error } = await supabase
      .from("tasks")
      .update(payload)
      .eq("id", taskId)
      .select("id,title,description,priority,stage,status,due_date,project_id,created_at")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ message: "Gagal mengubah task" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: { taskId: string } }
) {
  try {
    const taskId = String(context.params.taskId ?? "").trim();
    if (!taskId) {
      return NextResponse.json({ message: "Task id wajib ada" }, { status: 400 });
    }

    const supabase = await createSupabaseServiceClient({ allowWrite: true });
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ message: "Gagal menghapus task" }, { status: 500 });
  }
}
