import { BadgeCheck, CalendarClock, MapPin, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PMSidebar } from "@/app/(app)/pm/_components/sidebar";
import { getCurrentUserProfile } from "@/utils/current-user";
import { createSupabaseServiceClient } from "@/utils/supabase-service";

function normalizeId(value?: string | null) {
  const raw = (value ?? "").trim();
  if (!raw || raw === "undefined" || raw === "null") return "";
  return raw;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", year: "numeric" }).format(d);
}

async function loadProjectReport(projectId?: string) {
  if (!projectId) return null;
  const supabase = await createSupabaseServiceClient({ allowWrite: true });

  const { data: project } = await supabase
    .from("projects")
    .select("id,name,code,location,status,progress,lead,description,start_date,end_date,team_members,created_at,updated_at")
    .or(`id.eq.${projectId},code.eq.${projectId}`)
    .maybeSingle();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id,title,status,stage,due_date,assignee")
    .eq("project_id", project?.id ?? projectId);

  return { project, tasks: tasks ?? [] };
}

function PrintButton() {
  "use client";
  return (
    <Button variant="outline" className="border-slate-200" onClick={() => window.print()}>
      Print / Save as PDF
    </Button>
  );
}

export default async function ProjectReportPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const resolvedId = decodeURIComponent(projectId);
  const data = await loadProjectReport(normalizeId(resolvedId));

  if (!data?.project) {
    return (
      <main className="flex-1">
        <Card className="border-rose-200 bg-rose-50/40 shadow-sm">
          <CardContent className="p-6 text-rose-700">Project not found.</CardContent>
        </Card>
      </main>
    );
  }

  const { project, tasks } = data;
  const team = Array.isArray(project.team_members) && project.team_members.length ? project.team_members : ["No team members"];

  return (
    <main className="flex-1 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold text-slate-900">Project Report</h1>
          <p className="text-sm text-slate-600">Project summary and tasks for PDF export.</p>
        </div>
        <PrintButton />
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="space-y-3 p-5">
          <h2 className="text-xl font-semibold text-slate-900">{project.name}</h2>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
            <span className="flex items-center gap-2">
              <BadgeCheck className="size-4 text-indigo-600" />
              ID: {project.code || project.id}
            </span>
            <Separator orientation="vertical" className="h-4" />
            <span className="flex items-center gap-2">
              <UserRound className="size-4 text-slate-500" />
              Lead: {project.lead || "Unassigned"}
            </span>
            <Separator orientation="vertical" className="h-4" />
            <span className="flex items-center gap-2">
              <MapPin className="size-4 text-slate-500" />
              {project.location || "No location"}
            </span>
            <Separator orientation="vertical" className="h-4" />
            <Badge className="rounded-full bg-slate-100 text-slate-700">{project.status || "In Progress"}</Badge>
          </div>
          <p className="text-sm text-slate-600">{project.description || "No description provided."}</p>
          <div className="flex flex-wrap gap-4 text-sm text-slate-700">
            <span className="flex items-center gap-2">
              <CalendarClock className="size-4" /> Start: {formatDate(project.start_date)}
            </span>
            <span className="flex items-center gap-2">
              <CalendarClock className="size-4" /> End: {formatDate(project.end_date)}
            </span>
            <span className="flex items-center gap-2">
              <CalendarClock className="size-4" /> Updated: {formatDate(project.updated_at)}
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900">Team Members</p>
            <p className="text-sm text-slate-600">{team.join(", ")}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-slate-900">Tasks</p>
              <p className="text-sm text-slate-600">Tasks associated with this project.</p>
            </div>
            <Badge className="bg-slate-100 text-slate-700">{tasks.length} task</Badge>
          </div>
          <div className="divide-y divide-slate-200 rounded-xl border border-slate-200">
            {tasks.length === 0 ? (
              <div className="px-4 py-6 text-sm text-slate-500">No tasks yet.</div>
            ) : (
              tasks.map((task: any) => (
                <div key={task.id} className="grid grid-cols-[1.6fr,1fr,1fr,1fr] items-center gap-3 px-4 py-3 text-sm text-slate-800">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="size-4" checked={task.status === "Done" || task.status === "Completed"} readOnly />
                    <span className="font-semibold">{task.title}</span>
                  </div>
                  <span>{task.assignee || "Unassigned"}</span>
                  <span>{task.stage || "N/A"}</span>
                  <span>{formatDate(task.due_date)}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
