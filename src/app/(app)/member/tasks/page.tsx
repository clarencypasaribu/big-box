import { MemberSidebar, type MemberProjectItem } from "@/components/member-sidebar";
import { getCurrentUserProfile } from "@/utils/current-user";
import { AllTasksClient } from "./all-tasks-client";

const memberProjects: MemberProjectItem[] = [
  { id: "mobile", name: "Mobile App", color: "green" },
];

export default async function MemberTasksPage() {
  const profile = await getCurrentUserProfile();

  return (
    <div className="min-h-screen bg-[#f7f7f9] text-slate-900">
      <div className="mx-auto flex max-w-screen-2xl gap-6 px-4 py-8 lg:px-8">
        <MemberSidebar
          profile={profile}
          active="task"
          taskHref="/member/tasks"
          projects={memberProjects}
        />
        <main className="flex-1 space-y-6">
          <header className="space-y-2">
            <h1 className="text-3xl font-semibold text-slate-900">My Tasks</h1>
            <p className="text-slate-600">Semua task dari project yang kamu ikuti.</p>
          </header>
          <AllTasksClient projects={memberProjects} />
        </main>
      </div>
    </div>
  );
}
