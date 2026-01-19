import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Eye,
  Filter,
  LayoutDashboard,
  Search,
  ShieldAlert,
} from "lucide-react";

import { PMSidebar } from "@/app/(app)/pm/_components/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { getCurrentUserProfile } from "@/utils/current-user";

type RiskRow = {
  id: string;
  code: string;
  title: string;
  description: string;
  project: string;
  assignee: string;
  status: "Investigating" | "Open" | "Mitigated" | "Resolved";
  reportDate: string;
};

const risks: RiskRow[] = [
  {
    id: "1",
    code: "#BLK-2024-092",
    title: "Koneksi ke CCTV Dishub terputus",
    description: "Connection time out repeatedly on port 8080. Unable to establish secure stream.",
    project: "Big Vision",
    assignee: "Eliza Talent",
    status: "Investigating",
    reportDate: "23 Oct 2025",
  },
  {
    id: "2",
    code: "#BLK-2024-093",
    title: "Latency tinggi di traffic monitor",
    description: "Spike latency pada API core ketika peak traffic > 10k rpm.",
    project: "Big Vision",
    assignee: "Eliza Talent",
    status: "Investigating",
    reportDate: "23 Oct 2025",
  },
  {
    id: "3",
    code: "#BLK-2024-094",
    title: "Alert false-positive IDS",
    description: "IDS memicu banyak alert palsu pada subnet internal.",
    project: "Big Vision",
    assignee: "Eliza Talent",
    status: "Investigating",
    reportDate: "23 Oct 2025",
  },
];

function statusColor(status: RiskRow["status"]) {
  switch (status) {
    case "Investigating":
      return "bg-amber-50 text-amber-700";
    case "Open":
      return "bg-rose-50 text-rose-700";
    case "Mitigated":
      return "bg-blue-50 text-blue-700";
    case "Resolved":
      return "bg-emerald-50 text-emerald-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default async function PMRisksPage() {
  const profile = await getCurrentUserProfile();

  return (
    <div className="min-h-screen bg-[#f7f7f9] text-slate-900">
      <div className="mx-auto flex max-w-screen-2xl gap-6 px-4 py-8 lg:px-8">
        <PMSidebar currentPath="/pm/risks" profile={profile} />

        <main className="flex-1 space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold text-slate-900">Risk/Blocker Highlight</h1>
              <p className="text-slate-600">Lihat blocker aktif, risiko kritis, dan resolusi hari ini.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" className="gap-2">
                <Bell className="size-4" />
                Alerts
              </Button>
              <Button className="bg-[#256eff] text-white hover:bg-[#1c55c7]">New Risk</Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="flex items-center justify-between gap-4 p-5">
                <div className="space-y-1">
                  <p className="text-sm text-slate-600">Total Active Blocker</p>
                  <div className="flex items-center gap-3">
                    <p className="text-3xl font-semibold text-slate-900">12</p>
                    <span className="text-sm font-semibold text-rose-600">+2 today</span>
                  </div>
                </div>
                <div className="grid size-12 place-items-center rounded-lg bg-rose-50 text-rose-600">
                  <ShieldAlert className="size-5" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="flex items-center justify-between gap-4 p-5">
                <div className="space-y-1">
                  <p className="text-sm text-slate-600">Critical Risks</p>
                  <div className="flex items-center gap-3">
                    <p className="text-3xl font-semibold text-slate-900">5</p>
                    <span className="text-sm font-semibold text-amber-600">+1 new</span>
                  </div>
                </div>
                <div className="grid size-12 place-items-center rounded-lg bg-amber-50 text-amber-600">
                  <AlertTriangle className="size-5" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="flex items-center justify-between gap-4 p-5">
                <div className="space-y-1">
                  <p className="text-sm text-slate-600">Resolved Today</p>
                  <div className="flex items-center gap-3">
                    <p className="text-3xl font-semibold text-slate-900">3</p>
                    <span className="text-sm font-semibold text-emerald-600">+3 closed</span>
                  </div>
                </div>
                <div className="grid size-12 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                  <LayoutDashboard className="size-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 md:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="h-11 rounded-md border-slate-200 bg-slate-50 pl-10 text-sm"
                    placeholder="Search"
                  />
                </div>
                <Button
                  variant="outline"
                  className="h-11 rounded-md border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                >
                  <Filter className="size-4" />
                  Filter
                </Button>
              </div>
            </div>

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
                      <span className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">{risk.project}</span>
                      </span>
                      <Separator orientation="vertical" className="h-4" />
                      <span>Assignee: {risk.assignee}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-3 text-sm text-slate-600 lg:items-end">
                    <div className="flex items-center gap-2">
                      <Badge className={`rounded-md ${statusColor(risk.status)}`}>
                        {risk.status}
                      </Badge>
                      <ArrowRight className="size-4 text-slate-400" />
                    </div>
                    <div className="text-xs text-slate-500">Report: {risk.reportDate}</div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
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
          </div>
        </main>
      </div>
    </div>
  );
}
