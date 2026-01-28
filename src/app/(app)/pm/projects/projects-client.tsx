"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/utils/supabase";

export type ProjectRow = {
  id?: string | null; // project id for routing
  name: string;
  code?: string | null;
  location: string;
  status: "In Progress" | "Completed" | "Not Started" | "Pending";
  progress: number;
  stageLabel?: string;
  lead: string;
  updated?: string | null;
  description?: string | null;
  iconBg?: string;
  startDate?: string | null;
  endDate?: string | null;
  teamMembers?: string[];
  stageDeadlines?: StageDeadlines | null;
};

type StageDeadlines = {
  "stage-1": string;
  "stage-2": string;
  "stage-3": string;
  "stage-4": string;
  "stage-5": string;
};

type ProjectFormState = {
  name: string;
  code: string;
  location: string;
  status: ProjectRow["status"];
  lead: string;
  description: string;
  startDate: string;
  deadline: string;
  teamMembers: string[];
  stageDeadlines: StageDeadlines;
};

const defaultStageDeadlines: StageDeadlines = {
  "stage-1": "",
  "stage-2": "",
  "stage-3": "",
  "stage-4": "",
  "stage-5": "",
};

const stageLabels: Record<string, string> = {
  "stage-1": "Initiation",
  "stage-2": "Planning",
  "stage-3": "Execution",
  "stage-4": "Monitoring & Controlling",
  "stage-5": "Closure",
};

const statusOptions: ProjectRow["status"][] = ["In Progress", "Completed", "Not Started", "Pending"];

const defaultTeamOptions = [
  "Eliza Sirait",
  "Claren Pas",
  "Sarah Jenkins",
  "Lina Hartono",
  "Rafi Mahendra",
  "Dwi Kurniawan",
  "Fina Putri",
];

const statusColor: Record<ProjectRow["status"], string> = {
  "In Progress": "bg-amber-50 text-amber-700",
  Completed: "bg-emerald-50 text-emerald-700",
  "Not Started": "bg-slate-100 text-slate-700",
  Pending: "bg-blue-50 text-blue-700",
};

function progressTone(status: ProjectRow["status"]) {
  if (status === "Completed") return "bg-emerald-500";
  if (status === "Pending") return "bg-rose-500";
  return "bg-indigo-500";
}

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function ProjectsClient({
  initialProjects,
  searchQuery,
}: {
  initialProjects: ProjectRow[];
  searchQuery?: string;
}) {
  const router = useRouter();
  const normalizeId = (value?: string | null) => {
    const raw = (value ?? "").trim();
    if (!raw || raw === "undefined" || raw === "null") return "";
    return raw;
  };
  const ensureProjectId = (items: ProjectRow[]) => {
    let changed = false;
    const next = items.map((project) => {
      const normalized = normalizeId(project.id) || normalizeId(project.code) || null;
      if (normalized !== (project.id ?? null)) {
        changed = true;
        return { ...project, id: normalized };
      }
      return project;
    });
    return changed ? next : items;
  };
  const [projects, setProjects] = useState<ProjectRow[]>(() => ensureProjectId(initialProjects));
  const [loading, setLoading] = useState(!initialProjects.length);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | "view">("create");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<ProjectRow | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [leadOptions, setLeadOptions] = useState<string[]>([]);
  const [teamOptions, setTeamOptions] = useState<string[]>(defaultTeamOptions);
  const [newMember, setNewMember] = useState("");
  const [teamSearch, setTeamSearch] = useState("");
  const [form, setForm] = useState<ProjectFormState>({
    name: "",
    code: "",
    location: "",
    status: "In Progress",
    lead: "",
    description: "",
    startDate: "",
    deadline: "",
    teamMembers: [],
    stageDeadlines: { ...defaultStageDeadlines },
  });

  const dialogTitle =
    dialogMode === "create" ? "Add Project" : dialogMode === "edit" ? "Edit Project" : "Project Details";
  const isViewMode = dialogMode === "view";

  useEffect(() => {
    if (!initialProjects.length) {
      fetchProjects();
    }
  }, [initialProjects.length]);

  useEffect(() => {
    if (projects.length && projects.some((project) => !project.id && !project.code)) {
      fetchProjects();
    }
  }, [projects]);

  useEffect(() => {
    async function loadTeamOptions() {
      try {
        const res = await fetch("/api/profiles");
        if (!res.ok) return;
        const body = await res.json();
        const raw = body.data ?? [];
        const leadNames = new Set<string>();
        const memberNames = new Set<string>();

        raw.forEach((row: any) => {
          const name = row.full_name || row.email || row.id;
          if (!name) return;
          const role = String(row.role ?? "").toLowerCase().trim();
          const isLead = role === "project manager" || role === "project_manager" || role === "pm";
          const isMember = role === "team member" || role === "team_member";
          if (isLead) leadNames.add(name);
          else if (isMember) memberNames.add(name);
        });

        const leadList = Array.from(leadNames);
        const memberList = Array.from(memberNames);
        setLeadOptions(leadList);
        setTeamOptions(memberList.length ? memberList : defaultTeamOptions);
      } catch {
        // Fallback to static list.
      }
    }

    loadTeamOptions();
  }, []);

  useEffect(() => {
    if (dialogMode === "edit" && !editId && form.code.trim()) {
      setEditId(form.code.trim());
    }
  }, [dialogMode, editId, form.code]);

  useEffect(() => {
    if (!form.lead && leadOptions.length) {
      setForm((prev) => ({ ...prev, lead: prev.lead || leadOptions[0] }));
    }
  }, [leadOptions, form.lead]);

  async function fetchProjects() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to fetch project data.");
      }
      const body = await res.json();
      const rows: ProjectRow[] =
        body.data?.map((row: any) => ({
          id: normalizeId(row.id) || normalizeId(row.code) || null,
          name: row.name ?? "Untitled Project",
          code: row.code ?? "",
          location: row.location ?? "",
          status: statusOptions.includes(row.status) ? row.status : "In Progress",
          progress: typeof row.progress === "number" ? row.progress : 0,
          lead: row.lead ?? "Unassigned",
          updated: row.updated_at ?? row.created_at,
          description: row.description ?? "",
          iconBg: row.icon_bg ?? "bg-indigo-100 text-indigo-700",
          startDate: row.start_date ?? null,
          endDate: row.end_date ?? null,
          teamMembers: row.team_members ?? [],
        })) ?? [];

      setProjects(rows);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to fetch project data.");
    } finally {
      setLoading(false);
    }
  }

  function openCreateDialog() {
    setEditId(null);
    setDialogMode("create");
    setTeamOptions(defaultTeamOptions);
    setForm({
      name: "",
      code: "",
      location: "",
      status: "In Progress",
      lead: "",
      description: "",
      startDate: "",
      deadline: "",
      teamMembers: [],
      stageDeadlines: { ...defaultStageDeadlines },
    });
    setDialogOpen(true);
    setError(null);
  }

  function openEditDialog(project: ProjectRow) {
    const nextId = normalizeId(project.id) || normalizeId(project.code) || null;
    if (!nextId) {
      setError("Project ID is required to edit.");
      return;
    }
    setEditId(nextId);
    setDialogMode("edit");
    setTeamOptions((prev) => {
      const merged = new Set([...prev, ...(project.teamMembers || []), project.lead].filter(Boolean));
      return Array.from(merged);
    });
    setLeadOptions((prev) => {
      if (project.lead && !prev.includes(project.lead)) return [...prev, project.lead];
      return prev;
    });
    setForm({
      name: project.name || "",
      code: project.code || "",
      location: project.location || "",
      status: project.status,
      lead: project.lead || leadOptions[0] || "",
      description: project.description || "",
      startDate: project.startDate || "",
      deadline: project.endDate || "",
      teamMembers: project.teamMembers || [],
      stageDeadlines: { ...defaultStageDeadlines },
    });
    setDialogOpen(true);
    setError(null);
  }

  function goToDetail(project: ProjectRow) {
    const slug = normalizeId(project.id) || normalizeId(project.code);
    if (!slug) {
      setError("Project does not have an ID or code to open.");
      return;
    }
    const encoded = encodeURIComponent(slug);
    router.push(`/pm/projects/${encoded}?id=${encoded}`);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const isEdit = dialogMode === "edit";
    const safeEditId = isEdit ? normalizeId(editId) || normalizeId(form.code) : "";
    const payload = {
      ...form,
      id: isEdit ? safeEditId || undefined : undefined,
      progress: 0, // Auto-calculated from tasks
    };
    if (isEdit && !safeEditId) {
      setSaving(false);
      setError("Project ID is required to edit.");
      return;
    }
    const endpoint = isEdit ? `/api/projects/${safeEditId}` : "/api/projects";
    const method = isEdit ? "PUT" : "POST";

    const token = await supabase.auth.getSession().then((res) => res.data.session?.access_token);
    const authHeader: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const headers: HeadersInit = { "Content-Type": "application/json", ...(authHeader as any) };
      const res = await fetch(endpoint, { method, headers, body: JSON.stringify(payload) });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to save project.");
      }

      const body = await res.json();
      const saved: any = body.data;
      const normalized: ProjectRow = {
        id: normalizeId(saved?.id) || normalizeId(saved?.code) || null,
        name: saved?.name ?? payload.name,
        code: saved?.code ?? payload.code,
        location: saved?.location ?? payload.location,
        status: statusOptions.includes(saved?.status) ? saved.status : payload.status,
        progress: typeof saved?.progress === "number" ? saved.progress : payload.progress,
        lead: saved?.lead ?? payload.lead,
        updated: saved?.updated_at ?? saved?.created_at ?? new Date().toISOString(),
        description: saved?.description ?? payload.description,
        iconBg: saved?.icon_bg ?? "bg-indigo-100 text-indigo-700",
        startDate: saved?.start_date ?? payload.startDate ?? null,
        endDate: saved?.end_date ?? payload.deadline ?? null,
        teamMembers: saved?.team_members ?? payload.teamMembers ?? [],
        stageDeadlines: saved?.stage_deadlines ?? payload.stageDeadlines ?? null,
      };

      setProjects((prev) => {
        if (editId) {
          const targetId = normalizeId(editId);
          return prev.map((item) =>
            normalizeId(item.id) === targetId ? { ...item, ...normalized } : item
          );
        }
        return [normalized, ...prev];
      });

      setDialogOpen(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to save project.");
    } finally {
      setSaving(false);
    }
  }



  async function confirmDelete(id?: string | null, code?: string | null) {
    const targetId = normalizeId(id) || normalizeId(code);
    if (!targetId) {
      setError("Project ID is required to delete.");
      return;
    }
    setDeletingId(targetId);
    setError(null);
    const token = await supabase.auth.getSession().then((res) => res.data.session?.access_token);
    const authHeader: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const res = await fetch(`/api/projects/${targetId}?id=${encodeURIComponent(targetId)}`, {
        method: "DELETE",
        headers: { ...(authHeader as any), "Content-Type": "application/json" },
        body: JSON.stringify({ id: targetId, code: normalizeId(code) }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to delete project.");
      }
      setProjects((prev) =>
        prev.filter(
          (item) =>
            normalizeId(item.id) !== targetId && normalizeId(item.code) !== targetId
        )
      );
      setProjectToDelete(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to delete project.");
    } finally {
      setDeletingId(null);
    }
  }

  function handleAddMember() {
    const value = newMember.trim();
    if (!value) return;
    setTeamOptions((prev) => (prev.includes(value) ? prev : [...prev, value]));
    setForm((prev) => ({
      ...prev,
      teamMembers: prev.teamMembers.includes(value)
        ? prev.teamMembers
        : [...prev.teamMembers, value],
    }));
    setNewMember("");
    setTeamSearch("");
  }

  const projectSearch = searchQuery ?? "";

  const filteredTeam = useMemo(() => {
    const term = teamSearch.trim().toLowerCase();
    if (!term) return teamOptions;
    return teamOptions.filter((name) => name.toLowerCase().includes(term));
  }, [teamOptions, teamSearch]);

  const filteredProjects = useMemo(() => {
    const term = projectSearch.trim().toLowerCase();
    if (!term) return projects;
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        (p.code || "").toLowerCase().includes(term) ||
        p.location.toLowerCase().includes(term) ||
        p.lead.toLowerCase().includes(term)
    );
  }, [projects, projectSearch]);

  const hasData = useMemo(() => filteredProjects.length > 0, [filteredProjects.length]);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-800">Projects</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={fetchProjects} disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            Refresh
          </Button>
          <Button className="bg-[#256eff] text-white hover:bg-[#1c55c7]" onClick={openCreateDialog}>
            <Plus className="mr-2 size-4" />
            Add Project
          </Button>
        </div>
      </div>
      <Table>
      <TableHeader className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <TableRow className="hover:bg-slate-50">
          <TableHead>Project</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Progress</TableHead>
          <TableHead>Stage</TableHead>
          <TableHead>Lead</TableHead>
          <TableHead>Updated</TableHead>
          <TableHead className="text-center">Actions</TableHead>
        </TableRow>
      </TableHeader>
        <TableBody className="text-sm text-slate-800">
          {loading ? (
            <TableRow>
              <TableCell colSpan={7} className="py-6 text-center text-slate-500">
                Loading projects...
              </TableCell>
            </TableRow>
          ) : hasData ? (
            filteredProjects.map((project) => (
              <TableRow key={project.id ?? project.name}>
                <TableCell>
                  <div className="leading-tight">
                    <p className="font-semibold">{project.name}</p>
                    <p className="text-xs text-slate-500">{project.code || "No code"}</p>
                  </div>
                </TableCell>
                <TableCell className="text-slate-600">{project.location || "-"}</TableCell>
                <TableCell>
                  <Badge className={`rounded-md ${statusColor[project.status]}`}>
                    {project.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-2 flex-1 rounded-full bg-slate-200">
                      <div
                        className={`h-2 rounded-full ${progressTone(project.status)}`}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">
                      {Math.round(project.progress)}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-slate-700">
                  {project.stageLabel ?? "—"}
                </TableCell>
                <TableCell className="font-medium text-slate-800">
                  {project.lead || "Unassigned"}
                </TableCell>
                <TableCell className="text-slate-600">{formatDate(project.updated)}</TableCell>
                <TableCell className="text-center text-slate-600">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="rounded-md p-2 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        aria-label={`Actions for ${project.name}`}
                      >
                        <MoreHorizontal className="size-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem className="gap-2" onClick={() => goToDetail(project)}>
                        <Eye className="size-4" />
                        Details Page
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2"
                        onClick={() => openEditDialog(project)}
                      >
                        <Pencil className="size-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2 text-rose-600 focus:text-rose-700"
                        onClick={() => setProjectToDelete(project)}
                        disabled={deletingId === (project.id ?? "").trim()}
                      >
                        {deletingId === project.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="py-6 text-center text-slate-500">
                {projectSearch ? "No projects match your search." : "No projects yet. Add one using the \"Add Project\" button."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-5xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-900">
              {dialogTitle}
            </DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Left Column: General Info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Project Alpha"
                    required
                    disabled={isViewMode}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    value={form.location}
                    onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                    placeholder="Remote / Jakarta / Singapore"
                    disabled={isViewMode}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    name="description"
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    className="min-h-[90px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    placeholder="Deskripsi singkat..."
                    disabled={isViewMode}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lead">Project Lead</Label>
                  <select
                    id="lead"
                    name="lead"
                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    value={form.lead}
                    onChange={(e) => setForm((prev) => ({ ...prev, lead: e.target.value }))}
                    disabled={isViewMode || leadOptions.length === 0}
                  >
                    <option value="">{leadOptions.length ? "Select a lead" : "No project managers available"}</option>
                    {leadOptions.map((member) => (
                      <option key={member} value={member}>
                        {member}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teamMembers">Team Members</Label>
                  <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
                    {/* Selected Members as Tags */}
                    {form.teamMembers.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pb-2">
                        {form.teamMembers.map((member) => (
                          <span
                            key={member}
                            className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-700"
                          >
                            {member}
                            {!isViewMode && (
                              <button
                                type="button"
                                onClick={() => {
                                  setForm((prev) => ({
                                    ...prev,
                                    teamMembers: prev.teamMembers.filter((m) => m !== member),
                                  }));
                                }}
                                className="ml-0.5 rounded-full p-0.5 hover:bg-violet-200"
                              >
                                <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                    {/* Dropdown to add members */}
                    {!isViewMode && (
                      <select
                        className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-600 shadow-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                        value=""
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value && !form.teamMembers.includes(value)) {
                            setForm((prev) => ({
                              ...prev,
                              teamMembers: [...prev.teamMembers, value],
                            }));
                          }
                        }}
                      >
                        <option value="">+ Add team member...</option>
                        {teamOptions
                          .filter((m) => !form.teamMembers.includes(m))
                          .map((member) => (
                            <option key={member} value={member}>
                              {member}
                            </option>
                          ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Timeline & Planning */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                      value={form.startDate}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, startDate: e.target.value }))
                      }
                      disabled={isViewMode}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deadline">Deadline</Label>
                    <Input
                      id="deadline"
                      name="deadline"
                      type="date"
                      value={form.deadline}
                      onChange={(e) => setForm((prev) => ({ ...prev, deadline: e.target.value }))}
                      disabled={isViewMode}
                    />
                  </div>
                </div>

                <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Stage Planning</p>
                      <p className="text-xs text-slate-500">Set deadlines per stage</p>
                    </div>
                  </div>
                  <div className="grid gap-3">
                    {(Object.keys(stageLabels) as Array<keyof StageDeadlines>).map((stageId) => (
                      <div key={stageId} className="space-y-1">
                        <span className="text-xs font-medium text-slate-700">{stageLabels[stageId]}</span>
                        <Input
                          type="date"
                          value={form.stageDeadlines[stageId]}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              stageDeadlines: { ...prev.stageDeadlines, [stageId]: e.target.value },
                            }))
                          }
                          className="h-9 w-full text-sm"
                          disabled={isViewMode}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" type="button" onClick={() => setDialogOpen(false)}>
                {isViewMode ? "Close" : "Cancel"}
              </Button>
              {isViewMode ? null : (
                <Button
                  className="bg-[#256eff] text-white hover:bg-[#1c55c7]"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                  {editId ? "Save Changes" : "Create Project"}
                </Button>
              )}
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-900">
              Delete Project?
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm text-slate-600">
              Are you sure you want to delete <span className="font-semibold text-slate-900">{projectToDelete?.name}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setProjectToDelete(null)}
              disabled={!!deletingId}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (projectToDelete) {
                  confirmDelete(projectToDelete.id, projectToDelete.code);
                }
              }}
              disabled={!!deletingId}
            >
              {deletingId ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
