"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Filter,
  LayoutGrid,
  Link as LinkIcon,
  Lock,
  MessageSquare,
  Plus,
  ChevronDown,
  Search,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ColumnCard = {
  id: string;
  title: string;
  tag: string;
  description: string;
  priority?: "High" | "Medium" | "Low";
  dueDate?: string;
  comments: number;
  files: number;
  highlight?: "indigo" | "amber" | "emerald";
  done?: boolean;
  taskId?: string;
};

type Column = {
  id: string;
  title: string;
  status: "Completed" | "Active" | "Testing" | "Pending";
  color: "indigo" | "amber" | "emerald";
  approvalStatus?: "Not Submitted" | "Pending" | "Approved";
  cards: ColumnCard[];
};

type ApprovalStatus = NonNullable<Column["approvalStatus"]>;

const stageTitleMap: Record<string, string> = {
  "stage-1": "Stage F1: Initiation",
  "stage-2": "Stage F2: Planning",
  "stage-3": "Stage F3: Execution",
  "stage-4": "Stage F4: Monitoring & Controlling",
  "stage-5": "Stage F5: Closure",
};
const stageIdByTitle = Object.fromEntries(
  Object.entries(stageTitleMap).map(([id, title]) => [title, id])
);

function normalizeStageId(value?: string | null) {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "";
  if (stageTitleMap[trimmed]) return trimmed;
  return stageIdByTitle[trimmed] ?? trimmed;
}

const initialColumns: Column[] = [
  {
    id: "stage-1",
    title: stageTitleMap["stage-1"],
    status: "Completed",
    color: "indigo",
    approvalStatus: "Approved",
    cards: [
      {
        id: "t-1001",
        title: "Define scope & milestones",
        tag: "Infra",
        description: "Align goals, deliverables, and target dates.",
        priority: "Medium",
        comments: 6,
        files: 2,
      },
      {
        id: "t-1002",
        title: "Research requirements",
        tag: "Infra",
        description: "Gather constraints, risks, and dependencies.",
        priority: "Medium",
        comments: 4,
        files: 1,
      },
    ],
  },
  {
    id: "stage-2",
    title: stageTitleMap["stage-2"],
    status: "Completed",
    color: "indigo",
    approvalStatus: "Pending",
    cards: [
      {
        id: "t-1003",
        title: "Instalasi BigLake di Server Lokal",
        tag: "Infra",
        description: "Brainstorming brings team members' diverse experience into play.",
        priority: "Medium",
        comments: 12,
        files: 0,
      },
      {
        id: "t-1004",
        title: "Research",
        tag: "Infra",
        description: "Brainstorming brings team members' diverse experience into play.",
        priority: "Medium",
        comments: 12,
        files: 0,
      },
      {
        id: "t-1005",
        title: "Research",
        tag: "Infra",
        description: "Brainstorming brings team members' diverse experience into play.",
        priority: "Medium",
        comments: 12,
        files: 0,
      },
    ],
  },
  {
    id: "stage-3",
    title: stageTitleMap["stage-3"],
    status: "Active",
    color: "amber",
    approvalStatus: "Not Submitted",
    cards: [
      {
        id: "t-1006",
        title: "Buat Visualisasi Kependudukan di Big Builder",
        tag: "Infra",
        description: "Brainstorming brings team members' diverse experience into play.",
        comments: 14,
        files: 15,
        priority: "High",
      },
      {
        id: "t-1007",
        title: "Config BigSpider untuk Crawling",
        tag: "Crawler",
        description: "Brainstorming brings team members' diverse experience into play.",
        priority: "Medium",
        comments: 12,
        files: 0,
      },
    ],
  },
  {
    id: "stage-4",
    title: stageTitleMap["stage-4"],
    status: "Testing",
    color: "emerald",
    approvalStatus: "Not Submitted",
    cards: [
      {
        id: "t-1008",
        title: "Test Load API BigEnvelope",
        tag: "QA",
        description: "Planned: Oct 12",
        priority: "Low",
        comments: 0,
        files: 0,
        highlight: "emerald",
      },
    ],
  },
  {
    id: "stage-5",
    title: stageTitleMap["stage-5"],
    status: "Active",
    color: "emerald",
    approvalStatus: "Not Submitted",
    cards: [
      {
        id: "t-1010",
        title: "Release checklist",
        tag: "QA",
        description: "Final verification before handoff.",
        priority: "Medium",
        comments: 3,
        files: 1,
      },
    ],
  },
];

const emptyColumns: Column[] = initialColumns.map((column, index) => ({
  ...column,
  status: index === 0 ? "Active" : "Pending",
  cards: [],
}));

const statusTone = {
  Completed: "bg-emerald-100 text-emerald-700",
  Active: "bg-indigo-100 text-indigo-700",
  Testing: "bg-blue-100 text-blue-700",
  Pending: "bg-amber-100 text-amber-700",
};

const approvalTone: Record<ApprovalStatus, string> = {
  "Not Submitted": "bg-slate-100 text-slate-600",
  Pending: "bg-amber-100 text-amber-700",
  Approved: "bg-emerald-100 text-emerald-700",
};

const priorityTone = {
  High: "bg-rose-100 text-rose-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-emerald-100 text-emerald-700",
};

const statusOptions: Column["status"][] = [
  "Completed",
  "Active",
  "Pending",
  "Testing",
];

const avatarStack = [
  "bg-amber-200",
  "bg-emerald-200",
  "bg-blue-200",
  "bg-purple-200",
];

type CommentItem = {
  id: string;
  author: string;
  text: string;
  time: string;
};

type FileItem = {
  id: string;
  name: string;
  size: string;
  url?: string;
};

const mockComments: CommentItem[] = [
  {
    id: "c-1",
    author: "Eliza Sirait",
    text: "Please align the milestones with the PM timeline.",
    time: "2h ago",
  },
  {
    id: "c-2",
    author: "Nadia",
    text: "I can pick this up after the env setup is ready.",
    time: "5h ago",
  },
];

const mockFiles: FileItem[] = [
  { id: "f-1", name: "requirements.docx", size: "120 KB" },
  { id: "f-2", name: "wireframes.pdf", size: "2.1 MB" },
  { id: "f-3", name: "timeline.xlsx", size: "420 KB" },
];

function tokenizeSearch(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function matchesSearch(haystack: string, queryTokens: string[]) {
  if (!queryTokens.length) return true;
  const haystackTokens = tokenizeSearch(haystack);
  return queryTokens.every((token) => haystackTokens.some((item) => item.startsWith(token)));
}

function normalizeColumns(columns: Column[]) {
  return columns.map((column) => ({
    ...column,
    title: stageTitleMap[column.id] ?? column.title,
    approvalStatus: column.approvalStatus ?? "Not Submitted",
    cards:
      column.status === "Completed"
        ? column.cards.map((card) =>
            card.done === undefined ? { ...card, done: true } : card
          )
        : column.cards,
  }));
}

export function ProjectBoardClient({
  projectName,
  projectId,
  seedTasks = true,
}: {
  projectName: string;
  projectId: string;
  seedTasks?: boolean;
}) {
  const router = useRouter();
  const ignoreNextNavRef = useRef(false);
  const title = useMemo(() => projectName || "Smart City Project", [projectName]);
  const storageKey = useMemo(() => `member-project:v2:${projectId}`, [projectId]);
  const [columns, setColumns] = useState<Column[] | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [filesOpen, setFilesOpen] = useState(false);
  const [commentsList, setCommentsList] = useState<CommentItem[]>(mockComments);
  const [newComment, setNewComment] = useState("");
  const [filesList, setFilesList] = useState<FileItem[]>(mockFiles);
  const [fileToAdd, setFileToAdd] = useState<File | null>(null);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [addTaskStage, setAddTaskStage] = useState<string>("");
  const [taskName, setTaskName] = useState("");
  const [taskMember, setTaskMember] = useState("Select Member");
  const [taskPriority, setTaskPriority] = useState("Select Priority");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [editTaskOpen, setEditTaskOpen] = useState(false);
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [editTaskStageId, setEditTaskStageId] = useState<string | null>(null);
  const [editTaskName, setEditTaskName] = useState("");
  const [editTaskPriority, setEditTaskPriority] = useState<ColumnCard["priority"]>("Medium");
  const [editTaskDescription, setEditTaskDescription] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("All stages");
  const [stageApprovals, setStageApprovals] = useState<Record<string, ApprovalStatus>>({});
  const [loadingTasks, setLoadingTasks] = useState(true);

  const refreshProjectData = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoadingTasks(true);
    }
    try {
      const [tasksRes, approvalsRes] = await Promise.all([
        fetch(`/api/project-tasks?projectId=${encodeURIComponent(projectId)}`),
        fetch(`/api/project-stage-approvals?projectId=${encodeURIComponent(projectId)}`),
      ]);

      const tasksBody = tasksRes.ok ? await tasksRes.json() : { data: [] };
      const approvalsBody = approvalsRes.ok ? await approvalsRes.json() : { data: [] };

      const approvalsMap: Record<string, ApprovalStatus> = {};
      approvalsBody.data?.forEach((row: any) => {
        approvalsMap[row.stage_id] = row.status as ApprovalStatus;
      });

      const tasks = Array.isArray(tasksBody.data) ? tasksBody.data : [];
      const sanitizedApprovals: Record<string, ApprovalStatus> = {};
      const nextColumns = emptyColumns.map((column, index) => {
        const columnTasks = tasks.filter(
          (task: any) => normalizeStageId(task.stage) === column.id
        );
        const cards: ColumnCard[] = columnTasks.map((task: any) => ({
          id: task.id,
          taskId: task.id,
          title: task.title ?? "Untitled Task",
          tag: "Task",
          description: task.description ?? "",
          priority: task.priority ?? "Medium",
          dueDate: task.due_date ?? undefined,
          comments: 0,
          files: 0,
          done: task.status === "Done" || task.status === "Completed",
        }));
        const allDone = cards.length > 0 && cards.every((card) => card.done);
        const approvalStatus: ApprovalStatus =
          cards.length === 0 ? "Not Submitted" : approvalsMap[column.id] ?? "Not Submitted";
        sanitizedApprovals[column.id] = approvalStatus;
        const status: Column["status"] =
          cards.length === 0
            ? index === 0
              ? "Active"
              : "Pending"
            : allDone
              ? "Completed"
              : "Active";
        return { ...column, status, approvalStatus, cards };
      });

      setStageApprovals(sanitizedApprovals);
      setColumns(normalizeColumns(nextColumns));
    } catch {
      setColumns(normalizeColumns(emptyColumns));
    } finally {
      if (!options?.silent) {
        setLoadingTasks(false);
      }
    }
  }, [projectId]);
  const updateColumns = useCallback(
    (updater: (source: Column[]) => Column[]) => {
      setColumns((prev) => {
        const source = prev ?? (seedTasks ? initialColumns : emptyColumns);
        const next = updater(source);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(storageKey, JSON.stringify(next));
        }
        return next;
      });
    },
    [storageKey, seedTasks]
  );

  const stageOptions = useMemo(() => {
    const titles = initialColumns.map((column) => stageTitleMap[column.id] ?? column.title);
    return ["All stages", ...titles];
  }, []);
  const stageOrder = useMemo(() => initialColumns.map((column) => column.id), []);
  const getStageIndex = useCallback(
    (stageId: string) => stageOrder.indexOf(stageId),
    [stageOrder]
  );

  const visibleColumns = useMemo(() => {
    const source = normalizeColumns(columns ?? (seedTasks ? initialColumns : emptyColumns));
    const stageFiltered =
      stageFilter === "All stages" ? source : source.filter((column) => column.title === stageFilter);
    const queryTokens = tokenizeSearch(searchTerm.trim());
    if (!queryTokens.length) return stageFiltered;
    return stageFiltered
      .map((column) => {
        const columnMatch = matchesSearch(column.title, queryTokens);
        if (columnMatch) return column;
        const filteredCards = column.cards.filter((card: ColumnCard) => {
          const haystack = `${card.title} ${card.description ?? ""} ${card.tag}`;
          return matchesSearch(haystack, queryTokens);
        });
        return { ...column, cards: filteredCards };
      })
      .filter((column) => column.cards.length > 0);
  }, [columns, stageFilter, searchTerm]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(storageKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Column[];
        if (Array.isArray(parsed)) {
          if (
            !seedTasks &&
            parsed.some((column) => Array.isArray(column.cards) && column.cards.length > 0)
          ) {
            setColumns(normalizeColumns(emptyColumns));
            window.localStorage.setItem(storageKey, JSON.stringify(emptyColumns));
          } else {
            setColumns(normalizeColumns(parsed));
          }
        } else {
          setColumns(normalizeColumns(seedTasks ? initialColumns : emptyColumns));
        }
      } catch {
        setColumns(normalizeColumns(seedTasks ? initialColumns : emptyColumns));
      }
    } else {
      setColumns(normalizeColumns(seedTasks ? initialColumns : emptyColumns));
    }
    setHydrated(true);
  }, [storageKey, seedTasks]);

  useEffect(() => {
    refreshProjectData();
  }, [refreshProjectData]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!hydrated || !columns) return;
    window.localStorage.setItem(storageKey, JSON.stringify(columns));
  }, [columns, storageKey, hydrated]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white">
              <Plus className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white">
              <LinkIcon className="size-4" />
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <div className="relative w-[280px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="h-10 rounded-lg border-slate-200 bg-white pl-9"
                placeholder="Search Task, Docs, Projects"
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-10 gap-2">
                  <Filter className="size-4" />
                  {stageFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {stageOptions.map((option) => (
                  <DropdownMenuItem
                    key={option}
                    onClick={() => setStageFilter(option)}
                    className={cn(
                      "flex items-center justify-between",
                      stageFilter === option && "font-semibold text-slate-900"
                    )}
                  >
                    <span>{option}</span>
                    {stageFilter === option ? <span>✓</span> : null}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-10 gap-2">
            <Users className="size-4" />
            Invite
          </Button>
          <div className="flex -space-x-2">
            {avatarStack.map((tone, idx) => (
              <div
                key={tone}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-semibold text-slate-700",
                  tone
                )}
              >
                {String.fromCharCode(65 + idx)}
              </div>
            ))}
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-rose-100 text-xs font-semibold text-rose-600">
              +2
            </div>
          </div>
          <Button variant="outline" className="h-10">
            + New Task
          </Button>
          <Button className="h-10 w-10 bg-indigo-600 text-white hover:bg-indigo-700">
            <LayoutGrid className="size-4" />
          </Button>
        </div>
      </header>

      {!hydrated || !columns || loadingTasks ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Loading project board...
        </div>
      ) : visibleColumns.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          No tasks found. Try a different search or stage filter.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
            {visibleColumns.map((column) => (
            <section
              key={column.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              {(() => {
                const stageIndex = getStageIndex(column.id);
                const previousStageId = stageIndex > 0 ? stageOrder[stageIndex - 1] : null;
                const previousApproved =
                  stageIndex === 0
                    ? true
                    : stageApprovals[previousStageId ?? ""] === "Approved";
                const isLocked = !previousApproved;
                const approvalStatus = stageApprovals[column.id] ?? "Not Submitted";
                const approvalLabel =
                  approvalStatus === "Pending"
                    ? "Menunggu Approval"
                    : approvalStatus === "Approved"
                      ? "Approved"
                      : "Kirim Approval";
                return (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{column.title}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          disabled={isLocked}
                          variant="outline"
                          size="sm"
                          className={cn(
                            "h-7 gap-1 rounded-md px-2 text-xs",
                            statusTone[column.status]
                          )}
                        >
                          <span>{column.status}</span>
                          <ChevronDown className="size-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-40">
                        {statusOptions.map((status) => (
                          <DropdownMenuItem
                            key={status}
                            disabled={isLocked}
                            onSelect={(event) => {
                              event.preventDefault();
                              updateColumns((source) =>
                                source.map((item) => {
                                  if (item.id !== column.id) return item;
                                  return {
                                    ...item,
                                    status,
                                    cards:
                                      status === "Completed"
                                        ? item.cards.map((card) => ({ ...card, done: true }))
                                        : item.cards,
                                  };
                                })
                              );
                            }}
                            className={cn(
                              "flex items-center justify-between",
                              column.status === status && "font-semibold text-slate-900"
                            )}
                          >
                            <span>{status}</span>
                            {column.status === status ? <span>✓</span> : null}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-md px-2 py-1 text-xs font-semibold",
                        approvalTone[approvalStatus]
                      )}
                    >
                      {approvalStatus}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      disabled={
                        approvalStatus === "Pending" ||
                        approvalStatus === "Approved" ||
                        isLocked ||
                        column.cards.length === 0 ||
                        column.cards.some((card) => !card.done)
                      }
                      onClick={async () => {
                        try {
                          const res = await fetch("/api/project-stage-approvals", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              projectId,
                              stageId: column.id,
                              status: "Pending",
                            }),
                          });
                          if (!res.ok) return;
                          await refreshProjectData();
                        } catch {
                          // ignore
                        }
                      }}
                    >
                      {approvalLabel}
                    </Button>
                    {isLocked ? (
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Lock className="size-3" />
                        Menunggu approval stage sebelumnya
                      </div>
                    ) : null}
                  </div>
                </div>
                  <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={isLocked}
                  onClick={() => {
                    setAddTaskStage(column.title);
                    setTaskName("");
                    setTaskMember("Select Member");
                    setTaskPriority("Select Priority");
                    setTaskDueDate("");
                    setTaskDescription("");
                    setAddTaskOpen(true);
                  }}
                >
                  <Plus className="size-4 text-slate-500" />
                </Button>
              </div>
                );
              })()}

            <div className="mt-4 space-y-4">
                {column.cards
                  .map((card, index) => ({ card, index }))
                .sort(
                  (a, b) =>
                    Number(Boolean(b.card.done)) - Number(Boolean(a.card.done)) ||
                    a.index - b.index
                )
                .map(({ card }) => {
                  const isDone = Boolean(card.done);
                  return (
                    <div
                      key={card.id}
                      role="button"
                      tabIndex={0}
                      onClick={(event) => {
                        if (ignoreNextNavRef.current) {
                          ignoreNextNavRef.current = false;
                          return;
                        }
                        const target = event.target as HTMLElement | null;
                        if (target?.closest('[data-no-nav="true"]')) return;
                        router.push(`/member/tasks/${card.id}`);
                      }}
                      onKeyDown={(event) => {
                        if (event.key !== "Enter" && event.key !== " ") return;
                        if (ignoreNextNavRef.current) {
                          ignoreNextNavRef.current = false;
                          return;
                        }
                        const target = event.target as HTMLElement | null;
                        if (target?.closest('[data-no-nav="true"]')) return;
                        event.preventDefault();
                        router.push(`/member/tasks/${card.id}`);
                      }}
                      className={cn(
                        "flex min-h-[180px] cursor-pointer flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md",
                        isDone && "bg-slate-200 opacity-50"
                      )}
                    >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "rounded-md px-2 py-1 text-xs font-semibold",
                        card.priority ? priorityTone[card.priority] : "bg-slate-100 text-slate-700"
                      )}
                    >
                      {card.priority ? `${card.priority} Priority` : "No Priority"}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          data-no-nav="true"
                          className="text-xs text-slate-400 hover:text-slate-600"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            ignoreNextNavRef.current = true;
                          }}
                        >
                          •••
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem
                          onSelect={async (event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            ignoreNextNavRef.current = true;
                            const nextDone = !card.done;
                            const applyDoneState = (value: boolean) => {
                              updateColumns((source) =>
                                source.map((column) => {
                                  if (!column.cards.some((item) => item.id === card.id)) {
                                    return column;
                                  }
                                  const nextCards = column.cards.map((item) =>
                                    item.id === card.id ? { ...item, done: value } : item
                                  );
                                  const allDone =
                                    nextCards.length > 0 && nextCards.every((item) => item.done);
                                  const nextStatus =
                                    nextCards.length === 0
                                      ? getStageIndex(column.id) === 0
                                        ? "Active"
                                        : "Pending"
                                      : allDone
                                        ? "Completed"
                                        : "Active";
                                  return {
                                    ...column,
                                    status: nextStatus,
                                    cards: nextCards,
                                  };
                                })
                              );
                            };
                            applyDoneState(nextDone);
                            const taskId = card.taskId;
                            if (!taskId) return;
                            try {
                              const statusCandidates = nextDone
                                ? ["Done", "Completed"]
                                : ["In Progress", "Active"];
                              let requestOk = false;
                              for (const status of statusCandidates) {
                                const res = await fetch(`/api/project-tasks/${taskId}`, {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ status }),
                                });
                                if (res.ok) {
                                  requestOk = true;
                                  break;
                                }
                              }
                              if (!requestOk) {
                                applyDoneState(!nextDone);
                                await refreshProjectData({ silent: true });
                              }
                            } finally {
                              // no-op: keep optimistic state unless we detect a failure
                            }
                          }}
                        >
                          {card.done ? "Mark as Undone" : "Mark as Done"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={(event) => {
                            event.stopPropagation();
                            ignoreNextNavRef.current = true;
                            setEditTaskId(card.id);
                            setEditTaskStageId(column.id);
                            setEditTaskName(card.title);
                            setEditTaskPriority(card.priority ?? "Medium");
                            setEditTaskDescription(card.description ?? "");
                            setEditTaskOpen(true);
                          }}
                        >
                          Edit task
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-rose-600 focus:text-rose-600"
                          onSelect={(event) => {
                            event.stopPropagation();
                            ignoreNextNavRef.current = true;
                            if (!window.confirm("Yakin menghapus task ini?")) return;
                            if (!card.taskId) return;
                            fetch(`/api/project-tasks/${card.taskId}`, {
                              method: "DELETE",
                            })
                              .then((res) => {
                                if (!res.ok) return;
                                return refreshProjectData();
                              })
                              .catch(() => undefined)
                              .finally(() => {
                                if (editTaskId === card.id) {
                                  setEditTaskOpen(false);
                                }
                              });
                          }}
                        >
                          Delete task
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                    <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          isDone ? "text-slate-800" : "text-slate-900"
                        )}
                      >
                        {card.title}
                      </p>
                    </div>
                    {card.description ? (
                      <p className={cn("text-xs", isDone ? "text-slate-700" : "text-slate-500")}>
                        {card.description}
                      </p>
                    ) : null}
                  </div>
                  <div className="mt-auto flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center -space-x-1">
                      {avatarStack.slice(0, 3).map((tone) => (
                        <div
                          key={`${card.id}-${tone}`}
                          className={cn(
                            "h-6 w-6 rounded-full border-2 border-white",
                            tone
                          )}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        data-no-nav="true"
                        className="flex items-center gap-1 text-slate-500 hover:text-slate-700"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setCommentsOpen(true);
                        }}
                      >
                        <MessageSquare className="size-3" />
                        {commentsList.length} comments
                      </button>
                      <button
                        type="button"
                        data-no-nav="true"
                        className="flex items-center gap-1 text-slate-500 hover:text-slate-700"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setFilesOpen(true);
                        }}
                      >
                        <FileText className="size-3" />
                        {filesList.length} files
                      </button>
                    </div>
                  </div>
                    </div>
                  );
                })}
            </div>
            </section>
          ))}
        </div>
      )}

      <Dialog open={commentsOpen} onOpenChange={setCommentsOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-900">Comments</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              {commentsList.map((comment) => (
                <div key={comment.id} className="rounded-xl border border-slate-200 p-3">
                  <p className="text-sm font-semibold text-slate-900">{comment.author}</p>
                  <p className="text-sm text-slate-600">{comment.text}</p>
                  <p className="text-xs text-slate-400">{comment.time}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800" htmlFor="commentInput">
                Chat
              </label>
              <textarea
                id="commentInput"
                value={newComment}
                onChange={(event) => setNewComment(event.target.value)}
                className="min-h-[100px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                placeholder="Tulis komentar..."
              />
              <div className="flex justify-end">
                <Button
                  className="bg-[#256eff] text-white hover:bg-[#1c55c7]"
                  onClick={() => {
                    if (!newComment.trim()) return;
                    setCommentsList((prev) => [
                      {
                        id: `c-${Date.now()}`,
                        author: "You",
                        text: newComment.trim(),
                        time: "just now",
                      },
                      ...prev,
                    ]);
                    setNewComment("");
                  }}
                >
                  Send
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={filesOpen} onOpenChange={setFilesOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-900">Files</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              {filesList.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm text-slate-700"
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-900">{file.name}</p>
                    <p className="text-xs text-slate-400">{file.size}</p>
                  </div>
                  {file.url ? (
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-semibold text-indigo-600 hover:underline"
                    >
                      View
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400">No preview</span>
                  )}
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800" htmlFor="fileUpload">
                Submit Files
              </label>
              <Input
                id="fileUpload"
                type="file"
                onChange={(event) => setFileToAdd(event.target.files?.[0] ?? null)}
              />
              <div className="flex justify-end">
                <Button
                  className="bg-[#256eff] text-white hover:bg-[#1c55c7]"
                  onClick={() => {
                    if (!fileToAdd) return;
                    const url = URL.createObjectURL(fileToAdd);
                    setFilesList((prev) => [
                      {
                        id: `f-${Date.now()}`,
                        name: fileToAdd.name,
                        size: `${Math.max(1, Math.round(fileToAdd.size / 1024))} KB`,
                        url,
                      },
                      ...prev,
                    ]);
                    setFileToAdd(null);
                  }}
                >
                  Submit
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={addTaskOpen} onOpenChange={setAddTaskOpen}>
        <DialogContent className="max-w-3xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-900">Add Task</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!taskName.trim()) return;
              const stageId = stageOrder.find(
                (stageKey) => stageTitleMap[stageKey] === addTaskStage
              );
              if (!stageId) return;
              fetch("/api/project-tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  projectId,
                  stageId,
                  title: taskName.trim(),
                  description: taskDescription.trim(),
                  priority:
                    taskPriority === "High" ||
                    taskPriority === "Medium" ||
                    taskPriority === "Low"
                      ? (taskPriority as ColumnCard["priority"])
                      : "Medium",
                  dueDate: taskDueDate.trim() || null,
                }),
              })
                .then((res) => {
                  if (!res.ok) return;
                  return refreshProjectData();
                })
                .finally(() => {
                  setAddTaskOpen(false);
                });
            }}
          >
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800" htmlFor="taskName">
                Task Name
              </label>
              <Input
                id="taskName"
                placeholder="Redesign Project Dashboard"
                value={taskName}
                onChange={(event) => setTaskName(event.target.value)}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-800" htmlFor="taskProject">
                  Project
                </label>
                <select
                  id="taskProject"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
                  defaultValue={title}
                >
                  <option>{title}</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-800" htmlFor="taskMember">
                  Assigned Team Member
                </label>
                <select
                  id="taskMember"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
                  value={taskMember}
                  onChange={(event) => setTaskMember(event.target.value)}
                >
                  <option disabled>Select Member</option>
                  <option>Eliza Sirait</option>
                  <option>Nadia</option>
                  <option>Arif</option>
                </select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-800" htmlFor="taskPriority">
                  Priority
                </label>
                <select
                  id="taskPriority"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
                  value={taskPriority}
                  onChange={(event) => setTaskPriority(event.target.value)}
                >
                  <option disabled>Select Priority</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-800" htmlFor="taskDue">
                  Due Date
                </label>
                <Input
                  id="taskDue"
                  placeholder="mm/dd/yy"
                  value={taskDueDate}
                  onChange={(event) => setTaskDueDate(event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800" htmlFor="taskStage">
                Stage
              </label>
              <Input id="taskStage" value={addTaskStage} readOnly />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800" htmlFor="taskDesc">
                Description
              </label>
              <textarea
                id="taskDesc"
                className="min-h-[140px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                placeholder="Redesign Project Dashboard"
                value={taskDescription}
                onChange={(event) => setTaskDescription(event.target.value)}
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="border-rose-200 text-rose-600 hover:bg-rose-50"
                onClick={() => setAddTaskOpen(false)}
              >
                Cancel
              </Button>
              <Button className="bg-[#256eff] text-white hover:bg-[#1c55c7]" type="submit">
                Add Task
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editTaskOpen} onOpenChange={setEditTaskOpen}>
        <DialogContent className="max-w-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-900">Edit Task</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!editTaskId || !editTaskName.trim()) return;
              updateColumns((source) =>
                source.map((column) => ({
                  ...column,
                  cards: column.cards.map((card) =>
                    card.id === editTaskId
                      ? {
                          ...card,
                          title: editTaskName.trim(),
                          description: editTaskDescription.trim(),
                          priority: editTaskPriority ?? "Medium",
                        }
                      : card
                  ),
                }))
              );
              if (editTaskStageId) {
                const target = columns
                  ?.find((column) => column.id === editTaskStageId)
                  ?.cards.find((card) => card.id === editTaskId);
                if (target?.taskId) {
                  fetch(`/api/project-tasks/${target.taskId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      title: editTaskName.trim(),
                      description: editTaskDescription.trim(),
                      priority: editTaskPriority ?? "Medium",
                    }),
                  })
                    .then((res) => {
                      if (!res.ok) return;
                      return refreshProjectData();
                    })
                    .catch(() => undefined);
                }
              }
              setEditTaskOpen(false);
            }}
          >
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800" htmlFor="editTaskName">
                Task Name
              </label>
              <Input
                id="editTaskName"
                placeholder="Redesign Project Dashboard"
                value={editTaskName}
                onChange={(event) => setEditTaskName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800" htmlFor="editTaskPriority">
                Priority
              </label>
              <select
                id="editTaskPriority"
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
                value={editTaskPriority}
                onChange={(event) =>
                  setEditTaskPriority(event.target.value as ColumnCard["priority"])
                }
              >
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800" htmlFor="editTaskDesc">
                Description
              </label>
              <textarea
                id="editTaskDesc"
                className="min-h-[120px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                placeholder="Redesign Project Dashboard"
                value={editTaskDescription}
                onChange={(event) => setEditTaskDescription(event.target.value)}
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="border-rose-200 text-rose-600 hover:bg-rose-50"
                onClick={() => setEditTaskOpen(false)}
              >
                Cancel
              </Button>
              <Button className="bg-[#256eff] text-white hover:bg-[#1c55c7]" type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
