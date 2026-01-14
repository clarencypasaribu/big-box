"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { supabase } from "@/utils/supabase";

export type ProjectRow = {
  id?: string | null;
  name: string;
  code?: string | null;
  location: string;
  status:
    | "Cloud"
    | "On-Premise"
    | "Hybrid"
    | "At Risk"
  | "In Progress"
  | "Completed";
  progress: number;
  lead: string;
  updated?: string | null;
  description?: string | null;
  iconBg?: string;
};

type ProjectFormState = {
  name: string;
  code: string;
  location: string;
  status: ProjectRow["status"];
  progress: number;
  lead: string;
  description: string;
};

const statusOptions: ProjectRow["status"][] = [
  "Cloud",
  "On-Premise",
  "Hybrid",
  "At Risk",
  "In Progress",
  "Completed",
];

const statusColor: Record<ProjectRow["status"], string> = {
  Cloud: "bg-amber-50 text-amber-700",
  "On-Premise": "bg-blue-50 text-blue-700",
  Hybrid: "bg-emerald-50 text-emerald-700",
  "At Risk": "bg-purple-50 text-purple-700",
  "In Progress": "bg-amber-50 text-amber-700",
  Completed: "bg-emerald-50 text-emerald-700",
};

function progressTone(status: ProjectRow["status"]) {
  if (status === "Completed") return "bg-emerald-500";
  if (status === "At Risk") return "bg-rose-500";
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

export function ProjectsClient({ initialProjects }: { initialProjects: ProjectRow[] }) {
  const [projects, setProjects] = useState<ProjectRow[]>(initialProjects);
  const [loading, setLoading] = useState(!initialProjects.length);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ProjectFormState>({
    name: "",
    code: "",
    location: "",
    status: "In Progress",
    progress: 0,
    lead: "",
    description: "",
  });

  const dialogTitle = editId ? "Edit Project" : "Add Project";

  useEffect(() => {
    if (!initialProjects.length) {
      fetchProjects();
    }
  }, [initialProjects.length]);

  async function fetchProjects() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Gagal mengambil data project");
      }
      const body = await res.json();
      const rows: ProjectRow[] =
        body.data?.map((row: any) => ({
          id: row.id,
          name: row.name ?? "Untitled Project",
          code: row.code ?? "",
          location: row.location ?? "",
          status: statusOptions.includes(row.status) ? row.status : "In Progress",
          progress: typeof row.progress === "number" ? row.progress : 0,
          lead: row.lead ?? "Unassigned",
          updated: row.updated_at ?? row.created_at,
          description: row.description ?? "",
          iconBg: row.icon_bg ?? "bg-indigo-100 text-indigo-700",
        })) ?? [];

      setProjects(rows);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Gagal mengambil data project");
    } finally {
      setLoading(false);
    }
  }

  function openCreateDialog() {
    setEditId(null);
    setForm({
      name: "",
      code: "",
      location: "",
      status: "In Progress",
      progress: 0,
      lead: "",
      description: "",
    });
    setDialogOpen(true);
    setError(null);
  }

  function openEditDialog(project: ProjectRow) {
    setEditId(project.id ?? null);
    setForm({
      name: project.name || "",
      code: project.code || "",
      location: project.location || "",
      status: project.status,
      progress: project.progress ?? 0,
      lead: project.lead || "",
      description: project.description || "",
    });
    setDialogOpen(true);
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      ...form,
      progress: Number(form.progress) || 0,
    };

    const endpoint = editId ? `/api/projects/${editId}` : "/api/projects";
    const method = editId ? "PUT" : "POST";

    const token = await supabase.auth.getSession().then((res) => res.data.session?.access_token);
    const authHeader: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const headers: HeadersInit = { "Content-Type": "application/json", ...(authHeader as any) };
      const res = await fetch(endpoint, { method, headers, body: JSON.stringify(payload) });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Gagal menyimpan project");
      }

      const body = await res.json();
      const saved: any = body.data;
      const normalized: ProjectRow = {
        id: saved?.id,
        name: saved?.name ?? payload.name,
        code: saved?.code ?? payload.code,
        location: saved?.location ?? payload.location,
        status: statusOptions.includes(saved?.status) ? saved.status : payload.status,
        progress: typeof saved?.progress === "number" ? saved.progress : payload.progress,
        lead: saved?.lead ?? payload.lead,
        updated: saved?.updated_at ?? saved?.created_at ?? new Date().toISOString(),
        description: saved?.description ?? payload.description,
        iconBg: saved?.icon_bg ?? "bg-indigo-100 text-indigo-700",
      };

      setProjects((prev) => {
        if (editId) {
          return prev.map((item) => (item.id === editId ? { ...item, ...normalized } : item));
        }
        return [normalized, ...prev];
      });

      setDialogOpen(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Gagal menyimpan project");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id?: string | null) {
    if (!id) return;
    setDeletingId(id);
    setError(null);
    const token = await supabase.auth.getSession().then((res) => res.data.session?.access_token);
    const authHeader: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
        headers: authHeader as any,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Gagal menghapus project");
      }
      setProjects((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Gagal menghapus project");
    } finally {
      setDeletingId(null);
    }
  }

  const hasData = useMemo(() => projects.length > 0, [projects.length]);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-800">Projects</p>
          <p className="text-xs text-slate-500">Create, update, or remove project records.</p>
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
            projects.map((project) => (
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
                <TableCell className="font-medium text-slate-800">
                  {project.lead || "Unassigned"}
                </TableCell>
                <TableCell className="text-slate-600">{formatDate(project.updated)}</TableCell>
                <TableCell className="text-center text-slate-600">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      className="rounded-md p-2 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                      aria-label={`Edit ${project.name}`}
                      onClick={() => openEditDialog(project)}
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      className="rounded-md p-2 text-rose-600 hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-rose-200"
                      aria-label={`Delete ${project.name}`}
                      onClick={() => handleDelete(project.id)}
                      disabled={deletingId === project.id}
                    >
                      {deletingId === project.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="py-6 text-center text-slate-500">
                Belum ada project. Tambahkan dari tombol &quot;Add Project&quot;.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        <TableCaption className="text-xs text-slate-500">
          Data diambil dari tabel <code>projects</code>. Perubahan memerlukan login.
        </TableCaption>
      </Table>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-900">
              {dialogTitle}
            </DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Project Alpha"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  name="code"
                  value={form.code}
                  onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
                  placeholder="PRJ-001"
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
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  value={form.status}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, status: e.target.value as ProjectRow["status"] }))
                  }
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="progress">Progress (%)</Label>
                <Input
                  id="progress"
                  name="progress"
                  type="number"
                  min={0}
                  max={100}
                  value={form.progress}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, progress: Number(e.target.value) || 0 }))
                  }
                  placeholder="0 - 100"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="lead">Project Lead</Label>
                <Input
                  id="lead"
                  name="lead"
                  value={form.lead}
                  onChange={(e) => setForm((prev) => ({ ...prev, lead: e.target.value }))}
                  placeholder="Nama PIC"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="min-h-[90px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  placeholder="Deskripsi singkat..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" type="button" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-[#256eff] text-white hover:bg-[#1c55c7]"
                type="submit"
                disabled={saving}
              >
                {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                {editId ? "Save Changes" : "Create Project"}
              </Button>
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
