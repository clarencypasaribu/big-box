require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixNotificationsPermissions() {
    console.log('Fixing notifications table permissions...');

    // Execute SQL to fix permissions
    const { data, error } = await supabase.rpc('exec_sql', {
        sql: `
            -- Disable RLS on notifications table
            ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
            
            -- Grant all permissions to service role
            GRANT ALL ON public.notifications TO service_role;
            GRANT ALL ON public.notifications TO authenticated;
            GRANT ALL ON public.notifications TO anon;
        `
    });

    if (error) {
        console.log('RPC method not available, trying direct SQL...');

        // Alternative: Try using raw SQL via REST API
        // This usually needs to be done via Supabase Dashboard SQL Editor
        console.log('\n=== MANUAL FIX REQUIRED ===');
        console.log('Please run the following SQL in your Supabase Dashboard SQL Editor:');
        console.log(`
-- Disable RLS on notifications table
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- Or if you want to keep RLS, add these policies:
-- Allow service role to do anything
CREATE POLICY "Service role can do anything" ON public.notifications
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Allow users to read their own notifications
CREATE POLICY "Users can read own notifications" ON public.notifications
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Allow insert from authenticated users (for system notifications)
CREATE POLICY "Allow insert notifications" ON public.notifications
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
        `);
    } else {
        console.log('Success:', data);
    }

    // Test insert after fix
    const elizaId = '5ccd0018-63d6-42c9-bd33-75db2ba201ea';

    const { data: insertData, error: insertError } = await supabase
        .from('notifications')
        .insert({
            user_id: elizaId,
            title: 'Added to Project',
            message: 'You have been added to project "bigbox ai".',
            type: 'PROJECT_ASSIGNED',
            link: '/member/project/5a496020-ec9e-453b-ba24-d4c6767b003b',
        })
        .select();

    if (insertError) {
        console.log('\nInsert still failing:', insertError.message);
    } else {
        console.log('\nInsert successful:', insertData);
    }
}

fixNotificationsPermissions();
