import { NextRequest, NextResponse } from "next/server";

import { createSupabaseServiceClient } from "@/utils/supabase-service";

function getBearerToken(request: Request) {
  const header = request.headers.get("authorization") || request.headers.get("Authorization");
  if (!header) return null;
  const [, token] = header.split(" ");
  return token || null;
}

export async function PUT(request: NextRequest) {
  const token = getBearerToken(request);
  if (!token) {
    return NextResponse.json({ message: "Missing auth token" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const supabase = await createSupabaseServiceClient({ allowWrite: true });
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return NextResponse.json({ message: "Invalid session" }, { status: 401 });
    }

    const user = data.user;
    const firstName = String(body.firstName ?? "").trim();
    const lastName = String(body.lastName ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const position = String(body.position ?? "").trim();
    const bio = String(body.bio ?? "").trim();
    const fullName = [firstName, lastName].filter(Boolean).join(" ").trim() || user.email;

    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        email: user.email,
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        phone,
        position,
        bio,
      },
      { onConflict: "id" }
    );

    if (profileError) {
      return NextResponse.json({ message: profileError.message }, { status: 400 });
    }

    if (supabase.auth.admin?.updateUserById) {
      await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          firstName,
          lastName,
          name: fullName,
          phone,
          position,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ message: "Failed to update profile" }, { status: 500 });
  }
}
