
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
        // Check for tasks assigned to this user OR projects owned by this user (if PM)
        // For simplicity, let's check tasks in projects where this user is a member/lead/owner.
        // To keep it performant, we'll check tasks assigned to the user OR tasks in projects they own.

        // 1. Get projects owned by user to check all tasks there (as PM should likely know about all deadline risks)
        //    OR just check tasks where user is assignee. 
        //    User request was: "notif deadline tasknya".
        //    Let's check tasks where assignee is user or user is Project Owner.

        // Get projects owned by user
        const { data: ownedProjects } = await supabase
            .from("projects")
            .select("id")
            .eq("owner_id", userId);

        const ownedProjectIds = ownedProjects?.map(p => p.id) || [];

        // Calculate deadline range (e.g., due within 24 hours)
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // ISO strings for query
        const nowStr = now.toISOString();
        // For "approaching deadline", we look for due_date between now and tomorrow (assuming due_date is date or datetime)
        // The schema has `due_date String?`. This is tricky. 
        // If it's stored as 'YYYY-MM-DD', we can compare strings roughly or we need to parse.
        // Let's assume standard ISO format or YYYY-MM-DD. 

        // We will select tasks that are NOT Done and have a due_date.
        // Since we can't easily do date math on a String column in DB without knowing format certainty, 
        // we fetch candidate tasks and filter in code.
        // Fetching open tasks for user's purview.

        const { data: candidateTasks } = await supabase
            .from("tasks")
            .select("id, title, due_date, project_id, status, projects(name, owner_id)")
            .neq("status", "Done")
            .not("due_date", "is", null);

        // Filter in memory for deadline match
        const deadlineTasks = candidateTasks?.filter(task => {
            // Check if user is relevant (Assignee logic is missing in schema check? 
            // Schema has `assignee String?` but it might be name not ID. 
            // The `projects` relation exists. 
            // We notify the Project Owner (PM) about deadlines.
            // And if the user is the PM (owner_id matches), we notify them.

            // If user is the project owner
            // @ts-ignore
            const isOwner = task.projects?.owner_id === userId;
            if (!isOwner) return false;

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
        // To avoid spam, we'd ideally check if we already notified today.
        // For MVP, we'll just check if a notification exists for this task with 'DEADLINE' type.
        // A better approach is checking `created_at` of last notification.

        for (const task of deadlineTasks) {
            // Check existing recent notification (last 24h)
            const { data: existing } = await supabase
                .from("notifications")
                .select("id")
                .eq("user_id", userId)
                .eq("type", "DEADLINE_APPROACHING")
                .ilike("message", `%${task.title}%`) // Loose matching or use a better key? 
                // Ideally we'd store entity_id in notification, but schema has just link.
                .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
                .maybeSingle();

            if (!existing) {
                const dueDate = new Date(task.due_date!);
                const isPastDue = dueDate < now;
                const msg = isPastDue
                    ? `Task "${task.title}" in project "${
                    // @ts-ignore
                    task.projects?.name}" is OVERDUE.`
                    : `Task "${task.title}" in project "${
                    // @ts-ignore
                    task.projects?.name}" is due soon.`;

                await supabase.from("notifications").insert({
                    user_id: userId,
                    title: isPastDue ? "Task Overdue" : "Task Deadline Approaching",
                    message: msg,
                    type: "DEADLINE_APPROACHING",
                    link: `/projects/${task.project_id}?taskId=${task.id}`,
                });
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
    } catch (error) {
        console.error("Notifications API Error:", error);
        return NextResponse.json({ message: "Failed to load notifications" }, { status: 500 });
    }
}
