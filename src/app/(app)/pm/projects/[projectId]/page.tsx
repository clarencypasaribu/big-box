import { PMSidebar } from "@/app/(app)/pm/_components/sidebar";
import { ProjectDetailClient } from "@/app/(app)/pm/projects/[projectId]/project-detail-client";
import { getCurrentUserProfile } from "@/utils/current-user";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: { projectId?: string | string[] };
}) {
  const profile = await getCurrentUserProfile();
  return (
    <div className="min-h-screen bg-[#f7f7f9] text-slate-900">
      <div className="mx-auto flex max-w-screen-2xl gap-6 px-4 py-8 lg:px-8">
        <PMSidebar currentPath={`/pm/projects/${params.projectId}`} profile={profile} />
        <main className="flex-1">
          <ProjectDetailClient projectId={Array.isArray(params.projectId) ? params.projectId[0] : params.projectId} />
        </main>
      </div>
    </div>
  );
}
