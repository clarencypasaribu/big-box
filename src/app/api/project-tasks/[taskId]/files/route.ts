import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/utils/supabase-service";
import { getCurrentUserProfile } from "@/utils/current-user";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ taskId: string }> }
) {
    const { taskId } = await params;
    const supabase = await createSupabaseServiceClient();

    const { data: files, error } = await supabase
        .from("files")
        .select("id, name, size, type, created_at")
        .eq("entity_type", "task")
        .eq("entity_id", taskId)
        .order("created_at", { ascending: false });

    if (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: files });
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ taskId: string }> }
) {
    const { taskId } = await params;
    const { name, size, type, data } = await request.json();

    if (!name || !data) {
        return NextResponse.json({ message: "File data required" }, { status: 400 });
    }

    const profile = await getCurrentUserProfile();

    if (!profile.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createSupabaseServiceClient({ allowWrite: true });

    const { data: file, error } = await supabase
        .from("files")
        .insert({
            name,
            size,
            type,
            data,
            entity_type: "task",
            entity_id: taskId,
            uploader_id: profile.id,
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: file });
}
