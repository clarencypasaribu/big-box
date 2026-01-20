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
  const [items, setItems] = useState<ApprovalRow[]>(rows);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailCache, setDetailCache] = useState<Record<string, ApprovalDetail>>(details);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((row) => {
      const haystack = `${row.name} ${row.code ?? ""} ${row.location} ${row.stage} ${row.team.join(" ")}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [items, search]);

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

      const approvals = (approvalsBody.data ?? []).map((row: any) => ({
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
            updated: task.due_date ? new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(task.due_date)) : "",
          })) ?? [];

      return {
        approvalsMap,
        currentStageMeta,
        nextStageMeta,
        phases,
        activeTasks,
      };
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : "Gagal memuat detail approval");
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
      note: "Pastikan seluruh task pada stage ini sudah lengkap sebelum approve.",
      phases: result.phases,
      tasks: result.activeTasks,
      files: [],
    };

    setDetailCache((prev) => ({ ...prev, [project.id]: detail }));
  }

  function handleApprove() {
    if (!selectedId) return;
    const detail = detailCache[selectedId];
    const stageId = detail?.stageId;
    if (stageId) {
      fetch(`/api/project-stage-approvals/${stageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: selectedId, status: "Approved" }),
      }).catch(() => {
        // optimistic remove; fallback to local only
      });
    }
    setItems((prev) => prev.filter((row) => row.id !== selectedId));
    setSelectedId(null);
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
                placeholder="Cari project atau kode"
              />
            </div>
            <Button
              variant="outline"
              className="h-11 rounded-md border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
              type="button"
            >
              <Filter className="size-4" />
              Filter
            </Button>
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
                      Tidak ada approval menunggu. Semua state sudah disetujui.
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
                            <p className="text-xs text-slate-500">Lokasi: {project.location || "Tidak ada lokasi"}</p>
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
                          <p className="text-xs text-slate-500">Menunggu approval</p>
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
                          aria-label={`Lihat detail ${project.name}`}
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

      <Dialog open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="max-w-5xl border-slate-200 bg-white">
          {selectedDetail ? (
            <>
              <DialogHeader className="space-y-2">
                <DialogTitle className="text-2xl font-semibold text-slate-900">
                  {selectedDetail.project}
                </DialogTitle>
                <DialogDescription asChild>
                  <div className="space-y-1 text-sm text-slate-600">
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50 px-3 py-1">
                        Stage: {selectedDetail.stage} ({selectedDetail.stageCode})
                      </Badge>
                      <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50 px-3 py-1">
                        ID: {selectedDetail.code ?? selectedDetail.id}
                      </Badge>
                      <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50 px-3 py-1">
                        PM: {selectedDetail.pm}
                      </Badge>
                    </div>
                    <p>{selectedDetail.note}</p>
                  </div>
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-5 lg:grid-cols-[1.1fr,0.9fr]">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    {selectedDetail.phases.map((phase) => (
                      <Card key={phase.code} className={`border ${phaseTone[phase.status]} shadow-sm`}>
                        <CardContent className="space-y-2 p-4">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                            <span className="text-slate-500">{phase.code}</span>
                            {phase.status === "done" && <CheckCircle2 className="size-4 text-emerald-600" />}
                            {phase.status === "in-review" && (
                              <span className="size-2 rounded-full bg-sky-500" aria-hidden />
                            )}
                          </div>
                          <p className="text-base font-semibold text-slate-900">{phase.title}</p>
                          <Badge
                            className="w-fit rounded-full border border-white/50 bg-white/60 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide"
                            variant="outline"
                          >
                            {phase.status === "done"
                              ? "Completed"
                              : phase.status === "current"
                                ? "Current"
                                : phase.status === "in-review"
                                  ? "In Review"
                                  : "Pending"}
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Card className="border-slate-200 shadow-sm">
                    <CardContent className="space-y-4 p-4 md:p-5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900">Task Per Phase</h3>
                        <Badge className="rounded-full bg-emerald-50 text-emerald-700">
                          {selectedDetail.tasks.filter((task) => task.done).length}/{selectedDetail.tasks.length} selesai
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        {selectedDetail.tasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5"
                          >
                            <span
                              className={`mt-0.5 grid size-6 place-items-center rounded-full border text-white ${
                                task.done
                                  ? "border-emerald-100 bg-emerald-500"
                                  : "border-amber-200 bg-amber-400"
                              }`}
                            >
                              {task.done ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}
                            </span>
                            <div className="space-y-1">
                              <p className="font-semibold text-slate-900">{task.title}</p>
                              <p className="text-xs text-slate-500">
                                {task.owner ? `Owner: ${task.owner}` : "Owner belum diisi"}
                                {task.updated ? ` • Update: ${task.updated}` : ""}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                        <CheckCircle2 className="size-4" />
                        Semua task pada phase ini sudah dicek tim.
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-200 shadow-sm">
                    <CardContent className="space-y-3 p-4 md:p-5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900">Files dari Tim</h3>
                        <Badge className="rounded-full bg-slate-100 text-slate-700">
                          {selectedDetail.files.length} file
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {selectedDetail.files.length === 0 ? (
                          <p className="text-sm text-slate-500">Belum ada file terlampir.</p>
                        ) : (
                          selectedDetail.files.map((file) => (
                            <div
                              key={file.id}
                              className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5"
                            >
                              <div className="flex items-center gap-3">
                                <span className="grid size-9 place-items-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-200">
                                  <File className="size-4" />
                                </span>
                                <div className="leading-tight">
                                  <p className="font-semibold text-slate-900">{file.name}</p>
                                  <p className="text-xs text-slate-500">
                                    {file.owner} • {file.size}
                                  </p>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm" className="gap-2 text-slate-700 hover:bg-slate-100">
                                <Download className="size-4" />
                                Unduh
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <Card className="border-slate-200 shadow-sm">
                    <CardContent className="space-y-4 p-4 md:p-5">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Next Stage</p>
                        <p className="text-xl font-semibold text-slate-900">
                          {selectedDetail.nextStageCode} - {selectedDetail.nextStage}
                        </p>
                        <p className="text-sm text-slate-600">
                          Dengan menyetujui, semua deliverable untuk {selectedDetail.stageCode} telah dicek dan valid.
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                        <div className="flex items-center gap-2 font-semibold text-slate-800">
                          <ArrowRight className="size-4 text-indigo-600" />
                          Team approval
                        </div>
                        <p>Pastikan semua checklist selesai dan file pendukung telah di-review.</p>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                          variant="outline"
                          className="flex-1 border-rose-200 text-rose-600 hover:bg-rose-50"
                          onClick={() => setSelectedId(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700"
                          onClick={handleApprove}
                        >
                          Approve & Hapus dari daftar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-200 shadow-sm">
                    <CardContent className="space-y-2 p-4 md:p-5">
                      <p className="text-sm font-semibold text-slate-800">Approval akan menghapus item ini</p>
                      <p className="text-xs text-slate-600">
                        Setelah disetujui, state ini tidak lagi muncul di daftar approval utama. Pastikan kamu sudah
                        mengarsipkan catatan dan file penting.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-2 p-6">
              <DialogHeader className="sr-only">
                <DialogTitle>Loading approval detail</DialogTitle>
              </DialogHeader>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                {detailError ? (
                  <span>{detailError}</span>
                ) : (
                  <>
                    <Loader2 className="size-4 animate-spin text-slate-500" />
                    Loading detail...
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
