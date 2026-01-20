"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleCheck,
  FileText,
  Link as LinkIcon,
  UploadCloud,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MemberSidebar } from "@/components/member-sidebar";
import { cn } from "@/lib/utils";
import { supabase } from "@/utils/supabase";
import type { SidebarProfileData } from "@/utils/current-user";

type TaskDetailClientProps = {
  profile: SidebarProfileData;
  taskId: string;
  projects?: {
    id: string;
    name: string;
    color: "green" | "blue" | "purple" | "amber";
  }[];
};

type Deliverable = {
  id: string;
  title: string;
  subtitle: string;
  tone: "green" | "indigo";
  status: "Submitted" | "Reviewed" | "Approved";
  ownerId?: string | null;
  ownerName?: string;
};

type Dependency = {
  id: string;
  title: string;
  subtitle: string;
};

const defaultDeliverables: Deliverable[] = [
  {
    id: "del-1",
    title: "Design Auth Schema",
    subtitle: "Task 1001",
    tone: "green",
    status: "Approved",
    ownerName: "You",
  },
  {
    id: "del-2",
    title: "Design Auth Schema",
    subtitle: "Task 1001",
    tone: "green",
    status: "Reviewed",
    ownerName: "Nadia",
  },
  {
    id: "del-3",
    title: "Design Auth Schema",
    subtitle: "Task 1001",
    tone: "green",
    status: "Submitted",
    ownerName: "You",
  },
  {
    id: "del-4",
    title: "Design Auth Schema",
    subtitle: "Task 1001",
    tone: "green",
    status: "Approved",
    ownerName: "Arif",
  },
  {
    id: "del-5",
    title: "Design Auth Schema",
    subtitle: "Task 1001",
    tone: "green",
    status: "Reviewed",
    ownerName: "You",
  },
  {
    id: "del-6",
    title: "Design Auth Schema",
    subtitle: "Task 1001",
    tone: "green",
    status: "Submitted",
    ownerName: "Nadia",
  },
];

const dependencies: Dependency[] = [
  { id: "dep-1", title: "Design Auth Schema", subtitle: "Task 1001" },
  { id: "dep-2", title: "Design Auth Schema", subtitle: "Task 1001" },
  { id: "dep-3", title: "Design Auth Schema", subtitle: "Task 1001" },
  { id: "dep-4", title: "Design Auth Schema", subtitle: "Task 1001" },
  { id: "dep-5", title: "Design Auth Schema", subtitle: "Task 1001" },
  { id: "dep-6", title: "Design Auth Schema", subtitle: "Task 1001" },
];

const blockerReasons = [
  "Menunggu Kredensial Server",
  "Lisensi bigQuery",
  "Environment Setup Failure",
  "Other",
];

const blockerCategories = ["Access", "Dependency", "Scope", "Technical", "Other"];
const blockerSeverities = ["Low", "Medium", "High", "Critical"];
const blockerAssignees = ["Project Manager", "Tech Lead", "QA Lead", "Product Owner"];

const deliverableFilterOptions = ["All", "Mine"] as const;

export function TaskDetailClient({ profile, taskId, projects }: TaskDetailClientProps) {
  const [status, setStatus] = useState<"In Progress" | "Done">("In Progress");
  const [deliverables, setDeliverables] = useState<Deliverable[]>(defaultDeliverables);
  const [deliverableFilter, setDeliverableFilter] =
    useState<(typeof deliverableFilterOptions)[number]>("All");
  const [submitOpen, setSubmitOpen] = useState(false);
  const [blockerOpen, setBlockerOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");
  const [ingestValue, setIngestValue] = useState("");
  const [notesValue, setNotesValue] = useState("");
  const [blockerCategory, setBlockerCategory] = useState<string>("");
  const [blockerAssignee, setBlockerAssignee] = useState<string>("");
  const [blockerSeverity, setBlockerSeverity] = useState<string>("");
  const [blockerReason, setBlockerReason] = useState<string | null>(null);
  const [blockerNotes, setBlockerNotes] = useState("");
  const [blockerError, setBlockerError] = useState<string | null>(null);
  const [blockerSubmitting, setBlockerSubmitting] = useState(false);
  const [blockerSuccess, setBlockerSuccess] = useState<string | null>(null);

  const statusTone =
    status === "Done" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700";

  const deliverableStatusTone = {
    Submitted: "bg-amber-100 text-amber-700",
    Reviewed: "bg-blue-100 text-blue-700",
    Approved: "bg-emerald-100 text-emerald-700",
  } as const;

  const visibleDeliverables =
    deliverableFilter === "Mine"
      ? deliverables.filter((item) =>
          (profile.id && item.ownerId === profile.id) ||
          item.ownerName === profile.name ||
          item.ownerName === "You"
        )
      : deliverables;

  function handleSubmitDeliverable(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = linkValue || "New Deliverable";
    const subtitle = ingestValue ? `${ingestValue} data ingested` : "Submitted";
    setDeliverables((prev) => [
      {
        id: `del-${Date.now()}`,
        title,
        subtitle,
        tone: "indigo",
        status: "Submitted",
        ownerId: profile.id,
        ownerName: profile.name,
      },
      ...prev,
    ]);
    setLinkValue("");
    setIngestValue("");
    setNotesValue("");
    setSubmitOpen(false);
  }

  async function handleRaiseBlocker(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBlockerError(null);
    setBlockerSuccess(null);

    if (!blockerCategory || !blockerAssignee || !blockerSeverity) {
      setBlockerError("Lengkapi kategori, assign-to, dan severity.");
      return;
    }

    if (!blockerReason && !blockerNotes.trim()) {
      setBlockerError("Pilih alasan atau isi detail blocker.");
      return;
    }

    setBlockerSubmitting(true);
    try {
      const token = await supabase.auth.getSession().then((res) => res.data.session?.access_token);
      const authHeader: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch("/api/blockers", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({
          taskId,
          category: blockerCategory,
          assignee: blockerAssignee,
          severity: blockerSeverity,
          reason: blockerReason,
          notes: blockerNotes.trim() || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Gagal mengirim blocker");
      }

      setBlockerSuccess("Blocker berhasil dikirim ke project manager.");
      setBlockerCategory("");
      setBlockerAssignee("");
      setBlockerSeverity("");
      setBlockerReason(null);
      setBlockerNotes("");
      setBlockerOpen(false);
    } catch (error) {
      setBlockerError(error instanceof Error ? error.message : "Gagal mengirim blocker");
    } finally {
      setBlockerSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f7f9] text-slate-900">
      <div className="mx-auto flex max-w-screen-2xl gap-6 px-4 py-8 lg:px-8">
        <MemberSidebar
          profile={profile}
          active="task"
          taskHref={`/member/tasks/${taskId}`}
          projects={projects}
        />

        <main className="flex-1 space-y-6">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-semibold text-slate-900">Instalasi BigLake</h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                <Badge className={`rounded-md ${statusTone}`}>{status}</Badge>
                <span>Project BigBox Care</span>
                <span>•</span>
                <span>Stage Development</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-3">
              <Button
                variant="outline"
                className="border-rose-200 text-rose-600 hover:bg-rose-50"
                onClick={() => {
                  setBlockerError(null);
                  setBlockerSuccess(null);
                  setBlockerOpen(true);
                }}
              >
                <AlertTriangle className="mr-2 size-4" />
                Raise Blocker
              </Button>
              <Button
                className="bg-[#256eff] text-white hover:bg-[#1c55c7]"
                onClick={() => setStatus("Done")}
                disabled={status === "Done"}
              >
                <CircleCheck className="mr-2 size-4" />
                {status === "Done" ? "Completed" : "Mark as Done"}
              </Button>
            </div>
          </header>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Task Description</h2>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700">
              <p>
                The current authentication system is outdated and limits our ability to integrate with
                strategic partners. We need to implement OAuth 2.0 to support third-party integrations
                securely and provide a seamless login experience for our enterprise customers.
              </p>
              <p className="mt-4">
                This task involves updating the auth-service module to handle the new flow.
              </p>
              <div className="mt-4">
                <p className="font-semibold text-slate-800">Key Objectives:</p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>Create new endpoints for authorization code grant and token exchange.</li>
                  <li>Update the user database schema to store refresh tokens securely.</li>
                  <li>Ensure backward compatibility for legacy clients for at least 3 months.</li>
                  <li>Write unit tests covering at least 90% of the new code paths.</li>
                </ul>
              </div>
              <p className="mt-4">
                Reference the architecture diagram in the project wiki for the intended data flow between
                the gateway and the identity provider.
              </p>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-900">Input Output/Deliverables</h2>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="grid size-12 place-items-center rounded-xl bg-indigo-600/10 text-indigo-600">
                    <UploadCloud className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Attach Document/File</p>
                    <p className="text-xs text-slate-500">
                      Configured environment for backend API.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1 rounded-full bg-slate-100 p-1">
                    {deliverableFilterOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setDeliverableFilter(option)}
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-semibold",
                          deliverableFilter === option
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-500"
                        )}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  <Button
                    className="bg-slate-700 text-white hover:bg-slate-800"
                    onClick={() => setSubmitOpen(true)}
                  >
                    Submit Deliverables
                    <LinkIcon className="ml-2 size-4" />
                  </Button>
                </div>
              </div>
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                  {visibleDeliverables.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"
                    >
                      <div
                        className={cn(
                          "grid size-12 place-items-center rounded-xl text-white",
                          item.tone === "green" ? "bg-emerald-400" : "bg-indigo-400"
                        )}
                      >
                        <FileText className="size-5" />
                      </div>
                      <div className="leading-tight">
                        <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                        <p className="text-xs text-slate-500">{item.subtitle}</p>
                        <p className="text-xs text-slate-400">
                          Owner: {item.ownerName ?? "Team"}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "ml-auto rounded-full px-2.5 py-1 text-[11px] font-semibold",
                          deliverableStatusTone[item.status]
                        )}
                      >
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-900">Dependencies</h2>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">Design Auth Schema</p>
                  <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                    6/10 Done
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {dependencies.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="grid size-8 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                        <CheckCircle2 className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                        <p className="text-xs text-slate-500">{item.subtitle}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>

      <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
        <DialogContent className="max-w-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-slate-900">
              Submit Deliverables
            </DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmitDeliverable}>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800" htmlFor="deliverableLink">
                Attachment/Documentation Link
              </label>
              <Input
                id="deliverableLink"
                value={linkValue}
                onChange={(event) => setLinkValue(event.target.value)}
                placeholder="Redesign Project Dashboard"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800" htmlFor="deliverableIngest">
                Total Data ter Ingest
              </label>
              <Input
                id="deliverableIngest"
                value={ingestValue}
                onChange={(event) => setIngestValue(event.target.value)}
                placeholder="Redesign Project Dashboard"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800" htmlFor="deliverableNotes">
                Notes
              </label>
              <textarea
                id="deliverableNotes"
                value={notesValue}
                onChange={(event) => setNotesValue(event.target.value)}
                className="min-h-[160px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                placeholder="Redesign Project Dashboard"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800" htmlFor="deliverableFile">
                Upload File
              </label>
              <Input id="deliverableFile" type="file" />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="outline" type="button" onClick={() => setSubmitOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-[#256eff] text-white hover:bg-[#1c55c7]" type="submit">
                Submit
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={blockerOpen} onOpenChange={setBlockerOpen}>
        <DialogContent className="max-w-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-slate-900">
              Report A Blocker
            </DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleRaiseBlocker}>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-800" htmlFor="blockerCategory">
                  Category
                </label>
                <select
                  id="blockerCategory"
                  value={blockerCategory}
                  onChange={(event) => setBlockerCategory(event.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
                >
                  <option value="">Select</option>
                  {blockerCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-800" htmlFor="blockerAssignee">
                  Assign To
                </label>
                <select
                  id="blockerAssignee"
                  value={blockerAssignee}
                  onChange={(event) => setBlockerAssignee(event.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
                >
                  <option value="">Select</option>
                  {blockerAssignees.map((assignee) => (
                    <option key={assignee} value={assignee}>
                      {assignee}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-800" htmlFor="blockerSeverity">
                  Severity
                </label>
                <select
                  id="blockerSeverity"
                  value={blockerSeverity}
                  onChange={(event) => setBlockerSeverity(event.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
                >
                  <option value="">Select</option>
                  {blockerSeverities.map((severity) => (
                    <option key={severity} value={severity}>
                      {severity}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-800">Common Reasons</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {blockerReasons.map((reason) => (
                  <button
                    type="button"
                    key={reason}
                    onClick={() => setBlockerReason(reason)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm text-slate-700",
                      blockerReason === reason
                        ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40"
                    )}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800" htmlFor="blockerNotes">
                Additional Details
              </label>
              <textarea
                id="blockerNotes"
                value={blockerNotes}
                onChange={(event) => setBlockerNotes(event.target.value)}
                className="min-h-[180px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                placeholder="Redesign Project Dashboard"
              />
            </div>
            {blockerError ? (
              <p className="text-sm text-rose-600">{blockerError}</p>
            ) : blockerSuccess ? (
              <p className="text-sm text-emerald-600">{blockerSuccess}</p>
            ) : null}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="outline" type="button" onClick={() => setBlockerOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-[#256eff] text-white hover:bg-[#1c55c7]"
                type="submit"
                disabled={blockerSubmitting}
              >
                {blockerSubmitting ? "Sending..." : "Raise a Blocker"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
