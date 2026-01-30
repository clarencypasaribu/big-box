
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

    console.log("Checking notifications for Project Mega...");

    // Project Mega ID
    const projectId = "b9f547e5-e618-4738-bfed-e944f48e1880";

    const { data: notifications, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("type", "STAGE_REJECTED")
        .order("created_at", { ascending: false })
        .limit(20);

    if (error) {
        console.error("Error fetching notifications:", error);
        return;
    }

    notifications?.forEach(n => {
        // Check if notification relates to Project Mega
        if (n.link && n.link.includes(projectId)) {
            console.log("Found Project Mega notification:");
            console.log(`  ID: ${n.id}`);
            console.log(`  Message: "${n.message}"`);
            console.log(`  Created: ${n.created_at}`);

            // Extract reason
            const match = n.message.match(/Reason: "(.*)"/);
            if (match) {
                console.log(`  EXTRACTED REASON: "${match[1]}"`);
            }
        }
    });
}

main().catch(console.error);
