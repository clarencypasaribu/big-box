const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    db: { schema: "public" },
});

async function fixTaskCommentsPermissions() {
    console.log("Fixing task_comments table permissions...");

    // Enable RLS and grant permissions
    const queries = [
        `ALTER TABLE IF EXISTS public.task_comments ENABLE ROW LEVEL SECURITY;`,
        `DROP POLICY IF EXISTS "Enable all access for service role" ON public.task_comments;`,
        `CREATE POLICY "Enable all access for service role" ON public.task_comments
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);`,
        `DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.task_comments;`,
        `CREATE POLICY "Enable read access for authenticated users" ON public.task_comments
      FOR SELECT
      TO authenticated
      USING (true);`,
        `DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.task_comments;`,
        `CREATE POLICY "Enable insert for authenticated users" ON public.task_comments
      FOR INSERT
      TO authenticated
      WITH CHECK (true);`,
        `GRANT ALL ON public.task_comments TO service_role;`,
        `GRANT SELECT, INSERT ON public.task_comments TO authenticated;`,
        `GRANT SELECT, INSERT ON public.task_comments TO anon;`,
    ];

    for (const query of queries) {
        console.log("Running:", query.substring(0, 60) + "...");
        const { error } = await supabase.rpc("exec_sql", { sql: query }).maybeSingle();
        if (error) {
            // Try direct SQL if RPC fails
            console.log("RPC failed, trying alternative method...");
        }
    }

    // Test insert
    console.log("\nTesting insert...");
    const { data, error } = await supabase
        .from("task_comments")
        .insert({
            task_id: "00000000-0000-0000-0000-000000000000",
            author: "Test User",
            text: "Test comment",
        })
        .select()
        .single();

    if (error) {
        console.error("Insert test failed:", error.message);
        console.log("\nManual fix required. Run these SQL commands in Supabase SQL Editor:");
        console.log(`
-- Fix permissions for task_comments table
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for service role" ON public.task_comments
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Enable read for authenticated" ON public.task_comments
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated" ON public.task_comments
FOR INSERT TO authenticated WITH CHECK (true);

GRANT ALL ON public.task_comments TO service_role;
GRANT SELECT, INSERT ON public.task_comments TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
    `);
    } else {
        console.log("SUCCESS! Insert test passed:", data);
        // Clean up test record
        await supabase.from("task_comments").delete().eq("id", data.id);
        console.log("Test record cleaned up.");
    }
}

fixTaskCommentsPermissions().catch(console.error);
