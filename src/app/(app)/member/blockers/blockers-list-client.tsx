"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, Search, Filter, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Blocker = {
    id: string;
    task_id: string;
    task_title: string;
    project_id: string;
    project_name: string;
    title?: string;
    reason: string;
    notes?: string;
    reporter_id: string;
    reporter_name: string;
    status: string;
    created_at: string;
    updated_at: string;
};

type FilterStatus = "all" | "Open" | "Assigned" | "Investigating" | "Resolved";

export function BlockersListClient() {
    const [blockers, setBlockers] = useState<Blocker[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBlocker, setSelectedBlocker] = useState<Blocker | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
    const [updatingStatus, setUpdatingStatus] = useState(false);

    async function fetchBlockers() {
        try {
            const res = await fetch("/api/member/blockers");
            if (res.ok) {
                const body = await res.json();
                setBlockers(body.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch blockers", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchBlockers();
    }, []);

    async function handleStatusChange(blockerId: string, newStatus: string) {
        setUpdatingStatus(true);
        try {
            const res = await fetch(`/api/blockers/${blockerId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (res.ok) {
                // Update local state
                setBlockers((prev) =>
                    prev.map((b) => (b.id === blockerId ? { ...b, status: newStatus } : b))
                );
                // Update selected blocker if open
                if (selectedBlocker?.id === blockerId) {
                    setSelectedBlocker((prev) => prev ? { ...prev, status: newStatus } : null);
                }
            } else {
                console.error("Failed to update status");
            }
        } catch (error) {
            console.error("Error updating status", error);
        } finally {
            setUpdatingStatus(false);
        }
    }

    const filteredBlockers = blockers.filter((blocker) => {
        const matchesSearch =
            blocker.task_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            blocker.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            blocker.project_name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === "all" || blocker.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const statusCounts = {
        all: blockers.length,
        Open: blockers.filter((b) => b.status === "Open").length,
        Assigned: blockers.filter((b) => b.status === "Assigned").length,
        Investigating: blockers.filter((b) => b.status === "Investigating").length,
        Resolved: blockers.filter((b) => b.status === "Resolved").length,
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Open":
                return "bg-red-100 text-red-700";
            case "Assigned":
                return "bg-indigo-100 text-indigo-700";
            case "Investigating":
                return "bg-amber-100 text-amber-700";
            case "Resolved":
                return "bg-emerald-100 text-emerald-700";
            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    return (
        <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <Card className="border-slate-200 bg-white shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="grid size-10 place-items-center rounded-full bg-slate-100">
                                <AlertTriangle className="size-5 text-slate-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{statusCounts.all}</p>
                                <p className="text-xs text-slate-500">Total Blockers</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-red-100 bg-red-50/50 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="grid size-10 place-items-center rounded-full bg-red-100">
                                <AlertTriangle className="size-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-red-700">{statusCounts.Open}</p>
                                <p className="text-xs text-red-600">Open</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-indigo-100 bg-indigo-50/50 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="grid size-10 place-items-center rounded-full bg-indigo-100">
                                <Clock className="size-5 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-indigo-700">{statusCounts.Assigned + statusCounts.Investigating}</p>
                                <p className="text-xs text-indigo-600">In Progress</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-emerald-100 bg-emerald-50/50 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="grid size-10 place-items-center rounded-full bg-emerald-100">
                                <CheckCircle2 className="size-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-emerald-700">{statusCounts.Resolved}</p>
                                <p className="text-xs text-emerald-600">Resolved</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter and Search */}
            <Card className="border-slate-200 bg-white shadow-sm">
                <CardContent className="p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-wrap gap-2">
                            {(["all", "Open", "Assigned", "Investigating", "Resolved"] as FilterStatus[]).map((status) => (
                                <Button
                                    key={status}
                                    variant={filterStatus === status ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setFilterStatus(status)}
                                    className={cn(
                                        "text-xs",
                                        filterStatus === status && "bg-slate-900 text-white"
                                    )}
                                >
                                    {status === "all" ? "All" : status} ({statusCounts[status]})
                                </Button>
                            ))}
                        </div>
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                placeholder="Search blockers..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Blockers List */}
            <Card className="border-slate-200 bg-white shadow-sm">
                <CardHeader className="border-b border-slate-100 pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                        <AlertTriangle className="size-5 text-red-600" />
                        Assigned Blockers
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"></div>
                        </div>
                    ) : filteredBlockers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
                            <CheckCircle2 className="mb-3 size-12 text-emerald-200" />
                            <p className="text-lg font-medium">No blockers found</p>
                            <p className="text-sm">
                                {searchQuery || filterStatus !== "all"
                                    ? "Try adjusting your filters"
                                    : "You have no assigned blockers"}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {filteredBlockers.map((blocker) => (
                                <div
                                    key={blocker.id}
                                    onClick={async () => {
                                        // Auto-change status to Open when clicking
                                        if (blocker.status !== "Open" && blocker.status !== "Resolved") {
                                            await handleStatusChange(blocker.id, "Open");
                                            setSelectedBlocker({ ...blocker, status: "Open" });
                                        } else {
                                            setSelectedBlocker(blocker);
                                        }
                                    }}
                                    className="flex cursor-pointer items-start gap-4 p-4 transition-colors hover:bg-slate-50"
                                >
                                    <div className="grid size-10 shrink-0 place-items-center rounded-full bg-red-100 text-red-600">
                                        <AlertTriangle className="size-5" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-sm font-semibold text-slate-900">
                                                {blocker.task_title || blocker.title || "Untitled Blocker"}
                                            </p>
                                            <span
                                                className={cn(
                                                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                                                    getStatusColor(blocker.status)
                                                )}
                                            >
                                                {blocker.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-600 line-clamp-2">
                                            <span className="font-medium">Reason:</span> {blocker.reason}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs text-slate-500">
                                            <span className="font-medium text-indigo-600">{blocker.project_name}</span>
                                            <span>•</span>
                                            <span>Reported by {blocker.reporter_name}</span>
                                            <span>•</span>
                                            <span>{formatDate(blocker.created_at)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Detail Dialog */}
            <Dialog open={!!selectedBlocker} onOpenChange={(open) => !open && setSelectedBlocker(null)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <AlertTriangle className="size-5 text-red-600" />
                            Blocker Details
                        </DialogTitle>
                    </DialogHeader>
                    {selectedBlocker && (
                        <div className="space-y-5">
                            <div className="space-y-1">
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                                    Task / Issue
                                </p>
                                <p className="text-base font-semibold text-slate-900">
                                    {selectedBlocker.task_title || selectedBlocker.title}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                                        Project
                                    </p>
                                    <p className="text-sm text-slate-900">{selectedBlocker.project_name}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                                        Reporter
                                    </p>
                                    <p className="text-sm text-slate-900">{selectedBlocker.reporter_name}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                                        Status
                                    </p>
                                    <span
                                        className={cn(
                                            "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                                            getStatusColor(selectedBlocker.status)
                                        )}
                                    >
                                        {selectedBlocker.status}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                                        Created
                                    </p>
                                    <p className="text-sm text-slate-900">{formatDate(selectedBlocker.created_at)}</p>
                                </div>
                            </div>

                            <div className="space-y-1 rounded-lg border border-red-100 bg-red-50 p-3">
                                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-red-800">
                                    Reason / Issue
                                </p>
                                <p className="text-sm text-red-900">{selectedBlocker.reason}</p>
                            </div>

                            {selectedBlocker.notes && (
                                <div className="space-y-1 rounded-lg border border-indigo-100 bg-indigo-50 p-3">
                                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-indigo-800">
                                        Instructions from PM
                                    </p>
                                    <p className="text-sm text-indigo-900">{selectedBlocker.notes}</p>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                                    Update Status
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {selectedBlocker.status !== "Investigating" && selectedBlocker.status !== "Resolved" && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-amber-600 border-amber-200 hover:bg-amber-50"
                                            disabled={updatingStatus}
                                            onClick={() => handleStatusChange(selectedBlocker.id, "Investigating")}
                                        >
                                            {updatingStatus ? <Loader2 className="mr-1 size-3 animate-spin" /> : null}
                                            Start Investigating
                                        </Button>
                                    )}
                                    {selectedBlocker.status !== "Resolved" && (
                                        <Button
                                            size="sm"
                                            className="bg-emerald-600 text-white hover:bg-emerald-700"
                                            disabled={updatingStatus}
                                            onClick={() => handleStatusChange(selectedBlocker.id, "Resolved")}
                                        >
                                            {updatingStatus ? <Loader2 className="mr-1 size-3 animate-spin" /> : null}
                                            Mark as Resolved
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <Button variant="outline" onClick={() => setSelectedBlocker(null)}>
                                    Close
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
