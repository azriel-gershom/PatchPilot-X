import { useEffect, useState } from 'react';
import type { RunEvidence, RunDetail } from '../../types';

export default function TestResults({ runId }: { runId: string | null }) {
  const [evidence, setEvidence] = useState<RunEvidence | null>(null);
  const [runDetail, setRunDetail] = useState<RunDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!runId) return;
    setLoading(true);

    Promise.all([
      fetch(`/api/agent/runs/${runId}/evidence`),
      fetch(`/api/agent/runs/${runId}`)
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
      console.error('Failed to load test results', err);
    }).finally(() => {
      setLoading(false);
    });
  }, [runId]);

  const testSummary = evidence?.targeted || evidence?.baseline;
  const passed = testSummary?.passed ?? 0;
  const failed = testSummary?.failed ?? 0;
  const skipped = testSummary?.skipped ?? 0;
  const testCommand = runDetail?.framework?.test_command;

  return (
    <div className="flex flex-col gap-5 text-text-primary">
      <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-card-sm flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[24px] text-emerald-600">task_alt</span>
            <span className="text-[22px] font-bold tracking-tight">Test Results</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[12px] font-semibold">
              Run #{runId || 'None'}
            </span>
          </div>
          {testCommand && (
            <span className="font-mono text-[12px] px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-600">
              Command: {testCommand}
            </span>
          )}
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-slate-500 font-mono text-[13px]">
            Loading test metrics...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col gap-1">
                <span className="text-emerald-800 text-[12px]">Passed</span>
                <span className="text-emerald-600 text-[26px] font-bold">{passed}</span>
              </div>
              <div className={`p-4 rounded-xl border flex flex-col gap-1 ${
                failed > 0 ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <span className="text-[12px]">Failed</span>
                <span className={`text-[26px] font-bold ${failed > 0 ? 'text-rose-600' : 'text-slate-400'}`}>{failed}</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-1">
                <span className="text-slate-600 text-[12px]">Skipped</span>
                <span className="text-slate-400 text-[26px] font-bold">{skipped}</span>
              </div>
            </div>

            {/* Test Runner Output Log */}
            <div className="bg-[#0F172A] rounded-xl border border-slate-800 p-4 text-slate-200 font-mono text-[12px] leading-relaxed max-h-[300px] overflow-y-auto">
              <div className="text-slate-400 pb-2 mb-2 border-b border-slate-800 text-[11px] uppercase tracking-wider flex items-center justify-between">
                <span>Test Execution Output</span>
                <span>Exit Code: {testSummary?.exit_code ?? 0}</span>
              </div>
              {testSummary?.stdout ? (
                <pre className="whitespace-pre-wrap">{testSummary.stdout}</pre>
              ) : testSummary?.stderr ? (
                <pre className="whitespace-pre-wrap text-rose-300">{testSummary.stderr}</pre>
              ) : (
                <div className="text-slate-500 italic">
                  No automated test command executed for this repository.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
