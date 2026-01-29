import { NextResponse } from "next/server";

import { createSupabaseServiceClient } from "@/utils/supabase-service";
import { createSupabaseServerClient } from "@/utils/supabase-server";

function hasSupabaseAuthCookie(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  return cookieHeader.includes("sb-") || cookieHeader.includes("supabase-auth-token");
}

async function getCurrentUserId(request: Request): Promise<string | null> {
  if (!hasSupabaseAuthCookie(request)) return null;

  try {
    const supabase = await createSupabaseServerClient({ allowWrite: true });
    const { data: { user } } = await supabase.auth.getUser();
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
      return NextResponse.json({ message: "Project ID is required." }, { status: 400 });
    }

    const supabase = await createSupabaseServiceClient({ allowWrite: true });
    let tasks: any[] | null = null;
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select(
          "id,title,description,priority,stage,status,due_date,project_id,created_at,assignee,created_by"
        )
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      tasks = data;
    } catch (err: any) {
      // Fallback if column missing or select fails
      console.warn("[project-tasks] primary select failed, fallback without created_by", err?.message);
      const { data, error } = await supabase
        .from("tasks")
        .select("id,title,description,priority,stage,status,due_date,project_id,created_at,assignee")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });
      if (error) {
        return NextResponse.json({ message: error.message }, { status: 400 });
      }
      tasks = data ?? [];
    }

    if (!tasks || tasks.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const taskIds = tasks.map((t) => t.id);

    // Fetch deliverables
    const { data: deliverables, error: delError } = await supabase
      .from("task_deliverables")
      .select("*")
      .in("task_id", taskIds);

    console.log("[project-tasks] deliverables count:", deliverables?.length, "error:", delError);
    if (deliverables && deliverables.length > 0) {
      console.log("[project-tasks] sample deliverable:", deliverables[0]);
    }

    // Fetch files for these deliverables
    const deliverableIds = deliverables?.map((d) => d.id) ?? [];
    console.log("[project-tasks] deliverableIds:", deliverableIds);

    const { data: files, error: filesError } = await supabase
      .from("files")
      .select("id,name,size,entity_id,entity_type")
      .in("entity_id", deliverableIds)
      .eq("entity_type", "task_deliverable");

    console.log("[project-tasks] files count:", files?.length, "error:", filesError);

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
    return NextResponse.json({ message: "Failed to load tasks." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const projectId = String(body.projectId ?? "").trim();
    const stageId = String(body.stageId ?? "").trim();
    const title = String(body.title ?? "").trim();
    const rawAssignee = String(body.assignee ?? "").trim();

    if (!projectId || !stageId || !title) {
      return NextResponse.json(
        { message: "Project, stage, and title are required." },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServiceClient({ allowWrite: true });

    // Get current user for auto-assignment (using server client for session)
    const currentUserId = await getCurrentUserId(request);

    // If no assignee is provided, try to get the current user's full name
    let assigneeName = body.assignee ? String(body.assignee) : null;
    if (!assigneeName && currentUserId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", currentUserId)
        .maybeSingle();
      assigneeName = profile?.full_name || null;
    }

    const payload = {
      project_id: projectId,
      stage: stageId,
      title,
      description: body.description ? String(body.description) : null,
      priority: body.priority ? String(body.priority) : null,
      due_date: body.dueDate ? String(body.dueDate) : null,
      assignee: assigneeName,
      status: "Not Started",
    };
    const { data, error } = await supabase
      .from("tasks")
      .insert(payload)
      .select("id,title,description,priority,stage,status,due_date,project_id,created_at")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    // --- Notification Logic ---
    // --- Notification Logic ---
    // Fetch Project Members AND Owner to notify
    const { data: projectMembers } = await supabase
      .from("project_members")
      .select("member_id")
      .eq("project_id", projectId);

    const { data: projectData } = await supabase
      .from("projects")
      .select("owner_id, name")
      .eq("id", projectId)
      .maybeSingle();

    const recipientIds = new Set<string>();
    if (projectData?.owner_id) recipientIds.add(projectData.owner_id);
    projectMembers?.forEach(pm => recipientIds.add(pm.member_id));

    // Exclude current user from notifications (already fetched above)
    if (currentUserId) recipientIds.delete(currentUserId);

    const notifications = Array.from(recipientIds).map(userId => ({
      user_id: userId,
      title: "New Task Created",
      message: `A new task "${title}" has been added to project "${projectData?.name}".`,
      type: "TASK_CREATED",
      link: `/projects/${projectId}?taskId=${data?.id}`,
    }));

    if (notifications.length > 0) {
      await supabase.from("notifications").insert(notifications);
    }
    // --------------------------
    // --------------------------

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ message: "Failed to add task." }, { status: 500 });
  }
}
