const { Pool } = require('pg');
require('dotenv').config();

const sql = `
  -- Add stage_deadlines column to projects table
  ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS stage_deadlines JSONB DEFAULT '{}'::jsonb;
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

        console.log("Running SQL to add stage_deadlines column...");
        await client.query(sql);
        console.log("✅ Column 'stage_deadlines' added successfully to projects table.");

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
