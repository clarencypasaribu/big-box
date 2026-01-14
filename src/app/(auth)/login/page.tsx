"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
      setError("Gagal mendapatkan sesi pengguna.");
      return;
    }

    const rawRole = user.user_metadata?.role;
    if (rawRole !== "project_manager" && rawRole !== "team_member") {
      setError("Role tidak valid. Hubungi admin.");
      return;
    }

    const role: "project_manager" | "team_member" = rawRole;

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email: user.email,
          first_name: (user.user_metadata?.firstName as string) ?? "",
          last_name: (user.user_metadata?.lastName as string) ?? "",
          full_name: (user.user_metadata?.name as string) ?? user.email,
          role,
        },
        { onConflict: "id" }
      );

    if (profileError) {
      setError(profileError.message);
      return;
    }

    const destination = roleToPath[role] ?? "/member/dashboard";
    router.push(destination);
  }

  return (
    <div className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
      <div className="grid gap-0 md:grid-cols-2">
        <div className="flex flex-col gap-6 px-8 py-10 sm:px-12">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-full bg-indigo-100 text-indigo-700">
              <LockKeyhole className="size-5" />
            </div>
            <p className="text-lg font-semibold text-slate-900">LOGO</p>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-slate-900">Login</h1>
            <p className="text-slate-600">Login to access your travelwise account.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john.doe@gmail.com"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-700">
                <Checkbox id="remember" />
                Remember me
              </label>
              <Link href="/forgot-password" className="text-rose-500 hover:underline">
                Forgot Password
              </Link>
            </div>

            <Button className="h-11 w-full bg-[#4255ff] text-white shadow-sm hover:bg-[#3446e6]" type="submit" disabled={loading}>
              {loading ? "Memproses..." : "Login"}
            </Button>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </form>

          <div className="text-center text-sm text-slate-700">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-rose-500 hover:underline">
              Sign up
            </Link>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              Or login with
              <span className="h-px flex-1 bg-slate-200" />
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm font-semibold text-slate-700">
              {["Facebook", "Google", "Apple"].map((provider) => (
                <button
                  key={provider}
                  type="button"
                  className="rounded-lg border border-slate-200 px-4 py-2 shadow-sm transition hover:bg-slate-50"
                >
                  {provider}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="relative hidden min-h-full items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-indigo-50 md:flex">
          <div className="absolute inset-6 rounded-3xl bg-white shadow-inner" />
          <div className="relative flex h-[420px] w-[320px] flex-col items-center justify-center rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200">
            <div className="flex h-12 w-20 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
              <LockKeyhole className="size-6 text-[#4CAF50]" />
            </div>
            <div className="mt-6 h-16 w-28 rounded-lg bg-[#4CAF50]/10" />
            <div className="mt-8 flex gap-2">
              <span className="h-2 w-6 rounded-full bg-indigo-400" />
              <span className="h-2 w-2 rounded-full bg-indigo-200" />
              <span className="h-2 w-2 rounded-full bg-indigo-200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
