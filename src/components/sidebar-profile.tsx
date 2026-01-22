"use client";

import { useMemo, useState } from "react";
import { LogOut, Mail, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/utils/supabase";
import type { SidebarProfileData } from "@/utils/current-user";

type SidebarProfileProps = {
  profile: SidebarProfileData;
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (!parts.length) return "US";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function SidebarProfile({ profile }: SidebarProfileProps) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initials = useMemo(() => getInitials(profile.name), [profile.name]);
  const workspaceLabel = profile.workspace || "Workspace";

  async function handleLogout() {
    setError(null);
    setSigningOut(true);
    const { error: signOutError } = await supabase.auth.signOut();
    setSigningOut(false);

    if (signOutError) {
      setError(signOutError.message);
      return;
    }

    router.push("/login");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          id="sidebar-user-trigger"
          className="flex w-full items-center gap-3 rounded-lg bg-slate-50 px-3 py-3 text-left transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <Avatar className="size-10 border border-slate-200">
            {profile.avatarUrl ? (
              <AvatarImage src={profile.avatarUrl} alt={profile.name} />
            ) : null}
            <AvatarFallback className="bg-slate-200 text-sm font-semibold text-slate-800">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 leading-tight">
            <p className="text-sm font-semibold text-slate-900">{profile.name}</p>
            <p className="text-xs text-slate-500">{workspaceLabel}</p>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>
          <p className="text-sm font-semibold text-slate-900">{profile.name}</p>
          {profile.email ? (
            <p className="text-xs text-slate-500">{profile.email}</p>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {profile.role ? (
          <DropdownMenuItem disabled className="gap-2 text-slate-700">
            <UserRound className="size-4 text-slate-500" />
            <span className="capitalize">{profile.role.replaceAll("_", " ")}</span>
          </DropdownMenuItem>
        ) : null}
        {profile.email ? (
          <DropdownMenuItem disabled className="gap-2 text-slate-700">
            <Mail className="size-4 text-slate-500" />
            <span>{profile.email}</span>
          </DropdownMenuItem>
        ) : null}
        {error ? (
          <div className="px-2 py-1 text-xs text-red-600">{error}</div>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="gap-2 text-destructive focus:text-destructive"
          disabled={signingOut}
        >
          <LogOut className="size-4" />
          {signingOut ? "Logging out..." : "Logout"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
