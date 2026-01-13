interface RiskPageProps {
  params: { riskId: string };
}

export default function PMRiskDetailPage({ params }: RiskPageProps) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-slate-900">
        Detail Risiko #{params.riskId}
      </h1>
      <p className="text-slate-600">Analisis risiko dan tindakan mitigasi.</p>
    </div>
  );
}
