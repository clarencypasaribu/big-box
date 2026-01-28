"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  Eye,
  File,
  Filter,
  Loader2,
  Folder,
  Search,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function safeDateFormat(dateStr: string) {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", year: "numeric" }).format(date);
  } catch {
    return "";
  }
}

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type ApprovalRow = {
  id: string;
  name: string;
  code?: string;
  location: string;
  stage: string;
  updated: string;
  team: string[];
  pm?: string | null;
};

export type StagePhase = {
  title: string;
  code: string;
  status: "done" | "current" | "pending" | "in-review";
};

export type StageTask = {
  id: string;
  title: string;
  done: boolean;
  owner?: string;
  updated?: string;
};

export type StageFile = {
  id: string;
  name: string;
  owner: string;
  size: string;
  stageLabel?: string;
};

export type ApprovalDetail = {
  id: string;
  project: string;
  code?: string;
  pm?: string | null;
  stageId: string;
  stage: string;
  stageCode: string;
  nextStage: string;
  nextStageCode: string;
  note: string;
  phases: StagePhase[];
  tasks: StageTask[];
  files: StageFile[];
};

const stageDefinitions = [
  { id: "stage-1", code: "F1", title: "Initiation", aliases: ["F1", "Initiation"] },
  { id: "stage-2", code: "F2", title: "Planning", aliases: ["F2", "Planning"] },
  { id: "stage-3", code: "F3", title: "Execution", aliases: ["F3", "Execution"] },
  { id: "stage-4", code: "F4", title: "Monitoring", aliases: ["F4", "Monitoring"] },
  { id: "stage-5", code: "F5", title: "Closure", aliases: ["F5", "Closure"] },
];

const stageOrder = stageDefinitions.map((stage) => stage.id);

const phaseTone: Record<StagePhase["status"], string> = {
  done: "border-emerald-200 bg-emerald-50 text-emerald-700",
  current: "border-indigo-200 bg-indigo-50 text-indigo-700",
  "in-review": "border-sky-200 bg-sky-50 text-sky-700",
  pending: "border-slate-200 bg-slate-50 text-slate-600",
};

function normalizeStageId(stageId?: string | null) {
  const input = (stageId ?? "").toLowerCase();
  if (!input) return stageOrder[0];
  const match = stageDefinitions.find(
    (stage) =>
      stage.id === stageId ||
      stage.code.toLowerCase() === input ||
      stage.aliases.some((alias) => input.includes(alias.toLowerCase()))
  );
  return match?.id ?? stageOrder[0];
}

function stageMeta(stageId?: string | null) {
  const normalized = normalizeStageId(stageId);
  const meta = stageDefinitions.find((stage) => stage.id === normalized);
  return {
    id: normalized,
    code: meta?.code ?? "F?",
    title: meta?.title ?? "Unknown Stage",
    label: `${meta?.code ?? "Fx"} - ${meta?.title ?? "Stage"}`,
  };
}

export function ApprovalsClient({
  rows,
  details = {},
}: {
  rows: ApprovalRow[];
  details?: Record<string, ApprovalDetail>;
}) {
  const [search, setSearch] = useState("");
  const [selectedStages, setSelectedStages] = useState<Set<string>>(new Set());
  const [items, setItems] = useState<ApprovalRow[]>(rows);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailCache, setDetailCache] = useState<Record<string, ApprovalDetail>>(details);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();

    return items.filter((row) => {
      // Search filter
      const haystack = `${row.name} ${row.code ?? ""} ${row.location} ${row.stage} ${row.team.join(" ")}`.toLowerCase();
      const matchesSearch = !term || haystack.includes(term);

      // Stage filter
      // Extract code from "F1 - Initiation" -> "F1" to match filter keys
      const rowStageCode = row.stage.split(" - ")[0];
      const matchesStage = selectedStages.size === 0 || selectedStages.has(rowStageCode);

      return matchesSearch && matchesStage;
    });
  }, [items, search, selectedStages]);

  const selectedDetail = selectedId ? detailCache[selectedId] : null;

  function statusToPhaseState(status: string | null | undefined) {
    if (status === "Approved") return "done";
    if (status === "Pending" || status === "In Review") return "in-review";
    return "pending";
  }

  async function fetchDetail(projectId: string) {
    setLoadingDetail(true);
    setDetailError(null);
    try {
      const [approvalsRes, tasksRes] = await Promise.all([
        fetch(`/api/project-stage-approvals?projectId=${encodeURIComponent(projectId)}`),
        fetch(`/api/project-tasks?projectId=${encodeURIComponent(projectId)}`),
      ]);

      const approvalsBody = approvalsRes.ok ? await approvalsRes.json() : { data: [] };
      const tasksBody = tasksRes.ok ? await tasksRes.json() : { data: [] };

      const approvals: { stageId: string; status: string }[] = (approvalsBody.data ?? []).map((row: any) => ({
        stageId: normalizeStageId(row.stage_id),
        status: row.status ?? "Pending",
      }));
      const approvalsMap: Record<string, string> = {};
      approvals.forEach((row) => {
        approvalsMap[row.stageId] = row.status;
      });

      const firstPending = stageOrder.find((stageId) => approvalsMap[stageId] !== "Approved") ?? stageOrder[0];
      const currentStageMeta = stageMeta(firstPending);
      const currentIndex = stageOrder.indexOf(currentStageMeta.id);
      const nextStageMeta = stageMeta(stageOrder[currentIndex + 1] ?? currentStageMeta.id);

      const phases: StagePhase[] = stageOrder.map((stageId) => {
        const meta = stageMeta(stageId);
        const status = approvalsMap[stageId];
        return {
          code: meta.code,
          title: meta.title,
          status: stageId === currentStageMeta.id ? "current" : statusToPhaseState(status),
        };
      });

      const activeTasks: StageTask[] =
        (tasksBody.data ?? [])
          .filter((task: any) => normalizeStageId(task.stage) === currentStageMeta.id)
          .map((task: any) => ({
            id: task.id ?? crypto.randomUUID(),
            title: task.title ?? "Untitled Task",
            done: task.status === "Done" || task.status === "Completed",
            owner: task.assignee ?? "",
            updated: task.due_date ? safeDateFormat(task.due_date) : "",
            // store raw files if needed for individual task view, but here we aggregate
            rawFiles: task.files ?? []
          })) ?? [];

      const stageFiles: StageFile[] = [];
      (tasksBody.data ?? [])
        // Show files from ALL stages so PM can review past/future deliverables
        // .filter((task: any) => normalizeStageId(task.stage) === currentStageMeta.id)
        .forEach((task: any) => {
          if (task.files && Array.isArray(task.files)) {
            task.files.forEach((f: any) => {
              const taskStageMeta = stageMeta(normalizeStageId(task.stage));
              stageFiles.push({
                id: f.id,
                name: f.name,
                owner: task.assignee || "Team",
                size: f.size ? `${Math.round(f.size / 1024)} KB` : "0 KB",
                stageLabel: taskStageMeta.code, // Add stage label
              });
            });
          }
        });

      return {
        approvalsMap,
        currentStageMeta,
        nextStageMeta,
        phases,
        activeTasks,
        files: stageFiles
      };
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : "Failed to load approval details.");
      return null;
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleSelect(project: ApprovalRow) {
    setSelectedId(project.id);
    if (detailCache[project.id]) return;
    const result = await fetchDetail(project.id);
    if (!result) return;

    const detail: ApprovalDetail = {
      id: project.id,
      project: project.name,
      code: project.code,
      pm: project.pm,
      stageId: result.currentStageMeta.id,
      stage: result.currentStageMeta.title,
      stageCode: result.currentStageMeta.code,
      nextStage: result.nextStageMeta.title,
      nextStageCode: result.nextStageMeta.code,
      note: "Make sure all tasks in this stage are complete before approval.",
      phases: result.phases,
      tasks: result.activeTasks,
      files: result.files,
    };

    setDetailCache((prev) => ({ ...prev, [project.id]: detail }));
  }

  const [rejectionComment, setRejectionComment] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  async function handleApprove() {
    if (!selectedId) return;
    const detail = detailCache[selectedId];
    const stageId = detail?.stageId;
    if (stageId) {
      await fetch(`/api/project-stage-approvals/${stageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: selectedId, status: "Approved" }),
      });
    }
    setItems((prev) => prev.filter((row) => row.id !== selectedId));
    setSelectedId(null);
  }

  async function handleReject() {
    if (!selectedId) return;
    const detail = detailCache[selectedId];
    const stageId = detail?.stageId;

    if (stageId) {
      await fetch(`/api/project-stage-approvals/${stageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedId,
          status: "Rejected",
          comment: rejectionComment
        }),
      });
    }
    setItems((prev) => prev.filter((row) => row.id !== selectedId));
    setSelectedId(null);
    setShowRejectInput(false);
    setRejectionComment("");
  }

  return (
    <>
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-11 rounded-md border-slate-200 bg-slate-50 pl-10 text-sm"
                placeholder="Search project or code"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-11 gap-2 rounded-md border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                >
                  <Filter className="size-4" />
                  Filter
                  {selectedStages.size > 0 && (
                    <span className="ml-1 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold">
                      {selectedStages.size}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white">
                <DropdownMenuLabel>Filter Stage</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {stageDefinitions.map((stage) => (
                  <DropdownMenuCheckboxItem
                    key={stage.id}
                    checked={selectedStages.has(stage.code)}
                    onCheckedChange={(checked) => {
                      setSelectedStages((prev) => {
                        const next = new Set(prev);
                        if (checked) next.add(stage.code);
                        else next.delete(stage.code);
                        return next;
                      });
                    }}
                  >
                    {stage.code} - {stage.title}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <Table className="min-w-[900px]">
              <TableHeader className="bg-slate-50">
                <TableRow className="border-slate-200">
                  <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                    Project
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                    Team Approval
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                    Current Stage
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                    Last Updated
                  </TableHead>
                  <TableHead className="text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-6 text-center text-sm text-slate-500">
                      No pending approvals. All stages are approved.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map((project) => (
                    <TableRow
                      key={project.id}
                      className="border-slate-200 text-sm text-slate-800 hover:bg-slate-50"
                    >
                      <TableCell className="min-w-[220px]">
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 grid size-10 place-items-center rounded-lg bg-indigo-50 text-indigo-600 ring-1 ring-slate-200">
                            <Folder className="size-5" />
                          </span>
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-slate-900">{project.name}</p>
                              {project.code ? (
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 ring-1 ring-slate-200">
                                  {project.code}
                                </span>
                              ) : null}
                            </div>
                            <p className="text-xs text-slate-500">Location: {project.location || "No location"}</p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="min-w-[220px]">
                        <div className="flex flex-wrap items-center gap-2">
                          {project.team.map((person) => (
                            <span
                              key={person}
                              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm"
                            >
                              <span className="grid size-6 place-items-center rounded-full bg-slate-900 text-[10px] font-bold uppercase text-white">
                                {person.slice(0, 1)}
                              </span>
                              {person}
                            </span>
                          ))}
                        </div>
                      </TableCell>

                      <TableCell className="min-w-[150px]">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-900">{project.stage}</p>
                          <p className="text-xs text-slate-500">Awaiting approval</p>
                        </div>
                      </TableCell>

                      <TableCell className="min-w-[140px]">
                        <div className="space-y-1 text-sm">
                          <p className="font-semibold text-slate-800">{project.updated}</p>
                          <p className="text-xs text-slate-500">Last touch</p>
                        </div>
                      </TableCell>

                      <TableCell className="min-w-[120px] text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 rounded-full border-slate-200 text-slate-700 hover:bg-slate-100"
                          aria-label={`View details for ${project.name}`}
                          onClick={() => handleSelect(project)}
                        >
                          <Eye className="size-4" />
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      <Dialog open={!!selectedId} onOpenChange={(open) => {
        if (!open) {
          setSelectedId(null);
          setShowRejectInput(false);
          setRejectionComment("");
        }
      }}>
        <DialogContent className="max-h-[85vh] w-full max-w-4xl overflow-y-auto border-slate-200 bg-white p-6 sm:p-8">
          {selectedDetail ? (
            <div className="space-y-8">
              <DialogHeader className="space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <DialogTitle className="text-3xl font-bold text-slate-900">
                      {selectedDetail.project}
                    </DialogTitle>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                      <span>ID: {selectedDetail.code ?? selectedDetail.id}</span>
                      <span className="text-slate-300">•</span>
                      <span>PM: {selectedDetail.pm}</span>
                      <span className="text-slate-300">•</span>
                      <span className="font-medium text-indigo-600">Current Stage: {selectedDetail.stage}</span>
                    </div>
                  </div>
                </div>


                {/* Phases Visual */}
                <div className="flex w-full flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/50 p-2 sm:flex-nowrap">
                  {selectedDetail.phases.map((phase) => (
                    <div
                      key={phase.code}
                      className={cn(
                        "flex w-full flex-1 flex-col items-center justify-center rounded-md py-2 px-1 text-center transition-all sm:w-auto",
                        phase.status === 'current' ? "bg-white shadow-sm ring-1 ring-slate-200" :
                          phase.status === 'done' ? "text-emerald-700 opacity-70" : "text-slate-400"
                      )}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider mb-1">{phase.code}</span>
                      <span className="text-xs font-semibold truncate w-full px-1" title={phase.title}>{phase.title}</span>
                    </div>
                  ))}
                </div>
              </DialogHeader>

              <div className="grid gap-8 lg:grid-cols-2">
                {/* Left Column: Tasks & Files */}
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900">Tasks</h3>
                      <Badge className="rounded-full bg-slate-100 text-slate-600 font-medium">
                        {selectedDetail.tasks.length} items
                      </Badge>
                    </div>
                    {selectedDetail.tasks.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-sm text-slate-500">
                        No tasks for this stage.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                        {selectedDetail.tasks.map((task) => (
                          <div key={task.id} className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                            <div className={cn(
                              "mt-0.5 grid size-5 place-items-center rounded-full text-[10px]",
                              task.done ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"
                            )}>
                              {task.done ? <CheckCircle2 className="size-3" /> : <div className="size-2 rounded-full bg-slate-400" />}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">{task.title}</p>
                              <p className="text-xs text-slate-500">{task.owner || "Unassigned"}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900">Deliverables</h3>
                      <Badge className="rounded-full bg-slate-100 text-slate-600 font-medium">
                        {selectedDetail.files.length} files
                      </Badge>
                    </div>
                    {selectedDetail.files.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-sm text-slate-500">
                        No files attached yet.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedDetail.files.map((file) => (
                          <div key={file.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                            <div className="flex items-center gap-3">
                              <div className="grid size-8 place-items-center rounded bg-white text-slate-400 shadow-sm border border-slate-100">
                                <File className="size-4" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-900 line-clamp-1">{file.name}</p>
                                <p className="text-xs text-slate-500">{file.size}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="size-8 text-slate-400 hover:text-indigo-600" onClick={() => window.open(`/api/files?id=${file.id}`, "_blank")}>
                              <Download className="size-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Actions */}
                <div className="space-y-6">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">Approval Decision</h3>
                      <p className="text-sm text-slate-500">
                        Review the deliverables above. Approving will move the project to <strong className="text-slate-900">{selectedDetail.nextStage}</strong>.
                      </p>
                    </div>

                    {showRejectInput ? (
                      <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reason for rejection</Label>
                          <Textarea
                            placeholder="Describe what needs to be fixed or added..."
                            value={rejectionComment}
                            onChange={(e) => setRejectionComment(e.target.value)}
                            className="min-h-[100px] resize-none bg-white"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="destructive"
                            className="flex-1"
                            onClick={handleReject}
                            disabled={!rejectionComment.trim()}
                          >
                            Confirm Rejection
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Button
                          className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                          onClick={handleApprove}
                        >
                          <CheckCircle2 className="mr-2 size-4" />
                          Approve & Next Stage
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full h-11 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          onClick={() => setShowRejectInput(true)}
                        >
                          <XCircle className="mr-2 size-4" />
                          Reject & Request Changes
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg bg-indigo-50 p-4 text-xs text-indigo-700 flex gap-3">
                    <div className="mt-0.5"><Eye className="size-4" /></div>
                    <p>
                      <strong>PM Note:</strong> Ensure all "Tasks" are marked done and required "Deliverables" are uploaded before approving. Rejected stages will notify the team to make adjustments.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-3">
              <DialogTitle className="sr-only">Loading approval detail</DialogTitle>
              <Loader2 className="size-8 animate-spin text-slate-300" />
              <p className="text-sm">Loading project details...</p>
            </div>
          )}
        </DialogContent >
      </Dialog >
    </>
  );
}
