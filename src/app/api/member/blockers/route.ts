import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase-server";

export async function GET() {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { data: blockers, error } = await supabase
            .from("blockers")
            .select("*")
            .eq("assignee_id", user.id)
            .eq("assignee_id", user.id)
            .in("status", ["Open", "Assigned", "Investigating"])
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching blockers:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data: blockers });
    } catch (error) {
        console.error("Unexpected error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
