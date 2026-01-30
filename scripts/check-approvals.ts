
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

    // Fetch projects to map IDs to Names
    const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select("id, name");

    if (projectsError) {
        console.error("Error fetching projects:", projectsError);
        return;
    }

    const projectMap = Object.fromEntries(
        projects?.map(p => [p.id, p.name]) || []
    );

    const { data, error } = await supabase
        .from("project_stage_approvals")
        .select("*");

    if (error) {
        console.error("Error fetching approvals:", error);
        return;
    }

    console.log("Found approvals:", data?.length);
    data?.forEach(row => {
        const projectName = projectMap[row.project_id] || row.project_id;
        console.log(`Project: "${projectName}" (${row.project_id})`);
        console.log(`  Stage: ${row.stage_id}`);
        console.log(`  Status: ${row.status}`);
        console.log(`  Comment: "${row.comment}"`);
        console.log("---");
    });
}

main().catch(console.error);
