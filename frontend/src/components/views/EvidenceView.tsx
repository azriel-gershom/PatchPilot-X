import { useEffect, useState } from 'react';
import type { RunDetail, RunEvidence } from '../../types';

export default function EvidenceView({ runId }: { runId: string | null }) {
  const [evidence, setEvidence] = useState<RunEvidence | null>(null);
  const [runDetail, setRunDetail] = useState<RunDetail | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!runId) return;
    setLoading(true);

    Promise.all([
      fetch(`/api/agent/runs/${runId}/evidence`).then(r => r.ok ? r.json() : null),
      fetch(`/api/agent/runs/${runId}`).then(r => r.ok ? r.json() : null),
      fetch(`/api/agent/runs/${runId}/explanation`).then(r => r.ok ? r.text() : null)
    ]).then(([evData, detData, expData]) => {
      setEvidence(evData);
      setRunDetail(detData);
      setExplanation(expData || detData?.explanation || null);
    }).catch(err => {
      console.error(err);
    }).finally(() => {
      setLoading(false);
    });
  }, [runId]);

  const validation = evidence?.validation || runDetail?.validation;
  const hallucination = evidence?.hallucination;
  const testSummary = evidence?.targeted || evidence?.baseline;

  return (
    <div className="w-full max-w-[1600px] mx-auto p-5 lg:p-7 flex flex-col gap-5 text-text-primary">
      {/* Header Strip */}
      <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-card-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0 flex flex-col gap-1.5">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="material-symbols-outlined text-[24px] text-emerald-600">assignment</span>
            <span className="text-[22px] font-bold tracking-tight">Evidence & Audit Dossier</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[12px] font-semibold">
              Run #{runId || 'None'}
            </span>
            {validation && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[12px] font-semibold ${
                validation.passed 
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' 
                  : 'bg-rose-50 border border-rose-200 text-rose-700'
              }`}>
                {validation.passed ? 'PASSED EVIDENCE GATE' : 'GATE REJECTED'}
              </span>
            )}
          </div>
          <p className="text-[14px] text-text-secondary font-medium leading-relaxed">
            Immutable proof records, regression gates, hallucination checks, and final engineering explanation report.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 font-mono text-[13px] bg-white rounded-2xl border border-[#E2E8F0]">
          Loading Evidence records...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* EVIDENCE SUMMARY CARDS */}
          <div className="lg:col-span-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className={`p-4 rounded-xl border flex flex-col gap-1 ${
              validation?.passed ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' : 'bg-rose-50/70 border-rose-200 text-rose-950'
            }`}>
              <span className="font-mono text-[11px] uppercase font-bold text-slate-600">Validation Gate</span>
              <span className="text-[20px] font-bold font-mono">
                {validation?.passed ? 'APPROVED' : 'FAILED'}
              </span>
              <span className="text-[12px] truncate">{validation?.reason || 'Pending evaluation'}</span>
            </div>

            <div className={`p-4 rounded-xl border flex flex-col gap-1 ${
              hallucination?.status === 'NO' ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}>
              <span className="font-mono text-[11px] uppercase font-bold text-slate-600">Hallucination Check</span>
              <span className="text-[20px] font-bold font-mono">
                {hallucination?.status === 'NO' ? 'CLEAN (0 HALLUCINATIONS)' : hallucination?.status || 'NOT RUN'}
              </span>
              <span className="text-[12px] text-slate-600">AST symbols verified against real imports</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 flex flex-col gap-1">
              <span className="font-mono text-[11px] uppercase font-bold text-slate-600">Regression Tests</span>
              <span className="text-[20px] font-bold font-mono text-emerald-600">
                {testSummary?.passed ?? 0} Passing
              </span>
              <span className="text-[12px] text-slate-600">{validation?.regressions?.length ?? 0} regressions detected</span>
            </div>
          </div>

          {/* EXPLANATION REPORT (explanation.md) */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-card-sm flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <h3 className="text-[16px] font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-emerald-600">description</span>
                  Engineering Explanation Report (explanation.md)
                </h3>
                <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  Markdown
                </span>
              </div>

              {explanation ? (
                <div className="prose prose-slate max-w-none text-[13px] leading-relaxed text-slate-700 whitespace-pre-wrap font-sans bg-slate-50/60 p-5 rounded-xl border border-slate-200/80 font-mono">
                  {explanation}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 font-mono text-[13px] italic">
                  No explanation.md report generated for this run yet.
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: EVIDENCE GATE LOGS */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Validation Rationale */}
            <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-card-sm flex flex-col gap-3">
              <h3 className="text-[14px] font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-emerald-600">verified</span>
                Evidence Gate Rationale
              </h3>
              <p className="text-[12px] text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                {validation?.reason || 'No validation rationale recorded.'}
              </p>
            </div>

            {/* Hallucination Evidence */}
            {hallucination?.evidence && (
              <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-card-sm flex flex-col gap-3">
                <h3 className="text-[14px] font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-cyan-600">visibility</span>
                  Hallucination Proof
                </h3>
                <div className="flex flex-col gap-2">
                  {hallucination.evidence.map((ev, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-cyan-50/40 border border-cyan-200/60 text-[11px] text-cyan-950 flex items-start gap-2">
                      <span className="material-symbols-outlined text-[15px] text-cyan-600 mt-0.5 flex-shrink-0">check</span>
                      <span>{ev}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
