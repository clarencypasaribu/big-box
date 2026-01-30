
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { createClient } from "@supabase/supabase-js";

async function main() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        console.error("Missing Supabase URL or Key");
        return;
    }

    const supabase = createClient(url, key);

    const projectId = "b9f547e5-e618-4738-bfed-e944f48e1880";
    const stageId = "stage-1";

    const realReason = "jshbsjbjudsnsdjnisddwbndiuhswdiububdsuidewiguwedihwediuewduuichuewcfhuewfhuheuvwoifhueniuehcuefwububecuiifebfbwcubcfbucuk";

    console.log("Restoring comment for Project Mega", projectId, stageId);

    const payload = {
        project_id: projectId,
        stage_id: stageId,
        status: "Rejected",
        comment: realReason,
        // We might need to preserve other fields if we knew them, but upsert should handle it if we only update what we know?
        // No, upsert replaces if we don't be careful. 
        // But we are selecting existing in the route. Here we just want to update the comment.
        // Ideally we should use update matching the ID, but we only have project/stage.
    };

    const { data, error } = await supabase
        .from("project_stage_approvals")
        .update({ comment: realReason })
        .eq("project_id", projectId)
        .eq("stage_id", stageId)
        .select();

    if (error) {
        console.error("Update failed:", error);
        return;
    }

    console.log("Update success! Restored real note.", data);
}

main().catch(console.error);
