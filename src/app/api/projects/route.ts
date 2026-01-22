import { NextResponse } from "next/server";

import { createClient } from "@supabase/supabase-js";

import { createSupabaseServiceClient } from "../../../utils/supabase-service";
import { createSupabaseServerClient } from "../../../utils/supabase-server";

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

async function resolveMemberIds(supabase: Awaited<ReturnType<typeof createSupabaseServiceClient>>, members: string[]) {
  const names = members.filter((member) => member && !member.includes("@"));
  const emails = members.filter((member) => member && member.includes("@"));
  const ids = new Set<string>();
  const matchedNames = new Set<string>();

  if (names.length) {
    const { data } = await supabase
      .from("profiles")
      .select("id,full_name")
      .in("full_name", names);
    data?.forEach((row) => {
      if (row.id) ids.add(row.id);
      if (row.full_name) matchedNames.add(row.full_name);
    });
  }

  if (emails.length) {
    const { data } = await supabase
      .from("profiles")
      .select("id,email")
      .in("email", emails);
    data?.forEach((row) => {
      if (row.id) ids.add(row.id);
    });
  }

  const unresolved = names.filter((name) => !matchedNames.has(name));
  for (const name of unresolved) {
    const { data } = await supabase
      .from("profiles")
      .select("id,full_name")
      .ilike("full_name", `%${name}%`)
      .limit(1);
    const match = data?.[0];
    if (match?.id) {
      ids.add(match.id);
    }
  }

  return Array.from(ids);
}

async function syncProjectMembers(
  supabase: Awaited<ReturnType<typeof createSupabaseServiceClient>>,
  projectId: string,
  members: string[],
  projectName: string
) {
  const memberIds = await resolveMemberIds(supabase, members);
  const { data: existing } = await supabase
    .from("project_members")
    .select("member_id")
    .eq("project_id", projectId);

  const existingIds = new Set((existing ?? []).map((row) => row.member_id).filter(Boolean));
  const desiredIds = new Set(memberIds);

  const toInsert = memberIds
    .filter((id) => !existingIds.has(id))
    .map((id) => ({ project_id: projectId, member_id: id, role: "member" }));

  const toDelete = Array.from(existingIds).filter((id) => !desiredIds.has(id));

  if (toInsert.length) {
    await supabase.from("project_members").upsert(toInsert, {
      onConflict: "project_id,member_id",
    });

    // Notify new members
    const notifications = toInsert.map((m) => ({
      user_id: m.member_id,
      title: "Added to Project",
      message: `You have been added to project "${projectName}".`,
      type: "PROJECT_ASSIGNED",
      link: `/projects/${projectId}`,
    }));
    await supabase.from("notifications").insert(notifications);
  }

  if (toDelete.length) {
    await supabase
      .from("project_members")
      .delete()
      .eq("project_id", projectId)
      .in("member_id", toDelete);
  }
}

export async function GET() {
  try {
    const supabase = await createSupabaseServiceClient({ allowWrite: true });
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("updated_at", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ message: "Failed to load projects" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const ownerId = await getUserId(request);

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
      owner_id: ownerId ?? null,
    };

    if (!payload.name) {
      return NextResponse.json({ message: "Nama project wajib diisi" }, { status: 400 });
    }

    const supabase = await createSupabaseServiceClient({ allowWrite: true });

    if (!payload.code) {
      const { data: codes } = await supabase
        .from("projects")
        .select("code")
        .not("code", "is", null)
        .order("created_at", { ascending: false })
        .limit(1);

      const lastCode = codes?.[0]?.code ?? "";
      const match = typeof lastCode === "string" ? lastCode.match(/(\d+)$/) : null;
      const nextNumber = match ? Number(match[1]) + 1 : 1;
      const padded = String(nextNumber).padStart(4, "0");
      payload.code = `PRJ-${padded}`;
    }

    const { data, error } = await supabase
      .from("projects")
      .insert(payload)
      .select("id,code,name,location,status,progress,lead,icon_bg,description,start_date,end_date,team_members,owner_id,created_at,updated_at")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    if (data) {
      const teamMembers = Array.isArray(body.teamMembers)
        ? body.teamMembers.map((member: string) => String(member))
        : [];
      await syncProjectMembers(supabase, data.id, teamMembers, payload.name);
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ message: "Gagal menambah project" }, { status: 500 });
  }
}
