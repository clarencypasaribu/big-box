require('dotenv').config({ path: '.env' });
const { Client } = require('pg');

async function fixPermissions() {
    const directUrl = process.env.DIRECT_DATABASE_URL;

    const client = new Client({
        connectionString: directUrl,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to database!');

        // Disable RLS
        await client.query('ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;');
        console.log('✅ RLS disabled');

        // Grant all permissions
        await client.query('GRANT ALL ON public.notifications TO anon;');
        await client.query('GRANT ALL ON public.notifications TO authenticated;');
        await client.query('GRANT ALL ON public.notifications TO service_role;');
        console.log('✅ Permissions granted to all roles');

        // Check current notifications for Eliza
        const elizaId = '5ccd0018-63d6-42c9-bd33-75db2ba201ea';
        const result = await client.query(
            'SELECT id, title, message, type, created_at FROM public.notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5',
            [elizaId]
        );

        console.log('\nEliza notifications:');
        if (result.rows.length === 0) {
            console.log('No notifications yet');
        } else {
            result.rows.forEach(row => {
                console.log(`- [${row.type}] ${row.title}: ${row.message}`);
            });
        }

        await client.end();
    } catch (err) {
        console.error('Error:', err.message);
        await client.end();
    }
}

fixPermissions();
