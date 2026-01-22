const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    db: { schema: "public" },
});

async function fixPermissions() {
    console.log("🔧 Fixing task_comments table permissions...\n");

    // SQL commands to fix permissions
    const sqlCommands = `
    -- Enable RLS
    ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Enable all for service role" ON public.task_comments;
    DROP POLICY IF EXISTS "Enable read for authenticated" ON public.task_comments;
    DROP POLICY IF EXISTS "Enable insert for authenticated" ON public.task_comments;

    -- Create policies
    CREATE POLICY "Enable all for service role" ON public.task_comments
    FOR ALL TO service_role USING (true) WITH CHECK (true);

    CREATE POLICY "Enable read for authenticated" ON public.task_comments
    FOR SELECT TO authenticated USING (true);

    CREATE POLICY "Enable insert for authenticated" ON public.task_comments
    FOR INSERT TO authenticated WITH CHECK (true);

    -- Grant permissions
    GRANT ALL ON public.task_comments TO service_role;
    GRANT SELECT, INSERT ON public.task_comments TO authenticated;
    GRANT SELECT, INSERT ON public.task_comments TO anon;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
  `;

    try {
        // Execute SQL using Supabase client
        const { data, error } = await supabase.rpc('exec_sql', { sql: sqlCommands });

        if (error) {
            console.log("⚠️  RPC method not available, manually execute SQL:\n");
            console.log("Go to Supabase Dashboard → SQL Editor and run:");
            console.log("=".repeat(60));
            console.log(sqlCommands);
            console.log("=".repeat(60));
            return false;
        }

        console.log("✅ Permissions fixed via RPC!");
        return true;
    } catch (err) {
        console.log("⚠️  Could not execute automatically. Please run manually:\n");
        console.log("Go to Supabase Dashboard → SQL Editor and run:");
        console.log("=".repeat(60));
        console.log(sqlCommands);
        console.log("=".repeat(60));
        return false;
    }
}

async function testInsert() {
    console.log("\n🧪 Testing comment insert...");

    const testTaskId = "00000000-0000-0000-0000-000000000000";
    const { data, error } = await supabase
        .from("task_comments")
        .insert({
            task_id: testTaskId,
            author: "Test User",
            text: "Test comment from script",
        })
        .select()
        .single();

    if (error) {
        console.error("❌ Insert test failed:", error.message);
        console.log("\n📝 You MUST run the SQL commands manually in Supabase Dashboard");
        return false;
    }

    console.log("✅ Insert test PASSED!");

    // Clean up test record
    await supabase.from("task_comments").delete().eq("id", data.id);
    console.log("🧹 Test record cleaned up");

    return true;
}

async function main() {
    const fixed = await fixPermissions();
    const testPassed = await testInsert();

    if (testPassed) {
        console.log("\n🎉 SUCCESS! Comments should work now!");
    } else {
        console.log("\n⚠️  MANUAL ACTION REQUIRED - See SQL above");
    }
}

main().catch(console.error);
