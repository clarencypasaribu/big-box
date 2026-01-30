
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

    const projectId = "acb7a735-be4c-4440-9d6a-17530041cb50";
    const stageId = "stage-2";

    // The recovered reason from notification logs
    const realReason = "anasicnf sjcfnacvnsd dbjisbdnvibsd sdbcfhjdvnsdiv bduihivsd hudghvisw dhuvshbi dhuvsdvi duvhbcisedwc eiuhvwsihnwf ewgbvuiwjb";

    console.log("Restoring comment for", projectId, stageId);

    const payload = {
        project_id: projectId,
        stage_id: stageId,
        status: "Rejected",
        comment: realReason,
    };

    const { data, error } = await supabase
        .from("project_stage_approvals")
        .upsert(payload, { onConflict: "project_id,stage_id" })
        .select();

    if (error) {
        console.error("Upsert failed:", error);
        return;
    }

    console.log("Upsert success! Restored real note.");
}

main().catch(console.error);
