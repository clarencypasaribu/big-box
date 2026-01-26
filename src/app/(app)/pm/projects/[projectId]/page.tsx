import { PMSidebar } from "@/app/(app)/pm/_components/sidebar";
import { ProjectDetailClient } from "@/app/(app)/pm/projects/[projectId]/project-detail-client";
import { getCurrentUserProfile } from "@/utils/current-user";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId?: string | string[] }>;
}) {
  const { projectId } = await params;
  return (
    <main className="flex-1">
      <ProjectDetailClient projectId={Array.isArray(projectId) ? projectId[0] : projectId} />
    </main>
  );
}

