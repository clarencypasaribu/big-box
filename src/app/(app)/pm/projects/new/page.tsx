import { PMSidebar } from "@/app/(app)/pm/_components/sidebar";
import { getCurrentUserProfile } from "@/utils/current-user";
import { ProjectCreateForm } from "./project-form";

export default async function PMNewProjectPage() {
  const profile = await getCurrentUserProfile();
  return (
    <div className="min-h-screen bg-[#f7f7f9] text-slate-900">
      <div className="mx-auto flex max-w-screen-2xl gap-6 px-4 py-8 lg:px-8">
        <PMSidebar currentPath="/pm/projects" profile={profile} />

        <main className="flex-1 space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-slate-900">Create New Project</h1>
            <p className="text-slate-600">Lengkapi detail proyek baru.</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <ProjectCreateForm />
          </div>
        </main>
      </div>
    </div>
  );
}
