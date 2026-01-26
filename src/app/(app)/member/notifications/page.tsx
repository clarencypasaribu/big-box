import { NotificationsClient } from "@/app/(app)/member/dashboard/notifications-client";

export default function MemberNotificationsPage() {
  return (
    <main className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold text-slate-900">Notifications</h1>
        <p className="text-slate-600">All updates from your projects and tasks.</p>
      </div>

      <NotificationsClient onlyToday={false} limit={0} showFooterLink={false} groupByDate />
    </main>
  );
}
