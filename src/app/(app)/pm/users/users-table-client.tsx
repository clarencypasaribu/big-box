"use client";

import { useMemo, useState } from "react";
import { Eye, Folder, Loader2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

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

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchSearch =
        searchQuery === "" ||
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchRole = roleFilter === "all" || (user.role ?? "").toLowerCase() === roleFilter.toLowerCase();
      const matchStatus = statusFilter === "all" || user.status.toLowerCase() === statusFilter.toLowerCase();

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const uniqueRoles = useMemo(() => {
    const roles = new Set(users.map(u => u.role).filter(Boolean));
    return Array.from(roles);
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
        throw new Error(body.message || "Failed to update user status.");
      }
      setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, status: nextStatus } : user)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user status.");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-1">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 rounded-lg border-slate-200 bg-white pl-10 text-sm focus-visible:ring-indigo-600"
              placeholder="Search user by name or email..."
            />
          </div>

          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-10 w-[160px] rounded-lg border-slate-200 bg-white">
              <div className="flex items-center gap-2">
                <Folder className="size-4 text-slate-500" />
                <SelectValue placeholder="All Roles" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {uniqueRoles.map(role => (
                <SelectItem key={role} value={role!}>{role}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 w-[140px] rounded-lg border-slate-200 bg-white">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

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
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-sm text-slate-500">
                    {searchQuery || roleFilter !== "all" || statusFilter !== "all"
                      ? "No users match the filters."
                      : "No users registered yet."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
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
                        <p className="mb-1 text-xs text-amber-600">User ID not available yet</p>
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
