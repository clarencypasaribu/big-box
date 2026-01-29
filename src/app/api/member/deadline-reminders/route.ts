import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/utils/supabase-service";
import { getCurrentUserProfile } from "@/utils/current-user";

type DeadlineReminder = {
    id: string;
    type: "project" | "stage";
    title: string;
    projectName: string;
    deadline: string;
    daysLeft: number;
    isOverdue: boolean;
    urgency: "overdue" | "urgent" | "warning" | "normal";
};

export async function GET() {
    try {
        const profile = await getCurrentUserProfile();
        if (!profile?.id) {
            return NextResponse.json({ data: [] });
        }

        const supabase = await createSupabaseServiceClient();

        // Get projects where user is a team member
        const { data: memberRows } = await supabase
            .from("project_members")
            .select("project_id")
            .eq("profile_id", profile.id);

        const projectIds = (memberRows ?? []).map((r) => r.project_id);

        if (projectIds.length === 0) {
            return NextResponse.json({ data: [] });
        }

        // Get project details with deadlines
        const { data: projects } = await supabase
            .from("projects")
            .select("id, name, end_date, stage_deadlines, status")
            .in("id", projectIds)
            .neq("status", "Completed");

        const reminders: DeadlineReminder[] = [];
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const stageLabels: Record<string, string> = {
            "stage-1": "Initiation",
            "stage-2": "Planning",
            "stage-3": "Execution",
            "stage-4": "Monitoring & Control",
            "stage-5": "Closure",
        };

        (projects ?? []).forEach((project) => {
            // Check project deadline
            if (project.end_date) {
                const deadline = new Date(project.end_date);
                deadline.setHours(0, 0, 0, 0);
                const diffTime = deadline.getTime() - now.getTime();
                const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                let urgency: DeadlineReminder["urgency"] = "normal";
                if (daysLeft < 0) urgency = "overdue";
                else if (daysLeft <= 1) urgency = "urgent";
                else if (daysLeft <= 3) urgency = "warning";

                if (daysLeft <= 7) {
                    reminders.push({
                        id: `project-${project.id}`,
                        type: "project",
                        title: `Project Deadline`,
                        projectName: project.name,
                        deadline: project.end_date,
                        daysLeft,
                        isOverdue: daysLeft < 0,
                        urgency,
                    });
                }
            }

            // Check stage deadlines
            const stageDeadlines = project.stage_deadlines as Record<string, string> | null;
            if (stageDeadlines) {
                Object.entries(stageDeadlines).forEach(([stageId, deadlineStr]) => {
                    if (!deadlineStr) return;

                    const deadline = new Date(deadlineStr);
                    deadline.setHours(0, 0, 0, 0);
                    const diffTime = deadline.getTime() - now.getTime();
                    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    let urgency: DeadlineReminder["urgency"] = "normal";
                    if (daysLeft < 0) urgency = "overdue";
                    else if (daysLeft <= 1) urgency = "urgent";
                    else if (daysLeft <= 3) urgency = "warning";

                    if (daysLeft <= 7) {
                        reminders.push({
                            id: `stage-${project.id}-${stageId}`,
                            type: "stage",
                            title: `${stageLabels[stageId] ?? stageId} Deadline`,
                            projectName: project.name,
                            deadline: deadlineStr,
                            daysLeft,
                            isOverdue: daysLeft < 0,
                            urgency,
                        });
                    }
                });
            }
        });

        // Sort by urgency (overdue first, then by days left)
        reminders.sort((a, b) => {
            if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
            return a.daysLeft - b.daysLeft;
        });

        return NextResponse.json({ data: reminders });
    } catch (error) {
        console.error("Deadline reminders error:", error);
        return NextResponse.json({ data: [] });
    }
}
