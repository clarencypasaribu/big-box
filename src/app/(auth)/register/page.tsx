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
      return "Password dan konfirmasi password wajib diisi.";
    }
    if (password !== confirmPassword) {
      return "Password dan konfirmasi tidak sama.";
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

    // Jika email confirmation aktif, tidak ada session token
    // Profile akan di-sync saat user pertama kali login setelah confirm email
    const token = signUpData.session?.access_token;
    if (token) {
      // User langsung dapat session (email confirm disabled di Supabase)
      const res = await fetch("/api/profile/sync", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message || "Gagal menyimpan profil.");
        return;
      }
    }

    setRoleDialogOpen(false);

    // Cek apakah user perlu confirm email atau sudah bisa langsung login
    if (signUpData.user && !signUpData.session) {
      window.alert(
        `Registrasi berhasil sebagai ${role === "project_manager" ? "Project Manager" : "Team Member"}.\n\nSilakan cek email Anda untuk konfirmasi, lalu login.`
      );
    } else {
      window.alert(
        `Registrasi berhasil sebagai ${role === "project_manager" ? "Project Manager" : "Team Member"}. Silakan login.`
      );
    }
    router.push("/login");
  }

  return (
    <>
      <div className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="grid gap-0 md:grid-cols-2">
          <div className="relative hidden items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-indigo-50 md:flex">
            <div className="absolute inset-6 rounded-3xl bg-white shadow-inner" />
            <div className="relative flex h-[440px] w-[320px] flex-col items-center justify-center rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200">
              <div className="flex h-12 w-20 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
                <LockKeyhole className="size-6 text-[#4b2fdb]" />
              </div>
              <div className="mt-6 h-16 w-28 rounded-lg bg-[#4b2fdb]/10" />
              <div className="mt-8 flex gap-2">
                <span className="h-2 w-6 rounded-full bg-indigo-400" />
                <span className="h-2 w-2 rounded-full bg-indigo-200" />
                <span className="h-2 w-2 rounded-full bg-indigo-200" />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6 px-8 py-10 sm:px-12">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-full bg-indigo-100 text-indigo-700">
                <LockKeyhole className="size-5" />
              </div>
              <p className="text-lg font-semibold text-slate-900">LOGO</p>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-semibold text-slate-900">Register</h1>
              <p className="text-slate-600">Let’s get you all set up so you can access your personal account.</p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <div className="relative">
                    <UserRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input id="firstName" name="firstName" placeholder="John" className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" name="lastName" placeholder="Doe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input id="email" name="email" type="email" placeholder="john.doe@gmail.com" className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input id="phone" name="phone" type="tel" placeholder="+62..." className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="position">Position</Label>
                  <Input id="position" name="position" placeholder="Web Developer" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
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
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                    >
                      {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" required className="size-4 rounded border-slate-300 text-indigo-600" />
                <span>
                  I agree to all the{" "}
                  <a className="text-rose-500" href="#" onClick={(e) => e.preventDefault()}>
                    Terms
                  </a>{" "}
                  and{" "}
                  <a className="text-rose-500" href="#" onClick={(e) => e.preventDefault()}>
                    Privacy Policies
                  </a>
                </span>
              </div>

              <Button
                className="h-11 w-full bg-[#4255ff] text-white shadow-sm hover:bg-[#3446e6]"
                type="submit"
                disabled={loading}
              >
                {loading ? "Memproses..." : "Create account"}
              </Button>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
            </form>

            <div className="text-center text-sm text-slate-700">
              Already have an account?{" "}
              <Link href="/login" className="text-rose-500 hover:underline">
                Login
              </Link>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="h-px flex-1 bg-slate-200" />
                Or Sign up with
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
        </div>
      </div>

      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent showCloseButton={false} className="max-w-lg rounded-3xl bg-white p-8 text-center">
          <DialogHeader>
            <DialogTitle className="text-2xl text-slate-900">Choose Your Role</DialogTitle>
            <DialogDescription className="text-slate-600">
              Tentukan peran agar kami bisa mengarahkanmu ke dashboard yang tepat.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: "As Project Manager", value: "project_manager" as const },
              { label: "As Team Member", value: "team_member" as const },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={loading}
                onClick={() => handleChooseRole(option.value)}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-indigo-50 p-5 text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <UserRound className="size-8 text-slate-900" />
                <span className="rounded-md bg-black px-3 py-2 text-xs font-semibold uppercase text-white">
                  {option.label}
                </span>
                {loading && (
                  <span className="text-xs text-slate-500">Processing...</span>
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <CheckCircle2 className="size-4" />
            <span>Role ini akan disimpan di akunmu.</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
