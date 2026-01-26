"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SidebarProfile } from "@/components/sidebar-profile";
import { cn } from "@/lib/utils";
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

export function PMSidebar({ profile }: { profile?: SidebarProfileData }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 h-screen flex w-80 shrink-0 flex-col justify-between overflow-y-auto border-r border-slate-200 bg-[#0b1220] px-4 py-6 text-slate-300 shadow-lg shadow-black/20">
      <div className="space-y-8">
        <div className="flex items-center px-2">
          <img src="/logo.png" alt="BigBox Logo" className="h-28 w-auto max-w-[200px] object-contain" />
        </div>

        <nav className="space-y-2 text-sm font-medium">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = pathname?.startsWith(href);
            return (
              <Link
                key={label}
                href={href}
                className={cn(
                  "relative flex w-full items-center gap-3 rounded-xl px-4 py-3 transition",
                  active
                    ? "bg-white/5 text-blue-300 shadow-sm shadow-black/10"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                {active ? (
                  <span className="absolute left-2 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-blue-500" />
                ) : null}
                <Icon className="size-5" />
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
