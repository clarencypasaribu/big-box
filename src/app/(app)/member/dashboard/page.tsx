import { DashboardSearch } from "@/components/dashboard-search";
import { getCurrentUserProfile } from "@/utils/current-user";
import { MemberSidebar } from "@/components/member-sidebar";
import { QuickActionsClient } from "@/app/(app)/member/dashboard/quick-actions-client";
import { StatsCardsClient } from "@/app/(app)/member/dashboard/stats-cards-client";
import { UrgentTasksClient } from "@/app/(app)/member/dashboard/urgent-tasks-client";
import { getMemberProjects } from "@/utils/member-projects";
import { NotificationsClient } from "@/app/(app)/member/dashboard/notifications-client";

export default async function MemberDashboardPage() {
  const profile = await getCurrentUserProfile();
  const memberProjects = await getMemberProjects(profile.id);

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">
            Hi, {profile.name}!
          </h1>
          <p className="text-slate-600">
            Here is an overview of your current workload and projects updates.
          </p>
        </div>

        <div className="relative flex w-full max-w-sm items-center gap-4">
          <DashboardSearch />
        </div>
      </header>

      <StatsCardsClient projects={memberProjects} />

      <div className="grid gap-4 xl:grid-cols-[1.4fr,1fr]">
        <QuickActionsClient projects={memberProjects} />
        <NotificationsClient onlyToday={false} limit={4} showFooterLink groupByDate />
      </div>

      <UrgentTasksClient projects={memberProjects} />
    </section>
  );
}
