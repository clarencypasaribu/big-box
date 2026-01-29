import { Eye, Folder, Search, ShieldOff, User, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { UsersTableClient, type UserRow } from "@/app/(app)/pm/users/users-table-client";
import { PMSidebar } from "@/app/(app)/pm/_components/sidebar";
import { getCurrentUserProfile } from "@/utils/current-user";
import { createSupabaseServiceClient } from "@/utils/supabase-service";

export const dynamic = "force-dynamic";

const statusColor: Record<UserRow["status"], string> = {
  Active: "bg-emerald-50 text-emerald-700",
  Inactive: "bg-slate-200 text-slate-700",
};

async function loadUsersFromDb(): Promise<{ users: UserRow[]; error?: string | null; supportsStatus: boolean }> {
  try {
    const supabase = await createSupabaseServiceClient({ allowWrite: true });
    let supportsStatus = true;
    let data: any[] | null = null;

    const firstAttempt = await supabase
      .from("profiles")
      .select("id,full_name,email,role,is_active,updated_at,phone,position,avatar_url,created_at")
      .order("full_name", { ascending: true });

    if (firstAttempt.error) {
      if (firstAttempt.error.message.toLowerCase().includes("is_active")) {
        supportsStatus = false;
        const fallback = await supabase
          .from("profiles")
          .select("id,full_name,email,role,updated_at")
          .order("full_name", { ascending: true });
        if (fallback.error) {
          console.error("Failed to load profiles:", fallback.error.message);
          return { users: [], error: fallback.error.message, supportsStatus };
        }
        data = fallback.data ?? [];
      } else {
        console.error("Failed to load profiles:", firstAttempt.error.message);
        return { users: [], error: firstAttempt.error.message, supportsStatus };
      }
    } else {
      data = firstAttempt.data ?? [];
    }

    const users: UserRow[] = (data ?? []).map((row: any) => {
      const id = String(row.id ?? "").trim();
      const rawStatus = row.is_active;
      const isActive = supportsStatus
        ? rawStatus === true || rawStatus === "true" || rawStatus === 1 || rawStatus === "1"
        : !!row.updated_at;
      return {
        id,
        name: row.full_name || row.email || "User",
        email: row.email || "-",
        role: row.role || null,
        status: isActive ? "Active" : "Inactive",
        phone: row.phone || "-",
        position: row.position || "-",
        avatarUrl: row.avatar_url || null,
        joinedAt: row.created_at ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(new Date(row.created_at)) : "Unknown",
      };
    });

    return { users, error: null, supportsStatus };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load profiles";
    console.error(message);
    return { users: [], error: message, supportsStatus: false };
  }
}

export default async function PMUsersPage() {
  const { users, error, supportsStatus } = await loadUsersFromDb();
  const activeCount = users.filter((user) => user.status === "Active").length;
  const inactiveCount = users.filter((user) => user.status === "Inactive").length;

  return (
    <main className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold text-slate-900">User</h1>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <div className="space-y-1">
              <p className="text-sm text-slate-600">Active</p>
              <p className="text-3xl font-semibold text-slate-900">{activeCount}</p>
            </div>
            <div className="grid size-12 place-items-center rounded-full bg-emerald-100 text-emerald-700">
              <User className="size-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <div className="space-y-1">
              <p className="text-sm text-slate-600">Inactive</p>
              <p className="text-3xl font-semibold text-slate-900">{inactiveCount}</p>
            </div>
            <div className="grid size-12 place-items-center rounded-full bg-rose-100 text-rose-700">
              <ShieldOff className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Failed to load users: {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <UsersTableClient initialUsers={users} supportsStatus={supportsStatus} />
      </div>
    </main>
  );
}
