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

    // Send notifications to task assignee and PM
    const uploaderName = profile.name || profile.email || "Someone";

    // Get task info for notification
    const { data: task } = await supabase
        .from("tasks")
        .select("title, assignee, project_id, projects(owner_id, name)")
        .eq("id", taskId)
        .single();

    if (task) {
        const notificationRecipients: string[] = [];
        // @ts-ignore
        const pmId = task.projects?.owner_id;
        // @ts-ignore
        const projectName = task.projects?.name || "Unknown Project";

        // Find assignee profile id
        if (task.assignee) {
            const { data: assigneeProfile } = await supabase
                .from("profiles")
                .select("id")
                .or(`full_name.eq.${task.assignee},email.ilike.${task.assignee}%`)
                .maybeSingle();

            if (assigneeProfile && assigneeProfile.id !== profile.id) {
                notificationRecipients.push(assigneeProfile.id);
            }
        }

        // Add PM if not the uploader
        if (pmId && pmId !== profile.id && !notificationRecipients.includes(pmId)) {
            notificationRecipients.push(pmId);
        }

        // Send notifications
        const notifications = notificationRecipients.map(userId => ({
            user_id: userId,
            title: "New File Uploaded",
            message: `${uploaderName} uploaded file "${name}" to task "${task.title}" in project "${projectName}"`,
            type: "FILE_UPLOADED",
            link: `/member/tasks?taskId=${taskId}`,
        }));

        if (notifications.length > 0) {
            await supabase.from("notifications").insert(notifications);
        }
    }

    return NextResponse.json({ data: file });
}
