"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  UserRound,
  CheckCircle2,
  Briefcase,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/utils/supabase";

type Role = "project_manager" | "team_member";

type PendingData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  position: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [pendingData, setPendingData] = useState<PendingData | null>(null);

  const fullName = useMemo(() => {
    if (!pendingData) return "";
    return [pendingData.firstName, pendingData.lastName].filter(Boolean).join(" ").trim();
  }, [pendingData]);

  function validatePasswords(password: string, confirmPassword: string) {
    if (!password || !confirmPassword) {
      return "Password and confirmation are required.";
    }
    if (password !== confirmPassword) {
      return "Passwords do not match.";
    }
    return null;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    const firstName = String(formData.get("firstName") || "").trim();
    const lastName = String(formData.get("lastName") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const position = String(formData.get("position") || "").trim();
    const password = String(formData.get("password") || "").trim();
    const confirmPassword = String(formData.get("confirmPassword") || "").trim();

    const passwordError = validatePasswords(password, confirmPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setPendingData({ firstName, lastName, email, phone, position, password });
    setRoleDialogOpen(true);
  }

  async function handleChooseRole(role: Role) {
    if (!pendingData) return;
    setLoading(true);
    const { email, password, phone, position, firstName, lastName } = pendingData;

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: {
          role,
          phone,
          position,
          firstName,
          lastName,
          name: fullName || email,
        },
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }


    const token = signUpData.session?.access_token;
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

    setRoleDialogOpen(false);

    if (signUpData.user && !signUpData.session) {
      window.alert(
        `Registration successful as ${role === "project_manager" ? "Project Manager" : "Team Member"}.\n\nPlease check your email to confirm, then sign in.`
      );
    } else {
      window.alert(
        `Registration successful as ${role === "project_manager" ? "Project Manager" : "Team Member"}. You can sign in now.`
      );
    }
    router.push("/login");
  }

  return (
    <>
      <div className="flex min-h-[720px] w-full max-w-6xl overflow-hidden rounded-[32px] bg-white shadow-2xl">
        {/* Left Side - Brand & Visual */}
        <div className="relative hidden w-[45%] flex-col justify-between bg-gradient-to-br from-blue-50 via-orange-50 to-red-50 p-10 md:flex">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="BigBox Logo" className="h-25 w-auto" />
          </div>

          <div className="mx-auto w-full max-w-sm transform rounded-[32px] bg-white/60 p-8 shadow-xl backdrop-blur-xl transition duration-500 hover:-translate-y-2 hover:shadow-2xl">
            <div className="mb-6 grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 via-orange-500 to-red-500 text-white shadow-lg shadow-blue-500/30">
              <ShieldCheck className="size-6" />
            </div>
            <h2 className="mb-3 text-2xl font-bold leading-tight text-slate-900">
              Manage your projects with confidence.
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-slate-600">
              Join over 10,000+ professionals who trust BigBox for their daily project management and team collaboration workflow.
            </p>
            <div className="flex gap-2">
              <div className="h-1.5 w-8 rounded-full bg-blue-600" />
              <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
              <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
            </div>
          </div>

          <p className="text-xs font-semibold text-slate-400">© 2026 BigBox Inc. All rights reserved.</p>
        </div>

        {/* Right Side - Form */}
        <div className="flex flex-1 flex-col justify-center overflow-y-auto px-8 py-10 sm:px-12 lg:px-16">
          <div className="mx-auto w-full max-w-lg space-y-8">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">Register</h1>
              <p className="text-base text-slate-500">
                Let’s get you all set up so you can access your personal account.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium text-slate-700">First Name</Label>
                  <div className="relative">
                    <UserRound className="absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                    <Input id="firstName" name="firstName" placeholder="John" className="h-12 rounded-xl border-slate-200 pl-11 shadow-sm focus-visible:ring-0 focus-visible:border-blue-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium text-slate-700">Last Name</Label>
                  <Input id="lastName" name="lastName" placeholder="Doe" className="h-12 rounded-xl border-slate-200 shadow-sm focus-visible:ring-0 focus-visible:border-blue-600" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                    <Input id="email" name="email" type="email" placeholder="john@example.com" className="h-12 rounded-xl border-slate-200 pl-11 shadow-sm focus-visible:ring-0 focus-visible:border-blue-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-slate-700">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                    <Input id="phone" name="phone" type="tel" placeholder="+62 812 3456 789" className="h-12 rounded-xl border-slate-200 pl-11 shadow-sm focus-visible:ring-0 focus-visible:border-blue-600" />
                  </div>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="position" className="text-sm font-medium text-slate-700">Position</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                    <Input id="position" name="position" placeholder="e.g. Senior Product Manager" className="h-12 rounded-xl border-slate-200 pl-11 shadow-sm focus-visible:ring-0 focus-visible:border-blue-600" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="h-12 rounded-xl border-slate-200 pr-11 shadow-sm focus-visible:ring-0 focus-visible:border-blue-600"
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
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="h-12 rounded-xl border-slate-200 pr-11 shadow-sm focus-visible:ring-0 focus-visible:border-blue-600"
                    />
                    <button
                      type="button"
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                    >
                      {showConfirmPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input type="checkbox" id="terms" required className="size-5 rounded border-slate-300 text-blue-600 focus:ring-blue-600" />
                <Label htmlFor="terms" className="text-sm text-slate-600 font-normal cursor-pointer">
                  I agree to all the{" "}
                  <a className="font-semibold text-blue-600 hover:underline" href="#" onClick={(e) => e.preventDefault()}>
                    Terms
                  </a>{" "}
                  and{" "}
                  <a className="font-semibold text-blue-600 hover:underline" href="#" onClick={(e) => e.preventDefault()}>
                    Privacy Policies
                  </a>.
                </Label>
              </div>

              <Button
                className="h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 via-orange-500 to-red-500 text-base font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.01] hover:shadow-blue-500/40"
                type="submit"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create account"}
              </Button>
              {error ? <p className="text-center text-sm font-medium text-rose-600 bg-rose-50 p-3 rounded-lg">{error}</p> : null}
            </form>

            <div className="text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-blue-600 hover:underline">
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent showCloseButton={false} className="max-w-md rounded-[32px] bg-white p-8 text-center">
          <DialogHeader className="space-y-3">
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-blue-50 text-blue-600">
              <UserRound className="size-7" />
            </div>
            <DialogTitle className="text-2xl font-bold text-slate-900">Choose Your Role</DialogTitle>
            <DialogDescription className="text-base text-slate-500">
              Choose a role so we can guide you to the right dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 grid gap-4">
            {[
              { label: "As Project Manager", value: "project_manager" as const, desc: "Manage projects & teams" },
              { label: "As Team Member", value: "team_member" as const, desc: "View tasks & collaborate" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={loading}
                onClick={() => handleChooseRole(option.value)}
                className="group relative flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:border-blue-600 hover:shadow-md active:scale-[0.99]"
              >
                <div>
                  <span className="block text-base font-bold text-slate-900">{option.label}</span>
                  <span className="block text-sm text-slate-500">{option.desc}</span>
                </div>
                <div className="grid size-8 place-items-center rounded-full border border-slate-200 text-slate-300 transition-colors group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white">
                  <div className="size-2 rounded-full bg-current" />
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
