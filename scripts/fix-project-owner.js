const { Pool } = require('pg');
require('dotenv').config();

async function fixData() {
    const connectionString = process.env.DIRECT_DATABASE_URL;
    const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const client = await pool.connect();

        console.log("Fetching profiles...");
        const profiles = await client.query(`SELECT id, email FROM profiles LIMIT 1`);

        if (profiles.rows.length === 0) {
            console.log("No profiles found. Cannot assign owner.");
            return;
        }

        const ownerId = profiles.rows[0].id;
        console.log(`Assigning owner ${ownerId} (${profiles.rows[0].email}) to all projects...`);

        await client.query(`
            UPDATE projects SET owner_id = $1 WHERE owner_id IS NULL
        `, [ownerId]);

        console.log("✅ Projects updated with owner_id.");

        client.release();
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        pool.end();
    }
}

fixData();
