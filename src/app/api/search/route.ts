import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from "@/utils/supabase-server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');

        if (!query || query.length < 2) {
            return NextResponse.json({ results: [] });
        }

        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // 1. Get projects the user is a member of OR owner of
        const { data: memberProjects } = await supabase
            .from('project_members')
            .select('project_id')
            .eq('member_id', user.id);

        const { data: ownedProjects } = await supabase
            .from('projects')
            .select('id')
            .eq('owner_id', user.id);

        const projectIds = Array.from(new Set([
            ...(memberProjects?.map((mp: any) => mp.project_id) || []),
            ...(ownedProjects?.map((p: any) => p.id) || [])
        ]));

        if (projectIds.length === 0) {
            return NextResponse.json({ results: [] });
        }

        // 2. Search Projects
        const { data: projects } = await supabase
            .from('projects')
            .select('id, name, description')
            .in('id', projectIds)
            .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
            .limit(5);

        // 3. Search Tasks
        const { data: tasks } = await supabase
            .from('tasks')
            .select('id, title, description, project_id, projects(name)')
            .in('project_id', projectIds)
            .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
            .limit(5);

        // 4. Transform and Combine
        const formattedProjects = projects?.map((p: any) => ({
            type: 'project',
            id: p.id,
            title: p.name,
            subtitle: p.description || 'Project',
            url: `/member/projects/${p.id}`
        })) || [];

        const formattedTasks = tasks?.map((t: any) => ({
            type: 'task',
            id: t.id,
            title: t.title,
            subtitle: `${t.projects?.name} • Task`,
            url: `/member/projects/${t.project_id}?taskId=${t.id}`
        })) || [];

        return NextResponse.json({
            results: [...formattedProjects, ...formattedTasks]
        });

    } catch (error) {
        console.error('Search API Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
