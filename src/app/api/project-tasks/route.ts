import { NextResponse } from "next/server";

import { createSupabaseServiceClient } from "@/utils/supabase-service";
import { createSupabaseServerClient } from "@/utils/supabase-server";

async function getCurrentUserFromRequest(request: Request) {
  // Try cookie-based session first
  try {
    const server = await createSupabaseServerClient();
    const { data } = await server.auth.getUser();
    if (data.user) return data.user;
  } catch {
    // ignore
  }

  // Fallback: Authorization Bearer token
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const admin = await createSupabaseServiceClient({ allowWrite: true });
      const { data, error } = await admin.auth.getUser(token);
      if (!error && data.user) return data.user;
    } catch {
      // ignore
    }
  }

  return null;
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

    // Resolve current user and default assignee
    let resolvedAssignee: string | null = rawAssignee || null;
    let createdBy: string | null = null;
    try {
      const user = await getCurrentUserFromRequest(request);
      if (user?.id) {
        createdBy = user.id;
        if (!resolvedAssignee) {
          const supabaseAdmin = await createSupabaseServiceClient({ allowWrite: true });
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("full_name,email")
            .eq("id", user.id)
            .maybeSingle();
          resolvedAssignee =
            profile?.full_name ||
            profile?.email ||
            (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null) ||
            user.email ||
            user.id ||
            null;
        }
      }
    } catch {
      resolvedAssignee = resolvedAssignee ?? null;
    }

    const payload = {
      project_id: projectId,
      stage: stageId,
      title,
      description: body.description ? String(body.description) : null,
      priority: body.priority ? String(body.priority) : null,
      due_date: body.dueDate ? String(body.dueDate) : null,
      assignee: resolvedAssignee,
      created_by: createdBy,
      status: "Not Started",
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

    // Get current user ID to exclude self
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser?.id) recipientIds.delete(currentUser.id);

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
