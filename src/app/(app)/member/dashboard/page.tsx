import { NotificationBell } from "@/components/notification-bell";
import { getCurrentUserProfile } from "@/utils/current-user";

import { StatsCardsClient } from "@/app/(app)/member/dashboard/stats-cards-client";
import { UrgentTasksClient } from "@/app/(app)/member/dashboard/urgent-tasks-client";
import { WorkloadChart } from "@/app/(app)/member/dashboard/workload-chart";
import { DeadlineChart } from "@/app/(app)/member/dashboard/deadline-chart";
import { BlockerPreviewClient } from "@/app/(app)/member/dashboard/blocker-preview-client";

import { getMemberProjects } from "@/utils/member-projects";

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

        <div className="flex items-center gap-3">
          <NotificationBell />
        </div>
      </header>

      <BlockerPreviewClient />

      <StatsCardsClient projects={memberProjects} />

      {/* Productivity Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <WorkloadChart projects={memberProjects} />
        <DeadlineChart projects={memberProjects} />
      </div>

      <UrgentTasksClient projects={memberProjects} />
    </section >
  );
}
