"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo } from "react";

export type ProjectHealthData = {
  onTrack: number;
  atRisk: number;
  delayed: number;
};

export function ProjectHealthChart({ data }: { data: ProjectHealthData }) {
  const total = data.onTrack + data.atRisk + data.delayed;

  const segments = useMemo(() => {
    const cleanTotal = total || 1; // avoid divide by zero for percentages
    return [
      {
        label: "On Track",
        value: data.onTrack,
        percent: (data.onTrack / cleanTotal) * 100,
        color: "#10b981",
      },
      {
        label: "At Risk",
        value: data.atRisk,
        percent: (data.atRisk / cleanTotal) * 100,
        color: "#f59e0b",
      },
      {
        label: "Delayed",
        value: data.delayed,
        percent: (data.delayed / cleanTotal) * 100,
        color: "#ef4444",
      },
    ];
  }, [data.atRisk, data.delayed, data.onTrack, total]);

  const gradient = useMemo(() => {
    let acc = 0;
    const stops = segments.map((seg) => {
      const start = acc;
      const end = acc + seg.percent;
      acc = end;
      return `${seg.color} ${start}% ${end}%`;
    });
    return stops.join(", ");
  }, [segments]);

  return (
    <Card className="border-slate-200/60 bg-white shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-slate-900">Project Health Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="relative mx-auto flex h-48 w-48 items-center justify-center">
            <div
              className="absolute inset-2 rounded-full"
              style={{
                background: total === 0 ? "#f1f5f9" : `conic-gradient(${gradient})`,
              }}
            />
            <div className="absolute inset-6 rounded-full bg-white shadow-inner" />
            <div className="relative flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-slate-900">{total}</span>
              <span className="text-xs font-medium text-slate-500">Projects</span>
            </div>
          </div>

          <div className="grid w-full max-w-sm grid-cols-1 gap-3">
            {segments.map((seg) => (
              <div
                key={seg.label}
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="inline-flex size-3 rounded-full" style={{ backgroundColor: seg.color }} />
                  <div className="flex flex-col leading-tight">
                    <span className="text-sm font-semibold text-slate-800">{seg.label}</span>
                    <span className="text-xs text-slate-500">{seg.percent.toFixed(0)}%</span>
                  </div>
                </div>
                <span className="text-base font-semibold text-slate-900">{seg.value}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
