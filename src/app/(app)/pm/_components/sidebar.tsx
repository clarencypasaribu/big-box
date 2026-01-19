import Link from "next/link";

import { SidebarProfile } from "@/components/sidebar-profile";
import type { SidebarProfileData } from "@/utils/current-user";
import {
  AlarmClock,
  AlertTriangle,
  Folder,
  LayoutDashboard,
  Users,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/pm/dashboard", icon: LayoutDashboard },
  { label: "Projects", href: "/pm/projects", icon: Folder },
  { label: "Approvals", href: "/pm/approvals", icon: AlarmClock },
  { label: "Risks & Blockers", href: "/pm/risks", icon: AlertTriangle },
  { label: "Users", href: "/pm/users", icon: Users },
];

export function PMSidebar({
  currentPath,
  profile,
}: {
  currentPath: string;
  profile?: SidebarProfileData;
}) {
  return (
    <aside className="hidden w-[230px] flex-col justify-between rounded-xl border border-slate-200 bg-white px-5 py-6 md:flex">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-full bg-[#e8defe] text-[#4d2ba3]">
            <LayoutDashboard className="size-5" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#4d2ba3]">
              Logo
            </p>
            <p className="text-sm font-semibold text-slate-900">Control</p>
          </div>
        </div>

        <nav className="space-y-1.5 text-sm font-semibold">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = currentPath.startsWith(href);
            return (
              <Link
                key={label}
                href={href}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 transition ${
                  active ? "bg-[#e8defe] text-[#2f1c70]" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon className="size-4" />
                <span className="flex-1 text-left">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {profile ? <SidebarProfile profile={profile} /> : null}
    </aside>
  );
}
