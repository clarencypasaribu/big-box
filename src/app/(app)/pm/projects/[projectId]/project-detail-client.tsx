"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  MapPin,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

type ProjectDetail = {
  id: string;
  name: string;
  code?: string | null;
  owner?: string | null;
  status?: string | null;
  description?: string | null;
  progress?: number | null;
  location?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  teamMembers?: string[];
};

type ProjectDetailClientProps = {
  projectId?: string;
};

type StageTask = {
  id: string;
  title: string;
  assignee?: string;
  due?: string;
  status: "In Progress" | "Pending Review" | "Not Started" | "Done" | "Completed";
  done: boolean;
  stage: string;
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

function normalizeId(value?: string | null) {
  const raw = (value ?? "").trim();
  if (!raw || raw === "undefined" || raw === "null") return "";
  return raw;
}

const stageDefinitions = [
  { id: "stage-1", label: "Initiation" },
  { id: "stage-2", label: "Planning" },
  { id: "stage-3", label: "Execution" },
  { id: "stage-4", label: "Monitoring & Controlling" },
  { id: "stage-5", label: "Closure" },
];

export function ProjectDetailClient({ projectId }: ProjectDetailClientProps) {
  const params = useParams();
  const searchParams = useSearchParams();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [stageApprovals, setStageApprovals] = useState<Record<string, string>>({});
  const [tasks, setTasks] = useState<StageTask[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const lastLocalToggleAtRef = useRef<number>(0);

  const resolvedId = useMemo(() => {
    const paramId = typeof params?.projectId === "string" ? params.projectId : "";
    const queryId = searchParams?.get("id") ?? searchParams?.get("code") ?? "";
    return normalizeId(projectId) || normalizeId(paramId) || normalizeId(queryId);
  }, [params, projectId, searchParams]);

  const refreshProject = useCallback(
    async (signal?: AbortSignal) => {
      if (!resolvedId) return;
      const encoded = encodeURIComponent(resolvedId);
      const res = await fetch(`/api/projects/${encoded}?id=${encoded}`, { signal });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Project tidak ditemukan");
      }
      const body = await res.json();
      const data = body.data;
      setProject({
        id: data.id,
        name: data.name ?? "Untitled Project",
        code: data.code ?? null,
        owner: data.lead ?? null,
        status: data.status ?? "In Progress",
        description: data.description ?? null,
        progress: typeof data.progress === "number" ? data.progress : 0,
        location: data.location ?? null,
        startDate: data.start_date ?? null,
        endDate: data.end_date ?? null,
        teamMembers: data.team_members ?? [],
      });
    },
    [resolvedId]
  );

  const refreshStageData = useCallback(
    async (signal?: AbortSignal, options?: { force?: boolean }) => {
      if (!options?.force && Date.now() - lastLocalToggleAtRef.current < 2000) {
        return;
      }
      if (!resolvedId) return;
      const [tasksRes, approvalsRes] = await Promise.all([
        fetch(`/api/project-tasks?projectId=${encodeURIComponent(resolvedId)}`, { signal }),
        fetch(`/api/project-stage-approvals?projectId=${encodeURIComponent(resolvedId)}`, { signal }),
      ]);
      const tasksBody = tasksRes.ok ? await tasksRes.json() : { data: [] };
      const approvalsBody = approvalsRes.ok ? await approvalsRes.json() : { data: [] };

      const normalizedTasks: StageTask[] = (tasksBody.data ?? []).map((task: any) => ({
        id: task.id,
        title: task.title ?? "Untitled Task",
        assignee: task.assignee ?? "",
        due: task.due_date ?? "",
        status: task.status ?? "Not Started",
        done: task.status === "Done" || task.status === "Completed",
        stage: task.stage ?? "stage-1",
      }));

      const approvalsMap: Record<string, string> = {};
      (approvalsBody.data ?? []).forEach((row: any) => {
        approvalsMap[row.stage_id] = row.status;
      });

      setTasks(normalizedTasks);
      setStageApprovals(approvalsMap);
    },
    [resolvedId]
  );

  useEffect(() => {
    if (!resolvedId) {
      setError("Project ID or code is missing.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    refreshProject(controller.signal)
      .then(() => refreshStageData(controller.signal))
      .catch((err) => {
        if (controller.signal.aborted) return;
        setProject(null);
        setError(err instanceof Error ? err.message : "Project not found.");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [refreshProject, refreshStageData, resolvedId]);


  if (loading) {
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6 text-sm text-slate-500">Loading project detail...</CardContent>
      </Card>
    );
  }

  if (!project) {
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <h1 className="text-2xl font-semibold text-slate-900">Project not found</h1>
          <p className="mt-2 text-slate-600">
            Project data was not found. Make sure the ID or code is correct, then try again.
          </p>
          {error ? <p className="mt-3 text-sm text-rose-600">Detail: {error}</p> : null}
        </CardContent>
      </Card>
    );
  }

  const statusTone: Record<string, string> = {
    "In Progress": "bg-amber-50 text-amber-700",
    Completed: "bg-emerald-50 text-emerald-700",
    Pending: "bg-rose-50 text-rose-700",
    "Not Started": "bg-slate-100 text-slate-700",
  };

  const progress = project.progress ?? 0;
  const team = project.teamMembers?.length ? project.teamMembers : ["No team assigned"];
  // Semua task per stage (termasuk stage-1) untuk ditampilkan di kartu "Task Team Member per Stage".
  const tasksByStageAll = stageDefinitions.map((stage) => ({
    ...stage,
    tasks: tasks.filter((task) => task.stage === stage.id),
  }));
  // Stage untuk timeline/approval (tampilkan 5 stage lengkap).
  const timelineStages = tasksByStageAll;
  const milestone = {
    title: project.name,
    targetDate: project.endDate ? formatDate(project.endDate) : "Oct 24, 2024",
    remaining: "12 days left",
  };
  const statusPill: Record<string, string> = {
    "In Progress": "bg-emerald-100 text-emerald-700",
    "Pending Review": "bg-amber-100 text-amber-700",
    "Not Started": "bg-slate-100 text-slate-600",
    Done: "bg-emerald-100 text-emerald-700",
    Completed: "bg-emerald-100 text-emerald-700",
  };

  const currentStageIndex = timelineStages.findIndex((stage, index) => {
    if (stageApprovals[stage.id] === "Approved") return false;
    const prevApproved = timelineStages
      .slice(0, index)
      .every((item) => stageApprovals[item.id] === "Approved");
    return prevApproved;
  });
  const resolvedStageIndex =
    currentStageIndex === -1 ? timelineStages.length - 1 : currentStageIndex;
  const activeStage = timelineStages[resolvedStageIndex];
  const hasAnyTasks = tasks.length > 0;

  const stageStates = timelineStages.map((stage, index) => {
    if (stageApprovals[stage.id] === "Approved") return "done";
    if (index === resolvedStageIndex) return "active";
    return "upcoming";
  });

  async function approveStage(stageId: string) {
    if (!project) return;
    const res = await fetch(`/api/project-stage-approvals/${stageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: project.id, status: "Approved" }),
    });
    if (!res.ok) {
      await fetch("/api/project-stage-approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id, stageId, status: "Approved" }),
      });
    }
    setStageApprovals((prev) => ({ ...prev, [stageId]: "Approved" }));
    await refreshStageData(undefined, { force: true });
  }

  async function toggleTaskDone(taskId: string, nextDone: boolean) {
    lastLocalToggleAtRef.current = Date.now();
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
            ...task,
            done: nextDone,
            status: nextDone ? "Done" : "In Progress",
          }
          : task
      )
    );
    try {
      const res = await fetch(`/api/project-tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextDone ? "Done" : "In Progress" }),
      });
      if (res.ok) {
        const body = await res.json().catch(() => null);
        const updatedStatus = body?.data?.status as StageTask["status"] | undefined;
        if (updatedStatus) {
          setTasks((prev) =>
            prev.map((task) =>
              task.id === taskId
                ? {
                  ...task,
                  status: updatedStatus,
                  done: updatedStatus === "Done" || updatedStatus === "Completed",
                }
                : task
            )
          );
        }
        return;
      }
      if (nextDone) {
        const fallback = await fetch(`/api/project-tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "Completed" }),
        });
        if (fallback.ok) {
          const body = await fallback.json().catch(() => null);
          const updatedStatus = body?.data?.status as StageTask["status"] | undefined;
          if (updatedStatus) {
            setTasks((prev) =>
              prev.map((task) =>
                task.id === taskId
                  ? {
                    ...task,
                    status: updatedStatus,
                    done: updatedStatus === "Done" || updatedStatus === "Completed",
                  }
                  : task
              )
            );
          }
          return;
        }
      }
      await refreshStageData();
    } catch {
      await refreshStageData();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <h1 className="text-4xl font-semibold text-slate-900">{project.name}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
            <span className="flex items-center gap-2">
              <BadgeCheck className="size-4 text-indigo-600" />
              ID: {project.code || project.id}
            </span>
            <Separator orientation="vertical" className="h-4" />
            <span className="flex items-center gap-2">
              <UserRound className="size-4 text-slate-500" />
              Owner: {project.owner ?? "Unassigned"}
            </span>
            <Separator orientation="vertical" className="h-4" />
            <span className="flex items-center gap-2">
              <MapPin className="size-4 text-slate-500" />
              {project.location ?? "No location"}
            </span>
            <Separator orientation="vertical" className="h-4" />
            <Badge
              className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone[project.status ?? "In Progress"] ?? "bg-slate-100 text-slate-700"}`}
            >
              {project.status ?? "In Progress"}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" className="gap-2 rounded-full border-slate-200" asChild>
            <Link href={`/pm/projects/${project.id}/report.pdf`} download>
              Export PDF
            </Link>
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {timelineStages.map((stage, index) => (
            <div key={`${stage.label}-${index}`} className="flex items-center gap-3">
              <div
                className={`grid size-9 place-items-center rounded-full border ${stageStates[index] === "done"
                    ? "border-indigo-200 bg-indigo-50 text-indigo-600"
                    : stageStates[index] === "active"
                      ? "border-slate-900 text-slate-900"
                      : "border-slate-200 text-slate-400"
                  }`}
              >
                {stageStates[index] === "done" ? (
                  <CheckCircle2 className="size-4" />
                ) : (
                  <span className="text-xs font-semibold">{index + 1}</span>
                )}
              </div>
              <div className="space-y-0.5">
                <p
                  className={`text-sm font-semibold ${stageStates[index] === "upcoming" ? "text-slate-400" : "text-slate-800"
                    }`}
                >
                  {stage.label}
                </p>
                <p className="text-xs text-slate-400">
                  {stageStates[index] === "active" ? "Active" : stage.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="space-y-4 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Health Status
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-semibold text-slate-900">On Track</p>
              <div className="grid size-12 place-items-center rounded-full bg-emerald-50 text-emerald-500">
                <CheckCircle2 className="size-6" />
              </div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
              <span className="size-2 rounded-full bg-emerald-500" />
              Trending positive
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="space-y-3 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Next Milestone
            </p>
            <div className="space-y-1">
              <p className="text-xl font-semibold text-slate-900">{milestone.title}</p>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <CalendarClock className="size-4" />
                Target Date
              </div>
              <p className="text-sm font-semibold text-slate-900">{milestone.targetDate}</p>
            </div>
            <span className="inline-flex rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
              {milestone.remaining}
            </span>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Open Task
              </p>
              <p className="text-sm font-semibold text-slate-900">{progress}%</p>
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-semibold text-slate-900">
                {activeStage.tasks.length}
              </p>
              <Progress value={progress} className="h-2 bg-slate-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Task Team Member per Stage</h2>
              <p className="text-xs text-slate-500">Tasks submitted by team members for each stage.</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {tasksByStageAll.map((stage) => (
              <div key={stage.id} className="space-y-3 rounded-lg border border-slate-200 bg-white p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">{stage.label}</p>
                  <Badge className="rounded-full bg-slate-100 text-slate-700">{stage.tasks.length} task</Badge>
                </div>
                {stage.tasks.length === 0 ? (
                  <p className="text-xs text-slate-500">No tasks from team members yet.</p>
                ) : (
                  <div className="space-y-2">
                    {stage.tasks.map((task) => (
                      <div
                        key={task.id}
                        className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-800"
                      >
                        <p className="font-semibold text-slate-900">{task.title}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                          <span>Assignee: {task.assignee || "Unassigned"}</span>
                          <span className="h-3 w-px bg-slate-300" aria-hidden />
                          <span>Status: {task.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>



    </div>
  );
}
