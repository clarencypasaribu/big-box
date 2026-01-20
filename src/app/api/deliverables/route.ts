import { NextResponse } from "next/server";

import { createSupabaseServiceClient } from "@/utils/supabase-service";
import { createSupabaseServerClient } from "@/utils/supabase-server";

async function getUserId() {
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

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const taskId = String(body.taskId ?? "").trim();
        const attachmentLink = body.attachmentLink ? String(body.attachmentLink).trim() : "";
        const totalDataIngest = body.totalDataIngest ? String(body.totalDataIngest).trim() : "";
        const notes = body.notes ? String(body.notes).trim() : "";

        if (!taskId) {
            return NextResponse.json({ message: "Task wajib diisi" }, { status: 400 });
        }

        const userId = await getUserId();
        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const supabase = await createSupabaseServiceClient({ allowWrite: true });

        // Get task info
        const { data: task, error: taskError } = await supabase
            .from("tasks")
            .select("id,title,project_id")
            .eq("id", taskId)
            .maybeSingle();

        if (taskError || !task) {
            return NextResponse.json({ message: "Task tidak ditemukan" }, { status: 404 });
        }

        // Update task status to Done
        const { error: updateError } = await supabase
            .from("tasks")
            .update({ status: "Done" })
            .eq("id", taskId);

        if (updateError) {
            return NextResponse.json({ message: updateError.message }, { status: 400 });
        }

        // Store deliverable info in task_deliverables table (if it exists) or return success
        // For now, just mark as done and return success
        return NextResponse.json({
            data: {
                taskId,
                status: "Done",
                attachmentLink,
                totalDataIngest,
                notes,
            }
        });
    } catch (error) {
        return NextResponse.json({ message: "Gagal submit deliverables" }, { status: 500 });
    }
}
