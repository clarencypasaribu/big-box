import { createSupabaseServerClient } from "./supabase-server";

export type SidebarProfileData = {
  id: string | null;
  name: string;
  email: string | null;
  role: string | null;
  avatarUrl?: string | null;
  workspace?: string | null;
};

export async function getCurrentUserProfile(): Promise<SidebarProfileData> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return {
        id: null,
        name: "Guest",
        email: null,
        role: null,
        workspace: "Bigbox Workspace",
      };
    }

    const user = session.user;
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name,email,role,avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    const name =
      profile?.full_name ||
      (user.user_metadata?.name as string | undefined) ||
      user.email?.split("@")[0] ||
      "User";

    return {
      id: user.id,
      name,
      email: profile?.email ?? user.email ?? null,
      role: profile?.role ?? (user.user_metadata?.role as string | null) ?? null,
      avatarUrl: profile?.avatar_url ?? null,
      workspace: "Bigbox Workspace",
    };
  } catch (error) {
    console.warn("Failed to load current user profile:", error);
    return {
      id: null,
      name: "Guest",
      email: null,
      role: null,
      workspace: "Bigbox Workspace",
    };
  }
}
