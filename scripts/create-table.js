const { Pool } = require('pg');
require('dotenv').config();

async function createTable() {
    const connectionString = process.env.DIRECT_DATABASE_URL;
    const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    const sql = `
    CREATE TABLE IF NOT EXISTS public.project_stage_approvals (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      project_id UUID NOT NULL,
      stage_id TEXT NOT NULL,
      status TEXT DEFAULT 'Pending' NOT NULL,
      requested_by UUID,
      approved_by UUID,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      approved_at TIMESTAMPTZ,
      CONSTRAINT project_stage_approvals_project_id_stage_id_key UNIQUE (project_id, stage_id)
    );
    
    -- Enable RLS
    ALTER TABLE public.project_stage_approvals ENABLE ROW LEVEL SECURITY;
  `;

    try {
        const client = await pool.connect();
        console.log("Creating table...");
        await client.query(sql);
        console.log("✅ Table project_stage_approvals created successfully");

        // Reload cache explicitly
        await client.query("NOTIFY pgrst, 'reload config'");
        console.log("✅ Schema cache reloaded");

        client.release();
    } catch (err) {
        console.error("Error creating table:", err.message);
    } finally {
        pool.end();
    }
}

createTable();
