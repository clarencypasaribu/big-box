import Link from "next/link";
import { Eye, Folder, Search, ShieldOff, User, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SidebarProfile } from "@/components/sidebar-profile";
import { getCurrentUserProfile } from "@/utils/current-user";

type UserRow = {
  name: string;
  email: string;
  role: string;
  status: "Active" | "Inactive";
};

const navItems = [
  { label: "Dashboard", href: "/pm/dashboard" },
  { label: "Projects", href: "/pm/projects" },
  { label: "Approvals", href: "/pm/approvals" },
  { label: "Risks & Blockers", href: "/pm/risks" },
  { label: "Users", href: "/pm/users", active: true },
];

const users: UserRow[] = [
  { name: "Anima Eliza", email: "animaeliza@gmail.com", role: "Team Member", status: "Active" },
  { name: "Anima", email: "anima@gmail.com", role: "Team Member", status: "Active" },
  { name: "Anima", email: "anima@gmail.com", role: "Team Member", status: "Inactive" },
  { name: "Anima", email: "anima@gmail.com", role: "Team member", status: "Active" },
  { name: "Anima", email: "anima@gmail.com", role: "Team member", status: "Active" },
];

const statusColor: Record<UserRow["status"], string> = {
  Active: "bg-amber-50 text-amber-700",
  Inactive: "bg-slate-200 text-slate-700",
};

export default async function PMUsersPage() {
  const profile = await getCurrentUserProfile();
  return (
    <div className="min-h-screen bg-[#f7f7f9] text-slate-900">
      <div className="mx-auto flex max-w-screen-2xl gap-6 px-4 py-8 lg:px-8">
        <aside className="hidden w-[230px] flex-col justify-between rounded-xl border border-slate-200 bg-white px-5 py-6 md:flex">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-full bg-[#e8defe] text-[#4d2ba3]">
                <span className="text-lg font-semibold">LOGO</span>
              </div>
            </div>

            <nav className="space-y-1.5 text-sm font-semibold">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 transition ${
                    item.active ? "bg-[#e8defe] text-[#2f1c70]" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span className="flex-1 text-left">{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          <SidebarProfile profile={profile} />
        </aside>

        <main className="flex-1 space-y-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold text-slate-900">User</h1>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="flex items-center justify-between gap-4 p-5">
                <div className="space-y-1">
                  <p className="text-sm text-slate-600">Active</p>
                  <p className="text-3xl font-semibold text-slate-900">30</p>
                </div>
                <div className="grid size-12 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                  <User className="size-5" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="flex items-center justify-between gap-4 p-5">
                <div className="space-y-1">
                  <p className="text-sm text-slate-600">Inactive</p>
                  <p className="text-3xl font-semibold text-slate-900">5</p>
                </div>
                <div className="grid size-12 place-items-center rounded-lg bg-rose-50 text-rose-700">
                  <ShieldOff className="size-5" />
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
                    placeholder="Search user"
                  />
                </div>
                <Button
                  variant="outline"
                  className="h-11 rounded-md border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                >
                  <Folder className="size-4" />
                  Filter
                </Button>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <div className="grid grid-cols-[1.4fr,1.4fr,1fr,1fr,0.6fr] bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <div>User Name</div>
                <div>Email</div>
                <div>Role</div>
                <div>Status</div>
                <div className="text-center">Actions</div>
              </div>
              <div className="divide-y divide-slate-200">
                {users.map((user, idx) => (
                  <div
                    key={`${user.email}-${idx}`}
                    className="grid grid-cols-[1.4fr,1.4fr,1fr,1fr,0.6fr] items-center px-5 py-4 text-sm text-slate-800"
                  >
                    <div className="font-semibold">{user.name}</div>
                    <div className="text-slate-600">{user.email}</div>
                    <div className="text-slate-700">{user.role}</div>
                    <div>
                      <Badge className={`rounded-md ${statusColor[user.status]}`}>
                        {user.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-center gap-4 text-slate-600">
                      <Eye className="size-5" />
                      <X className="size-5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
