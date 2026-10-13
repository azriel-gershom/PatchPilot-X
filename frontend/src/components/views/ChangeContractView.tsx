import { useEffect, useState } from 'react';
import type { RunDetail } from '../../types';

export default function ChangeContractView({ runId }: { runId: string | null }) {
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
  const goal = contract?.goal;
  const criteria = contract?.acceptance_criteria || [];
  const mustChange = contract?.must_change || [];
  const mustPreserve = contract?.must_preserve || [];
  const edgeCases = contract?.edge_cases || [];
  const plan = contract?.validation_plan || [];

  return (
    <div className="w-full max-w-[1600px] mx-auto p-5 lg:p-7 flex flex-col gap-5 text-text-primary">
      {/* Header Strip */}
      <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-card-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0 flex flex-col gap-1.5">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="material-symbols-outlined text-[24px] text-emerald-600">contract</span>
            <span className="text-[22px] font-bold tracking-tight">Formal Change Contract</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[12px] font-semibold">
              Run #{runId || 'None'}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-mono font-semibold">
              Specification Locked
            </span>
          </div>
          <p className="text-[14px] text-text-secondary font-medium leading-relaxed">
            The mathematically constrained change agreement synthesized by the AI architect before any code editing began.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 font-mono text-[13px] bg-white rounded-2xl border border-[#E2E8F0]">
          Loading Change Contract...
        </div>
      ) : !contract ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-[#E2E8F0] shadow-card-sm flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-[36px] text-amber-500">warning</span>
          <h3 className="text-[16px] font-bold text-text-primary">Change Contract Not Synthesized</h3>
          <p className="text-[13px] text-text-secondary max-w-2xl font-mono leading-relaxed bg-amber-50/70 p-4 rounded-xl border border-amber-200 text-left">
            {(runDetail as any)?.error || (runDetail as any)?.contract_rejection?.reason || 'The specification could not be finalized because the request was too vague or lacked sufficient evidence.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* PRIMARY GOAL CARD */}
          <div className="lg:col-span-12 bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-card-sm flex flex-col gap-3">
            <div className="flex items-center gap-2 text-emerald-700 font-mono text-[11px] uppercase tracking-wider font-semibold">
              <span className="material-symbols-outlined text-[16px]">target</span>
              Contract Primary Objective
            </div>
            <p className="text-[16px] font-semibold text-text-primary leading-relaxed">
              {goal || 'No explicit goal specified.'}
            </p>
          </div>

          {/* LEFT: ACCEPTANCE CRITERIA & MUST CHANGE */}
          <div className="lg:col-span-6 flex flex-col gap-5">
            {/* Acceptance Criteria */}
            <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-card-sm flex flex-col gap-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                <h3 className="text-[15px] font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-emerald-600">checklist</span>
                  Acceptance Criteria ({criteria.length})
                </h3>
              </div>
              <div className="flex flex-col gap-2.5">
                {criteria.map((crit, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200/70 flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-[18px] text-emerald-600 mt-0.5 flex-shrink-0">check_circle</span>
                    <span className="text-[13px] text-emerald-950 font-medium leading-relaxed">{crit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Must Change */}
            <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-card-sm flex flex-col gap-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                <h3 className="text-[15px] font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-cyan-600">edit_note</span>
                  Target Modules (Must Change)
                </h3>
              </div>
              <div className="flex flex-col gap-2">
                {mustChange.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 font-mono text-[12px]">
                    <span className="material-symbols-outlined text-[17px] text-cyan-600 mt-0.5 flex-shrink-0">arrow_right</span>
                    <span className="text-slate-800 font-medium leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: MUST PRESERVE & EDGE CASES */}
          <div className="lg:col-span-6 flex flex-col gap-5">
            {/* Must Preserve Invariants */}
            <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-card-sm flex flex-col gap-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                <h3 className="text-[15px] font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-amber-500">lock</span>
                  Invariant Rules (Must Preserve)
                </h3>
              </div>
              <div className="flex flex-col gap-2.5">
                {mustPreserve.map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/70 flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-[18px] text-amber-600 mt-0.5 flex-shrink-0">shield</span>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-semibold text-amber-950 font-mono leading-tight">{item}</span>
                      <span className="text-[11px] text-amber-800/80 mt-1">Strict regression guardrail</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Edge Cases */}
            <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-card-sm flex flex-col gap-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                <h3 className="text-[15px] font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-rose-500">warning</span>
                  Adversarial Edge Cases ({edgeCases.length})
                </h3>
              </div>
              <div className="flex flex-col gap-2">
                {edgeCases.map((edge, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-rose-50/40 border border-rose-200/60 flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-[17px] text-rose-600 mt-0.5 flex-shrink-0">bolt</span>
                    <span className="text-[12px] text-rose-950 leading-relaxed font-sans">{edge}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* VALIDATION PLAN FULL-WIDTH */}
          {plan.length > 0 && (
            <div className="lg:col-span-12 bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-card-sm flex flex-col gap-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                <h3 className="text-[15px] font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-cyan-600">verified</span>
                  Validation Verification Plan ({plan.length} checkpoints)
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {plan.map((p, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                    <span className="h-5 w-5 rounded-full bg-emerald-600 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-[12px] text-slate-800 leading-relaxed font-medium">{p}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
