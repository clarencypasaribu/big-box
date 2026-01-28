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

    // Auto-update project progress when task status changes
    if (data?.project_id && body.status !== undefined) {
      try {
        // Get all tasks for this project
        const { data: allTasks } = await supabase
          .from("tasks")
          .select("id,status")
          .eq("project_id", data.project_id);

        if (allTasks && allTasks.length > 0) {
          // Count completed tasks
          const completedCount = allTasks.filter(
            (t) => t.status === "Done" || t.status === "Completed"
          ).length;

          // Calculate progress percentage
          const progress = Math.round((completedCount / allTasks.length) * 100);

          // Update project progress
          await supabase
            .from("projects")
            .update({ progress, updated_at: new Date().toISOString() })
            .eq("id", data.project_id);
        }
      } catch {
        // Silently ignore progress update errors
      }
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
