import { PMSidebar } from "@/app/(app)/pm/_components/sidebar";
import { getCurrentUserProfile } from "@/utils/current-user";
import { ProjectCreateForm } from "./project-form";

export default async function PMNewProjectPage() {
  return (
    <main className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Create New Project</h1>
        <p className="text-slate-600">Complete the details for the new project.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <ProjectCreateForm />
      </div>
    </main>
  );
}
