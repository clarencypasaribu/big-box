import { MemberSidebar } from "@/components/member-sidebar";
import { getCurrentUserProfile } from "@/utils/current-user";
import { ProjectBoardClient } from "./project-board-client";
import { getMemberProjects } from "@/utils/member-projects";

interface ProjectPageProps {
  params: { projectId: string };
}

export default async function MemberProjectPage({ params }: ProjectPageProps) {
  const profile = await getCurrentUserProfile();
  const memberProjects = await getMemberProjects(profile.id);
  const project =
    memberProjects.find((item) => item.id === params.projectId) ?? memberProjects[0] ?? null;

  return (
    <div className="min-h-screen bg-[#f7f7f9] text-slate-900">
      <div className="mx-auto flex max-w-screen-2xl gap-6 px-4 py-8 lg:px-8">
        <MemberSidebar
          profile={profile}
          active="project"
          taskHref="/member/tasks/1001"
          projects={memberProjects}
          activeProjectId={project?.id ?? null}
        />
        <main className="flex-1">
          {project ? (
            <ProjectBoardClient projectName={project.name} projectId={project.id} seedTasks={false} />
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
              Belum ada project yang di-assign. Minta PM menambahkan kamu ke project.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
