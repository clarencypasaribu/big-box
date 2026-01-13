interface ProjectPageProps {
  params: { projectId: string };
}

export default function PMProjectDetailPage({ params }: ProjectPageProps) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-slate-900">
        Detail Proyek #{params.projectId}
      </h1>
      <p className="text-slate-600">Informasi ringkas tentang proyek.</p>
    </div>
  );
}
