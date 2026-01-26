require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
    // Get project 'bigbox ai'
    const { data: project, error: projErr } = await supabase
        .from('projects')
        .select('*')
        .ilike('name', '%bigbox%')
        .maybeSingle();

    console.log('Project:', JSON.stringify(project, null, 2));
    if (projErr) console.log('Project Error:', projErr.message);

    // Get project members
    if (project) {
        const { data: members } = await supabase
            .from('project_members')
            .select('*')
            .eq('project_id', project.id);
        console.log('Project Members:', JSON.stringify(members, null, 2));
    }

    // Get Eliza's profile
    const { data: eliza } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .ilike('full_name', '%eliza%')
        .maybeSingle();
    console.log('Eliza Profile:', JSON.stringify(eliza, null, 2));

    // Get Eliza's notifications
    if (eliza) {
        const { data: notifs } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', eliza.id)
            .order('created_at', { ascending: false })
            .limit(10);
        console.log('Eliza Notifications:', JSON.stringify(notifs, null, 2));
    }
}

check();
