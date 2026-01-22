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

        // Create TaskDeliverable record
        const { data: deliverable, error: deliverableError } = await supabase
            .from("task_deliverables")
            .insert({
                task_id: taskId,
                data_ingest: totalDataIngest || null,
                notes: notes || null,
            })
            .select()
            .single();

        if (deliverableError) {
            console.error("Error creating deliverable:", deliverableError);
            // Verify if table exists? Proceeding anyway since task is done.
        }

        // Save Attachment if present
        if (body.attachmentData && body.attachmentFileName) {
            const { error: fileError } = await supabase
                .from("files")
                .insert({
                    name: body.attachmentFileName,
                    data: body.attachmentData,
                    size: body.attachmentSize || 0,
                    type: body.attachmentType || "application/octet-stream",
                    entity_type: "task_deliverable",
                    entity_id: deliverable?.id ?? taskId, // fallback to taskId if deliverable creation failed (unlikely)
                    uploader_id: userId,
                });

            if (fileError) {
                console.error("Error saving file:", fileError);
            }
        }

        // --- Notification Logic ---
        // Fetch Project info to notify PM
        const { data: projectInfo } = await supabase
            .from("projects")
            .select("owner_id, name")
            .eq("id", task.project_id)
            .maybeSingle();

        if (projectInfo?.owner_id) {
            await supabase.from("notifications").insert({
                user_id: projectInfo.owner_id,
                title: "Task Deliverable Submitted",
                message: `Deliverables for task "${task.title}" have been submitted in project "${projectInfo.name}".`,
                type: "TASK_SUBMITTED",
                link: `/projects/${task.project_id}?taskId=${taskId}`,
            });
        }
        // --------------------------

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
