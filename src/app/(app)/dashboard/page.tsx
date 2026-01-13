import { redirect } from "next/navigation";

// TODO: Replace with real role-based logic (e.g., from session/user profile).
export default function AppDashboardRedirect() {
  redirect("/pm/dashboard");
}
