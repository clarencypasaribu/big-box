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

    // Fetched tasks...
    // const taskIds already defined above
    const creatorIds = Array.from(new Set(tasks.map((t) => t.created_by).filter(Boolean))) as string[];

    // Fetch comments count
    const { data: comments, error: commentsError } = await supabase
      .from("task_comments")
      .select("task_id")
      .in("task_id", taskIds);

    // Fetch files count (entity_type = 'task')
    const { data: directFiles, error: filesError } = await supabase
      .from("files")
      .select("entity_id")
      .eq("entity_type", "task")
      .in("entity_id", taskIds);

    // Fetch creators
    let creatorMap: Record<string, string> = {};
    if (creatorIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", creatorIds);

      profiles?.forEach((p) => {
        creatorMap[p.id] = p.full_name || "Unknown";
      });
    }

    // Map data back to tasks
    const tasksWithData = tasks.map((task) => {
      const taskCommentsCount = comments?.filter((c) => c.task_id === task.id).length ?? 0;
      const taskFilesCount = directFiles?.filter((f) => f.entity_id === task.id).length ?? 0;
      const creatorName = task.created_by ? creatorMap[task.created_by] : null;

      return {
        ...task,
        comments_count: taskCommentsCount,
        files_count: taskFilesCount,
        created_by_name: creatorName,
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
      created_by: currentUserId,
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
