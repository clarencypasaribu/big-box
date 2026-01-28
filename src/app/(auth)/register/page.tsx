"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  UserRound,
  Mail,
  Phone,
  Briefcase,
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
      <div className="flex h-screen w-full overflow-hidden bg-white">
        {/* Left Side - Brand & Visual */}
        <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-12 lg:flex relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 h-[500px] w-[500px] rounded-full bg-blue-400/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-[500px] w-[500px] rounded-full bg-indigo-400/10 blur-3xl" />

          <div className="relative z-10 mb-auto -mt-6">
            <img src="/logo.png" alt="BigBox Logo" className="w-48 h-auto" />
          </div>

          <div className="relative z-10 flex flex-1 flex-col justify-center max-w-lg mx-auto">
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 mb-4">
              Join the new standard in management.
            </h1>
            <p className="text-lg text-slate-600">
              Start your journey with BigBox today. Create an account to organize, track, and deliver like never before.
            </p>
          </div>

          <div className="relative z-10 text-sm text-slate-500">
            © 2026 BigBox Inc.
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="flex flex-1 flex-col justify-center overflow-y-auto bg-white px-8 py-10 sm:px-12 lg:px-24">
          <div className="mx-auto w-full max-w-lg space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Create an account</h1>
              <p className="text-slate-500">
                Let’s get you all set up so you can access your personal account.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">First Name</Label>
                  <div className="relative">
                    <UserRound className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input id="firstName" name="firstName" placeholder="" className="h-11 rounded-md border-slate-200 bg-slate-50 pl-10 text-sm placeholder:text-slate-400 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-0" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Last Name</Label>
                  <Input id="lastName" name="lastName" placeholder="" className="h-11 rounded-md border-slate-200 bg-slate-50 px-3 text-sm placeholder:text-slate-400 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-0" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input id="email" name="email" type="email" placeholder="" className="h-11 rounded-md border-slate-200 bg-slate-50 pl-10 text-sm placeholder:text-slate-400 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-0" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input id="phone" name="phone" type="tel" placeholder="+62 000 0000" className="h-11 rounded-md border-slate-200 bg-slate-50 pl-10 text-sm placeholder:text-slate-400 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-0" />
                  </div>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="position" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Position</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input id="position" name="position" placeholder="" className="h-11 rounded-md border-slate-200 bg-slate-50 pl-10 text-sm placeholder:text-slate-400 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-0" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder=""
                      className="h-11 rounded-md border-slate-200 bg-slate-50 px-3 text-sm placeholder:text-slate-400 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-0 pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder=""
                      className="h-11 rounded-md border-slate-200 bg-slate-50 px-3 text-sm placeholder:text-slate-400 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-0 pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                    >
                      {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input type="checkbox" id="terms" required className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600" />
                <Label htmlFor="terms" className="text-xs text-slate-600 font-normal cursor-pointer">
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
                className="h-11 w-full rounded-lg bg-gradient-to-r from-blue-700 to-blue-900 text-sm font-semibold text-white shadow-md transition-all hover:opacity-90 active:scale-[0.98]"
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
