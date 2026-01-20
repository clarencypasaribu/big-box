export const dynamic = "force-dynamic";

interface EditProjectPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function PMEditProjectPage({ params }: EditProjectPageProps) {
  const { projectId } = await params;
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-slate-900">
        Edit Proyek #{projectId}
      </h1>
      <p className="text-slate-600">Form untuk memperbarui detail proyek.</p>
    </div>
  );
}

