import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-600">
          Pemulihan Akun
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">Lupa password</h1>
        <p className="text-sm text-slate-600">
          Masukkan email untuk menerima tautan reset.
        </p>
      </div>

      <form className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="you@example.com" />
        </div>
        <Button className="w-full" type="submit">
          Kirim tautan reset
        </Button>
      </form>

      <Link className="text-sm text-indigo-600" href="/login">
        Kembali ke login
      </Link>
    </div>
  );
}
