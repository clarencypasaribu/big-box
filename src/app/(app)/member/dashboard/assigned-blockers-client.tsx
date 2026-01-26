"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Blocker = {
    id: string;
    task_title: string;
    reason: string;
    project_name: string;
    reporter_name: string;
    status: string;
    notes?: string;
    created_at: string;
};

export function AssignedBlockersClient() {
    const [blockers, setBlockers] = useState<Blocker[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBlocker, setSelectedBlocker] = useState<Blocker | null>(null);

    useEffect(() => {
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

        fetchBlockers();
    }, []);

    return (
        <>
            <Card className={cn("shadow-sm", blockers.length > 0 ? "border-red-100 bg-red-50/50" : "border-slate-200")}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className={cn("text-lg font-semibold flex items-center gap-2", blockers.length > 0 ? "text-red-700" : "text-slate-900")}>
                        {blockers.length > 0 ? (
                            <AlertTriangle className="size-5" />
                        ) : (
                            <CheckCircle2 className="size-5 text-emerald-500" />
                        )}
                        Assigned Blockers
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {loading ? (
                        <p className="text-sm text-slate-500">Checking blockers...</p>
                    ) : blockers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-6 text-center text-slate-500">
                            <CheckCircle2 className="mb-2 size-8 text-emerald-100" />
                            <p className="text-sm">Good news! You have no active blockers.</p>
                        </div>
                    ) : (
                        blockers.map((blocker) => (
                            <div
                                key={blocker.id}
                                onClick={() => setSelectedBlocker(blocker)}
                                className="flex cursor-pointer items-start gap-3 rounded-lg border border-red-200 bg-white p-3 shadow-sm hover:border-indigo-300 hover:bg-slate-50 transition-colors"
                            >
                                <div className="grid size-8 shrink-0 place-items-center rounded-full bg-red-100 text-red-600">
                                    <AlertTriangle className="size-4" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium text-slate-900">
                                        {blocker.task_title || "Untitled Blocker"}
                                    </p>
                                    <p className="text-xs text-slate-600 line-clamp-1">
                                        <span className="font-medium text-slate-800">Reason:</span> {blocker.reason}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <span>{blocker.project_name}</span>
                                        <span>•</span>
                                        <span className={cn("px-1.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide",
                                            blocker.status === "Assigned" ? "bg-indigo-100 text-indigo-700" : "bg-red-100 text-red-700"
                                        )}>
                                            {blocker.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>

            <Dialog open={!!selectedBlocker} onOpenChange={(open) => !open && setSelectedBlocker(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <AlertTriangle className="size-5 text-red-600" />
                            Blocker Details
                        </DialogTitle>
                    </DialogHeader>
                    {selectedBlocker && (
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-slate-500 uppercase tracking-widest text-[10px]">Task / Issue</p>
                                <p className="text-base font-semibold text-slate-900">{selectedBlocker.task_title}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-slate-500 uppercase tracking-widest text-[10px]">Project</p>
                                    <p className="text-sm text-slate-900">{selectedBlocker.project_name}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-slate-500 uppercase tracking-widest text-[10px]">Reporter</p>
                                    <p className="text-sm text-slate-900">{selectedBlocker.reporter_name}</p>
                                </div>
                            </div>

                            <div className="space-y-1 rounded-lg bg-red-50 p-3 border border-red-100">
                                <p className="text-xs font-semibold text-red-800 uppercase tracking-wide mb-1">Reason / Issue</p>
                                <p className="text-sm text-red-900">{selectedBlocker.reason}</p>
                            </div>

                            {/* Show notes if available (PM Instructions) */}
                            {blockers.find(b => b.id === selectedBlocker.id)?.notes && (
                                <div className="space-y-1 rounded-lg bg-indigo-50 p-3 border border-indigo-100">
                                    <p className="text-xs font-semibold text-indigo-800 uppercase tracking-wide mb-1">Instruction from PM</p>
                                    <p className="text-sm text-indigo-900">{blockers.find(b => b.id === selectedBlocker.id)?.notes}</p>
                                </div>
                            )}

                            <div className="flex justify-end pt-2">
                                <Button onClick={() => setSelectedBlocker(null)}>Close</Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
