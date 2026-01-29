"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  MapPin,
  Plus,
  Search,
  UserRound,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  stageDeadlines?: Record<string, string> | null;
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
  const taskSectionRef = useRef<HTMLDivElement>(null);

  // Add Task Dialog State
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [addTaskStage, setAddTaskStage] = useState("");
  const [addTaskTitle, setAddTaskTitle] = useState("");
  const [addTaskDescription, setAddTaskDescription] = useState("");
  const [addTaskAssignee, setAddTaskAssignee] = useState("");
  const [addTaskDueDate, setAddTaskDueDate] = useState("");
  const [addTaskPriority, setAddTaskPriority] = useState("");
  const [addTaskLoading, setAddTaskLoading] = useState(false);

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
        stageDeadlines: data.stage_deadlines ?? null,
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
        assignee: task.assignee ?? task.created_by ?? "",
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
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 grid size-16 place-items-center rounded-full bg-slate-100">
            <Search className="size-8 text-slate-400" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Project not found</h1>
          <p className="mt-2 text-sm text-slate-500 max-w-sm">
            We couldn't find the project you're looking for. It might have been deleted or the link is invalid.
          </p>
          {error && <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">Error: {error}</p>}
          <div className="mt-6">
            <Link href="/pm/projects">
              <Button>Back to Projects</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusTone: Record<string, string> = {
    "In Progress": "bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-600/10",
    Completed: "bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-600/10",
    Pending: "bg-rose-600 text-white shadow-sm ring-1 ring-rose-600/10",
    "Not Started": "bg-slate-600 text-white shadow-sm ring-1 ring-slate-600/10",
  };

  const progress = project.progress ?? 0;
  const team = project.teamMembers?.length ? project.teamMembers : ["No team assigned"];



  const scrollToStage = (stageId: string) => {
    // Ideally we would scroll to specific stage card, but scrolling to section is good start
    taskSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Semua task per stage (termasuk stage-1) untuk ditampilkan di kartu "Task Team Member per Stage".
  const tasksByStageAll = stageDefinitions.map((stage) => ({
    ...stage,
    tasks: tasks.filter((task) => task.stage === stage.id),
  }));
  // Stage untuk timeline/approval (tampilkan 5 stage lengkap).
  const timelineStages = tasksByStageAll;

  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter(t => t.done).length;

  const stageStats = tasksByStageAll.reduce<Record<string, { total: number; done: number; deadline?: string | null }>>(
    (acc, stage) => {
      const total = stage.tasks.length;
      const done = stage.tasks.filter((t) => t.done).length;
      const deadlines = stage.tasks
        .map((t) => t.due)
        .filter((d) => d && String(d).trim());
      const earliest =
        deadlines.length > 0
          ? deadlines.reduce((min, curr) => {
            const m = new Date(min as string);
            const c = new Date(curr as string);
            if (Number.isNaN(m.getTime())) return curr;
            if (Number.isNaN(c.getTime())) return min;
            return c < m ? curr : min;
          })
          : null;
      acc[stage.id] = { total, done, deadline: earliest };
      return acc;
    },
    {}
  );
  function getDaysLeft(dateStr?: string | null) {
    if (!dateStr) return "No deadline";
    const target = new Date(dateStr);
    if (Number.isNaN(target.getTime())) return "Invalid date";
    const now = new Date();
    // Reset hours to compare dates only
    target.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    const diff = target.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return "Due today";
    return `${days} days left`;
  }

  const milestone = {
    title: project.name,
    targetDate: project.endDate ? formatDate(project.endDate) : "No target date",
    remaining: getDaysLeft(project.endDate),
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

  function openAddTaskDialog(stageId: string) {
    setAddTaskStage(stageId);
    setAddTaskTitle("");
    setAddTaskDescription("");
    setAddTaskAssignee("");
    setAddTaskDueDate("");
    setAddTaskPriority("");
    setAddTaskOpen(true);
  }

  async function handleCreateTask() {
    if (!project || !addTaskTitle.trim() || !addTaskStage) return;

    setAddTaskLoading(true);
    try {
      const res = await fetch("/api/project-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          stageId: addTaskStage,
          title: addTaskTitle.trim(),
          description: addTaskDescription.trim() || null,
          assignee: addTaskAssignee || null,
          dueDate: addTaskDueDate || null,
          priority: addTaskPriority || null,
        }),
      });

      if (res.ok) {
        setAddTaskOpen(false);
        await refreshStageData(undefined, { force: true });
      }
    } catch {
      // Handle error silently
    } finally {
      setAddTaskLoading(false);
    }
  }

  return (
    <>
      {/* Add Task Dialog */}
      <Dialog open={addTaskOpen} onOpenChange={setAddTaskOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Task to {stageDefinitions.find(s => s.id === addTaskStage)?.label}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="task-title">Task Title *</Label>
              <Input
                id="task-title"
                placeholder="Enter task title"
                value={addTaskTitle}
                onChange={(e) => setAddTaskTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-description">Description</Label>
              <Input
                id="task-description"
                placeholder="Enter description (optional)"
                value={addTaskDescription}
                onChange={(e) => setAddTaskDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-assignee">Assign to Team Member</Label>
              <Select value={addTaskAssignee} onValueChange={setAddTaskAssignee}>
                <SelectTrigger id="task-assignee">
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {(project?.teamMembers ?? []).map((member) => (
                    <SelectItem key={member} value={member}>
                      {member}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-due">Due Date</Label>
                <Input
                  id="task-due"
                  type="date"
                  value={addTaskDueDate}
                  onChange={(e) => setAddTaskDueDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-priority">Priority</Label>
                <Select value={addTaskPriority} onValueChange={setAddTaskPriority}>
                  <SelectTrigger id="task-priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setAddTaskOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateTask}
                disabled={!addTaskTitle.trim() || addTaskLoading}
              >
                {addTaskLoading ? "Creating..." : "Create Task"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
            {/* Export PDF removed */}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {timelineStages.map((stage, index) => {
              const stageId = `stage-${index + 1}`;
              const stageDeadline = project.stageDeadlines?.[stageId];
              const isOverdue = stageDeadline && new Date(stageDeadline) < new Date() && stageStates[index] !== "done";
              const isClickable = stageStates[index] === "active";

              return (
                <div
                  key={`${stage.label}-${index}`}
                  className={`flex items-center gap-3 ${isClickable ? "cursor-pointer transition-opacity hover:opacity-80" : "opacity-80 disabled"}`}
                  onClick={() => isClickable && scrollToStage(stage.id)}
                >
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
                    <p className={`text-xs ${isOverdue ? "font-medium text-rose-600" : "text-slate-400"}`}>
                      {stageDeadline
                        ? `${isOverdue ? "⚠️ Overdue: " : "Due: "}${formatDate(stageDeadline)}`
                        : (stageStates[index] === "active" ? "Active" : stage.label)
                      }
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="space-y-4 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Team Members
              </p>
              <div className="flex items-center justify-between">
                <div className="flex -space-x-3 overflow-hidden">
                  {team.slice(0, 4).map((member, i) => (
                    <div
                      key={i}
                      className="flex size-10 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-xs font-medium text-slate-600 ring-2 ring-transparent"
                      title={member}
                    >
                      {member.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {team.length > 4 && (
                    <div className="flex size-10 items-center justify-center rounded-full border-2 border-white bg-slate-50 text-xs font-medium text-slate-500">
                      +{team.length - 4}
                    </div>
                  )}
                </div>
                <p className="text-2xl font-semibold text-slate-900">{team.length}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {team.slice(0, 3).map((member, i) => (
                  <span key={i} className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">
                    {member}
                  </span>
                ))}
                {team.length > 3 && (
                  <span className="inline-flex rounded-full bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-500">
                    ...
                  </span>
                )}
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
                  Completed Tasks
                </p>
                <p className="text-sm font-semibold text-slate-900">{progress}%</p>
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-semibold text-slate-900">
                  {completedTasksCount} / {totalTasksCount}
                </p>
                <Progress value={progress} className="h-2 bg-slate-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200 shadow-sm" ref={taskSectionRef}>
          <CardContent className="space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Task Team Member per Stage</h2>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {tasksByStageAll.map((stage, index) => {
                const stageId = stage.id;
                const stageDeadlineStr = project.stageDeadlines?.[stageId];
                const stageDeadline = stageDeadlineStr ? new Date(stageDeadlineStr) : null;
                const now = new Date();

                // Countdown Logic
                let countdownText = "";
                let countdownColor = "text-slate-500";
                let isOverdue = false;

                if (stageDeadline) {
                  const diffTime = stageDeadline.getTime() - now.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                  if (diffDays < 0) {
                    isOverdue = true;
                    countdownText = `(🚨 Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? "s" : ""})`;
                    countdownColor = "text-rose-600 font-medium";
                  } else if (diffDays <= 3) {
                    countdownText = `(⚠️ ${diffDays} day${diffDays !== 1 ? "s" : ""} left)`;
                    countdownColor = "text-amber-600 font-medium";
                  } else {
                    countdownText = `(${diffDays} days left)`;
                    countdownColor = "text-slate-500";
                  }
                }

                // Task Progress Logic
                const totalTasks = stage.tasks.length;
                const completedTasks = stage.tasks.filter((t) => t.done).length;
                const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

                // Time Progress Logic
                let timeProgress = 0;
                let stageStartDate: Date | null = project.startDate ? new Date(project.startDate) : null;

                // If not first stage, try to use previous stage deadline as start
                if (index > 0) {
                  const prevStageId = timelineStages[index - 1].id; // using timelineStages which has same order
                  const prevDeadlineStr = project.stageDeadlines?.[prevStageId];
                  if (prevDeadlineStr) {
                    stageStartDate = new Date(prevDeadlineStr);
                  }
                }

                if (stageStartDate && stageDeadline) {
                  const totalDuration = stageDeadline.getTime() - stageStartDate.getTime();
                  const elapsed = now.getTime() - stageStartDate.getTime();
                  if (totalDuration > 0) {
                    timeProgress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
                  } else if (elapsed > 0) {
                    timeProgress = 100;
                  }
                }

                return (
                  <div key={stage.id} className="space-y-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                    {/* Header Section */}
                    <div className="flex items-center justify-between">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">{stage.label}</p>
                          <Badge className="rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200">
                            {stageStats[stageId]?.done ?? 0}/{stageStats[stageId]?.total ?? 0}
                          </Badge>
                        </div>
                        {stageDeadline && (
                          <div className="flex flex-col gap-0.5">
                            <p className={`text-xs ${isOverdue ? "text-rose-600" : "text-slate-500"}`}>
                              Due: {formatDate(stageDeadlineStr)} <span className={countdownColor}>{countdownText}</span>
                            </p>

                            {/* Double Progress Bar */}
                            <div className="relative mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                              {/* Task Progress (Blue Bar) */}
                              <div
                                className="absolute left-0 top-0 h-full bg-blue-500 transition-all duration-500"
                                style={{ width: `${taskProgress}%` }}
                              />
                              {/* Time Progress (Red Indicator) */}
                              {/* Using a red dashed line marker or overlay bar */}
                              <div
                                className="absolute top-0 h-full border-r-2 border-dashed border-rose-500 transition-all duration-500"
                                style={{
                                  left: `${timeProgress}%`,
                                  borderColor: timeProgress >= 100 ? '#e11d48' : undefined // solid red if 100%
                                }}
                              />
                            </div>
                            {/* Detailed % text removed for cleaner UI */}
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="ml-2 h-7 shrink-0 gap-1 text-xs text-violet-600 hover:bg-violet-50 hover:text-violet-700"
                        onClick={() => openAddTaskDialog(stage.id)}
                      >
                        <Plus className="size-3.5" />
                      </Button>
                    </div>

                    {/* Tasks List */}
                    {stage.tasks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-2 py-6 rounded-md border border-dashed border-slate-200 bg-slate-50">
                        <p className="text-xs text-slate-500">No tasks yet</p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => openAddTaskDialog(stage.id)}
                        >
                          Add first task
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {stage.tasks.map((task) => (
                          <div
                            key={task.id}
                            className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-800 transition-colors hover:bg-slate-100"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-semibold text-slate-900 line-clamp-2">{task.title}</p>
                              {task.done && <CheckCircle2 className="size-3.5 text-green-600 shrink-0 mt-0.5" />}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                              <span className="flex items-center gap-1">
                                <UserRound className="size-3" />
                                {task.assignee ? (
                                  <span>{task.assignee}</span>
                                ) : (
                                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                                    ⚠️ Unassigned
                                  </span>
                                )}
                              </span>
                              <span className="h-3 w-px bg-slate-300" aria-hidden />
                              <span>{task.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>



      </div>
    </>
  );
}
