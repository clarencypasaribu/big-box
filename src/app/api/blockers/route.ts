import { NextResponse } from "next/server";

import { createClient } from "@supabase/supabase-js";

import { createSupabaseServiceClient } from "@/utils/supabase-service";
import { createSupabaseServerClient } from "@/utils/supabase-server";

function getBearerToken(request: Request) {
  const header = request.headers.get("authorization") || request.headers.get("Authorization");
  if (!header) return null;
  const [, token] = header.split(" ");
  return token || null;
}

function hasSupabaseAuthCookie(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  return cookieHeader.includes("sb-") || cookieHeader.includes("supabase-auth-token");
}

async function getUserId(request: Request) {
  const token = getBearerToken(request);
  if (token) {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabaseAdmin = await createSupabaseServiceClient({ allowWrite: true });
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && data.user?.id) return data.user.id;
    } else if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const supabaseToken = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false,
          },
        }
      );
      const { data, error } = await supabaseToken.auth.getUser(token);
      if (!error && data.user?.id) return data.user.id;
    }
  }

  if (!hasSupabaseAuthCookie(request)) return null;

  try {
    const supabase = await createSupabaseServerClient({ allowWrite: true });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const userId = await getUserId(request);
    console.log("[API Default] /api/blockers user:", userId);

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createSupabaseServiceClient({ allowWrite: true });

    // Fetch projects where user is owner or member
    const { data: memberProjects } = await supabase
      .from("project_members")
      .select("project_id")
      .eq("member_id", userId);

    const { data: ownedProjects } = await supabase
      .from("projects")
      .select("id")
      .eq("owner_id", userId);

    const projectIds = new Set([
      ...(memberProjects?.map(p => p.project_id) || []),
      ...(ownedProjects?.map(p => p.id) || [])
    ]);

    // Optional filter by specific project from query params
    const projectIdParam = new URL(request.url).searchParams.get("projectId")?.trim();
    let finalProjectIds = Array.from(projectIds);

    if (projectIdParam) {
      if (!projectIds.has(projectIdParam)) {
        // If user is not member of requested project
        return NextResponse.json({ message: "Unauthorized for this project" }, { status: 403 });
      }
      finalProjectIds = [projectIdParam];
    }

    if (finalProjectIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const { data: blockers, error } = await supabase
      .from("blockers")
      .select(
        "id,task_id,task_title,project_id,project_name,title,product,reason,notes,reporter_name,status,created_at,assignee_id,assignee_name,pm_id"
      )
      .in("project_id", finalProjectIds)
      .order("created_at", { ascending: false });

    console.log("[API Default] Found blockers:", blockers?.length, "Error:", error);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    if (!blockers || blockers.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const blockerIds = blockers.map(b => b.id);
    const { data: files } = await supabase
      .from("files")
      .select("id,name,size,type,data,entity_id") // including data for download
      .in("entity_id", blockerIds)
      .eq("entity_type", "blocker");

    const blockersWithFiles = blockers.map(b => ({
      ...b,
      files: files?.filter(f => f.entity_id === b.id) ?? []
    }));

    return NextResponse.json({ data: blockersWithFiles });
  } catch (error) {
    return NextResponse.json({ message: "Failed to load blockers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const taskId = String(body.taskId ?? "").trim();
    const title = body.title ? String(body.title).trim() : "";
    const product = body.product ? String(body.product).trim() : "";
    const reason = body.reason ? String(body.reason).trim() : "";
    const notes = body.notes ? String(body.notes).trim() : "";

    if (!taskId) {
      return NextResponse.json({ message: "Task is required." }, { status: 400 });
    }

    if (!title && !reason && !notes) {
      return NextResponse.json(
        { message: "Isi judul blocker atau deskripsi detail." },
        { status: 400 }
      );
    }

    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createSupabaseServiceClient({ allowWrite: true });
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("id,title,project_id")
      .or(`id.eq.${taskId},seed_key.eq.${taskId}`)
      .maybeSingle();

    if (taskError) {
      return NextResponse.json({ message: taskError.message }, { status: 400 });
    }

    if (!task) {
      return NextResponse.json({ message: "Task tidak ditemukan." }, { status: 404 });
    }

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id,name,owner_id")
      .eq("id", task.project_id)
      .maybeSingle();

    if (projectError) {
      return NextResponse.json({ message: projectError.message }, { status: 400 });
    }

    if (!project) {
      return NextResponse.json({ message: "Project tidak ditemukan." }, { status: 404 });
    }

    if (!project.owner_id) {
      return NextResponse.json(
        { message: "Project manager belum ditentukan untuk project ini." },
        { status: 400 }
      );
    }

    const { data: reporterProfile } = await supabase
      .from("profiles")
      .select("full_name,email")
      .eq("id", userId)
      .maybeSingle();

    const reporterName =
      reporterProfile?.full_name ||
      reporterProfile?.email?.split("@")[0] ||
      "Member";

    const payload = {
      id: crypto.randomUUID(),
      task_id: task.id,
      task_title: task.title,
      project_id: project.id,
      project_name: project.name,
      title: title || reason || null,
      product: product || null,
      reason: reason || title || null,
      notes: notes || null,
      reporter_id: userId,
      reporter_name: reporterName,
      pm_id: project.owner_id,
      status: "Open",
    };

    const { data, error } = await supabase
      .from("blockers")
      .insert(payload)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    // Save attachment if exists
    if (data && body.attachmentData && body.attachmentFileName) {
      await supabase.from("files").insert({
        name: body.attachmentFileName,
        data: body.attachmentData,
        size: body.attachmentSize || 0,
        type: body.attachmentType || "application/octet-stream",
        entity_type: "blocker",
        entity_id: data.id,
        uploader_id: userId,
      });
    }



    // --- Notification Logic ---
    if (project.owner_id) {
      await supabase.from("notifications").insert({
        user_id: project.owner_id,
        title: "Blocker Reported",
        message: `${reporterName} reported a blocker: "${title || reason}" in project "${project.name}".`,
        type: "BLOCKER_REPORTED",
        link: `/projects/${project.id}?blockerId=${data?.id}`, // Assuming a way to deep link or view blockers
      });
    }
    // --------------------------

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ message: "Failed to send blocker." }, { status: 500 });
  }
}
