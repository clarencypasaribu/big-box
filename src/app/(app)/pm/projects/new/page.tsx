import Link from "next/link";

import { SidebarProfile } from "@/components/sidebar-profile";
import { getCurrentUserProfile } from "@/utils/current-user";
import { ProjectCreateForm } from "./project-form";

const navItems = [
  { label: "Dashboard", href: "/pm/dashboard" },
  { label: "Projects", href: "/pm/projects", active: true },
  { label: "Approvals", href: "/pm/approvals" },
  { label: "Risks & Blockers", href: "/pm/risks" },
  { label: "Users", href: "/pm/users" },
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
            <ProjectCreateForm />
          </div>
        </main>
      </div>
    </div>
  );
}
