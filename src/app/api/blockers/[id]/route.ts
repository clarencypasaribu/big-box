
import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/utils/supabase-service";
import { createSupabaseServerClient } from "@/utils/supabase-server";

async function getUserId(request: Request) {
    try {
        const header = request.headers.get("authorization");
        if (header) {
            const token = header.split(" ")[1];
            const supabaseAdmin = await createSupabaseServiceClient({ allowWrite: true });
            const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
            if (!error && user) return user.id;
        }

        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();
        return user?.id ?? null;
    } catch {
        return null;
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const userId = await getUserId(request);

        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const supabase = await createSupabaseServiceClient({ allowWrite: true });

        // Get existing blocker
        const { data: blocker, error: fetchError } = await supabase
            .from("blockers")
            .select("*")
            .eq("id", id)
            .single();

        if (fetchError || !blocker) {
            return NextResponse.json({ message: "Blocker not found" }, { status: 404 });
        }

        // Prepare updates
        const updates: any = { updated_at: new Date().toISOString() };
        let notificationPromise = null;

        // Handle assignment
        if (body.assigneeId !== undefined) {
            // Fetch assignee profile if assigning
            if (body.assigneeId) {
                const { data: assignee } = await supabase
                    .from("profiles")
                    .select("full_name, email")
                    .eq("id", body.assigneeId)
                    .single();

                const assigneeName = assignee?.full_name || assignee?.email?.split('@')[0] || "User";
                updates.assignee_id = body.assigneeId;
                updates.assignee_name = assigneeName;
                updates.status = "Assigned"; // Auto update status?

                // Add notes if provided (Assignment instructions)
                if (body.notes) {
                    updates.notes = body.notes;
                }

                // Notify Assignee
                notificationPromise = supabase.from("notifications").insert({
                    user_id: body.assigneeId,
                    title: "Blocker Assigned",
                    message: `You have been assigned to blocker "${blocker.title || blocker.reason}" in project "${blocker.project_name}". ${body.notes ? `Note: ${body.notes}` : ""}`,
                    type: "BLOCKER_ASSIGNED",
                    link: `/projects/${blocker.project_id}?blockerId=${id}`,
                });
            } else {
                updates.assignee_id = null;
                updates.assignee_name = null;
                updates.status = "Open";
            }
        }

        // Handle Status Change (Resolve/Close)
        if (body.status) {
            updates.status = body.status;
            // Notify Reporter if resolved
            if (body.status === "Resolved" || body.status === "Closed") {
                // Notify reporter
                if (blocker.reporter_id !== userId) { // Don't notify self
                    await supabase.from("notifications").insert({
                        user_id: blocker.reporter_id,
                        title: "Blocker Resolved",
                        message: `Your blocker "${blocker.title || blocker.reason}" has been marked as ${body.status}.`,
                        type: "BLOCKER_RESOLVED",
                        link: `/projects/${blocker.project_id}?blockerId=${id}`,
                    });
                }
            }
        }

        const { data: updatedBlocker, error: updateError } = await supabase
            .from("blockers")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (updateError) {
            return NextResponse.json({ message: updateError.message }, { status: 400 });
        }

        if (notificationPromise) await notificationPromise;

        return NextResponse.json({ data: updatedBlocker });

    } catch (error: any) {
        return NextResponse.json({ message: error.message || "Failed to update blocker" }, { status: 500 });
    }
}
