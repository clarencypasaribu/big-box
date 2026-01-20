import { MemberSidebar } from "@/components/member-sidebar";
import { getCurrentUserProfile } from "@/utils/current-user";
import { createSupabaseServerClient } from "@/utils/supabase-server";
import { SettingsClient } from "./settings-client";
import { getMemberProjects } from "@/utils/member-projects";

export default async function MemberSettingsPage() {
  const profile = await getCurrentUserProfile();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialProfile = {
    name: profile.name,
    email: profile.email ?? "",
    firstName: "",
    lastName: "",
    phone: "",
    position: "",
    bio: "",
    avatarUrl: "",
  };

  if (user) {
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("first_name,last_name,full_name,email,phone,position,bio,avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    initialProfile = {
      name:
        profileRow?.full_name ||
        (user.user_metadata?.name as string | undefined) ||
        profile.name,
      email: profileRow?.email ?? user.email ?? profile.email ?? "",
      firstName: profileRow?.first_name ?? (user.user_metadata?.firstName as string) ?? "",
      lastName: profileRow?.last_name ?? (user.user_metadata?.lastName as string) ?? "",
      phone: profileRow?.phone ?? (user.user_metadata?.phone as string) ?? "",
      position: profileRow?.position ?? (user.user_metadata?.position as string) ?? "",
      bio: profileRow?.bio ?? "",
      avatarUrl: profileRow?.avatar_url ?? "",
    };
  }

  const memberProjects = await getMemberProjects(profile.id);

  return (
    <div className="min-h-screen bg-[#f7f7f9] text-slate-900">
      <div className="mx-auto flex max-w-screen-2xl gap-6 px-4 py-8 lg:px-8">
        <MemberSidebar
          profile={profile}
          active="settings"
          taskHref="/member/tasks/1001"
          projects={memberProjects}
        />
        <main className="flex-1">
          <SettingsClient initialProfile={initialProfile} />
        </main>
      </div>
    </div>
  );
}
