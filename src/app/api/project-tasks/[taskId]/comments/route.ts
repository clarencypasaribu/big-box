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
            return NextResponse.json({ data: [], message: "Task ID is required." });
        }

        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return NextResponse.json({ data: [], message: "SUPABASE_SERVICE_ROLE_KEY is not set (required to access task_comments)" }, { status: 500 });
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
            return NextResponse.json({ message: "SUPABASE_SERVICE_ROLE_KEY is not set (required to write task_comments)" }, { status: 500 });
        }

        const supabase = createSupabaseAdminClient();

        const profile = await getCurrentUserProfile().catch(() => null);
        const authorName = profile?.name || profile?.email || "Unknown";
        const authorId = profile?.id;

        const { data, error } = await supabase
            .from("task_comments")
            .insert({ task_id: taskId, author: authorName, text })
            .select()
            .maybeSingle();

        if (error) {
            return NextResponse.json({ message: error.message }, { status: 400 });
        }

        // Send notifications to task assignee and PM
        if (authorId) {
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

                    if (assigneeProfile && assigneeProfile.id !== authorId) {
                        notificationRecipients.push(assigneeProfile.id);
                    }
                }

                // Add PM if not the author
                if (pmId && pmId !== authorId && !notificationRecipients.includes(pmId)) {
                    notificationRecipients.push(pmId);
                }

                // Send notifications
                const notifications = notificationRecipients.map(userId => ({
                    user_id: userId,
                    title: "New Comment",
                    message: `${authorName} commented on task "${task.title}" in project "${projectName}": "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
                    type: "TASK_COMMENT",
                    link: `/member/tasks?taskId=${taskId}`,
                }));

                if (notifications.length > 0) {
                    await supabase.from("notifications").insert(notifications);
                }
            }
        }

        return NextResponse.json({ data });
    } catch (e: any) {
        console.error("Unexpected error in POST comment:", e);
        return NextResponse.json({ message: e.message || "Internal Server Error" }, { status: 500 });
    }
}
