"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AlertTriangle, CheckSquare, SquareChartGantt } from "lucide-react";

import { SidebarProfile } from "@/components/sidebar-profile";
import { cn } from "@/lib/utils";
import type { SidebarProfileData } from "@/utils/current-user";

export type MemberProjectItem = {
  id: string;
  name: string;
  color: "green" | "blue" | "purple" | "amber";
};

type activeType = "dashboard" | "task" | "blockers" | "settings" | "project";

type MemberSidebarProps = {
  profile: SidebarProfileData;
  projects?: MemberProjectItem[];
};

const fallbackProjects: MemberProjectItem[] = [
  { id: "mobile", name: "Mobile App", color: "green" },
];

export function MemberSidebar({
  profile,
  projects = fallbackProjects,
}: MemberSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const derivedProjectId = useMemo(() => {
    if (!pathname) return null;
    const match =
      pathname.match(/^\/member\/project\/([^/]+)/) ??
      pathname.match(/^\/member\/projects\/([^/]+)/);
    return match?.[1] ?? null;
  }, [pathname]);

  const active: activeType | null = useMemo(() => {
    if (!pathname) return null;
    if (pathname.includes("/member/dashboard")) return "dashboard";
    if (pathname.includes("/member/tasks")) return "task";
    if (pathname.includes("/member/blockers")) return "blockers";
    if (pathname.includes("/member/settings")) return "settings";
    if (pathname.includes("/member/project/")) return "project";
    return null;
  }, [pathname]);

  const taskHref = "/member/tasks";
  const projectHrefBase = "/member/project";
  const resolvedActiveProjectId = derivedProjectId;

  return (
    <aside className="sticky top-0 h-screen flex w-80 shrink-0 flex-col justify-between overflow-y-auto border-r border-slate-200 bg-[#0b1220] px-4 py-6 text-slate-300 shadow-lg shadow-black/20">
      <div className="space-y-8">
        <div className="flex items-center px-2">
          <img
            src="/logo.png"
            alt="BIGBOX"
            className="h-28 w-auto max-w-[200px] object-contain"
          />
        </div>

        <nav className="space-y-2 text-sm font-medium">
          <Link
            href="/member/dashboard"
            className={cn(
              "relative flex w-full items-center gap-3 rounded-xl px-4 py-3 transition",
              active === "dashboard"
                ? "bg-white/5 text-blue-300 shadow-sm shadow-black/10"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            )}
          >
            {active === "dashboard" ? (
              <span className="absolute left-2 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-blue-500" />
            ) : null}
            <SquareChartGantt className="size-5" />
            <span className="flex-1">My Dashboard</span>
          </Link>

          <Link
            href={taskHref}
            className={cn(
              "relative flex w-full items-center gap-3 rounded-xl px-4 py-3 transition",
              active === "task"
                ? "bg-white/5 text-blue-300 shadow-sm shadow-black/10"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            )}
          >
            {active === "task" ? (
              <span className="absolute left-2 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-blue-500" />
            ) : null}
            <CheckSquare className="size-5" />
            <span className="flex-1">My Tasks</span>
          </Link>

          <Link
            href="/member/blockers"
            className={cn(
              "relative flex w-full items-center gap-3 rounded-xl px-4 py-3 transition",
              active === "blockers"
                ? "bg-white/5 text-blue-300 shadow-sm shadow-black/10"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            )}
          >
            {active === "blockers" ? (
              <span className="absolute left-2 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-blue-500" />
            ) : null}
            <AlertTriangle className="size-5" />
            <span className="flex-1">My Blockers</span>
          </Link>
        </nav>

        <div className="space-y-4 px-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-slate-500">
            My Projects
          </p>

          <div className="space-y-1">
            {projects.map((project) => {
              const href = `${projectHrefBase}/${encodeURIComponent(project.id)}`;

              return (
                <button
                  key={project.id}
                  type="button"
                  className={cn(
                    "relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition",
                    project.id === resolvedActiveProjectId
                      ? "bg-white/5 text-white"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  )}
                  onClick={() => {
                    router.push(href);
                    router.refresh();
                  }}
                >
                  <span
                    className={cn(
                      "size-2.5 rounded-full",
                      project.color === "green" && "bg-emerald-500",
                      project.color === "blue" && "bg-blue-500",
                      project.color === "purple" && "bg-purple-500",
                      project.color === "amber" && "bg-amber-500"
                    )}
                  />

                  <span className="flex-1 min-w-0 break-words text-left">
                    {project.name}
                  </span>

                  {project.id === resolvedActiveProjectId && (
                    <div className="absolute right-2 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-blue-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <SidebarProfile profile={profile} />
    </aside>
  );
}
