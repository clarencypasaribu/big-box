import { NextResponse } from "next/server";

import { createSupabaseServiceClient } from "@/utils/supabase-service";

type RouteContext = {
  params: Promise<{ taskId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { taskId: rawTaskId } = await context.params;
    const taskId = String(rawTaskId ?? "").trim();
    if (!taskId) {
      return NextResponse.json({ message: "Task ID is required." }, { status: 400 });
    }

    const body = await request.json();
    const payload: Record<string, string | undefined> = {};
    if (body.title !== undefined) payload.title = String(body.title).trim();
    if (body.description !== undefined) payload.description = String(body.description);
    if (body.priority !== undefined) payload.priority = String(body.priority);
    if (body.status !== undefined) payload.status = String(body.status);

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
    return NextResponse.json({ message: "Failed to update task." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { taskId: rawTaskId } = await context.params;
    const taskId = String(rawTaskId ?? "").trim();
    if (!taskId) {
      return NextResponse.json({ message: "Task ID is required." }, { status: 400 });
    }

    const supabase = await createSupabaseServiceClient({ allowWrite: true });
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ message: "Failed to delete task." }, { status: 500 });
  }
}
