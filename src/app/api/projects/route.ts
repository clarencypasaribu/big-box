import { NextResponse } from "next/server";

import { createSupabaseServiceClient } from "../../../utils/supabase-service";
import { createSupabaseServerClient } from "../../../utils/supabase-server";

function getBearerToken(request: Request) {
  const header = request.headers.get("authorization") || request.headers.get("Authorization");
  if (!header) return null;
  const [, token] = header.split(" ");
  return token || null;
}

async function getUserId(request: Request) {
  const token = getBearerToken(request);
  if (token) {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabaseAdmin = await createSupabaseServiceClient();
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && data.user?.id) return data.user.id;
    }
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const supabase = await createSupabaseServiceClient();
    const { data, error } = await supabase
      .from("projects")
      .select("id,name,code,location,status,progress,lead,icon_bg,description,owner_id,updated_at,created_at")
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
      id: body.id ? String(body.id) : crypto.randomUUID(),
      name: String(body.name ?? "").trim(),
      code: body.code ? String(body.code).trim() : null,
      location: body.location ? String(body.location).trim() : null,
      status: body.status ?? "In Progress",
      progress: typeof body.progress === "number" ? body.progress : Number(body.progress ?? 0),
      lead: body.lead ? String(body.lead).trim() : null,
      icon_bg: body.iconBg ? String(body.iconBg) : null,
      description: body.description ? String(body.description) : null,
      owner_id: ownerId ?? null,
    };

    if (!payload.name) {
      return NextResponse.json({ message: "Nama project wajib diisi" }, { status: 400 });
    }

    const supabase = await createSupabaseServiceClient();
    const { data, error } = await supabase.from("projects").insert(payload).select().maybeSingle();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ message: "Gagal menambah project" }, { status: 500 });
  }
}
