import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/utils/supabase-service";
import { getMemberProjects } from "@/utils/member-projects";
import { getCurrentUserProfile } from "@/utils/current-user";

export async function GET() {
    try {
        const profile = await getCurrentUserProfile();
        if (!profile?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const memberProjects = await getMemberProjects(profile.id);
        const projectIds = memberProjects.map(p => p.id);

        if (projectIds.length === 0) {
            return NextResponse.json({ data: [] });
        }

        const supabase = await createSupabaseServiceClient();

        // Get all tasks from member's projects
        const { data: tasks } = await supabase
            .from("tasks")
            .select("id, project_id")
            .in("project_id", projectIds);

        const taskIds = tasks?.map(t => t.id) || [];
        const taskToProjectMap = new Map(tasks?.map(t => [t.id, t.project_id]) || []);

        // Get all task_deliverables from those tasks
        const { data: deliverables } = await supabase
            .from("task_deliverables")
            .select("id, task_id")
            .in("task_id", taskIds);

        const deliverableIds = deliverables?.map(d => d.id) || [];
        const deliverableToTaskMap = new Map(deliverables?.map(d => [d.id, d.task_id]) || []);

        // Build entity filter - get files from tasks, task_deliverables, and projects
        const allEntityIds = [...projectIds, ...taskIds, ...deliverableIds];

        if (allEntityIds.length === 0) {
            return NextResponse.json({ data: [] });
        }

        const { data: files, error } = await supabase
            .from("files")
            .select("id, name, type, size, entity_id, entity_type, created_at")
            .in("entity_id", allEntityIds)
            .order("created_at", { ascending: false })
            .limit(50);

        if (error) {
            return NextResponse.json({ message: error.message }, { status: 400 });
        }

        // Add project name to each file for context
        const filesWithProjectName = files?.map(f => {
            let projectId: string | undefined;

            if (f.entity_type === "project") {
                projectId = f.entity_id;
            } else if (f.entity_type === "task") {
                projectId = taskToProjectMap.get(f.entity_id);
            } else if (f.entity_type === "task_deliverable") {
                const taskId = deliverableToTaskMap.get(f.entity_id);
                if (taskId) {
                    projectId = taskToProjectMap.get(taskId);
                }
            }

            const project = memberProjects.find(p => p.id === projectId);
            return {
                ...f,
                projectName: project?.name || "Unknown Project"
            };
        });

        return NextResponse.json({ data: filesWithProjectName ?? [] });
    } catch (error: any) {
        return NextResponse.json({ message: error.message || "msg_failed_load_docs" }, { status: 500 });
    }
}
