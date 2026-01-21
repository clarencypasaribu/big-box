// Script to fix permissions via direct PostgreSQL connection
const { Pool } = require('pg');
require('dotenv').config();

const sql = `
-- Grant usage on public schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant permissions on all tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- Enable RLS on tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_stage_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload config';
`;

const policies = [
    // Profiles
    `DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles`,
    `DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles`,
    `DROP POLICY IF EXISTS "Service role full access profiles" ON public.profiles`,
    `DROP POLICY IF EXISTS "Allow insert for authenticated" ON public.profiles`,
    `CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id)`,
    `CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id)`,
    `CREATE POLICY "Allow insert for authenticated" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id)`,
    `CREATE POLICY "Service role full access profiles" ON public.profiles FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')`,

    // Projects
    `DROP POLICY IF EXISTS "Anyone can view projects" ON public.projects`,
    `DROP POLICY IF EXISTS "Service role full access projects" ON public.projects`,
    `CREATE POLICY "Anyone can view projects" ON public.projects FOR SELECT USING (true)`,
    `CREATE POLICY "Service role full access projects" ON public.projects FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')`,

    // Tasks
    `DROP POLICY IF EXISTS "Anyone can view tasks" ON public.tasks`,
    `DROP POLICY IF EXISTS "Service role full access tasks" ON public.tasks`,
    `CREATE POLICY "Anyone can view tasks" ON public.tasks FOR SELECT USING (true)`,
    `CREATE POLICY "Service role full access tasks" ON public.tasks FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')`,

    // Blockers
    `DROP POLICY IF EXISTS "Users can view their blockers" ON public.blockers`,
    `DROP POLICY IF EXISTS "Users can insert blockers" ON public.blockers`,
    `DROP POLICY IF EXISTS "Service role full access blockers" ON public.blockers`,
    `CREATE POLICY "Users can view their blockers" ON public.blockers FOR SELECT USING (reporter_id = auth.uid() OR pm_id = auth.uid())`,
    `CREATE POLICY "Users can insert blockers" ON public.blockers FOR INSERT WITH CHECK (reporter_id = auth.uid())`,
    `CREATE POLICY "Service role full access blockers" ON public.blockers FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')`,

    // Project Members
    `DROP POLICY IF EXISTS "Anyone can view project members" ON public.project_members`,
    `DROP POLICY IF EXISTS "Service role full access project_members" ON public.project_members`,
    `CREATE POLICY "Anyone can view project members" ON public.project_members FOR SELECT USING (true)`,
    `CREATE POLICY "Service role full access project_members" ON public.project_members FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')`,

    // Project Stage Approvals
    `DROP POLICY IF EXISTS "Anyone can select approvals" ON public.project_stage_approvals`,
    `DROP POLICY IF EXISTS "Authenticated can insert approvals" ON public.project_stage_approvals`,
    `DROP POLICY IF EXISTS "PM can update approvals" ON public.project_stage_approvals`,
    `DROP POLICY IF EXISTS "Service role full access approvals" ON public.project_stage_approvals`,

    `CREATE POLICY "Anyone can select approvals" ON public.project_stage_approvals FOR SELECT USING (true)`,
    `CREATE POLICY "Authenticated can insert approvals" ON public.project_stage_approvals FOR INSERT WITH CHECK (auth.role() = 'authenticated')`,
    `CREATE POLICY "PM can update approvals" ON public.project_stage_approvals FOR UPDATE USING (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'project_manager')`,
    `CREATE POLICY "Service role full access approvals" ON public.project_stage_approvals FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')`,

    // Files
    `DROP POLICY IF EXISTS "Authenticated can view files" ON public.files`,
    `DROP POLICY IF EXISTS "Authenticated can insert files" ON public.files`,
    `DROP POLICY IF EXISTS "Service role full access files" ON public.files`,

    `CREATE POLICY "Authenticated can view files" ON public.files FOR SELECT USING (auth.role() = 'authenticated')`,
    `CREATE POLICY "Authenticated can insert files" ON public.files FOR INSERT WITH CHECK (auth.role() = 'authenticated')`,
    `CREATE POLICY "Service role full access files" ON public.files FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')`,

    // Task Deliverables
    `DROP POLICY IF EXISTS "Authenticated can view deliverables" ON public.task_deliverables`,
    `DROP POLICY IF EXISTS "Authenticated can insert deliverables" ON public.task_deliverables`,
    `DROP POLICY IF EXISTS "Service role full access deliverables" ON public.task_deliverables`,

    `CREATE POLICY "Authenticated can view deliverables" ON public.task_deliverables FOR SELECT USING (auth.role() = 'authenticated')`,
    `CREATE POLICY "Authenticated can insert deliverables" ON public.task_deliverables FOR INSERT WITH CHECK (auth.role() = 'authenticated')`,
    `CREATE POLICY "Service role full access deliverables" ON public.task_deliverables FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')`
];

async function fixPermissions() {
    const connectionString = process.env.DIRECT_DATABASE_URL;

    const pool = new Pool({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('Connecting to database...');
        const client = await pool.connect();

        console.log('Running grants...');
        await client.query(sql);
        console.log('✅ Grants applied');

        console.log('Creating policies...');
        for (const policy of policies) {
            try {
                await client.query(policy);
                console.log('  ✓', policy.substring(0, 60) + '...');
            } catch (err) {
                console.log('  ⚠', err.message.substring(0, 60));
            }
        }

        console.log('\\n✅ Permissions fixed!');
        client.release();
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await pool.end();
    }
}

fixPermissions();
