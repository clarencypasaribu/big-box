"use client";

import { useMemo, useRef, useState } from "react";
import { Mail, Pencil } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/utils/supabase";

type SettingsClientProps = {
  initialProfile: {
    name: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    position: string;
    bio: string;
    avatarUrl: string;
  };
};

export function SettingsClient({ initialProfile }: SettingsClientProps) {
  const [profile, setProfile] = useState(initialProfile);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(profile.avatarUrl || "");
  const formRef = useRef<HTMLFormElement | null>(null);

  const initials = useMemo(() => {
    const parts = profile.name.trim().split(/\s+/);
    if (!parts.length) return "US";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }, [profile.name]);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    const token = await supabase.auth.getSession().then((res) => res.data.session?.access_token);
    if (!token) {
      setSaving(false);
      setError("Sesi login tidak ditemukan.");
      return;
    }

    const formEl = formRef.current;
    if (!formEl) {
      setSaving(false);
      setError("Form tidak ditemukan.");
      return;
    }

    const payload = new FormData(formEl);
    const firstName = String(payload.get("firstName") ?? "").trim();
    const lastName = String(payload.get("lastName") ?? "").trim();
    const phone = String(payload.get("phone") ?? "").trim();
    const position = String(payload.get("position") ?? "").trim();
    const bio = String(payload.get("bio") ?? "").trim();
    const name = [firstName, lastName].filter(Boolean).join(" ").trim() || profile.name;

    try {
      if (avatarFile) {
        if (avatarFile.size > 2 * 1024 * 1024) {
          throw new Error("Ukuran avatar maksimal 2MB.");
        }

        const uploadData = new FormData();
        uploadData.append("avatar", avatarFile);
        const uploadRes = await fetch("/api/profile/avatar", {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body: uploadData,
        });

        if (!uploadRes.ok) {
          const body = await uploadRes.json().catch(() => ({}));
          throw new Error(body.message || "Gagal mengunggah avatar.");
        }

        const body = await uploadRes.json();
        setProfile((prev) => ({ ...prev, avatarUrl: body.avatarUrl ?? prev.avatarUrl }));
        if (body.avatarUrl) {
          setAvatarPreview(body.avatarUrl);
        }
        setAvatarFile(null);
      }

      const res = await fetch("/api/profile/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ firstName, lastName, phone, position, bio }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Gagal memperbarui profil.");
      }

      setProfile((prev) => ({
        ...prev,
        name,
        firstName,
        lastName,
        phone,
        position,
        bio,
      }));
      setDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui profil.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Profile Information</h1>
        <p className="text-slate-600">Manage your profile, update notification preferences.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="size-10 border border-slate-200">
                {profile.avatarUrl ? (
                  <AvatarImage
                    src={profile.avatarUrl}
                    alt={profile.name}
                    className="h-10 w-10 object-cover"
                  />
                ) : null}
                <AvatarFallback className="bg-slate-200 text-sm font-semibold text-slate-800">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-lg font-semibold text-slate-900">{profile.name}</p>
                <p className="text-sm text-slate-500">{profile.email}</p>
              </div>
            </div>
            <Button
              className="bg-[#256eff] text-white hover:bg-[#1c55c7]"
              onClick={() => setDialogOpen(true)}
            >
              Edit
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" value={profile.firstName} readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" value={profile.lastName} readOnly />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" value={profile.email} readOnly />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="bio">Bio</Label>
              <textarea
                id="bio"
                value={profile.bio}
                readOnly
                className="min-h-[120px] w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
              />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-900">My email Address</p>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-4">
              <div className="grid size-10 place-items-center rounded-full bg-indigo-100 text-indigo-600">
                <Mail className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{profile.email}</p>
                <p className="text-xs text-slate-500">1 month ago</p>
              </div>
            </div>
            <Button variant="outline" className="w-fit text-indigo-600">
              + Add Email Address
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-slate-900">Edit Profile</DialogTitle>
          </DialogHeader>
          <form ref={formRef} className="space-y-4" onSubmit={handleSave}>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-4">
              <Avatar className="size-10 border border-slate-200">
                {avatarPreview ? (
                  <AvatarImage src={avatarPreview} alt={profile.name} className="h-10 w-10 object-cover" />
                ) : null}
                <AvatarFallback className="bg-slate-200 text-sm font-semibold text-slate-800">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-slate-900">{profile.name}</p>
                <p className="text-xs text-slate-500">{profile.email}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstNameEdit">First Name</Label>
                <Input id="firstNameEdit" name="firstName" defaultValue={profile.firstName} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastNameEdit">Last Name</Label>
                <Input id="lastNameEdit" name="lastName" defaultValue={profile.lastName} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emailEdit">Email account</Label>
              <div className="relative">
                <Input id="emailEdit" defaultValue={profile.email} readOnly className="pr-10" />
                <Mail className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phoneEdit">Mobile number</Label>
                <Input id="phoneEdit" name="phone" defaultValue={profile.phone} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="positionEdit">Position</Label>
                <Input id="positionEdit" name="position" defaultValue={profile.position} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bioEdit">Bio</Label>
              <textarea
                id="bioEdit"
                name="bio"
                defaultValue={profile.bio}
                className="min-h-[140px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatarEdit">Profile Avatar</Label>
              <Input
                id="avatarEdit"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setAvatarFile(file);
                  if (file) {
                    setAvatarPreview(URL.createObjectURL(file));
                  }
                }}
              />
              <p className="text-xs text-slate-500">JPG/PNG, max 2MB.</p>
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-[#256eff] text-white hover:bg-[#1c55c7]" type="submit" disabled={saving}>
                <Pencil className="mr-2 size-4" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
