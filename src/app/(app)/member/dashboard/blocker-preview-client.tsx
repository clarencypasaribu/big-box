"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ChevronRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Blocker = {
    id: string;
    status: string;
};

export function BlockerPreviewClient() {
    const [blockerCount, setBlockerCount] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        async function fetchBlockers() {
            try {
                const res = await fetch("/api/member/blockers");
                if (res.ok) {
                    const body = await res.json();
                    const data: Blocker[] = body.data || [];
                    const activeCount = data.length;
                    setBlockerCount(activeCount);
                }
            } catch (error) {
                console.error("Failed to fetch blockers", error);
            } finally {
                setLoading(false);
            }
        }
        fetchBlockers();
    }, []);

    useEffect(() => {
        if (blockerCount === 0) {
            const timer = setTimeout(() => {
                setVisible(false);
            }, 5000); // Disappear after 5 seconds to give enough time to read
            return () => clearTimeout(timer);
        }
    }, [blockerCount]);

    if (loading) return null;

    if (blockerCount === 0) {
        if (!visible) return null;

        return (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50/50 px-4 py-2.5 text-sm text-emerald-700 animate-in fade-in slide-in-from-top-1 transition-opacity duration-500">
                <CheckCircle2 className="size-4 shrink-0" />
                <span className="font-medium">You have no active blockers. Keep it up!</span>
            </div>
        )
    }

    return (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-800 animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center gap-2.5">
                <div className="grid size-6 place-items-center rounded-full bg-rose-200 text-rose-700 shrink-0">
                    <AlertTriangle className="size-3.5" />
                </div>
                <p>
                    You have <span className="font-bold">{blockerCount} active blocker{blockerCount === 1 ? '' : 's'}</span> requiring attention.
                </p>
            </div>
            <Link href="/member/blockers" className="flex items-center gap-1 font-semibold hover:underline decoration-rose-800/50 underline-offset-4 shrink-0">
                View Details <ChevronRight className="size-3.5" />
            </Link>
        </div>
    );
}
