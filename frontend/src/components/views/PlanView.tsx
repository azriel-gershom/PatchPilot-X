import { useEffect, useState } from 'react';
import type { RunDetail } from '../../types';

export default function PlanView({ runId }: { runId: string | null }) {
  const [runDetail, setRunDetail] = useState<RunDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!runId) return;
    setLoading(true);
    fetch(`/api/agent/runs/${runId}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => setRunDetail(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [runId]);

  const contract = runDetail?.contract;
  const validationPlan = contract?.validation_plan || [];
  const mustChange = contract?.must_change || [];
  const mustPreserve = contract?.must_preserve || [];
  const edgeCases = contract?.edge_cases || [];

  return (
    <div className="w-full max-w-[1600px] mx-auto p-5 lg:p-7 flex flex-col gap-5 text-text-primary">
      {/* Header Strip */}
      <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-card-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0 flex flex-col gap-1.5">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="material-symbols-outlined text-[24px] text-cyan-600">alt_route</span>
            <span className="text-[22px] font-bold tracking-tight">Execution & Validation Plan</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[12px] font-semibold">
              Run #{runId || 'None'}
            </span>
          </div>
          <p className="text-[14px] text-text-secondary font-medium leading-relaxed">
            The sequential engineering strategy and verification roadmap planned by PatchPilot before executing the patch.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 font-mono text-[13px] bg-white rounded-2xl border border-[#E2E8F0]">
          Loading Plan roadmap...
        </div>
      ) : !contract ? (
        <div className="p-12 text-center text-slate-500 font-mono text-[13px] bg-white rounded-2xl border border-[#E2E8F0]">
          No execution plan available for this run.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* MAIN ROADMAP STEPS */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-card-sm flex flex-col gap-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <h3 className="text-[16px] font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-emerald-600">route</span>
                  Validation Verification Roadmap
                </h3>
                <span className="font-mono text-[11px] text-text-secondary px-2.5 py-1 bg-slate-100 rounded-lg border border-slate-200 font-semibold">
                  {validationPlan.length} Steps Planned
                </span>
              </div>

              <div className="flex flex-col gap-4 relative pl-3">
                {/* Connecting Line */}
                <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-slate-200" />

                {validationPlan.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-4 relative z-10">
                    <div className="h-8 w-8 rounded-full bg-emerald-600 text-white font-mono text-[12px] font-bold flex items-center justify-center shrink-0 shadow-sm shadow-emerald-600/30">
                      {idx + 1}
                    </div>
                    <div className="flex-1 bg-slate-50/80 hover:bg-slate-50 p-4 rounded-xl border border-slate-200 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[11px] font-bold text-slate-600 uppercase">Step 0{idx + 1}</span>
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                          <span className="material-symbols-outlined text-[12px]">verified</span>Ready
                        </span>
                      </div>
                      <p className="text-[13px] text-slate-800 leading-relaxed font-medium">
                        {step}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: STRATEGY & GUARDRAILS */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Target Files Card */}
            <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-card-sm flex flex-col gap-3">
              <h3 className="text-[14px] font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-cyan-600">build_circle</span>
                Modification Scope
              </h3>
              <div className="flex flex-col gap-2">
                {mustChange.map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-cyan-50/60 border border-cyan-200/70 font-mono text-[11px] text-cyan-950 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[15px] text-cyan-600">edit</span>
                    <span className="truncate">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Invariant Boundaries */}
            <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-card-sm flex flex-col gap-3">
              <h3 className="text-[14px] font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-amber-500">security</span>
                Safety Invariants
              </h3>
              <div className="flex flex-col gap-2">
                {mustPreserve.map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-amber-50/50 border border-amber-200/70 font-mono text-[11px] text-amber-950 flex items-start gap-2">
                    <span className="material-symbols-outlined text-[15px] text-amber-600 mt-0.5">lock</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Edge Cases Tested */}
            <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-card-sm flex flex-col gap-3">
              <h3 className="text-[14px] font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-rose-500">bug_report</span>
                Adversarial Checks
              </h3>
              <div className="flex flex-col gap-2">
                {edgeCases.map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-700 flex items-start gap-2">
                    <span className="material-symbols-outlined text-[15px] text-slate-500 mt-0.5">chevron_right</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
