import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/utils/current-user";
import { createSupabaseAdminClient } from "@/utils/supabase-admin";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ taskId: string }> }
) {
    try {
        const { taskId } = await params;

        if (!taskId) {
            return NextResponse.json({ data: [], message: "Task id wajib ada" });
        }

        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return NextResponse.json({ data: [], message: "SUPABASE_SERVICE_ROLE_KEY belum diset (wajib untuk akses task_comments)" }, { status: 500 });
        }

        const supabase = createSupabaseAdminClient();
        const { data, error } = await supabase
            .from("task_comments")
            .select("*")
            .eq("task_id", taskId)
            .order("created_at", { ascending: false });

        if (error) {
            return NextResponse.json({ data: [], message: error.message }, { status: 400 });
        }

        return NextResponse.json({ data: data ?? [] });
    } catch (e: any) {
        console.error("Unexpected error in GET comments:", e);
        return NextResponse.json({ data: [], message: e.message || "Internal Server Error" });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ taskId: string }> }
) {
    try {
        const { taskId } = await params;
        const { text } = await request.json();

        if (!text) {
            return NextResponse.json({ message: "Text required" }, { status: 400 });
        }

        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return NextResponse.json({ message: "SUPABASE_SERVICE_ROLE_KEY belum diset (wajib untuk menulis task_comments)" }, { status: 500 });
        }

        const supabase = createSupabaseAdminClient();

        const profile = await getCurrentUserProfile().catch(() => null);
        const authorName = profile?.name || profile?.email || "Unknown";

        const { data, error } = await supabase
            .from("task_comments")
            .insert({ task_id: taskId, author: authorName, text })
            .select()
            .maybeSingle();

        if (error) {
            return NextResponse.json({ message: error.message }, { status: 400 });
        }

        return NextResponse.json({ data });
    } catch (e: any) {
        console.error("Unexpected error in POST comment:", e);
        return NextResponse.json({ message: e.message || "Internal Server Error" }, { status: 500 });
    }
}
