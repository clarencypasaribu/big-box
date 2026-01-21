"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { MoveRight, FileText, AlertTriangle, Paperclip, X } from "lucide-react";
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

export function AllTasksClient({ projects }: { projects: ProjectRef[] }) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);

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
        alert("Deliverables berhasil dikirim!");
      } else {
        throw new Error("Gagal mengirim data");
      }
    } catch (err: any) {
      alert("Gagal mengirim deliverable.");
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
        alert("Blocker berhasil dikirim ke Project Manager!");
      }
    } catch (err: any) {
      alert(err.message || "Gagal mengirim blocker. Silakan coba lagi.");
    } finally {
      setSubmittingBlocker(false);
    }
  };

  const emptyMessage = useMemo(
    () => "Belum ada task dari My Projects.",
    []
  );

  const firstProjectId = projects[0]?.id;

  return (
    <>
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">All Tasks</CardTitle>
          {firstProjectId && (
            <Button asChild variant="ghost" size="sm" className="text-slate-600">
              <Link href={`/member/project/${firstProjectId}`}>
                View project board
                <MoveRight className="size-4" />
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 md:col-span-2">
              Loading tasks...
            </div>
          ) : tasks.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 md:col-span-2">
              {emptyMessage}
            </div>
          ) : (
            tasks.map((task) => (
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
                    <Badge variant="outline" className={cn("rounded-md", statusTone[task.status] ?? "text-slate-700")}>
                      {task.status}
                    </Badge>
                  </div>
                </div>
                <p className="relative z-10 text-xs text-slate-600">Stage: {task.stage}</p>

                {/* Action Buttons */}
                {!task.done && (
                  <div className="relative z-10 flex gap-2 pt-2 border-t border-slate-100">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1 text-xs h-8"
                      onClick={() => handleOpenDeliverable(task)}
                    >
                      <FileText className="size-3" />
                      Submit Deliverables
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1 text-xs h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      onClick={() => handleOpenBlocker(task)}
                    >
                      <AlertTriangle className="size-3" />
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
              className="bg-indigo-600 hover:bg-indigo-700"
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
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {submittingBlocker ? "Sending..." : "Raise a Blocker"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
