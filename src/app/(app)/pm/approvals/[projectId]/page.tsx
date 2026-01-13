interface ApprovalDetailProps {
  params: { projectId: string };
}

export default function PMApprovalDetailPage({ params }: ApprovalDetailProps) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-slate-900">
        Approval untuk Proyek #{params.projectId}
      </h1>
      <p className="text-slate-600">Status dan riwayat persetujuan.</p>
    </div>
  );
}
