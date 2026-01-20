import { NextResponse } from "next/server";

import { createSupabaseServiceClient } from "@/utils/supabase-service";

export async function GET() {
  try {
    const supabase = await createSupabaseServiceClient({ allowWrite: true });
    const { data, error } = await supabase
      .from("profiles")
      .select("id,full_name,email,role")
      .order("full_name", { ascending: true });

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ message: "Gagal memuat profiles" }, { status: 500 });
  }
}
