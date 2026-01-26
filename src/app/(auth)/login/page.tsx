"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/utils/supabase";

const roleToPath: Record<"project_manager" | "team_member", string> = {
  project_manager: "/pm/dashboard",
  team_member: "/member/dashboard",
};

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "").trim();

    setLoading(true);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    const user = data.session?.user;
    if (!user) {
      setError("Unable to load your user session.");
      return;
    }

    const rawRole = user.user_metadata?.role;
    if (rawRole !== "project_manager" && rawRole !== "team_member") {
      setError("Invalid role. Please contact your administrator.");
      return;
    }

    const role: "project_manager" | "team_member" = rawRole;

    const token = data.session?.access_token;
    if (token) {
      const res = await fetch("/api/profile/sync", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message || "Failed to save profile.");
        return;
      }
    }

    const destination = roleToPath[role] ?? "/member/dashboard";
    router.push(destination);
  }

  return (
    <div className="flex min-h-[720px] w-full max-w-6xl overflow-hidden rounded-[32px] bg-white shadow-2xl">
      <div className="relative hidden w-[45%] flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-50 via-orange-50 to-red-50 p-10 md:flex">
        <div className="absolute -top-24 right-0 h-64 w-64 rounded-full bg-blue-200/40 blur-3xl" />
        <div className="absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-red-200/40 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <img src="/logo.png" alt="BigBox Logo" className="h-25 w-auto" />
        </div>

        <div className="relative space-y-6">
          <div className="rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-xl backdrop-blur">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold uppercase tracking-[0.2em] text-slate-500">
                Portfolio overview
              </span>
              <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-600">
                Live
              </span>
            </div>
            <h2 className="mt-4 text-3xl font-semibold leading-tight text-slate-900">
              Keep every team aligned in one workspace.
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              Track milestones, owners, and risks across your programs without switching tools.
            </p>
            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <span className="size-2.5 rounded-full bg-blue-600" />
                  <span className="mt-1 h-10 w-px bg-slate-200" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">Sprint planning locked</p>
                  <p className="text-xs text-slate-500">12 teams aligned on delivery goals</p>
                </div>
                <span className="ml-auto text-xs font-semibold text-slate-500">Today</span>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <span className="size-2.5 rounded-full bg-orange-500" />
                  <span className="mt-1 h-10 w-px bg-slate-200" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">Milestone review</p>
                  <p className="text-xs text-slate-500">6 deliverables signed off</p>
                </div>
                <span className="ml-auto text-xs font-semibold text-slate-500">Wed</span>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <span className="size-2.5 rounded-full bg-red-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">Risk triage</p>
                  <p className="text-xs text-slate-500">3 blockers flagged for escalation</p>
                </div>
                <span className="ml-auto text-xs font-semibold text-slate-500">Fri</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-8 rounded-full bg-blue-600" />
            <span className="h-1.5 w-2 rounded-full bg-slate-300" />
            <span className="h-1.5 w-2 rounded-full bg-slate-300" />
          </div>
        </div>

        <p className="relative text-xs font-semibold text-slate-400">
          © 2026 BigBox Inc. All rights reserved.
        </p>
      </div>

      <div className="flex flex-1 flex-col justify-center overflow-y-auto px-8 py-10 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-lg space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">Sign in</h1>
            <p className="text-base text-slate-500">
              Access your BigBox workspace to manage projects and collaboration.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@gmail.com"
                  className="h-12 rounded-xl border-slate-200 pl-11 shadow-sm focus-visible:border-blue-600 focus-visible:ring-0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="h-12 rounded-xl border-slate-200 pr-11 shadow-sm focus-visible:border-blue-600 focus-visible:ring-0"
                />
                <button
                  type="button"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-3 text-slate-600">
                <input
                  type="checkbox"
                  id="remember"
                  className="size-5 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                />
                Remember me
              </label>
              <Link href="/forgot-password" className="font-semibold text-blue-600 hover:underline">
                Forgot password
              </Link>
            </div>

            <Button
              className="h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 via-orange-500 to-red-500 text-base font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.01] hover:shadow-blue-500/40"
              type="submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
            {error ? (
              <p className="rounded-lg bg-rose-50 p-3 text-center text-sm font-medium text-rose-600">
                {error}
              </p>
            ) : null}
          </form>

          <div className="text-center text-sm text-slate-600">
            New to BigBox?{" "}
            <Link href="/register" className="font-bold text-blue-600 hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
