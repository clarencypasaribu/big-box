import {
  Bell,
  BookMarked,
  CheckSquare,
  Clock3,
  FileClock,
  Folder,
  Loader,
  MoveRight,
  Plus,
  Settings,
  SquareChartGantt,
} from "lucide-react";

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
import { SidebarProfile } from "@/components/sidebar-profile";
import { getCurrentUserProfile } from "@/utils/current-user";

type Stat = {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent: string;
};

type QuickAction = {
  label: string;
  description: string;
  icon: React.ElementType;
  accent: string;
};

type Task = {
  title: string;
  project: string;
  due: string;
  priority: "High" | "Medium" | "Low";
  status: "To Do" | "In Progress" | "In Review";
  highlight: string;
};

type Notification = {
  title: string;
  message: string;
  time: string;
  tone: "success" | "warning" | "danger";
  count?: number;
};

const stats: Stat[] = [
  { label: "Total Projects", value: 5, icon: Folder, accent: "bg-[#f1e7ff]" },
  {
    label: "Completed Task",
    value: 5,
    icon: CheckSquare,
    accent: "bg-[#fce9fd]",
  },
  { label: "Due Today", value: 2, icon: Clock3, accent: "bg-[#e8f1ff]" },
  {
    label: "Pending Overview",
    value: 30,
    icon: FileClock,
    accent: "bg-[#fdeff0]",
  },
];

const quickActions: QuickAction[] = [
  { label: "Create Task", description: "Make New Task", icon: Plus, accent: "bg-[#e8f1ff]" },
  {
    label: "Log Time",
    description: "Record Work Hours",
    icon: Loader,
    accent: "bg-[#fdeff0]",
  },
  {
    label: "Docs",
    description: "View BigBox Wiki",
    icon: BookMarked,
    accent: "bg-[#f9eed3]",
  },
];

const tasks: Task[] = [
  {
    title: "Create user flow for Finance App",
    project: "Project BigBox Care",
    due: "Today",
    priority: "High",
    status: "In Progress",
    highlight: "border-l-red-500",
  },
  {
    title: "Create user flow for Finance App",
    project: "Project BigBox Care",
    due: "Oct 24th",
    priority: "Low",
    status: "To Do",
    highlight: "border-l-blue-500",
  },
  {
    title: "App usability testing with Maze",
    project: "Project BigBox Care",
    due: "Tomorrow",
    priority: "Medium",
    status: "In Review",
    highlight: "border-l-amber-500",
  },
  {
    title: "Create user flow for Finance App",
    project: "Project BigBox Care",
    due: "Oct 24th",
    priority: "Low",
    status: "To Do",
    highlight: "border-l-blue-500",
  },
];

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

const projects = ["Mobile App", "Website Redesign", "Design System", "Wireframes"];

export default async function MemberDashboardPage() {
  const profile = await getCurrentUserProfile();
  return (
    <div className="min-h-screen bg-[#f7f7f9] text-slate-900">
      <div className="mx-auto flex max-w-screen-2xl gap-6 px-4 py-8 lg:px-8">
        <aside className="flex min-h-[90vh] w-[230px] flex-col justify-between rounded-xl border border-slate-200 bg-white px-5 py-6">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-full bg-[#e8defe] text-[#4d2ba3]">
                <SquareChartGantt className="size-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#4d2ba3]">
                  Logo
                </p>
                <p className="text-sm font-semibold text-slate-900">Workspace</p>
              </div>
            </div>

            <nav className="space-y-1.5 text-sm font-semibold">
              <button className="flex w-full items-center gap-3 rounded-lg bg-[#e8defe] px-3 py-2 text-[#2f1c70]">
                <SquareChartGantt className="size-4" />
                <span className="flex-1 text-left">My Dashboard</span>
              </button>
              <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100">
                <CheckSquare className="size-4" />
                <span className="flex-1 text-left">My Task</span>
              </button>
              <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100">
                <Settings className="size-4" />
                <span className="flex-1 text-left">Settings</span>
              </button>
            </nav>

            <Separator />

            <div className="space-y-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                My Projects
              </p>
              <div className="space-y-2">
                {projects.map((project, idx) => (
                  <div
                    key={project}
                    className="flex items-center gap-3 rounded-lg px-2 py-1 text-slate-700 hover:bg-slate-100"
                  >
                    <span
                      className={cn("size-2 rounded-full", [
                        "bg-emerald-500",
                        "bg-blue-500",
                        "bg-purple-500",
                        "bg-amber-500",
                      ][idx % 4])}
                    />
                    <span className="flex-1 text-left text-sm">{project}</span>
                    <span className="text-slate-400">…</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <SidebarProfile profile={profile} />
        </aside>

        <main className="flex-1 space-y-6">
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

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label} className="border-slate-200 shadow-sm">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className={cn("grid size-12 place-items-center rounded-full", stat.accent)}>
                    <stat.icon className="size-5 text-slate-800" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">{stat.label}</p>
                    <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.4fr,1fr]">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                {quickActions.map((action) => (
                  <div
                    key={action.label}
                    className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "grid size-10 place-items-center rounded-full text-slate-800",
                          action.accent
                        )}
                      >
                        <action.icon className="size-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{action.label}</p>
                        <p className="text-xs text-slate-600">{action.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

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

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Urgent Task</CardTitle>
              <Button variant="ghost" size="sm" className="text-slate-600">
                See all
                <MoveRight className="size-4" />
              </Button>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {tasks.map((task, idx) => (
                <div
                  key={`${task.title}-${idx}`}
                  className={cn(
                    "flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm",
                    task.highlight,
                    "border-l-4"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                      <p className="text-xs text-slate-500">Project {task.project}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-xs">
                      <Badge
                        className={cn(
                          "rounded-md",
                          task.priority === "High" && "bg-rose-100 text-rose-700",
                          task.priority === "Medium" && "bg-amber-100 text-amber-700",
                          task.priority === "Low" && "bg-blue-100 text-blue-700"
                        )}
                      >
                        {task.priority} Priority
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-md",
                          task.status === "In Progress" && "text-amber-700",
                          task.status === "In Review" && "text-purple-700",
                          task.status === "To Do" && "text-emerald-700"
                        )}
                      >
                        {task.status}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600">Due: {task.due}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
