import { Bell } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { getCurrentUserProfile } from "@/utils/current-user";
import { MemberSidebar, type MemberProjectItem } from "@/components/member-sidebar";
import { QuickActionsClient } from "./quick-actions-client";
import { StatsCardsClient } from "./stats-cards-client";
import { UrgentTasksClient } from "./urgent-tasks-client";

type Notification = {
  title: string;
  message: string;
  time: string;
  tone: "success" | "warning" | "danger";
  count?: number;
};

const notifications: Notification[] = [
  {
    title: "Reminder for your meetings",
    message: "Learn more about managing account info and activity",
    time: "9min ago",
    tone: "success",
    count: 2,
  },
  {
    title: "New Project Assigned",
    message: "Learn more about managing account info and activity",
    time: "14min ago",
    tone: "warning",
  },
  {
    title: "Deadline Approaching",
    message: "Learn more about managing account info and activity",
    time: "9min ago",
    tone: "danger",
    count: 2,
  },
];

const memberProjects: MemberProjectItem[] = [
  { id: "mobile", name: "Mobile App", color: "green" },
];

export default async function MemberDashboardPage() {
  const profile = await getCurrentUserProfile();
  return (
    <div className="min-h-screen bg-[#f7f7f9] text-slate-900">
      <div className="mx-auto flex max-w-screen-2xl gap-6 px-4 py-8 lg:px-8">
        <MemberSidebar
          profile={profile}
          active="dashboard"
          taskHref="/member/tasks"
          projects={memberProjects}
        />

        <main className="flex-1 space-y-6">
          <section className="space-y-6">
            <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">Hi, {profile.name}!</h1>
              <p className="text-slate-600">
                Here is an overview of your current workload and projects updates.
              </p>
            </div>
            <div className="relative w-full max-w-sm">
              <Bell className="absolute right-3 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
              <Input
                className="h-11 rounded-md border-slate-200 bg-slate-100/60 pl-4 pr-10 text-sm"
                placeholder="Search Task, Docs, Projects"
                type="search"
              />
            </div>
          </header>

          <StatsCardsClient projects={memberProjects} />

          <div className="grid gap-4 xl:grid-cols-[1.4fr,1fr]">
            <QuickActionsClient />

            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Notifications</CardTitle>
                <Badge variant="outline" className="bg-slate-50 text-slate-700">
                  Today
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <Separator className="border-dashed" />
                <div className="space-y-3">
                  {notifications.map((note) => {
                    const tone: Record<
                      Notification["tone"],
                      { bg: string; text: string }
                    > = {
                      success: { bg: "bg-emerald-50", text: "text-emerald-600" },
                      warning: { bg: "bg-amber-50", text: "text-amber-600" },
                      danger: { bg: "bg-rose-50", text: "text-rose-600" },
                    };
                    return (
                      <div
                        key={note.title}
                        className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
                      >
                        <div
                          className={cn(
                            "grid size-10 place-items-center rounded-full",
                            tone[note.tone].bg,
                            tone[note.tone].text
                          )}
                        >
                          <Bell className="size-4" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-semibold text-slate-900">
                            {note.title}
                          </p>
                          <p className="text-sm text-slate-600">{note.message}</p>
                        </div>
                        <div className="text-right text-xs text-slate-500">
                          <p>{note.time}</p>
                          {note.count ? (
                            <Badge className="mt-1 bg-slate-100 text-slate-700">
                              {note.count}
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <UrgentTasksClient projects={memberProjects} />
          </section>
        </main>
      </div>
    </div>
  );
}
