"use client";

import { useMemo, useState } from "react";
import { Eye, Folder, Loader2, Search, Ban, ShieldAlert, Mail, Phone as PhoneIcon, BadgeCheck, Calendar, Briefcase } from "lucide-react";
import { Input } from "@/components/ui/input";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  status: "Active" | "Inactive";
  phone: string;
  position: string;
  avatarUrl: string | null;
  joinedAt?: string;
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

  // Confirmation Guardrail State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ userId: string; nextStatus: UserRow["status"] } | null>(null);

  // Detail Modal State
  const [detailUser, setDetailUser] = useState<UserRow | null>(null);

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
    const roles = new Set(users.map((u) => u.role).filter(Boolean));
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

  function handleStatusChange(user: UserRow, nextStatus: UserRow["status"]) {
    // Guardrail: If deactivating a Project Manager
    if (nextStatus === "Inactive" && (user.role?.toLowerCase() === "project_manager" || user.role === "Project Manager")) {
      setPendingAction({ userId: user.id, nextStatus });
      setConfirmOpen(true);
      return;
    }
    // Otherwise proceed
    updateStatus(user.id, nextStatus);
  }

  function confirmStatusChange() {
    if (pendingAction) {
      updateStatus(pendingAction.userId, pendingAction.nextStatus);
    }
    setConfirmOpen(false);
    setPendingAction(null);
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
              {uniqueRoles.map((role) => (
                <SelectItem key={role} value={role!}>
                  {role}
                </SelectItem>
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
          <TooltipProvider delayDuration={300}>
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
                  filteredUsers.map((user) => {
                    const isPM =
                      (user.role ?? "").toLowerCase() === "project_manager" || user.role === "Project Manager";
                    return (
                      <TableRow key={user.id} className="border-slate-200 text-sm hover:bg-slate-50/80">
                        <TableCell className="font-semibold text-slate-900">{user.name}</TableCell>
                        <TableCell className="text-slate-600">{user.email}</TableCell>
                        <TableCell className="text-slate-700">
                          <Badge
                            variant="outline"
                            className={`rounded-full border-0 px-2.5 py-0.5 font-medium ${isPM
                              ? "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-700/10"
                              : "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-600/10"
                              }`}
                          >
                            {user.role ?? "—"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {!(user.id || "").trim() && (
                            <p className="mb-1 text-xs text-amber-600">User ID not available yet</p>
                          )}
                          <Select
                            value={user.status}
                            onValueChange={(value) =>
                              handleStatusChange(user, value as UserRow["status"])
                            }
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
                          <div className="flex items-center justify-center gap-2 text-slate-600">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="size-8 p-0 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
                                  onClick={() => setDetailUser(user)}
                                >
                                  <Eye className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View details</p>
                              </TooltipContent>
                            </Tooltip>

                            {loadingId === user.id && <Loader2 className="size-4 animate-spin text-slate-400" />}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TooltipProvider>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-amber-100">
              <ShieldAlert className="size-6 text-amber-600" />
            </div>
            <DialogTitle className="text-center text-lg font-semibold text-slate-900">
              Deactivate Project Manager?
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-slate-500">
              Deactivating a Project Manager may affect active projects they are managing. Are you sure you want to proceed?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button variant="outline" onClick={() => setConfirmOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmStatusChange}
              className="w-full bg-amber-600 hover:bg-amber-700 sm:w-auto"
            >
              Yes, Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Detail Modal */}
      <Dialog open={!!detailUser} onOpenChange={(open) => !open && setDetailUser(null)}>
        <DialogContent className="p-0 overflow-hidden border-0 sm:max-w-md bg-white shadow-2xl rounded-2xl">
          {detailUser && (
            <>
              {/* Header Gradient */}
              <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 text-white/70 hover:bg-white/20 hover:text-white rounded-full"
                  onClick={() => setDetailUser(null)}
                >
                  <span className="sr-only">Close</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x size-5"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                </Button>
              </div>

              <div className="px-6 pb-6">
                <div className="relative flex flex-col items-center -mt-12 mb-6">
                  <div className="relative flex size-24 items-center justify-center rounded-full bg-white ring-4 ring-white shadow-md overflow-hidden text-3xl font-bold text-indigo-600">
                    {detailUser.avatarUrl ? (
                      <img src={detailUser.avatarUrl} alt={detailUser.name} className="size-full object-cover" />
                    ) : (
                      detailUser.name.charAt(0).toUpperCase()
                    )}
                    <div className={`absolute bottom-0 right-0 size-6 rounded-full border-[3px] border-white ${detailUser.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                  </div>

                  <div className="text-center mt-3 space-y-1">
                    <h2 className="text-xl font-bold text-slate-900">{detailUser.name}</h2>
                    <p className="text-sm font-medium text-slate-500 flex items-center justify-center gap-1.5">
                      {detailUser.position || "No Position"}
                      <span className="text-slate-300">•</span>
                      <span className="text-indigo-600">{detailUser.role || "Team Member"}</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-3">
                    {/* Email - Full Width */}
                    <div className="flex items-center p-3 rounded-xl bg-slate-50 border border-slate-100 gap-3">
                      <div className="grid size-10 place-items-center rounded-full bg-white text-slate-500 shadow-sm border border-slate-100 shrink-0">
                        <Mail className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Email Address</p>
                        <p className="text-sm font-medium text-slate-900 truncate">{detailUser.email}</p>
                      </div>
                    </div>

                    {/* Grid for other details */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center p-3 rounded-xl bg-slate-50 border border-slate-100 gap-3">
                        <div className="grid size-10 place-items-center rounded-full bg-white text-slate-500 shadow-sm border border-slate-100 shrink-0">
                          <PhoneIcon className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Phone</p>
                          <p className="text-sm font-medium text-slate-900 truncate">{detailUser.phone || "-"}</p>
                        </div>
                      </div>

                      <div className="flex items-center p-3 rounded-xl bg-slate-50 border border-slate-100 gap-3">
                        <div className="grid size-10 place-items-center rounded-full bg-white text-slate-500 shadow-sm border border-slate-100 shrink-0">
                          <Briefcase className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Position</p>
                          <p className="text-sm font-medium text-slate-900 truncate">{detailUser.position || "-"}</p>
                        </div>
                      </div>

                      <div className="flex items-center p-3 rounded-xl bg-slate-50 border border-slate-100 gap-3">
                        <div className="grid size-10 place-items-center rounded-full bg-white text-slate-500 shadow-sm border border-slate-100 shrink-0">
                          <Calendar className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Joined</p>
                          <p className="text-sm font-medium text-slate-900 truncate">{detailUser.joinedAt || "-"}</p>
                        </div>
                      </div>

                      <div className="flex items-center p-3 rounded-xl bg-slate-50 border border-slate-100 gap-3">
                        <div className="grid size-10 place-items-center rounded-full bg-white text-slate-500 shadow-sm border border-slate-100 shrink-0">
                          <BadgeCheck className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Status</p>
                          <div className={`inline-flex items-center gap-1.5 mt-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${detailUser.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                            <div className={`size-1.5 rounded-full ${detailUser.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                            {detailUser.status}
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
              <DialogTitle className="sr-only">User Details</DialogTitle>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
