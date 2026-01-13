interface EditProjectPageProps {
  params: { projectId: string };
}

export default function PMEditProjectPage({ params }: EditProjectPageProps) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-slate-900">
        Edit Proyek #{params.projectId}
      </h1>
      <p className="text-slate-600">Form untuk memperbarui detail proyek.</p>
    </div>
  );
}
