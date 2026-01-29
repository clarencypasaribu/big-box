"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { MoveRight, FileText, AlertTriangle, Paperclip, X, LayoutGrid, List, ChevronDown, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ProjectRef = {
  id?: string;
  name: string;
};

type TaskItem = {
  id: string;
  title: string;
  description?: string;
  project: string;
  projectId: string;
  priority?: "High" | "Medium" | "Low";
  status: string;
  stage: string;
  dueDate?: string;
  done?: boolean;
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

const stageTitleMap: Record<string, string> = {
  "stage-1": "Stage F1: Initiation",
  "stage-2": "Stage F2: Planning",
  "stage-3": "Stage F3: Execution",
  "stage-4": "Stage F4: Monitoring & Controlling",
  "stage-5": "Stage F5: Closure",
};

const productCategories = [
  "Big Vision",
  "Traffic Monitor",
  "SOC Platform",
  "IDS",
  "Data Pipeline",
  "Other",
];

const STATUS_OPTIONS = ["Not Started", "In Progress", "Done"] as const;

export function AllTasksClient({ projects }: { projects: ProjectRef[] }) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [hideCompleted, setHideCompleted] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedMode = localStorage.getItem("tasks-view-mode") as "grid" | "list";
      if (savedMode) {
        setViewMode(savedMode);
      }
    }
  }, []);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  // Submit Deliverables Dialog State
  const [deliverableOpen, setDeliverableOpen] = useState(false);
  const [deliverableTask, setDeliverableTask] = useState<TaskItem | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [totalDataIngest, setTotalDataIngest] = useState("");
  const [deliverableNotes, setDeliverableNotes] = useState("");
  const [submittingDeliverable, setSubmittingDeliverable] = useState(false);

  // Report Blocker Dialog State
  const [blockerOpen, setBlockerOpen] = useState(false);
  const [blockerTask, setBlockerTask] = useState<TaskItem | null>(null);
  const [blockerTitle, setBlockerTitle] = useState("");
  const [blockerProduct, setBlockerProduct] = useState("");
  const [blockerDescription, setBlockerDescription] = useState("");
  const [blockerAttachment, setBlockerAttachment] = useState<File | null>(null);
  const [submittingBlocker, setSubmittingBlocker] = useState(false);

  const fetchAllTasks = useCallback(async () => {
    if (!projects.length) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const allTasks: TaskItem[] = [];

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
              allTasks.push({
                id: task.id,
                title: task.title ?? "Untitled Task",
                description: task.description ?? "",
                project: project.name,
                projectId: project.id!,
                priority: task.priority ?? undefined,
                status: isDone ? "Completed" : (task.status ?? "Active"),
                stage: stageTitleMap[task.stage] ?? task.stage ?? "Unknown Stage",
                dueDate: task.due_date ?? undefined,
                done: isDone,
              });
            });
          } catch {
            // ignore errors for individual projects
          }
        })
      );
    } catch {
      // ignore
    }

    allTasks.sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return 0;
    });

    setTasks(allTasks);
    setLoading(false);
  }, [projects]);

  useEffect(() => {
    fetchAllTasks();
  }, [fetchAllTasks]);

  const handleViewModeChange = (mode: "grid" | "list") => {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("tasks-view-mode", mode);
    }
  };

  const handleQuickStatusUpdate = async (task: TaskItem, newStatus: string) => {
    setUpdatingTaskId(task.id);
    try {
      const res = await fetch(`/api/project-tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        // Update local state
        const isDone = newStatus === "Done" || newStatus === "Completed";
        setTasks(prev => prev.map(t =>
          t.id === task.id
            ? { ...t, status: isDone ? "Completed" : newStatus, done: isDone }
            : t
        ));
      }
    } catch (error) {
      console.error("Failed to update task status:", error);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleOpenDeliverable = (task: TaskItem) => {
    setDeliverableTask(task);
    setAttachmentFile(null);
    setTotalDataIngest("");
    setDeliverableNotes("");
    setDeliverableOpen(true);
  };

  // Helper to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmitDeliverable = async () => {
    if (!deliverableTask) return;
    setSubmittingDeliverable(true);

    try {
      let attachmentData = null;
      if (attachmentFile) {
        attachmentData = await fileToBase64(attachmentFile);
      }

      const res = await fetch("/api/deliverables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: deliverableTask.id,
          attachmentFileName: attachmentFile?.name ?? null,
          attachmentData: attachmentData,
          attachmentSize: attachmentFile?.size ?? 0,
          attachmentType: attachmentFile?.type ?? "",
          totalDataIngest,
          notes: deliverableNotes,
        }),
      });

      if (res.ok) {
        setDeliverableOpen(false);
        fetchAllTasks();
        alert("Deliverables sent successfully.");
      } else {
        throw new Error("Failed to send data.");
      }
    } catch (err: any) {
      alert("Failed to submit deliverable.");
    } finally {
      setSubmittingDeliverable(false);
    }
  };

  const handleOpenBlocker = (task: TaskItem) => {
    setBlockerTask(task);
    setBlockerTitle("");
    setBlockerProduct("");
    setBlockerDescription("");
    setBlockerAttachment(null);
    setBlockerOpen(true);
  };

  const handleSubmitBlocker = async () => {
    if (!blockerTask) return;
    if (!blockerTitle.trim() && !blockerDescription.trim()) return;

    setSubmittingBlocker(true);

    try {
      let attachmentData = null;
      if (blockerAttachment) {
        attachmentData = await fileToBase64(blockerAttachment);
      }

      const res = await fetch("/api/blockers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: blockerTask.id,
          title: blockerTitle.trim(),
          product: blockerProduct,
          reason: blockerTitle.trim(),
          notes: blockerDescription.trim(),
          attachmentFileName: blockerAttachment?.name ?? null,
          attachmentData: attachmentData,
          attachmentSize: blockerAttachment?.size ?? 0,
          attachmentType: blockerAttachment?.type ?? "",
        }),
      });

      if (res.ok) {
        setBlockerOpen(false);
        alert("Blocker sent to the Project Manager.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to send blocker. Please try again.");
    } finally {
      setSubmittingBlocker(false);
    }
  };

  const emptyMessage = useMemo(
    () => "No tasks from My Projects yet.",
    []
  );

  const filteredTasks = useMemo(() => {
    if (hideCompleted) {
      return tasks.filter(t => !t.done);
    }
    return tasks;
  }, [tasks, hideCompleted]);

  const firstProjectId = projects[0]?.id;

  return (
    <>
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-lg">All Tasks</CardTitle>
          <div className="flex items-center gap-2">
            {/* Hide Completed Toggle */}
            <Button
              variant="outline"
              size="sm"
              className={cn("h-7 gap-2 px-2 text-xs", hideCompleted && "bg-slate-100 text-slate-700")}
              onClick={() => setHideCompleted(!hideCompleted)}
            >
              {hideCompleted ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              <span className="hidden sm:inline">{hideCompleted ? "Hidden" : "Show All"}</span>
            </Button>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-lg border border-slate-200 p-0.5">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2"
                onClick={() => handleViewModeChange("grid")}
                title="Task Focus Mode"
              >
                <LayoutGrid className="size-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2"
                onClick={() => handleViewModeChange("list")}
                title="Table View"
              >
                <List className="size-4" />
              </Button>
            </div>
            {firstProjectId && (
              <Button asChild variant="ghost" size="sm" className="text-slate-600">
                <Link href={`/member/project/${firstProjectId}`}>
                  View project board
                  <MoveRight className="size-4" />
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className={viewMode === "list" ? "p-0" : "grid gap-4 md:grid-cols-2"}>
          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 md:col-span-2">
              Loading tasks...
            </div>
          ) : tasks.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 md:col-span-2">
              {emptyMessage}
            </div>
          ) : viewMode === "list" ? (
            /* List View using Table */
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[30%]">Task</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => (
                  <TableRow key={`${task.projectId}-${task.id}`} className={task.done ? "bg-slate-50/50" : undefined}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className={cn("font-medium text-slate-900", task.done && "text-slate-500 line-through")}>
                          {task.title}
                        </span>
                        {task.dueDate && (
                          <span className="text-xs text-slate-500">
                            Due {new Date(task.dueDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600">{task.project}</TableCell>
                    <TableCell className="text-slate-600">{task.stage}</TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs font-medium border-0", task.priority ? priorityTone[task.priority] : "bg-slate-100 text-slate-600")}>
                        {task.priority || "None"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild disabled={task.done || updatingTaskId === task.id}>
                          <Button variant="ghost" size="sm" className={cn("-ml-3 h-8 gap-1 text-xs font-normal", task.status === "Completed" ? "text-emerald-600" : "text-slate-700")}>
                            {updatingTaskId === task.id ? (
                              <span className="animate-pulse">Updating...</span>
                            ) : (
                              <>
                                {task.status}
                                <ChevronDown className="size-3 opacity-50" />
                              </>
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          {STATUS_OPTIONS.map((status) => (
                            <DropdownMenuItem
                              key={status}
                              onClick={() => handleQuickStatusUpdate(task, status)}
                              className={task.status === status ? "bg-slate-100" : ""}
                            >
                              {status}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {!task.done && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                              onClick={() => handleOpenDeliverable(task)}
                              title="View / Submit Deliverables"
                            >
                              <FileText className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                              onClick={() => handleOpenBlocker(task)}
                              title="Report Blocker"
                            >
                              <AlertTriangle className="size-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            /* Grid View */
            filteredTasks.map((task) => (
              <div
                key={`${task.projectId}-${task.id}`}
                className={cn(
                  "relative flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm",
                  task.priority ? highlightTone[task.priority] : "border-l-slate-300",
                  "border-l-4"
                )}
              >
                {task.done ? (
                  <div className="pointer-events-none absolute inset-0 rounded-xl bg-slate-200/60" />
                ) : null}
                <div className="relative z-10 flex items-start justify-between gap-2">
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
                    {/* Quick Status Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild disabled={task.done || updatingTaskId === task.id}>
                        <Button variant="outline" size="sm" className="h-6 gap-1 text-xs px-2">
                          {updatingTaskId === task.id ? "..." : task.status}
                          <ChevronDown className="size-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {STATUS_OPTIONS.map((status) => (
                          <DropdownMenuItem
                            key={status}
                            onClick={() => handleQuickStatusUpdate(task, status)}
                            className={task.status === status ? "bg-slate-100" : ""}
                          >
                            {status}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div className="relative z-10 flex items-center justify-between text-xs text-slate-600">
                  <span>Stage: {task.stage}</span>
                  {task.dueDate && (
                    <span className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-slate-700">
                      📅 {new Date(task.dueDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                {!task.done && (
                  <div className="relative z-10 flex gap-2 pt-2 border-t border-slate-100">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1 text-xs h-8"
                      onClick={() => handleOpenDeliverable(task)}
                    >
                      Submit Deliverables
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1 text-xs h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      onClick={() => handleOpenBlocker(task)}
                    >
                      Report Blocker
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Submit Deliverables Dialog */}
      <Dialog open={deliverableOpen} onOpenChange={setDeliverableOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Deliverables</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Upload File
              </label>
              <div className="flex items-center gap-2">
                <label className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500 hover:border-indigo-400 hover:bg-indigo-50 transition">
                    {attachmentFile ? (
                      <span className="text-slate-700 font-medium truncate">{attachmentFile.name}</span>
                    ) : (
                      <span>Click to select file...</span>
                    )}
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => setAttachmentFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                {attachmentFile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-rose-500 hover:text-rose-600"
                    onClick={() => setAttachmentFile(null)}
                  >
                    ✕
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Total Data ter Ingest
              </label>
              <Input
                placeholder={deliverableTask?.title ?? "Enter data count..."}
                value={totalDataIngest}
                onChange={(e) => setTotalDataIngest(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Notes</label>
              <Textarea
                placeholder={deliverableTask?.title ?? "Enter notes..."}
                value={deliverableNotes}
                onChange={(e) => setDeliverableNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setDeliverableOpen(false)}
              className="bg-rose-500 text-white hover:bg-rose-600 border-0"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitDeliverable}
              disabled={submittingDeliverable}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submittingDeliverable ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report A Blocker Dialog */}
      <Dialog open={blockerOpen} onOpenChange={setBlockerOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-900">Report A Blocker</DialogTitle>
            {blockerTask && (
              <p className="text-sm text-slate-500">Task: {blockerTask.title}</p>
            )}
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Blocker Title */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Blocker Title</Label>
              <Input
                placeholder="e.g., Koneksi ke CCTV terputus"
                value={blockerTitle}
                onChange={(e) => setBlockerTitle(e.target.value)}
              />
            </div>

            {/* Product Involved */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Product Involved</Label>
              <div className="grid grid-cols-3 gap-2">
                {productCategories.map((product) => (
                  <Button
                    key={product}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "justify-center text-xs h-9",
                      blockerProduct === product && "bg-indigo-100 border-indigo-300 text-indigo-700"
                    )}
                    onClick={() => setBlockerProduct(product)}
                  >
                    {product}
                  </Button>
                ))}
              </div>
            </div>

            {/* Detailed Description */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Detailed Description</Label>
              <Textarea
                placeholder="Describe the blocker in detail. Include error messages, steps to reproduce, and any relevant context..."
                value={blockerDescription}
                onChange={(e) => setBlockerDescription(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Attachment */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Attachment (Optional)</Label>
              <div className="flex items-center gap-2">
                <label className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500 hover:border-indigo-400 hover:bg-indigo-50 transition">
                    <Paperclip className="size-4" />
                    {blockerAttachment ? (
                      <span className="text-slate-700 font-medium truncate">{blockerAttachment.name}</span>
                    ) : (
                      <span>Click to attach file (log, screenshot, etc.)</span>
                    )}
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => setBlockerAttachment(e.target.files?.[0] ?? null)}
                  />
                </label>
                {blockerAttachment && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-rose-500 hover:text-rose-600"
                    onClick={() => setBlockerAttachment(null)}
                  >
                    <X className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setBlockerOpen(false)}
              className="bg-rose-500 text-white hover:bg-rose-600 border-0"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitBlocker}
              disabled={submittingBlocker || (!blockerTitle.trim() && !blockerDescription.trim())}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {submittingBlocker ? "Sending..." : "Raise a Blocker"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
