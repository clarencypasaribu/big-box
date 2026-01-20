export const dynamic = "force-dynamic";

interface RiskPageProps {
  params: Promise<{ riskId: string }>;
}

export default async function PMRiskDetailPage({ params }: RiskPageProps) {
  const { riskId } = await params;
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-slate-900">
        Detail Risiko #{riskId}
      </h1>
      <p className="text-slate-600">Analisis risiko dan tindakan mitigasi.</p>
    </div>
  );
}

