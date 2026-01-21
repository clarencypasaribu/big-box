import { NextResponse } from "next/server";

import { createSupabaseServiceClient } from "@/utils/supabase-service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId")?.trim();

    if (!projectId) {
      return NextResponse.json({ message: "Project id wajib ada" }, { status: 400 });
    }

    const supabase = await createSupabaseServiceClient({ allowWrite: true });
    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("id,title,description,priority,stage,status,due_date,project_id,created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    if (!tasks || tasks.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const taskIds = tasks.map((t) => t.id);

    // Fetch deliverables
    const { data: deliverables } = await supabase
      .from("task_deliverables")
      .select("*")
      .in("task_id", taskIds);

    // Fetch files for these deliverables
    const deliverableIds = deliverables?.map((d) => d.id) ?? [];
    const { data: files } = await supabase
      .from("files")
      .select("id,name,size,entity_id,entity_type")
      .in("entity_id", deliverableIds)
      .eq("entity_type", "task_deliverable");

    // Map data back to tasks
    const tasksWithData = tasks.map((task) => {
      const taskDeliverables = deliverables?.filter((d) => d.task_id === task.id) ?? [];
      const dIds = taskDeliverables.map((d) => d.id);
      const taskFiles = files?.filter((f) => dIds.includes(f.entity_id)) ?? [];

      return {
        ...task,
        deliverables: taskDeliverables,
        files: taskFiles,
      };
    });

    return NextResponse.json({ data: tasksWithData });
  } catch (error) {
    return NextResponse.json({ message: "Gagal memuat tasks" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const projectId = String(body.projectId ?? "").trim();
    const stageId = String(body.stageId ?? "").trim();
    const title = String(body.title ?? "").trim();

    if (!projectId || !stageId || !title) {
      return NextResponse.json(
        { message: "Project, stage, dan title wajib diisi" },
        { status: 400 }
      );
    }

    const payload = {
      project_id: projectId,
      stage: stageId,
      title,
      description: body.description ? String(body.description) : null,
      priority: body.priority ? String(body.priority) : null,
      due_date: body.dueDate ? String(body.dueDate) : null,
      status: "In Progress",
    };

    const supabase = await createSupabaseServiceClient({ allowWrite: true });
    const { data, error } = await supabase
      .from("tasks")
      .insert(payload)
      .select("id,title,description,priority,stage,status,due_date,project_id,created_at")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ message: "Gagal menambah task" }, { status: 500 });
  }
}
