"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/utils/supabase";

const roles = [
  { name: "Yash", title: "Team lead", assigned: true },
  { name: "Yash", title: "Team lead", assigned: false },
  { name: "Yash", title: "Team lead", assigned: false },
  { name: "Yash", title: "Team lead", assigned: false },
  { name: "Yash", title: "Team lead", assigned: false },
  { name: "Yash", title: "Team lead", assigned: false },
  { name: "Yash", title: "Team lead", assigned: false },
];

export function ProjectCreateForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const token = await supabase.auth.getSession().then((res) => res.data.session?.access_token);
    const authHeader: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({
          name: title,
          description,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Gagal membuat project");
      }

      router.push("/pm/projects");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat project");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-800" htmlFor="title">
          Project Title
        </label>
        <Input
          id="title"
          name="title"
          placeholder="Nama proyek"
          className="h-11"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-800" htmlFor="description">
          Project Description
        </label>
        <textarea
          id="description"
          name="description"
          placeholder="Deskripsikan tujuan proyek..."
          className="min-h-[120px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr,1fr]">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-800">Project Roles</label>
          <div className="rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
              <span>Team Lead</span>
              <span className="text-slate-400">▼</span>
            </div>
            <div className="divide-y divide-slate-200">
              {roles.map((role, idx) => (
                <label
                  key={`${role.name}-${idx}`}
                  className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700"
                >
                  <span className="flex-1">
                    {role.name} <span className="text-slate-400 italic">{role.title}</span>
                  </span>
                  <input
                    type="checkbox"
                    defaultChecked={role.assigned}
                    className="size-4 rounded border-slate-300 text-indigo-600"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800" htmlFor="startDate">
              Start Date
            </label>
            <Input
              id="startDate"
              name="startDate"
              type="date"
              className="h-11"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800" htmlFor="endDate">
              End Date
            </label>
            <Input
              id="endDate"
              name="endDate"
              type="date"
              className="h-11"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </div>
        </div>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <div className="flex items-center justify-end gap-3 pt-4">
        <Button variant="ghost" asChild>
          <Link href="/pm/projects">Cancel</Link>
        </Button>
        <Button className="bg-[#256eff] text-white hover:bg-[#1c55c7]" disabled={saving}>
          {saving ? "Creating..." : "Create"}
        </Button>
      </div>
    </form>
  );
}
