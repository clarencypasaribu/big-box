"use client";

import { useEffect, useMemo, useState } from "react";
import { MoveRight } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ProjectRef = {
  name: string;
};

type StoredCard = {
  id: string;
  title: string;
  description?: string;
  priority?: "High" | "Medium" | "Low";
  done?: boolean;
};

type StoredColumn = {
  id: string;
  title: string;
  status: "Completed" | "Active" | "Testing" | "Pending";
  cards: StoredCard[];
};

type UrgentTask = {
  id: string;
  title: string;
  project: string;
  priority?: StoredCard["priority"];
  status: StoredColumn["status"];
  stage: string;
  done?: boolean;
};

const priorityTone: Record<NonNullable<StoredCard["priority"]>, string> = {
  High: "bg-rose-100 text-rose-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-blue-100 text-blue-700",
};

const statusTone: Record<StoredColumn["status"], string> = {
  Completed: "text-emerald-700",
  Active: "text-amber-700",
  Pending: "text-amber-700",
  Testing: "text-blue-700",
};

const highlightTone: Record<NonNullable<StoredCard["priority"]>, string> = {
  High: "border-l-red-500",
  Medium: "border-l-amber-500",
  Low: "border-l-blue-500",
};

function storageKey(projectName: string) {
  return `member-project:v2:${projectName}`;
}

export function UrgentTasksClient({ projects }: { projects: ProjectRef[] }) {
  const [tasks, setTasks] = useState<UrgentTask[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const next: UrgentTask[] = [];

    projects.forEach((project) => {
      const raw = window.localStorage.getItem(storageKey(project.name));
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw) as StoredColumn[];
        if (!Array.isArray(parsed)) return;
        parsed.forEach((column) => {
          if (!Array.isArray(column.cards)) return;
          column.cards.forEach((card) => {
            next.push({
              id: card.id,
              title: card.title,
              project: project.name,
              priority: card.priority,
              status: column.status,
              stage: column.title,
              done: card.done,
            });
          });
        });
      } catch {
        return;
      }
    });

    const notDone = next.filter((item) => !item.done);
    setTasks((notDone.length ? notDone : next).slice(0, 4));
  }, [projects]);

  const hasTasks = tasks.length > 0;
  const emptyMessage = useMemo(
    () => "Belum ada task dari My Projects. Buka project board dulu ya.",
    []
  );

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
        {!hasTasks ? (
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 md:col-span-2">
            {emptyMessage}
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={`${task.project}-${task.id}`}
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
                    className={cn("rounded-md", statusTone[task.status])}
                  >
                    {task.status}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-slate-600">Stage: {task.stage}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
