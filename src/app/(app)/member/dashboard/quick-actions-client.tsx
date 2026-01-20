"use client";

import { useEffect, useMemo, useState } from "react";
import type { ElementType } from "react";
import { BookMarked, Loader, Plus } from "lucide-react";

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

type QuickActionId = "create-task" | "log-time" | "docs";

type QuickAction = {
  id: QuickActionId;
  label: string;
  description: string;
  icon: ElementType;
  accent: string;
};

type ColumnCard = {
  id: string;
  title: string;
  tag: string;
  description: string;
  priority?: "High" | "Medium" | "Low";
  comments: number;
  files: number;
  highlight?: "indigo" | "amber" | "emerald";
};

type Column = {
  id: string;
  title: string;
  status: "Completed" | "Active" | "Testing";
  color: "indigo" | "amber" | "emerald";
  cards: ColumnCard[];
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
    id: "log-time",
    label: "Log Time",
    description: "Record Work Hours",
    icon: Loader,
    accent: "bg-[#fdeff0]",
  },
  {
    id: "docs",
    label: "Docs",
    description: "View BigBox Wiki",
    icon: BookMarked,
    accent: "bg-[#f9eed3]",
  },
];

const docLinks = [
  { id: "getting-started", label: "Getting Started" },
  { id: "workflows", label: "Project Workflows" },
  { id: "api", label: "API References" },
];

const projectOptions = ["Mobile App", "BigBox Care", "DataOps"];

const stageOptions = [
  "Stage F1: Initiation",
  "Stage F2: Planning",
  "Stage F3: Execution",
  "Stage F4: Monitoring & Controlling",
  "Stage F5: Closure",
];

const defaultColumns: Column[] = [
  {
    id: "stage-1",
    title: "Stage F1: Initiation",
    status: "Completed",
    color: "indigo",
    cards: [],
  },
  {
    id: "stage-2",
    title: "Stage F2: Planning",
    status: "Completed",
    color: "indigo",
    cards: [],
  },
  {
    id: "stage-3",
    title: "Stage F3: Execution",
    status: "Active",
    color: "amber",
    cards: [],
  },
  {
    id: "stage-4",
    title: "Stage F4: Monitoring & Controlling",
    status: "Testing",
    color: "emerald",
    cards: [],
  },
  {
    id: "stage-5",
    title: "Stage F5: Closure",
    status: "Active",
    color: "emerald",
    cards: [],
  },
];

function getStorageKey(projectName: string) {
  return `member-project:v2:${projectName}`;
}

function loadColumns(projectName: string) {
  if (typeof window === "undefined") return defaultColumns;
  const raw = window.localStorage.getItem(getStorageKey(projectName));
  if (!raw) return defaultColumns;
  try {
    const parsed = JSON.parse(raw) as Column[];
    return Array.isArray(parsed) ? parsed : defaultColumns;
  } catch {
    return defaultColumns;
  }
}

export function QuickActionsClient() {
  const [activeAction, setActiveAction] = useState<QuickActionId | null>(null);
  const active = useMemo(
    () => quickActions.find((action) => action.id === activeAction) ?? null,
    [activeAction]
  );
  const [taskName, setTaskName] = useState("");
  const [projectName, setProjectName] = useState(projectOptions[0]);
  const [priority, setPriority] = useState<ColumnCard["priority"]>("Medium");
  const [stage, setStage] = useState(stageOptions[0]);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (activeAction !== "create-task") return;
    setTaskName("");
    setProjectName(projectOptions[0]);
    setPriority("Medium");
    setStage(stageOptions[0]);
    setDueDate("");
    setNotes("");
  }, [activeAction]);

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
        <DialogContent className="max-w-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-900">
              {active?.label ?? "Quick Action"}
            </DialogTitle>
          </DialogHeader>

          {activeAction === "create-task" ? (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (!taskName.trim()) return;
                if (typeof window !== "undefined") {
                  const nextColumns = loadColumns(projectName).map((column) =>
                    column.title !== stage
                      ? column
                      : {
                          ...column,
                          cards: [
                            {
                              id: `t-${Date.now()}`,
                              title: taskName.trim(),
                              tag: "Quick Action",
                              description: notes.trim(),
                              priority,
                              comments: 0,
                              files: 0,
                            },
                            ...column.cards,
                          ],
                        }
                  );
                  window.localStorage.setItem(
                    getStorageKey(projectName),
                    JSON.stringify(nextColumns)
                  );
                }
                setActiveAction(null);
              }}
            >
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
                    value={projectName}
                    onChange={(event) => setProjectName(event.target.value)}
                  >
                    {projectOptions.map((project) => (
                      <option key={project}>{project}</option>
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
                    onChange={(event) => setPriority(event.target.value as ColumnCard["priority"])}
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
                  placeholder="mm/dd/yy"
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
                <Button className="bg-[#256eff] text-white hover:bg-[#1c55c7]" type="submit">
                  Create Task
                </Button>
              </div>
            </form>
          ) : null}

          {activeAction === "log-time" ? (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                setActiveAction(null);
              }}
            >
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-800" htmlFor="qaLogTask">
                  Task
                </label>
                <Input id="qaLogTask" placeholder="Instalasi BigLake di Server Lokal" required />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-800" htmlFor="qaLogDate">
                    Date
                  </label>
                  <Input id="qaLogDate" placeholder="mm/dd/yy" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-800" htmlFor="qaLogHours">
                    Hours
                  </label>
                  <Input id="qaLogHours" type="number" min="0" step="0.5" placeholder="2.5" required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-800" htmlFor="qaLogNotes">
                  Notes
                </label>
                <textarea
                  id="qaLogNotes"
                  className="min-h-[120px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  placeholder="What did you work on?"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setActiveAction(null)}>
                  Cancel
                </Button>
                <Button className="bg-[#256eff] text-white hover:bg-[#1c55c7]" type="submit">
                  Log Time
                </Button>
              </div>
            </form>
          ) : null}

          {activeAction === "docs" ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Quick links to frequently used documentation in BigBox Wiki.
              </p>
              <div className="space-y-2">
                {docLinks.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-slate-900">{link.label}</span>
                    <Button variant="outline" size="sm" onClick={() => setActiveAction(null)}>
                      Open
                    </Button>
                  </div>
                ))}
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
