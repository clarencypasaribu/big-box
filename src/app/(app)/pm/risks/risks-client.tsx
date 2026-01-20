"use client";

import { useMemo, useState } from "react";
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
    title: "Koneksi ke CCTV Dishub terputus",
    description:
      "Connection time out repeatedly pada port 8080. Stream CCTV Dishub tidak dapat diakses. Perlu analisa network & credential ulang.",
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
    title: "Latency tinggi di traffic monitor",
    description: "Spike latency pada API core saat peak traffic > 10k rpm. Perlu profiling dan cache policy review.",
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
    description: "IDS memicu banyak alert palsu pada subnet internal. False-positive rate > 60%.",
    project: "SOC Platform",
    product: "IDS",
    reporter: "Eliza Talenty",
    assignee: "Unassigned",
    status: "Mitigated",
    reportDate: "22 Oct 2025",
  },
];

const teamMembers = [
  { id: "m1", name: "Eliza Talenty", role: "Backend Lead", activeTasks: 12 },
  { id: "m2", name: "Claren Pas", role: "Infra Engineer", activeTasks: 8 },
  { id: "m3", name: "Rafi Mahendra", role: "SRE", activeTasks: 9 },
];

const statusTone: Record<RiskStatus, string> = {
  Investigating: "bg-amber-50 text-amber-700",
  Open: "bg-rose-50 text-rose-700",
  Mitigated: "bg-blue-50 text-blue-700",
  Resolved: "bg-emerald-50 text-emerald-700",
  Assigned: "bg-indigo-50 text-indigo-700",
};

export function RisksClient() {
  const [risks, setRisks] = useState<RiskRow[]>(initialRisks);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedRisk = useMemo(() => risks.find((r) => r.id === selectedId) || null, [risks, selectedId]);

  function closeDetail() {
    setSelectedId(null);
    setAssignOpen(false);
    setSelectedMember("");
    setNote("");
  }

  function openAssign() {
    setAssignOpen(true);
  }

  function handleAssign() {
    if (!selectedRisk || !selectedMember) return;
    setLoading(true);
    setTimeout(() => {
      setRisks((prev) =>
        prev.map((risk) =>
          risk.id === selectedRisk.id
            ? { ...risk, assignee: teamMembers.find((m) => m.id === selectedMember)?.name ?? risk.assignee, status: "Assigned" }
            : risk
        )
      );
      setLoading(false);
      setAssignOpen(false);
      setSelectedMember("");
      setNote("");
    }, 500);
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="space-y-3">
        {risks.map((risk) => (
          <div
            key={risk.id}
            className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xs lg:flex-row lg:items-center lg:justify-between"
          >
            <div className="space-y-1">
              <p className="text-xs font-semibold text-rose-500">{risk.code}</p>
              <p className="text-lg font-semibold text-slate-900">{risk.title}</p>
              <p className="text-sm text-slate-500 line-clamp-2">{risk.description}</p>
              <div className="flex flex-wrap gap-3 pt-1 text-sm text-slate-600">
                <span className="font-semibold text-slate-800">{risk.project}</span>
                <Separator orientation="vertical" className="h-4" />
                <span>Assignee: {risk.assignee || "Unassigned"}</span>
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 text-sm text-slate-600 lg:items-end">
              <div className="flex items-center gap-2">
                <Badge className={`rounded-md ${statusTone[risk.status]}`}>{risk.status}</Badge>
                <ArrowRight className="size-4 text-slate-400" />
              </div>
              <div className="text-xs text-slate-500">Report: {risk.reportDate}</div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedId(risk.id)}
                  className="rounded-full p-2 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  aria-label={`View ${risk.title}`}
                >
                  <Eye className="size-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
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
                      <p className="text-sm text-slate-500">Tidak ada lampiran.</p>
                    ) : (
                      selectedRisk.attachments?.map((file) => (
                        <Card
                          key={file.id}
                          className="flex min-w-[180px] flex-col gap-2 border-slate-200 p-3 shadow-sm"
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
                  <p className="text-sm text-slate-700">Tambah komentar atau update untuk tim.</p>
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
                placeholder="Berikan konteks atau langkah selanjutnya"
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
              disabled={!selectedMember || loading}
              onClick={handleAssign}
            >
              {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Assign to Resolve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
