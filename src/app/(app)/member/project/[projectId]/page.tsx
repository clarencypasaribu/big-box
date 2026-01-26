import { MemberSidebar } from "@/components/member-sidebar";
import { getCurrentUserProfile } from "@/utils/current-user";
import { ProjectBoardClient } from "@/app/(app)/member/project/[projectId]/project-board-client";
import { getMemberProjects } from "@/utils/member-projects";
import { createSupabaseServerClient } from "@/utils/supabase-server";

export const dynamic = "force-dynamic";

interface ProjectPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function MemberProjectPage({ params }: ProjectPageProps) {
  const { projectId } = await params;
  const profile = await getCurrentUserProfile();
  const memberProjects = await getMemberProjects(profile.id);
  const requestedId = projectId;
  let project =
    memberProjects.find((item) => item.id === requestedId) ?? null;

  if (!project && requestedId) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data } = await supabase
        .from("projects")
        .select("id,name")
        .eq("id", requestedId)
        .maybeSingle();
      if (data?.id) {
        project = { id: data.id, name: data.name ?? "Untitled Project", color: "green" };
      } else {
        project = { id: requestedId, name: "Untitled Project", color: "green" };
      }
    } catch {
      project = { id: requestedId, name: "Untitled Project", color: "green" };
    }
  }

  if (!project && memberProjects.length > 0) {
    project = memberProjects[0];
  }

  return (
    <div className="h-full">
      {project ? (
        <ProjectBoardClient
          key={project.id}
          projectName={project.name}
          projectId={project.id}
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          No assigned projects yet. Ask your PM to add you to a project.
        </div>
      )}
    </div>
  );
}
