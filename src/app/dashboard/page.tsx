import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../../utils/supabase-server";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, created_at")
    .eq("id", auth.user.id)
    .maybeSingle();

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>Dashboard</h1>
      <p style={{ marginTop: 8 }}>Email: {auth.user.email}</p>
      <pre style={{ marginTop: 12, background: "#f3f4f6", padding: 12, borderRadius: 12 }}>
        {JSON.stringify(profile, null, 2)}
      </pre>

      <form action="/auth/logout" method="post" style={{ marginTop: 16 }}>
        <button style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #e5e7eb", cursor: "pointer" }}>
          Logout
        </button>
      </form>
    </div>
  );
}
