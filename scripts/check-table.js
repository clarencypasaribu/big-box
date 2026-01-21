const { Pool } = require('pg');
require('dotenv').config();

async function checkTable() {
    const connectionString = process.env.DIRECT_DATABASE_URL;
    const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const client = await pool.connect();
        const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'blockers';
    `);

        if (res.rows.length > 0) {
            console.log("✅ Table project_stage_approvals EXISTS");
        } else {
            console.log("❌ Table project_stage_approvals DOES NOT EXIST");
        }
        client.release();
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        pool.end();
    }
}

checkTable();
