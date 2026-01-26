export const dynamic = "force-dynamic";

interface ApprovalDetailProps {
  params: Promise<{ projectId: string }>;
}

export default async function PMApprovalDetailPage({ params }: ApprovalDetailProps) {
  const { projectId } = await params;
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-slate-900">
        Approval for Project #{projectId}
      </h1>
      <p className="text-slate-600">Approval status and history.</p>
    </div>
  );
}
