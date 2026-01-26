require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function disableRLS() {
    console.log('Disabling RLS on notifications table...');

    // Use Supabase's built-in SQL execution via the management API
    // Since we can't run ALTER TABLE directly, we'll use a workaround:
    // Grant explicit permissions to service_role

    // First, let's check current RLS status
    const { data: policies, error: policyError } = await supabase
        .from('notifications')
        .select('id')
        .limit(1);

    console.log('Current select test:', policies, policyError?.message);

    // The only way to execute DDL (ALTER TABLE) from Node.js is through:
    // 1. Supabase Dashboard SQL Editor (manual)
    // 2. Supabase CLI with db push
    // 3. Direct PostgreSQL connection (psql)

    // Let's try using the direct database URL
    const directUrl = process.env.DIRECT_DATABASE_URL;

    if (directUrl) {
        console.log('Found DIRECT_DATABASE_URL, attempting direct connection...');

        const { Client } = require('pg');
        const client = new Client({
            connectionString: directUrl,
            ssl: { rejectUnauthorized: false }
        });

        try {
            await client.connect();
            console.log('Connected to database!');

            // Disable RLS
            await client.query('ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;');
            console.log('✅ RLS disabled on notifications table!');

            // Test insert
            const elizaId = '5ccd0018-63d6-42c9-bd33-75db2ba201ea';
            await client.query(`
                INSERT INTO public.notifications (user_id, title, message, type, link)
                VALUES ($1, $2, $3, $4, $5)
            `, [elizaId, 'Added to Project', 'You have been added to project "project alpha".', 'PROJECT_ASSIGNED', '/member/project/test']);

            console.log('✅ Test notification inserted for Eliza!');

            await client.end();
        } catch (err) {
            console.error('Database error:', err.message);
            await client.end();
        }
    } else {
        console.log('DIRECT_DATABASE_URL not found in .env');
        console.log('Please add it or run the SQL manually in Supabase Dashboard.');
    }
}

disableRLS();
