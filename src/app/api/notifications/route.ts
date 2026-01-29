
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
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "50");

        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const supabase = await createSupabaseServiceClient({ allowWrite: true });
        const now = new Date();
        const checkWindowStart = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(); // Last 24h

        // 1. Get User Role
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", userId)
            .single();

        const isPM = (profile?.role || "").toLowerCase().includes("project_manager") ||
            (profile?.role || "").toLowerCase().includes("manager");

        const notificationsToInsert: any[] = [];

        // Deduplication Helper
        const { data: recentNotifs } = await supabase
            .from("notifications")
            .select("message")
            .eq("user_id", userId)
            .gte("created_at", checkWindowStart);

        const recentMessages = new Set(recentNotifs?.map(n => n.message) || []);

        const queueNotification = (
            title: string,
            message: string,
            link: string,
            type: "NEW_ASSIGNMENT" | "REMINDER" | "INTERACTION" | "PROJECT_INFO" | "RISK_ALERT" | "TASK_AGGREGATE" | "MEMBER_ISSUE" | "PROJECT_ALERT"
        ) => {
            if (!recentMessages.has(message)) {
                notificationsToInsert.push({
                    user_id: userId,
                    title,
                    message,
                    link,
                    type,
                    is_read: false
                });
                recentMessages.add(message);
            }
        };

        if (isPM) {
            // --- PM LOGIC ---

            // A. Project Level (Status & Deadline)
            const { data: ownedProjects } = await supabase
                .from("projects")
                .select("id, name, end_date, status, lead")
                // PM typically sees projects they lead or own. 
                // Adjust strictness if needed, for now 'lead' or 'owner' is safe assumption if schema supports
                // Assuming fetching all or owned. Let's stick to identifying via ownership/lead or member.
                .neq("status", "Completed");

            // Filter projects relevant to this PM (if schema has lead/owner_id, check that. 
            // The previous code verified ownership. Let's assume fetching all active projects the user has access to is handled by RLS typically, 
            // but here we are using service role so we MUST filter)
            // Previous code did:
            const { data: memberRows } = await supabase.from("project_members").select("project_id").eq("member_id", userId);
            const { data: owned } = await supabase.from("projects").select("id").eq("owner_id", userId);
            const pmProjectIds = new Set([...(memberRows?.map(r => r.project_id) || []), ...(owned?.map(p => p.id) || [])]);
            const finalPmProjectIds = Array.from(pmProjectIds);

            if (finalPmProjectIds.length > 0) {
                // Fetch full project details
                const { data: projects } = await supabase
                    .from("projects")
                    .select("id, name, end_date, status")
                    .in("id", finalPmProjectIds)
                    .neq("status", "Completed");

                (projects || []).forEach(p => {
                    // Status Change / Risk
                    if (p.status === "At Risk" || p.status === "Delayed") {
                        queueNotification(
                            `${p.status} Project`,
                            `Project "${p.name}" is currently marked as ${p.status}.`,
                            `/pm/projects/${p.id}`,
                            "PROJECT_ALERT"
                        );
                    }
                    // Deadline
                    if (p.end_date) {
                        const daysLeft = Math.ceil((new Date(p.end_date).getTime() - now.getTime()) / (86400000));
                        if (daysLeft >= 0 && daysLeft <= 3) {
                            queueNotification(
                                "Project Deadline Approaching",
                                `Project "${p.name}" is due in ${daysLeft === 0 ? "today" : daysLeft + " days"}.`,
                                `/pm/projects/${p.id}`,
                                "PROJECT_ALERT"
                            );
                        }
                    }
                });

                // B. Task Level (Grouped by Project)
                const { data: tasks } = await supabase
                    .from("tasks")
                    .select("id, status, due_date, project_id, projects(name)")
                    .in("project_id", finalPmProjectIds)
                    .neq("status", "Done")
                    .neq("status", "Completed");

                const projectOverdueMap: Record<string, { count: number, name: string }> = {};

                (tasks || []).forEach(t => {
                    if (t.due_date && new Date(t.due_date) < now) {
                        const pId = t.project_id;
                        // @ts-ignore
                        const pName = t.projects?.name || "Unknown Project";
                        if (!projectOverdueMap[pId]) {
                            projectOverdueMap[pId] = { count: 0, name: pName };
                        }
                        projectOverdueMap[pId].count++;
                    }
                });

                Object.entries(projectOverdueMap).forEach(([pId, info]) => {
                    queueNotification(
                        "Tasks Overdue",
                        `You have ${info.count} overdue tasks in "${info.name}".`,
                        `/pm/projects/${pId}`,
                        "TASK_AGGREGATE"
                    );
                });

                // C. Team Level (Skipping complex for now, focus on Risks)

                // D. Risk & Issue
                // Query open blockers for these projects
                const { data: blockers } = await supabase
                    .from("blockers")
                    .select("id, title, status, created_at, project_id, projects(name)")
                    .in("project_id", finalPmProjectIds)
                    .eq("status", "Open");

                (blockers || []).forEach(b => {
                    // Notify if created recently (in check window)
                    if (b.created_at >= checkWindowStart) {
                        // @ts-ignore
                        const pName = b.projects?.name || "Unknown Project";
                        queueNotification(
                            "New Risk Reported",
                            `Risk "${b.title}" reported in "${pName}".`,
                            `/pm/risks?id=${b.id}`,
                            "RISK_ALERT"
                        );
                    }
                });
            }

        } else {
            // --- TEAM MEMBER LOGIC (Existing) ---
            // Fetch relevant projects/tasks
            const { data: memberRows } = await supabase.from("project_members").select("project_id").eq("member_id", userId);
            const projectIds = memberRows?.map(r => r.project_id) || [];

            if (projectIds.length > 0) {
                const { data: tasks } = await supabase
                    .from("tasks")
                    .select("id, title, due_date, project_id, status, created_at, projects(name)")
                    .in("project_id", projectIds)
                    .neq("status", "Done")
                    .neq("status", "Completed");

                (tasks || []).forEach(task => {
                    // @ts-ignore
                    const projectName = task.projects?.name || "Unknown";

                    // New Assignment
                    if (task.created_at && task.created_at >= checkWindowStart) {
                        queueNotification(
                            "New Task Assigned",
                            `New task "${task.title}" in "${projectName}".`,
                            `/projects/${task.project_id}?taskId=${task.id}`,
                            "NEW_ASSIGNMENT"
                        );
                    }

                    // Reminders (Personal)
                    if (task.due_date) {
                        const daysLeft = Math.ceil((new Date(task.due_date).getTime() - now.getTime()) / (86400000));
                        if (daysLeft === 0 || daysLeft === 1) {
                            queueNotification(
                                "Task Due Soon",
                                `"${task.title}" is due ${daysLeft === 0 ? "today" : "tomorrow"}.`,
                                `/projects/${task.project_id}?taskId=${task.id}`,
                                "REMINDER"
                            );
                        }
                    }
                });
            }
        }

        // Insert new notifications
        if (notificationsToInsert.length > 0) {
            await supabase.from("notifications").insert(notificationsToInsert);
        }

        // Fetch display list
        const { data: notifications, error } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(limit);

        if (error) {
            throw error;
        }

        return NextResponse.json({ data: notifications });
    } catch (error: any) {
        console.error("Notifications API Error:", error);
        return NextResponse.json({ message: "Failed to load notifications" }, { status: 500 });
    }
}
