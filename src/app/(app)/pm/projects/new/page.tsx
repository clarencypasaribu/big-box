import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarProfile } from "@/components/sidebar-profile";
import { getCurrentUserProfile } from "@/utils/current-user";

const navItems = [
  { label: "Dashboard", href: "/pm/dashboard" },
  { label: "Projects", href: "/pm/projects", active: true },
  { label: "Approvals", href: "/pm/approvals" },
  { label: "Risks & Blockers", href: "/pm/risks" },
  { label: "Users", href: "/pm/users" },
];

const roles = [
  { name: "Yash", title: "Team lead", assigned: true },
  { name: "Yash", title: "Team lead", assigned: false },
  { name: "Yash", title: "Team lead", assigned: false },
  { name: "Yash", title: "Team lead", assigned: false },
  { name: "Yash", title: "Team lead", assigned: false },
  { name: "Yash", title: "Team lead", assigned: false },
  { name: "Yash", title: "Team lead", assigned: false },
];

export default async function PMNewProjectPage() {
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
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-slate-900">Create New Project</h1>
            <p className="text-slate-600">Lengkapi detail proyek baru.</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-800" htmlFor="title">
                  Project Title
                </label>
                <Input id="title" name="title" placeholder="Nama proyek" className="h-11" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-800" htmlFor="description">
                  Project Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  placeholder="Deskripsikan tujuan proyek..."
                  className="min-h-[120px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.5fr,1fr]">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-800">Project Roles</label>
                  <div className="rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
                      <span>Team Lead</span>
                      <span className="text-slate-400">▼</span>
                    </div>
                    <div className="divide-y divide-slate-200">
                      {roles.map((role, idx) => (
                        <label
                          key={`${role.name}-${idx}`}
                          className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700"
                        >
                          <span className="flex-1">
                            {role.name}{" "}
                            <span className="text-slate-400 italic">{role.title}</span>
                          </span>
                          <input
                            type="checkbox"
                            defaultChecked={role.assigned}
                            className="size-4 rounded border-slate-300 text-indigo-600"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-800" htmlFor="startDate">
                      Start Date
                    </label>
                    <Input id="startDate" name="startDate" type="date" className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-800" htmlFor="endDate">
                      End Date
                    </label>
                    <Input id="endDate" name="endDate" type="date" className="h-11" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <Button variant="ghost" asChild>
                  <Link href="/pm/projects">Cancel</Link>
                </Button>
                <Button className="bg-[#256eff] text-white hover:bg-[#1c55c7]">Create</Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
