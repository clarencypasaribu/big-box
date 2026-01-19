import { getCurrentUserProfile } from "@/utils/current-user";
import { TaskDetailClient } from "./task-detail-client";
import type { MemberProjectItem } from "@/components/member-sidebar";

interface TaskPageProps {
  params: { taskId: string };
}

export default async function MemberTaskDetailPage({ params }: TaskPageProps) {
  const profile = await getCurrentUserProfile();
  const memberProjects: MemberProjectItem[] = [
    { id: "mobile", name: "Mobile App", color: "green" },
  ];

  return (
    <TaskDetailClient
      profile={profile}
      taskId={params.taskId}
      projects={memberProjects}
    />
  );
}
