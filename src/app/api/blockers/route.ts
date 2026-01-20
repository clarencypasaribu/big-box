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
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createSupabaseServiceClient({ allowWrite: true });
    const { data, error } = await supabase
      .from("blockers")
      .select(
        "id,task_id,task_title,project_id,project_name,reason,notes,reporter_name,status,created_at"
      )
      .eq("pm_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ message: "Failed to load blockers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const taskId = String(body.taskId ?? "").trim();
    const reason = body.reason ? String(body.reason).trim() : "";
    const notes = body.notes ? String(body.notes).trim() : "";

    if (!taskId) {
      return NextResponse.json({ message: "Task wajib diisi" }, { status: 400 });
    }

    if (!reason && !notes) {
      return NextResponse.json(
        { message: "Pilih alasan atau tulis detail blocker." },
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
      reason: reason || null,
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

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ message: "Gagal mengirim blocker" }, { status: 500 });
  }
}
