import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const body = await req.json();
  const {
    id,
    email,
    full_name,
    first_name,
    last_name,
    phone,
    position,
    role,
  } = body ?? {};

  if (!id || !email || !role) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "Server is not configured." }, { status: 500 });
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  const { error } = await supabase.from("profiles").upsert({
    id,
    email,
    full_name,
    first_name,
    last_name,
    phone,
    position,
    role,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
