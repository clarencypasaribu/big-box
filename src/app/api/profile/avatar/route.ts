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
    const supabase = await createSupabaseServiceClient({ allowWrite: true });
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return NextResponse.json({ message: "Invalid session" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("avatar");
    if (!(file instanceof File)) {
      return NextResponse.json({ message: "Avatar file is required" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ message: "Avatar must be an image" }, { status: 400 });
    }

    const userId = data.user.id;
    const fileExt = file.name.split(".").pop() || "png";
    const filePath = `profiles/${userId}/avatar.${fileExt}`;
    const bucket = process.env.SUPABASE_AVATAR_BUCKET || "avatars";

    const arrayBuffer = await file.arrayBuffer();
    let { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, arrayBuffer, { upsert: true, contentType: file.type });

    if (uploadError?.message?.toLowerCase().includes("bucket not found")) {
      const { error: bucketError } = await supabase.storage.createBucket(bucket, {
        public: true,
      });
      if (!bucketError) {
        const retry = await supabase.storage
          .from(bucket)
          .upload(filePath, arrayBuffer, { upsert: true, contentType: file.type });
        uploadError = retry.error;
      }
    }

    if (uploadError) {
      return NextResponse.json({ message: uploadError.message }, { status: 400 });
    }

    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(filePath);
    const avatarUrl = publicData.publicUrl;

    const email =
      data.user.email ?? (data.user.user_metadata?.email as string | undefined) ?? null;
    if (!email) {
      return NextResponse.json({ message: "Email user tidak ditemukan." }, { status: 400 });
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({ id: userId, email, avatar_url: avatarUrl }, { onConflict: "id" });

    if (profileError) {
      return NextResponse.json({ message: profileError.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, avatarUrl });
  } catch (error) {
    return NextResponse.json({ message: "Failed to upload avatar" }, { status: 500 });
  }
}
