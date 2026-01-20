export const dynamic = "force-dynamic";

interface ApprovalDetailProps {
  params: Promise<{ projectId: string }>;
}

export default async function PMApprovalDetailPage({ params }: ApprovalDetailProps) {
  const { projectId } = await params;
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-slate-900">
        Approval untuk Proyek #{projectId}
      </h1>
      <p className="text-slate-600">Status dan riwayat persetujuan.</p>
    </div>
  );
}

