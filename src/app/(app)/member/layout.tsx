import { ReactNode } from "react";
import { MemberSidebar } from "@/components/member-sidebar";
import { getCurrentUserProfile } from "@/utils/current-user";
import { getMemberProjects } from "@/utils/member-projects";

export default async function MemberLayout({ children }: { children: ReactNode }) {
  const profile = await getCurrentUserProfile();
  const memberProjects = await getMemberProjects(profile.id);

  return (
    <div className="h-screen bg-[#f7f7f9] text-slate-900">
      <div className="flex h-screen w-full">
        <MemberSidebar profile={profile} projects={memberProjects} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-screen-2xl px-4 py-8 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
