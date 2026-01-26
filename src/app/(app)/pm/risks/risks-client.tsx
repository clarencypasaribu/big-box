"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, BadgeCheck, CheckCircle2, Eye, Loader2, Paperclip, Send, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type RiskStatus = "Investigating" | "Open" | "Mitigated" | "Resolved" | "Assigned";

export type RiskRow = {
  id: string;
  code: string;
  title: string;
  description: string;
  project: string;
  product: string;
  reporter: string;
  assignee?: string;
  status: RiskStatus;
  reportDate: string;
  attachments?: { id: string; name: string; type?: string; size?: string }[];
};
const initialRisks: RiskRow[] = [
  {
    id: "blk-092",
    code: "#BLK-2024-092",
    title: "CCTV network connection lost",
    description:
      "Connection timeouts on port 8080. The CCTV stream is unreachable. Review network access and credentials.",
    project: "Smart City Phase 2",
    product: "Big Vision",
    reporter: "Eliza Talenty",
    assignee: "Unassigned",
    status: "Investigating",
    reportDate: "23 Oct 2025",
    attachments: [{ id: "att-1", name: "error.log", type: "text/plain", size: "32 KB" }],
  },
  {
    id: "blk-093",
    code: "#BLK-2024-093",
    title: "High latency in traffic monitor",
    description: "Latency spikes on the core API during peak traffic > 10k rpm. Needs profiling and cache policy review.",
    project: "Big Vision",
    product: "Traffic Monitor",
    reporter: "Eliza Talenty",
    assignee: "Unassigned",
    status: "Open",
    reportDate: "23 Oct 2025",
  },
  {
    id: "blk-094",
    code: "#BLK-2024-094",
    title: "Alert false-positive IDS",
    description: "IDS triggers many false positives on the internal subnet. False-positive rate > 60%.",
    project: "SOC Platform",
    product: "IDS",
    reporter: "Eliza Talenty",
    assignee: "Unassigned",
    status: "Mitigated",
    reportDate: "22 Oct 2025",
  },
];

const statusTone: Record<RiskStatus, string> = {
  Investigating: "bg-amber-50 text-amber-700",
  Open: "bg-rose-50 text-rose-700",
  Mitigated: "bg-blue-50 text-blue-700",
  Resolved: "bg-emerald-50 text-emerald-700",
  Assigned: "bg-indigo-50 text-indigo-700",
};

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  activeTasks: number;
};

export function RisksClient({
  initialData = [],
  teamMembers = [],
  searchQuery = "",
}: {
  initialData?: RiskRow[];
  teamMembers?: TeamMember[];
  searchQuery?: string;
}) {
  const [risks, setRisks] = useState<RiskRow[]>(initialData);
  const [fetching, setFetching] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [note, setNote] = useState("");
  const [assigning, setAssigning] = useState(false);

  const selectedRisk = useMemo(() => risks.find((r) => r.id === selectedId) || null, [risks, selectedId]);

  // Fetch blockers from API (optional refresh)
  const fetchBlockers = useCallback(async () => {
    setFetching(true);
    try {
      const res = await fetch("/api/blockers");
      if (res.ok) {
        const body = await res.json();
        const blockerData = Array.isArray(body.data) ? body.data : [];

        // Transform API data to RiskRow format
        const transformedBlockers: RiskRow[] = blockerData.map((blocker: any, index: number) => ({
          id: blocker.id,
          code: `#BLK-${new Date(blocker.created_at).getFullYear()}-${String(index + 100).padStart(3, "0")}`,
          title: blocker.title || blocker.reason || blocker.task_title || "Untitled Blocker",
          description: blocker.notes || blocker.reason || "No description provided.",
          project: blocker.project_name || "Unknown Project",
          product: blocker.product || "Other",
          reporter: blocker.reporter_name || "Unknown",
          assignee: "Unassigned",
          status: (blocker.status as RiskStatus) || "Open",
          reportDate: formatDate(blocker.created_at),
          attachments: blocker.files?.map((f: any) => ({
            id: f.id,
            name: f.name,
            size: f.size ? `${Math.round(f.size / 1024)} KB` : "0 KB",
            type: f.type
          })) ?? [],
        }));

        if (transformedBlockers.length) {
          setRisks(transformedBlockers);
        } else {
          setRisks(initialRisks);
        }
      }
    } catch {
      setRisks(initialRisks);
    } finally {
      setFetching(false);
    }
  }, []);


  function closeDetail() {
    setSelectedId(null);
    setAssignOpen(false);
    setSelectedMember("");
    setNote("");
  }

  function openAssign() {
    setAssignOpen(true);
  }

  async function handleAssign() {
    if (!selectedRisk || !selectedMember) return;
    setAssigning(true);

    try {
      const res = await fetch(`/api/blockers/${selectedRisk.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeId: selectedMember, notes: note }),
      });

      if (!res.ok) {
        throw new Error("Failed to assign member");
      }

      // Success
      setRisks((prev) =>
        prev.map((risk) =>
          risk.id === selectedRisk.id
            ? { ...risk, assignee: teamMembers.find((m) => m.id === selectedMember)?.name ?? risk.assignee, status: "Assigned" }
            : risk
        )
      );

      setAssignOpen(false);
      setSelectedMember("");
      setNote("");
    } catch (error) {
      console.error("Assignment failed", error);
      alert("Failed to assign member. Please try again.");
    } finally {
      setAssigning(false);
    }
  }

  const filteredRisks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return risks.filter(
      (risk) =>
        risk.title.toLowerCase().includes(query) ||
        risk.code.toLowerCase().includes(query) ||
        risk.project.toLowerCase().includes(query) ||
        risk.description.toLowerCase().includes(query)
    );
  }, [risks, searchQuery]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="space-y-3">
          {filteredRisks.length === 0 && !fetching ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="grid size-12 place-items-center rounded-full bg-slate-50">
                <BadgeCheck className="size-6 text-slate-300" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-900">No Blockers Found</h3>
              <p className="max-w-[17rem] items-center text-sm text-slate-500">
                {searchQuery ? "No blockers match your search." : "The project team has not reported any blockers yet."}
              </p>
            </div>
          ) : (
            filteredRisks.map((risk) => (
              <div
                key={risk.id}
                onClick={() => setSelectedId(risk.id)}
                className="group relative flex cursor-pointer flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-indigo-300 hover:shadow-md md:flex-row md:items-start md:justify-between"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="font-semibold text-indigo-600">{risk.code}</span>
                    <span>•</span>
                    <span>{risk.reportDate}</span>
                    <span>•</span>
                    <span className="font-medium text-slate-700">{risk.project}</span>
                  </div>

                  <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">
                    {risk.title}
                  </h3>

                  <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                    {risk.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                    <Badge variant="secondary" className="bg-slate-100 font-normal text-slate-600 hover:bg-slate-200">
                      {risk.product}
                    </Badge>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <UserRound className="size-3.5" />
                      <span>{risk.reporter}</span>
                      <ArrowRight className="size-3 text-slate-300" />
                      <span className={risk.assignee && risk.assignee !== "Unassigned" ? "font-medium text-slate-900" : "text-slate-400 italic"}>
                        {risk.assignee || "Unassigned"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-3 md:items-end">
                  <Badge className={cn("rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide", statusTone[risk.status])}>
                    {risk.status}
                  </Badge>
                  <div className="hidden rounded-full border border-slate-200 bg-white p-2 text-slate-400 group-hover:border-indigo-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 md:block">
                    <Eye className="size-4" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <Dialog open={!!selectedRisk} onOpenChange={(open) => (!open ? closeDetail() : null)}>
          <DialogContent className="max-w-5xl border-slate-200">
            {selectedRisk ? (
              <div className="grid gap-6 md:grid-cols-[1.3fr,0.7fr]">
                <div className="space-y-4">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-semibold text-slate-900">{selectedRisk.title}</DialogTitle>
                    <p className="text-sm font-semibold text-rose-500">{selectedRisk.code}</p>
                  </DialogHeader>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Detailed Description</p>
                    <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                      {selectedRisk.description}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Attachments</p>
                    <div className="flex flex-wrap gap-3">
                      {(selectedRisk.attachments ?? []).length === 0 ? (
                        <p className="text-sm text-slate-500">No attachments.</p>
                      ) : (
                        selectedRisk.attachments?.map((file) => (
                          <Card
                            key={file.id}
                            className="flex min-w-[180px] flex-col gap-2 border-slate-200 p-3 shadow-sm cursor-pointer hover:bg-slate-50 transition"
                            onClick={() => window.open(`/api/files?id=${file.id}`, "_blank")}
                          >
                            <div className="flex items-center gap-2 text-sm text-slate-700">
                              <Paperclip className="size-4 text-slate-500" />
                              {file.name}
                            </div>
                            <p className="text-xs text-slate-500">{file.size || file.type || "file"}</p>
                          </Card>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
                    <Send className="size-4 text-indigo-600" />
                    <p className="text-sm text-slate-700">Add a comment or update for the team.</p>
                  </div>
                </div>

                <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Affected Project</p>
                    <p className="font-semibold text-slate-900">{selectedRisk.project}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Product Involved</p>
                    <p className="text-sm text-slate-700">{selectedRisk.product}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm text-slate-700">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reported By</p>
                      <p className="font-semibold text-slate-900">{selectedRisk.reporter}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Date Reported</p>
                      <p className="font-semibold text-slate-900">{selectedRisk.reportDate}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
                      <Badge className={`rounded-md ${statusTone[selectedRisk.status]}`}>{selectedRisk.status}</Badge>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assigned To</p>
                      <p className="font-semibold text-slate-900">{selectedRisk.assignee || "Unassigned"}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button variant="outline" className="justify-between" onClick={openAssign}>
                      <div className="flex items-center gap-2">
                        <UserRound className="size-4" />
                        <span>Assign Member</span>
                      </div>
                      <ArrowRight className="size-4" />
                    </Button>
                    <Button className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={closeDetail}>
                      Done
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        <Dialog open={assignOpen} onOpenChange={(open) => setAssignOpen(open)}>
          <DialogContent className="max-w-2xl border-slate-200">
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold text-slate-900">Assign Member to Resolve</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Select Team Member</Label>
                <RadioGroup value={selectedMember} onValueChange={setSelectedMember} className="space-y-3">
                  {teamMembers.map((member) => (
                    <label
                      key={member.id}
                      className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 shadow-sm"
                    >
                      <div className="space-y-0.5">
                        <p className="font-semibold text-slate-900">{member.name}</p>
                        <p className="text-xs text-slate-600">{member.role} • {member.activeTasks} task aktif</p>
                      </div>
                      <RadioGroupItem value={member.id} />
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Instruction (Opsional)</Label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add context or next steps"
                  className="min-h-[96px]"
                  maxLength={500}
                />
                <p className="text-right text-xs text-slate-500">{note.length}/500</p>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-3">
              <Button variant="outline" onClick={() => setAssignOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-indigo-600 text-white hover:bg-indigo-700"
                disabled={!selectedMember || assigning}
                onClick={handleAssign}
              >
                {assigning ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                Assign to Resolve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
