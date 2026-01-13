import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-600">
          Pemulihan Akun
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">Reset password</h1>
        <p className="text-sm text-slate-600">
          Buat password baru untuk akunmu.
        </p>
      </div>

      <form className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Password baru</Label>
          <Input id="password" name="password" type="password" placeholder="••••••••" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Konfirmasi password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
          />
        </div>
        <Button className="w-full" type="submit">
          Simpan password
        </Button>
      </form>

      <Link className="text-sm text-indigo-600" href="/login">
        Kembali ke login
      </Link>
    </div>
  );
}
