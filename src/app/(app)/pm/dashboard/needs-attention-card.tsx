"use client";

import Link from "next/link";
import { AlertCircle, Clock, AlertTriangle, Bell, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type NeedsAttentionItem = {
    id: string;
    type: "approval" | "overdue" | "risk" | "stale";
    title: string;
    subtitle: string;
    link: string;
    count?: number;
};

const typeConfig = {
    approval: {
        icon: AlertCircle,
        iconBg: "bg-rose-100",
        iconColor: "text-rose-600",
        badge: "🔴",
        label: "Stage approval pending",
    },
    overdue: {
        icon: Clock,
        iconBg: "bg-amber-100",
        iconColor: "text-amber-600",
        badge: "⚠️",
        label: "tasks overdue",
    },
    risk: {
        icon: AlertTriangle,
        iconBg: "bg-rose-100",
        iconColor: "text-rose-600",
        badge: "🚨",
        label: "project at risk",
    },
    stale: {
        icon: Bell,
        iconBg: "bg-yellow-100",
        iconColor: "text-yellow-600",
        badge: "🟡",
        label: "No update for 7 days",
    },
};

interface NeedsAttentionCardProps {
    items: NeedsAttentionItem[];
}

export function NeedsAttentionCard({ items }: NeedsAttentionCardProps) {
    if (items.length === 0) return null;

    return (
        <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50/80 to-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100">
                    <AlertCircle className="h-4 w-4 text-rose-600" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-900">Needs Attention</h2>
                    <p className="text-xs text-slate-500">Items requiring your immediate action</p>
                </div>
            </div>

            <div className="space-y-2">
                {items.slice(0, 5).map((item) => {
                    const config = typeConfig[item.type];
                    const Icon = config.icon;

                    return (
                        <Link
                            key={item.id}
                            href={item.link}
                            className={cn(
                                "group flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-3 transition-all",
                                "hover:border-indigo-200 hover:bg-indigo-50/30 hover:shadow-sm"
                            )}
                        >
                            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", config.iconBg)}>
                                <Icon className={cn("h-5 w-5", config.iconColor)} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-900">
                                    {item.type === "overdue" && item.count
                                        ? `${item.count} ${config.label}`
                                        : item.type === "risk" && item.count
                                            ? `${item.count} ${config.label}`
                                            : config.label}
                                </p>
                                <p className="text-xs text-slate-500 truncate">
                                    {item.title}{item.subtitle ? ` – ${item.subtitle}` : ""}
                                </p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
