"use client";

import { useCallback, useEffect, useState } from "react";
import { MoveRight, CalendarClock } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ProjectRef = {
  id?: string;
  name: string;
};

type UrgentTask = {
  id: string;
  title: string;
  project: string;
  projectId: string;
  priority?: "High" | "Medium" | "Low";
  status: string;
  stage: string;
  dueDate?: string;
  done?: boolean;
};

const stageTitleMap: Record<string, string> = {
  "stage-1": "Stage F1: Initiation",
  "stage-2": "Stage F2: Planning",
  "stage-3": "Stage F3: Execution",
  "stage-4": "Stage F4: Monitoring & Controlling",
  "stage-5": "Stage F5: Closure",
};

const priorityTone: Record<string, string> = {
  High: "bg-rose-100 text-rose-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-blue-100 text-blue-700",
};

const statusTone: Record<string, string> = {
  Completed: "text-emerald-700",
  Done: "text-emerald-700",
  Active: "text-amber-700",
  "In Progress": "text-amber-700",
  Pending: "text-amber-700",
  Testing: "text-blue-700",
};

const highlightTone: Record<string, string> = {
  High: "border-l-red-500",
  Medium: "border-l-amber-500",
  Low: "border-l-blue-500",
};

export function UrgentTasksClient({ projects }: { projects: ProjectRef[] }) {
  const [tasks, setTasks] = useState<UrgentTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUrgentTasks = useCallback(async () => {
    if (!projects.length) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const allTasks: UrgentTask[] = [];

    try {
      await Promise.all(
        projects.map(async (project) => {
          if (!project.id) return;
          try {
            const res = await fetch(`/api/project-tasks?projectId=${encodeURIComponent(project.id)}`);
            if (!res.ok) return;
            const body = await res.json();
            const data = Array.isArray(body.data) ? body.data : [];

            data.forEach((task: any) => {
              const isDone = task.status === "Done" || task.status === "Completed";
              // Only add High priority tasks that are not done
              if (task.priority === "High" && !isDone) {
                allTasks.push({
                  id: task.id,
                  title: task.title ?? "Untitled Task",
                  project: project.name,
                  projectId: project.id!,
                  priority: task.priority,
                  status: task.status ?? "Active",
                  stage: stageTitleMap[task.stage] ?? task.stage ?? "Unknown Stage",
                  dueDate: task.due_date ?? undefined,
                  done: isDone,
                });
              }
            });
          } catch {
            // ignore errors for individual projects
          }
        })
      );
    } catch {
      // ignore
    }

    // Sort by due date (nearest first), limit to 4
    allTasks.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

    setTasks(allTasks.slice(0, 4));
    setLoading(false);
  }, [projects]);

  useEffect(() => {
    fetchUrgentTasks();
  }, [fetchUrgentTasks]);

  const hasTasks = tasks.length > 0;

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Urgent Task</CardTitle>
        <Button asChild variant="ghost" size="sm" className="text-slate-600">
          <Link href="/member/tasks">
            See all
            <MoveRight className="size-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 md:col-span-2">
            Loading urgent tasks...
          </div>
        ) : !hasTasks ? (
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 md:col-span-2">
            Tidak ada task urgent (High Priority) saat ini. 🎉
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={`${task.projectId}-${task.id}`}
              className={cn(
                "flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm",
                task.priority ? highlightTone[task.priority] : "border-l-slate-300",
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
                      task.priority ? priorityTone[task.priority] : "bg-slate-100 text-slate-700"
                    )}
                  >
                    {task.priority ? `${task.priority} Priority` : "No Priority"}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn("rounded-md", statusTone[task.status] ?? "text-slate-700")}
                  >
                    {task.status}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Stage: {task.stage}</span>
                {task.dueDate && (
                  <span className="flex items-center gap-1 rounded-md bg-rose-100 px-2 py-0.5 text-rose-700 font-medium">
                    <CalendarClock className="size-3" />
                    {new Date(task.dueDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
