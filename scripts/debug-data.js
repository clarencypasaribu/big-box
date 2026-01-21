const { Pool } = require('pg');
require('dotenv').config();

async function checkData() {
    const connectionString = process.env.DIRECT_DATABASE_URL;
    const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const client = await pool.connect();

        console.log("Checking Projects and Owners...");
        const projects = await client.query(`
            SELECT id, name, owner_id FROM projects
        `);
        console.table(projects.rows);

        console.log("\nChecking Tasks...");
        const tasks = await client.query(`
            SELECT id, title, project_id FROM tasks LIMIT 5
        `);
        console.table(tasks.rows);

        client.release();
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        pool.end();
    }
}

checkData();
