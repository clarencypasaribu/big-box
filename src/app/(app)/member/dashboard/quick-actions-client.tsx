"use client";

import { useEffect, useMemo, useState } from "react";
import type { ElementType } from "react";
import { BookMarked, Plus, Loader2, FileIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { MemberProjectItem } from "@/components/member-sidebar";
import { useRouter } from "next/navigation";

type QuickActionId = "create-task" | "docs";

type QuickAction = {
  id: QuickActionId;
  label: string;
  description: string;
  icon: ElementType;
  accent: string;
};

const quickActions: QuickAction[] = [
  {
    id: "create-task",
    label: "Create Task",
    description: "Make New Task",
    icon: Plus,
    accent: "bg-[#e8f1ff]",
  },
  {
    id: "docs",
    label: "Docs",
    description: "View Project Files",
    icon: BookMarked,
    accent: "bg-[#f9eed3]",
  },
];

const stageOptions = [
  "Stage F1: Initiation",
  "Stage F2: Planning",
  "Stage F3: Execution",
  "Stage F4: Monitoring & Controlling",
  "Stage F5: Closure",
];

export function QuickActionsClient({ projects = [] }: { projects?: MemberProjectItem[] }) {
  const router = useRouter();
  const [activeAction, setActiveAction] = useState<QuickActionId | null>(null);
  const active = useMemo(
    () => quickActions.find((action) => action.id === activeAction) ?? null,
    [activeAction]
  );

  // Create Task State
  const [taskName, setTaskName] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || "");
  const [priority, setPriority] = useState<"High" | "Medium" | "Low">("Medium");
  const [stage, setStage] = useState(stageOptions[0]);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Docs State
  const [docs, setDocs] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  useEffect(() => {
    if (activeAction !== "create-task") return;
    setTaskName("");
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
    setPriority("Medium");
    setStage(stageOptions[0]);
    setDueDate("");
    setNotes("");
  }, [activeAction, projects, selectedProjectId]);

  useEffect(() => {
    if (activeAction === "docs") {
      setLoadingDocs(true);
      fetch("/api/member/docs")
        .then(res => res.json())
        .then(data => {
          setDocs(Array.isArray(data.data) ? data.data : []);
        })
        .catch(err => console.error("Failed to load docs", err))
        .finally(() => setLoadingDocs(false));
    }
  }, [activeAction]);

  async function handleCreateTask(event: React.FormEvent) {
    event.preventDefault();
    if (!taskName.trim() || !selectedProjectId) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/project-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProjectId,
          title: taskName,
          stageId: stage,
          priority: priority,
          dueDate: dueDate,
          description: notes
        })
      });

      if (!res.ok) throw new Error("Failed to create task");

      setActiveAction(null);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to create task. Make sure all fields are complete.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {quickActions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => setActiveAction(action.id)}
              className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
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
            </button>
          ))}
        </CardContent>
      </Card>

      <Dialog open={activeAction !== null} onOpenChange={(open) => (!open ? setActiveAction(null) : null)}>
        <DialogContent className="max-w-4xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-900">
              {active?.label ?? "Quick Action"}
            </DialogTitle>
          </DialogHeader>

          {activeAction === "create-task" ? (
            <form className="space-y-4" onSubmit={handleCreateTask}>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-800" htmlFor="qaTaskName">
                  Task Name
                </label>
                <Input
                  id="qaTaskName"
                  placeholder="Design onboarding flow"
                  value={taskName}
                  onChange={(event) => setTaskName(event.target.value)}
                  required
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-800" htmlFor="qaProject">
                    Project
                  </label>
                  <select
                    id="qaProject"
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
                    value={selectedProjectId}
                    onChange={(event) => setSelectedProjectId(event.target.value)}
                    required
                  >
                    {projects.length === 0 ? <option value="">No Projects Joined</option> : null}
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-800" htmlFor="qaPriority">
                    Priority
                  </label>
                  <select
                    id="qaPriority"
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
                    value={priority}
                    onChange={(event) => setPriority(event.target.value as any)}
                  >
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-800" htmlFor="qaStage">
                  Stage
                </label>
                <select
                  id="qaStage"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
                  value={stage}
                  onChange={(event) => setStage(event.target.value)}
                >
                  {stageOptions.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-800" htmlFor="qaDueDate">
                  Due Date
                </label>
                <Input
                  id="qaDueDate"
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-800" htmlFor="qaNotes">
                  Notes
                </label>
                <textarea
                  id="qaNotes"
                  className="min-h-[120px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  placeholder="Add short context for the task..."
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setActiveAction(null)}>
                  Cancel
                </Button>
                <Button
                  className="bg-[#256eff] text-white hover:bg-[#1c55c7]"
                  type="submit"
                  disabled={isSubmitting || projects.length === 0}
                >
                  {isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                  Create Task
                </Button>
              </div>
            </form>
          ) : null}

          {activeAction === "docs" ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Latest files from your projects.
              </p>
              <div className="space-y-2 max-h-[400px] overflow-y-auto overflow-x-hidden pr-1">
                {loadingDocs ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="size-6 animate-spin text-indigo-600" />
                  </div>
                ) : docs.length === 0 ? (
                  <p className="text-center text-sm text-slate-500 py-4">No files found.</p>
                ) : (
                  docs.map((file) => (
                    <div
                      key={file.id}
                      className="flex w-full max-w-full min-w-0 items-center justify-between gap-3 overflow-hidden rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm group"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="grid size-8 shrink-0 place-items-center rounded bg-indigo-50 text-indigo-600">
                          <FileIcon className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-900 truncate" title={file.name}>{file.name}</p>
                          <p className="text-xs text-slate-500 truncate">{file.projectName} • {(file.size / 1024).toFixed(0)} KB</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => window.open(`/api/files?id=${file.id}`, "_blank")}
                      >
                        Download
                      </Button>
                    </div>
                  ))
                )}
              </div>
              <div className="flex items-center justify-end pt-2">
                <Button variant="outline" onClick={() => setActiveAction(null)}>
                  Close
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
