import { AlertTriangle, Bell, Filter, LayoutDashboard, Search, ShieldAlert } from "lucide-react";

import { PMSidebar } from "@/app/(app)/pm/_components/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RisksClient } from "@/app/(app)/pm/risks/risks-client";
import { getCurrentUserProfile } from "@/utils/current-user";

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
              <p className="text-slate-600">Laporan blocker dari tim, detail task, dan assignment member.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Card className="flex items-center gap-2 border-slate-200 bg-white px-3 py-2 shadow-sm">
                <Search className="size-4 text-slate-500" />
                <Input
                  placeholder="Cari blocker"
                  className="h-9 w-36 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
                />
              </Card>
              <Card className="flex items-center gap-2 border-slate-200 bg-white px-3 py-2 shadow-sm">
                <Filter className="size-4 text-slate-500" />
                <span className="text-sm font-semibold text-slate-700">Filter</span>
              </Card>
              <Card className="flex items-center gap-2 border-slate-200 bg-white px-3 py-2 shadow-sm">
                <Bell className="size-4 text-slate-500" />
                <span className="text-sm font-semibold text-slate-700">Alerts</span>
              </Card>
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

          <RisksClient />
        </main>
      </div>
    </div>
  );
}
