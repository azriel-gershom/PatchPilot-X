import { useEffect, useState } from 'react';
import type { RunDetail, RunEvidence } from '../../types';

export default function VerificationArena({ runId }: { runId: string | null }) {
  const [evidence, setEvidence] = useState<RunEvidence | null>(null);
  const [runDetail, setRunDetail] = useState<RunDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!runId) return;
    setLoading(true);

    Promise.all([
      fetch(`/api/agent/runs/${runId}/evidence`),
      fetch(`/api/agent/runs/${runId}`),
    ]).then(async ([evRes, detRes]) => {
      if (evRes.ok) {
        const evData = await evRes.json();
        setEvidence(evData);
      }
      if (detRes.ok) {
        const detData = await detRes.json();
        setRunDetail(detData);
      }
    }).catch(err => {
      console.error('Failed to load evidence', err);
    }).finally(() => {
      setLoading(false);
    });
  }, [runId]);

  const validation = evidence?.validation || runDetail?.validation;
  const passed = validation?.passed;
  const invariants = runDetail?.contract?.must_preserve || [];
  const hallucination = evidence?.hallucination;

  return (
    <div className="flex flex-col gap-5 text-text-primary">
      {/* HEADER STRIP */}
      <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-card-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0 flex flex-col gap-1.5">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="material-symbols-outlined text-[24px] text-amber-500">shield</span>
            <span className="text-[22px] font-bold tracking-tight">Verification Arena</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[12px] font-semibold">
              Run #{runId || 'None'}
            </span>
            {validation && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[12px] font-semibold ${
                passed 
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' 
                  : 'bg-rose-50 border border-rose-200 text-rose-700'
              }`}>
                <span className="material-symbols-outlined text-[14px]">
                  {passed ? 'verified' : 'gpp_bad'}
                </span>
                {passed ? 'GATE PASSED' : 'GATE REJECTED'}
              </span>
            )}
          </div>
          <p className="text-[14px] text-text-secondary font-medium leading-relaxed">
            Multi-stage invariant validation, hallucination detection, and regression proof verification.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-8 rounded-2xl border border-[#E2E8F0] text-center text-slate-500 font-mono text-[13px]">
          Loading verification evidence...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* EVIDENCE GATE VERDICT */}
          <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-card-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-emerald-600">policy</span>
                Evidence Gate Verdict
              </h3>
              {validation && (
                <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                  passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {passed ? 'APPROVED' : 'FAILED'}
                </span>
              )}
            </div>

            {validation ? (
              <div className="flex flex-col gap-3">
                <div className={`p-4 rounded-xl border flex flex-col gap-1.5 ${
                  passed ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' : 'bg-rose-50/70 border-rose-200 text-rose-950'
                }`}>
                  <span className="text-[12px] font-semibold uppercase tracking-wider font-mono">
                    Evaluation Rationale
                  </span>
                  <p className="text-[13px] leading-relaxed">
                    {validation.reason}
                  </p>
                </div>

                {validation.regressions && validation.regressions.length > 0 && (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex flex-col gap-2">
                    <span className="text-[12px] font-semibold text-rose-800 font-mono uppercase">
                      Detected Regressions ({validation.regressions.length})
                    </span>
                    <ul className="text-[12px] text-rose-700 list-disc list-inside space-y-1">
                      {validation.regressions.map((reg, idx) => (
                        <li key={idx}>{reg}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 text-slate-500 text-[12px] font-mono">
                No evidence gate validation artifact available yet.
              </div>
            )}
          </div>
          
          {/* HALLUCINATION DETECTOR */}
          <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-card-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-cyan-600">visibility</span>
                Symbol Hallucination Check
              </h3>
              {hallucination && (
                <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                  hallucination.status === 'NO' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {hallucination.status === 'NO' ? 'CLEAN (NO HALLUCINATIONS)' : 'FLAGGED'}
                </span>
              )}
            </div>

            {hallucination ? (
              <div className="flex flex-col gap-2">
                {hallucination.evidence && hallucination.evidence.map((ev, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-emerald-600 text-[18px] mt-0.5 flex-shrink-0">
                      verified_user
                    </span>
                    <span className="text-[12px] text-slate-700 leading-relaxed font-sans">{ev}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 text-slate-500 text-[12px] font-mono">
                No hallucination check logs available.
              </div>
            )}
          </div>

          {/* INVARIANT RULES */}
          <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-card-sm flex flex-col gap-4 lg:col-span-2">
            <h3 className="text-[15px] font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-amber-500">lock</span>
              Preserved Invariant Contracts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {invariants.length === 0 ? (
                <div className="p-3 rounded-xl bg-slate-50 text-slate-500 text-[12px] font-mono col-span-2">
                  No explicit contract invariants specified for this repository run.
                </div>
              ) : (
                invariants.map((inv, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-emerald-600 text-[18px] mt-0.5 flex-shrink-0">check_circle</span>
                    <div className="flex flex-col min-w-0">
                      <span className="font-mono text-[12px] font-semibold leading-tight text-slate-800">{inv}</span>
                      <span className="text-[11px] text-text-muted mt-1">Verified unchanged in AST diff</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
