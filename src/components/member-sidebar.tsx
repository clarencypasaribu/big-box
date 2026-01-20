"use client";

import Link from "next/link";
import {
  CheckSquare,
  MoreHorizontal,
  Settings,
  SquareChartGantt,
} from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { SidebarProfile } from "@/components/sidebar-profile";
import { cn } from "@/lib/utils";
import type { SidebarProfileData } from "@/utils/current-user";

export type MemberProjectItem = {
  id: string;
  name: string;
  color: "green" | "blue" | "purple" | "amber";
};

type MemberSidebarProps = {
  profile: SidebarProfileData;
  active: "dashboard" | "task" | "settings" | "project";
  taskHref: string;
  projects?: MemberProjectItem[];
  projectHrefBase?: string;
  activeProjectId?: string | null;
};

const fallbackProjects: MemberProjectItem[] = [
  { id: "mobile", name: "Mobile App", color: "green" },
];

export function MemberSidebar({
  profile,
  active,
  taskHref,
  projects = fallbackProjects,
  projectHrefBase = "/member/projects",
  activeProjectId = null,
}: MemberSidebarProps) {
  return (
    <aside className="flex min-h-[90vh] w-[230px] flex-col justify-between rounded-xl border border-slate-200 bg-white px-5 py-6">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-full bg-[#e8defe] text-[#4d2ba3]">
            <SquareChartGantt className="size-5" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#4d2ba3]">Logo</p>
            <p className="text-sm font-semibold text-slate-900">Workspace</p>
          </div>
        </div>

        <nav className="space-y-1.5 text-sm font-semibold">
          <Link
            href="/member/dashboard"
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100",
              active === "dashboard" && "bg-[#e8defe] text-[#2f1c70]"
            )}
          >
            <SquareChartGantt className="size-4" />
            <span className="flex-1 text-left">My Dashboard</span>
          </Link>
          <Link
            href={taskHref}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100",
              active === "task" && "bg-[#e8defe] text-[#2f1c70]"
            )}
          >
            <CheckSquare className="size-4" />
            <span className="flex-1 text-left">My Task</span>
          </Link>
          <Link
            href="/member/settings"
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100",
              active === "settings" && "bg-[#e8defe] text-[#2f1c70]"
            )}
          >
            <Settings className="size-4" />
            <span className="flex-1 text-left">Settings</span>
          </Link>
        </nav>

        <Separator />

        <div className="space-y-3 text-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            My Projects
          </p>
          <div className="space-y-2">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`${projectHrefBase}/${project.id}`}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-2 py-1 text-slate-700 hover:bg-slate-100",
                  project.id === activeProjectId && "bg-[#e8defe] text-[#2f1c70]"
                )}
              >
                <span
                  className={cn(
                    "size-2 rounded-full",
                    project.color === "green" && "bg-emerald-500",
                    project.color === "blue" && "bg-blue-500",
                    project.color === "purple" && "bg-purple-500",
                    project.color === "amber" && "bg-amber-500"
                  )}
                />
                <span className="flex-1 text-left text-sm">{project.name}</span>
                <MoreHorizontal className="size-4 text-slate-400" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <SidebarProfile profile={profile} />
    </aside>
  );
}
