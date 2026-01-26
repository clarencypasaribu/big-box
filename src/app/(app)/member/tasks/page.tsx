import { MemberSidebar } from "@/components/member-sidebar";
import { getCurrentUserProfile } from "@/utils/current-user";
import { AllTasksClient } from "./all-tasks-client";
import { getMemberProjects } from "@/utils/member-projects";

export default async function MemberTasksPage() {
  const profile = await getCurrentUserProfile();
  const memberProjects = await getMemberProjects(profile.id);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">My Tasks</h1>
        <p className="text-slate-600">All tasks from the projects you are part of.</p>
      </header>
      <AllTasksClient projects={memberProjects} />
    </div>
  );
}
