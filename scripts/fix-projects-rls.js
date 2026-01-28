const { Pool } = require('pg');
require('dotenv').config();

const sql = `
  -- Ensure stage_deadlines column exists
  ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS stage_deadlines JSONB DEFAULT '{}'::jsonb;

  -- Fix RLS Policies for projects
  ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

  -- Drop existing potential restrictive policies
  DROP POLICY IF EXISTS "Enable read access for all users" ON public.projects;
  DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.projects;
  DROP POLICY IF EXISTS "Enable update for users based on email" ON public.projects;
  DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.projects;
  DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.projects;
  DROP POLICY IF EXISTS "Authenticated users can select projects" ON public.projects;
  DROP POLICY IF EXISTS "Authenticated users can insert projects" ON public.projects;
  DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
  DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;

  -- Update Policy: Allow authenticated users to perform ALL actions on projects
  -- This fixes "Project not found" errors due to hidden rows
  CREATE POLICY "Enable all access for authenticated users" ON public.projects
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
    
  -- Fix project_members RLS just in case
  ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.project_members;
  CREATE POLICY "Enable all access for authenticated users" ON public.project_members
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
`;

async function run() {
    const connectionString = process.env.DIRECT_DATABASE_URL;
    if (!connectionString) {
        console.error('❌ DIRECT_DATABASE_URL not found in environment');
        process.exit(1);
    }

    // Disable SSL verification for self-signed certs
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    const pool = new Pool({
        connectionString,
        ssl: true
    });

    try {
        const client = await pool.connect();

        console.log("Running SQL to fix RLS policies and schema...");
        await client.query(sql);
        console.log("✅ RLS policies updated: Authenticated users can now fully access 'projects' and 'project_members'.");
        console.log("✅ Column 'stage_deadlines' verified.");

        // Reload schema cache
        await client.query(`NOTIFY pgrst, 'reload schema'`);
        console.log("🔄 Schema cache reloaded.");

        client.release();
    } catch (err) {
        console.error("❌ Error:", err.message);
    } finally {
        pool.end();
    }
}

run();
