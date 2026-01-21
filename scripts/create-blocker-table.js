const { Pool } = require('pg');
require('dotenv').config();

const sql = `
    CREATE TABLE IF NOT EXISTS public.blockers (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      task_id UUID NOT NULL,
      task_title TEXT,
      project_id UUID NOT NULL,
      project_name TEXT,
      title TEXT,
      product TEXT,
      reason TEXT,
      notes TEXT,
      reporter_id UUID NOT NULL,
      reporter_name TEXT,
      pm_id UUID NOT NULL,
      status TEXT DEFAULT 'Open' NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );
    
    -- Enable RLS
    ALTER TABLE public.blockers ENABLE ROW LEVEL SECURITY;

    -- Policies
    DROP POLICY IF EXISTS "Anyone can select blockers" ON public.blockers;
    DROP POLICY IF EXISTS "Authenticated can insert blockers" ON public.blockers;
    DROP POLICY IF EXISTS "PM/Reporter can update blockers" ON public.blockers;
    DROP POLICY IF EXISTS "Service role full access blockers" ON public.blockers;

    CREATE POLICY "Anyone can select blockers" ON public.blockers FOR SELECT USING (true);
    CREATE POLICY "Authenticated can insert blockers" ON public.blockers FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    CREATE POLICY "PM/Reporter can update blockers" ON public.blockers FOR UPDATE USING (auth.jwt() ->> 'role' = 'service_role' OR auth.uid() = reporter_id OR auth.uid() = pm_id);
    CREATE POLICY "Service role full access blockers" ON public.blockers FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
  `;

async function run() {
    const connectionString = process.env.DIRECT_DATABASE_URL;
    const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const client = await pool.connect();

        console.log("Running SQL...");
        await client.query(sql);
        console.log("✅ Table 'blockers' created successfully with RLS policies.");

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
