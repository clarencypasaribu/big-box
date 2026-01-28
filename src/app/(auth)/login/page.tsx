"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

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
    <div className="flex h-screen w-full overflow-hidden bg-white">
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-12 lg:flex relative overflow-hidden">

        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-[500px] w-[500px] rounded-full bg-blue-400/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-[500px] w-[500px] rounded-full bg-indigo-400/10 blur-3xl" />



        <div className="relative z-10 mb-auto -mt-6">
          <img src="/logo.png" alt="BigBox Logo" className="w-48 h-auto" />
        </div>

        <div className="relative z-10 flex flex-1 flex-col justify-center max-w-lg mx-auto">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 mb-4">
            Welcome back to productivity.
          </h1>
          <p className="text-lg text-slate-600">
            Reconnect with your team and keep your projects moving forward without missing a beat.
          </p>
        </div>

        <div className="relative z-10 text-sm text-slate-500">
          © 2026 BigBox Inc.
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-white px-8 sm:px-12 lg:px-24">
        <div className="w-full max-w-[400px] space-y-8">
          <div className="space-y-2 text-center sm:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back</h2>
            <p className="text-slate-500">Enter your credentials to access your workspace.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Email Address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@gmail.com"
                className="h-11 rounded-md border-slate-200 bg-slate-50 px-3 text-sm placeholder:text-slate-400 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-0"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="h-11 rounded-md border-slate-200 bg-slate-50 px-3 text-sm placeholder:text-slate-400 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-0 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="remember"
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
              />
              <label
                htmlFor="remember"
                className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-600"
              >
                Keep me signed in for 30 days
              </label>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-lg bg-gradient-to-r from-blue-700 to-blue-900 text-sm font-semibold text-white shadow-md transition-all hover:opacity-90 active:scale-[0.98]"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>



          <p className="text-center text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-blue-600 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
