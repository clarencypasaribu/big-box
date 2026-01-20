import { getCurrentUserProfile } from "@/utils/current-user";
import { TaskDetailClient } from "./task-detail-client";
import { getMemberProjects } from "@/utils/member-projects";

interface TaskPageProps {
  params: { taskId: string };
}

export default async function MemberTaskDetailPage({ params }: TaskPageProps) {
  const profile = await getCurrentUserProfile();
  const memberProjects = await getMemberProjects(profile.id);

  return (
    <TaskDetailClient
      profile={profile}
      taskId={params.taskId}
      projects={memberProjects}
    />
  );
}
