
import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/utils/supabase-service";
import { createSupabaseServerClient } from "@/utils/supabase-server";

// Helper to get authenticated user
async function getUserId(request: Request) {
    try {
        // Try header token first
        const header = request.headers.get("authorization");
        if (header) {
            const token = header.split(" ")[1];
            const supabaseAdmin = await createSupabaseServiceClient({ allowWrite: true });
            const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
            if (!error && user) return user.id;
        }

        // Fallback to cookie
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();
        return user?.id ?? null;
    } catch {
        return null;
    }
}

export async function GET(request: Request) {
    try {
        const userId = await getUserId(request);

        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const supabase = await createSupabaseServiceClient({ allowWrite: true });

        // --- Deadline Check Logic ---

        // 1. Get projects where user is Owner OR Member
        const { data: ownedProjects } = await supabase
            .from("projects")
            .select("id")
            .eq("owner_id", userId);

        const { data: memberProjects } = await supabase
            .from("project_members")
            .select("project_id")
            .eq("member_id", userId);

        const projectIds = new Set([
            ...(ownedProjects?.map(p => p.id) || []),
            ...(memberProjects?.map(p => p.project_id) || [])
        ]);

        const finalProjectIds = Array.from(projectIds);

        if (finalProjectIds.length > 0) {
            // Calculate deadline range (e.g., due within 24 hours)
            const now = new Date();

            // Fetch candidate tasks from these projects
            const { data: candidateTasks } = await supabase
                .from("tasks")
                .select("id, title, due_date, project_id, status, projects(name, owner_id)")
                .neq("status", "Done")
                .not("due_date", "is", null)
                .in("project_id", finalProjectIds);

            // Filter in memory for deadline match
            const deadlineTasks = candidateTasks?.filter(task => {
                const dueDate = new Date(task.due_date!);
                if (isNaN(dueDate.getTime())) return false; // Invalid date string

                // Check if due date is today or tomorrow (within 24 hours of now approximately)
                // Or if it's already past due
                const timeDiff = dueDate.getTime() - now.getTime();
                const hoursDiff = timeDiff / (1000 * 3600);

                // Notify if:
                // 1. Past due (negative difference)
                // 2. Due within 24 hours (0 < hoursDiff < 24)
                return hoursDiff < 24;
            }) || [];

            // Insert notifications for these tasks if not already notified recently
            for (const task of deadlineTasks) {
                // Check existing recent notification (last 24h)
                const { data: existing } = await supabase
                    .from("notifications")
                    .select("id")
                    .eq("user_id", userId)
                    .eq("type", "DEADLINE_APPROACHING")
                    .ilike("message", `%${task.title}%`)
                    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
                    .maybeSingle();

                if (!existing) {
                    const dueDate = new Date(task.due_date!);
                    // @ts-ignore
                    const isPastDue = dueDate < now;
                    // @ts-ignore
                    const projectName = task.projects?.name || "Unknown Project";

                    const msg = isPastDue
                        ? `Task "${task.title}" in project "${projectName}" is OVERDUE.`
                        : `Task "${task.title}" in project "${projectName}" is due soon.`;

                    await supabase.from("notifications").insert({
                        user_id: userId,
                        title: isPastDue ? "Task Overdue" : "Task Deadline Approaching",
                        message: msg,
                        type: "DEADLINE_APPROACHING",
                        link: `/projects/${task.project_id}?taskId=${task.id}`,
                    });
                }
            }
        }
        // --------------------------

        // Fetch user's notifications
        const { data: notifications, error } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(50);

        if (error) {
            return NextResponse.json({ message: error.message }, { status: 400 });
        }

        return NextResponse.json({ data: notifications });
    } catch (error: any) {
        console.error("Notifications API Error:", error);
        return NextResponse.json({ message: "Failed to load notifications" }, { status: 500 });
    }
}
