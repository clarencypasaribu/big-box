import { NextRequest, NextResponse } from "next/server";

import { createSupabaseServiceClient } from "@/utils/supabase-service";

function getBearerToken(request: Request) {
  const header = request.headers.get("authorization") || request.headers.get("Authorization");
  if (!header) return null;
  const [, token] = header.split(" ");
  return token || null;
}

export async function POST(request: NextRequest) {
  const token = getBearerToken(request);
  if (!token) {
    return NextResponse.json({ message: "Missing auth token" }, { status: 401 });
  }

  try {
    const supabase = await createSupabaseServiceClient();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return NextResponse.json({ message: "Invalid session" }, { status: 401 });
    }

    const user = data.user;
    const metadata = user.user_metadata ?? {};
    const role = metadata.role ?? null;

    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        email: user.email,
        first_name: metadata.firstName ?? "",
        last_name: metadata.lastName ?? "",
        full_name: metadata.name ?? user.email,
        phone: metadata.phone ?? "",
        position: metadata.position ?? "",
        role,
      },
      { onConflict: "id" }
    );

    if (profileError) {
      return NextResponse.json({ message: profileError.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ message: "Failed to sync profile" }, { status: 500 });
  }
}
