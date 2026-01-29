"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Notification = {
    id: string;
    title: string;
    message: string;
    type: string;
    created_at: string;
};

export function RecentActivity() {
    const [activities, setActivities] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchActivity() {
            try {
                const res = await fetch("/api/notifications?limit=5");
                if (res.ok) {
                    const body = await res.json();
                    setActivities((body.data || []).slice(0, 5));
                }
            } catch (error) {
                console.error("Failed to fetch activity", error);
            } finally {
                setLoading(false);
            }
        }
        fetchActivity();
    }, []);

    if (activities.length === 0 && !loading) return null;

    return (
        <Card className="border-slate-200 shadow-sm h-full">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <Activity className="size-5 text-indigo-600" />
                    <CardTitle className="text-base font-semibold text-slate-800">
                        Recent Activity
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex gap-3">
                                <div className="size-2 mt-1.5 rounded-full bg-slate-200 animate-pulse shrink-0" />
                                <div className="h-4 w-3/4 bg-slate-100 rounded animate-pulse" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-6 relative ml-1">
                        {/* Thread line */}
                        <div className="absolute left-[3px] top-2 bottom-2 w-px bg-slate-200" />

                        {activities.map((item) => {
                            const timeAgo = formatTimeAgo(item.created_at);
                            return (
                                <div key={item.id} className="relative flex gap-3 text-sm group">
                                    <div className="relative z-10 grid place-items-center mt-1">
                                        <div className="size-2 rounded-full bg-slate-300 ring-4 ring-white group-hover:bg-indigo-500 transition-colors" />
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <p className="text-slate-700 font-medium leading-tight">
                                            {item.title} <span className="font-normal text-slate-500"> - {item.message}</span>
                                        </p>
                                        <span className="text-xs text-slate-400">{timeAgo}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function formatTimeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
}
