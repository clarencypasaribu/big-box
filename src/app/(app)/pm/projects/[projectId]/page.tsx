import { BadgeCheck, MapPin, UserRound } from "lucide-react";

import { PMSidebar } from "@/app/(app)/pm/_components/sidebar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { getCurrentUserProfile } from "@/utils/current-user";
import { createSupabaseServiceClient } from "@/utils/supabase-service";

export const dynamic = "force-dynamic";

type ProjectDetail = {
  uuid: string;
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
  updatedAt?: string | null;
};

async function fetchProject(slug: string): Promise<{ project: ProjectDetail | null; error?: string }> {
  try {
    const param = decodeURIComponent(slug ?? "");

    const supabase = await createSupabaseServiceClient();

    // Coba cari berdasarkan uuid
    let { data, error } = await supabase.from("projects").select("*").eq("uuid", param).maybeSingle();

    // Fallback cari berdasarkan kolom id (jaga-jaga skema berbeda)
    if ((!data || error) && param) {
      const byId = await supabase.from("projects").select("*").eq("id", param).maybeSingle();
      data = byId.data ?? data;
      error = byId.error ?? error;
    }

    // Fallback cari berdasarkan code
    if ((!data || error) && param) {
      const byCode = await supabase.from("projects").select("*").eq("code", param).maybeSingle();
      data = byCode.data;
      error = byCode.error;
    }

    // Fallback case-insensitive code
    if ((!data || error) && param) {
      const byCodeIlike = await supabase.from("projects").select("*").ilike("code", param).maybeSingle();
      data = byCodeIlike.data;
      error = byCodeIlike.error ?? error;
    }

    if (error || !data) {
      const sample = await supabase.from("projects").select("uuid,code").limit(5);
      const hint =
        sample.data && sample.data.length
          ? `Tidak ada row dengan '${param}'. Contoh: ${sample.data
              .map((r) => r.code || r.uuid)
              .filter(Boolean)
              .join(", ")}`
          : "Projects kosong atau tidak bisa diambil (cek RLS).";
      return { project: null, error: error?.message || hint };
    }

    return {
      project: {
        uuid: data.uuid,
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
        updatedAt: data.updated_at ?? data.created_at ?? null,
      },
    };
  } catch (err) {
    return { project: null, error: err instanceof Error ? err.message : "Gagal memuat project" };
  }
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", year: "numeric" }).format(d);
}

export default async function ProjectDetailPage({ params }: { params: { projectId: string } }) {
  const profile = await getCurrentUserProfile();
  const { project, error } = await fetchProject(params.projectId);

  if (!project) {
    return (
      <div className="min-h-screen bg-[#f7f7f9] text-slate-900">
        <div className="mx-auto flex max-w-screen-2xl gap-6 px-4 py-8 lg:px-8">
          <PMSidebar currentPath={`/pm/projects/${params.projectId}`} profile={profile} />
          <main className="flex-1">
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <h1 className="text-2xl font-semibold text-slate-900">Project not found</h1>
                <p className="mt-2 text-slate-600">
                  Data project tidak ditemukan. Pastikan ID atau code proyek benar, lalu coba kembali.
                </p>
                {error ? <p className="mt-3 text-sm text-rose-600">Detail: {error}</p> : null}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  const statusTone: Record<string, string> = {
    "In Progress": "bg-amber-50 text-amber-700",
    Completed: "bg-emerald-50 text-emerald-700",
    Pending: "bg-rose-50 text-rose-700",
    "Not Started": "bg-slate-100 text-slate-700",
  };

  const progress = project.progress ?? 0;
  const team = project.teamMembers?.length ? project.teamMembers : ["No team assigned"];

  return (
    <div className="min-h-screen bg-[#f7f7f9] text-slate-900">
      <div className="mx-auto flex max-w-screen-2xl gap-6 px-4 py-8 lg:px-8">
        <PMSidebar currentPath={`/pm/projects/${params.projectId}`} profile={profile} />
        <main className="flex-1 space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold text-slate-900">{project.name}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                <span className="flex items-center gap-2">
                  <BadgeCheck className="size-4 text-indigo-600" />
                  ID: {project.code || project.uuid}
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
                <Badge className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone[project.status ?? "In Progress"] ?? "bg-slate-100 text-slate-700"}`}>
                  {project.status ?? "In Progress"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-5 space-y-1">
                <p className="text-xs uppercase tracking-wide text-slate-500">Description</p>
                <p className="text-sm text-slate-800">{project.description || "Belum ada deskripsi."}</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-5 space-y-1">
                <p className="text-xs uppercase tracking-wide text-slate-500">Timeline</p>
                <p className="text-sm text-slate-800">Start: {formatDate(project.startDate)}</p>
                <p className="text-sm text-slate-800">End: {formatDate(project.endDate)}</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between text-sm text-slate-700">
                  <span>Progress</span>
                  <span className="font-semibold text-slate-900">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2 bg-slate-200" />
                <div className="flex flex-wrap gap-2 text-xs text-slate-700">
                  {team.map((member) => (
                    <Badge key={member} className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
                      {member}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
