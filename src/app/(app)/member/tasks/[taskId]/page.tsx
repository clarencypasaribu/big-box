interface TaskPageProps {
  params: { taskId: string };
}

export default function MemberTaskDetailPage({ params }: TaskPageProps) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-slate-900">
        Detail Tugas #{params.taskId}
      </h1>
      <p className="text-slate-600">Lihat progres, due date, dan catatan.</p>
    </div>
  );
}
