import { NextResponse } from "next/server";

import { createSupabaseServiceClient } from "@/utils/supabase-service";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ profileId: string }> }
) {
  const params = await context.params;
  const body = await request.json().catch(() => ({}));
  const profileId =
    String(params.profileId ?? "").trim() ||
    String(body.profileId ?? body.id ?? "").trim();
  if (!profileId) {
    return NextResponse.json({ message: "Profile ID is required." }, { status: 400 });
  }

  const status = String(body.status ?? "").trim();
  if (!["Active", "Inactive"].includes(status)) {
    return NextResponse.json({ message: "Status harus Active atau Inactive" }, { status: 400 });
  }

  try {
    const supabase = await createSupabaseServiceClient({ allowWrite: true });
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: status === "Active" })
      .eq("id", profileId);

    if (error) {
      const needsColumn = error.message?.toLowerCase().includes("is_active");
      const message = needsColumn
        ? "Kolom is_active belum ada di tabel profiles. Tambahkan kolom boolean is_active untuk mengaktifkan fitur toggle."
        : error.message;
      return NextResponse.json({ message }, { status: 400 });
    }

    return NextResponse.json({ data: { id: profileId, status } });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to update status." },
      { status: 500 }
    );
  }
}
