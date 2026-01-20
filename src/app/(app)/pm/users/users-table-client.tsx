"use client";

import { useMemo, useState } from "react";
import { Eye, Loader2, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  status: "Active" | "Inactive";
};

const statusColor: Record<UserRow["status"], string> = {
  Active: "bg-emerald-50 text-emerald-700",
  Inactive: "bg-slate-200 text-slate-700",
};

export function UsersTableClient({
  initialUsers,
  supportsStatus,
}: {
  initialUsers: UserRow[];
  supportsStatus: boolean;
}) {
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => a.name.localeCompare(b.name));
  }, [users]);

  async function updateStatus(userId: string, nextStatus: UserRow["status"]) {
    const normalizedId = (userId || "").trim();
    if (!normalizedId) return;
    if (!supportsStatus) return;
    setLoadingId(userId);
    setError(null);
    try {
      const res = await fetch(`/api/profiles/${encodeURIComponent(normalizedId)}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, profileId: normalizedId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Gagal memperbarui status user");
      }
      setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, status: nextStatus } : user)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui status user");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-3">
      {error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      ) : null}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <Table className="min-w-[780px]">
            <TableHeader className="bg-slate-50">
              <TableRow className="border-slate-200">
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Name
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Email
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Role
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Status
                </TableHead>
                <TableHead className="text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-sm text-slate-500">
                    Belum ada user terdaftar.
                  </TableCell>
                </TableRow>
              ) : (
                sortedUsers.map((user) => (
                  <TableRow key={user.id} className="border-slate-200 text-sm hover:bg-slate-50/80">
                    <TableCell className="font-semibold text-slate-900">{user.name}</TableCell>
                    <TableCell className="text-slate-600">{user.email}</TableCell>
                    <TableCell className="text-slate-700">
                      <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50">
                        {user.role ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {!(user.id || "").trim() && (
                        <p className="mb-1 text-xs text-amber-600">ID user belum tersedia</p>
                      )}
                      <Select
                        value={user.status}
                        onValueChange={(value) => updateStatus(user.id, value as UserRow["status"])}
                        disabled={loadingId === user.id || !supportsStatus || !(user.id || "").trim()}
                      >
                        <SelectTrigger className="w-[140px] rounded-full border-slate-200 text-left text-xs font-semibold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent align="start">
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-3 text-slate-600">
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-700 hover:bg-slate-100">
                          <Eye className="size-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-700 hover:bg-slate-100">
                          <X className="size-4" />
                        </Button>
                        {loadingId === user.id && <Loader2 className="size-4 animate-spin text-slate-400" />}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
