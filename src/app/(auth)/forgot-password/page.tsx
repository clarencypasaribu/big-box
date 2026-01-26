import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-600">
          Account Recovery
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">Forgot password</h1>
        <p className="text-sm text-slate-600">
          Enter your email to receive a reset link.
        </p>
      </div>

      <form className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="you@example.com" />
        </div>
        <Button className="w-full" type="submit">
          Send reset link
        </Button>
      </form>

      <Link className="text-sm text-indigo-600" href="/login">
        Back to sign in
      </Link>
    </div>
  );
}
