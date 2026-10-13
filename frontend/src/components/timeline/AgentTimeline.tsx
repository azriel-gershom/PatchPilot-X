import { useEffect, useState } from 'react';
import type { RunDetail, RunEvent } from '../../types';

export default function AgentTimeline({ runId, status: initialStatus }: { runId: string | null, status: string }) {
  const [runDetail, setRunDetail] = useState<RunDetail | null>(null);
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(false);

  const currentStatus = runDetail?.status?.status || initialStatus;
  const isRunning = currentStatus === 'RUNNING' || currentStatus === 'PENDING';

  // Fetch run details and events
  const fetchData = async () => {
    if (!runId) return;
    try {
      const [resStatus, resEvents] = await Promise.all([
        fetch(`/api/agent/runs/${runId}`),
        fetch(`/api/agent/runs/${runId}/events`),
      ]);

      if (resStatus.ok) {
        const detail = await resStatus.json();
        setRunDetail(detail);
      }
      if (resEvents.ok) {
        const eventsData = await resEvents.json();
        setEvents(eventsData.events || []);
      }
    } catch (err) {
      console.error('Failed to fetch timeline data:', err);
    }
  };

  useEffect(() => {
    if (!runId) return;
    setLoading(true);
    fetchData().finally(() => setLoading(false));

    // Polling if running
    if (isRunning) {
      const interval = setInterval(fetchData, 3000);
      return () => clearInterval(interval);
    }
  }, [runId, isRunning]);

  useEffect(() => {
    if (isRunning) {
      const timer = setInterval(() => setElapsed(e => e + 1), 1000);
      return () => clearInterval(timer);
    }
  }, [isRunning]);

  const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const s = (elapsed % 60).toString().padStart(2, '0');

  const repoUrl = runDetail?.status?.repository_url || '';
  const repoName = repoUrl ? (repoUrl.replace(/\.git$/, '').split('/').pop() || repoUrl) : 'PatchPilot-X';
  const goal = runDetail?.contract?.goal || 'Running engineering workflow...';
  const invariants = runDetail?.contract?.must_preserve || [];
  const acceptanceCriteria = runDetail?.contract?.acceptance_criteria || [];

  // Pipeline stages definition
  const stages = [
    { key: 'CLONE', label: 'Clone Workspace', icon: 'download' },
    { key: 'ANALYSIS', label: 'Framework Detection', icon: 'search' },
    { key: 'MAPPING', label: 'Symbol & AST Mapping', icon: 'account_tree' },
    { key: 'PLANNING', label: 'Change Contract Planning', icon: 'assignment' },
    { key: 'TESTING', label: 'Targeted & Regression Tests', icon: 'fact_check' },
    { key: 'VALIDATION', label: 'Evidence Gate Verification', icon: 'verified' },
    { key: 'PATCH', label: 'Patch Generation', icon: 'build' },
  ];

  const hasEvent = (type: string) => events.some(e => e.type === type);
  const errorEvent = events.find(e => e.type === 'ERROR');
  const failureReason = typeof errorEvent?.data === 'string' 
    ? errorEvent.data 
    : (runDetail as any)?.error || (currentStatus === 'FAILED' ? 'Run terminated with an error.' : null);

  return (
    <div className="flex flex-col gap-5 text-text-primary">
      {/* MISSION HEADER STRIP */}
      <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-card-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0 flex flex-col gap-1.5">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[22px] font-bold tracking-tight">Run #{runId || 'None'}</span>
            {isRunning ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono text-[12px] font-semibold">
                <span className="material-symbols-outlined text-[14px] animate-spin text-emerald-600">progress_activity</span>
                {currentStatus}
              </span>
            ) : (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[12px] font-semibold ${
                currentStatus === 'FAILED' || currentStatus === 'COMPLETED_FAILED_VALIDATION' 
                  ? 'bg-rose-50 border border-rose-200 text-rose-700' 
                  : currentStatus === 'COMPLETED_SUCCESS' 
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' 
                    : 'bg-slate-100 border border-slate-200 text-slate-700'
              }`}>
                {currentStatus}
              </span>
            )}
            {runDetail?.framework?.language && (
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-mono">
                {runDetail.framework.language} {runDetail.framework.framework ? `(${runDetail.framework.framework})` : ''}
              </span>
            )}
          </div>
          <p className="text-[14px] text-text-secondary font-medium leading-relaxed">
            “{goal}”
          </p>
          <div className="flex items-center gap-3 text-text-muted text-[12px] flex-wrap mt-0.5 font-mono">
            <span>Repo: <span className="text-text-primary font-semibold">{repoName}</span></span>
            <span>·</span>
            <span>Branch: <span className="text-text-primary font-semibold">main</span></span>
            <span>·</span>
            <span>Events: <span className="text-emerald-700 font-semibold">{events.length}</span></span>
            {isRunning && (
              <>
                <span>·</span>
                <span>Elapsed: <span className="text-text-primary font-semibold">{m}:{s}</span></span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <button 
            onClick={() => {
              setLoading(true);
              fetchData().finally(() => setLoading(false));
            }}
            disabled={loading}
            className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-medium text-[13px] flex items-center gap-1.5 transition-all shadow-sm shadow-emerald-500/20 cursor-pointer" 
            type="button"
          >
            <span className={`material-symbols-outlined text-[17px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
            <span>{loading ? 'Refreshing...' : 'Refresh State'}</span>
          </button>
        </div>
      </div>

      {/* FAILURE ROOT CAUSE BANNER */}
      {currentStatus === 'FAILED' && failureReason && (
        <div className="bg-rose-50/90 border border-rose-200 rounded-2xl p-5 shadow-xs flex flex-col gap-2.5">
          <div className="flex items-center gap-2 text-rose-800 font-bold text-[14px]">
            <span className="material-symbols-outlined text-[20px] text-rose-600">error</span>
            <span>Execution Failure Root Cause</span>
          </div>
          <div className="p-3.5 rounded-xl bg-white border border-rose-200/80 font-mono text-[12px] text-rose-900 leading-relaxed overflow-x-auto whitespace-pre-wrap">
            {failureReason}
          </div>
          {failureReason.includes('vague') || failureReason.includes('Insufficient evidence') ? (
            <div className="text-[12px] text-rose-700 font-sans flex items-start gap-1.5 mt-0.5">
              <span className="material-symbols-outlined text-[16px] mt-0.5 shrink-0 text-amber-600">lightbulb</span>
              <span>
                <strong>Resolution Tip:</strong> The AI Software Architect requires a concrete goal. Instead of <em>"fix all bugs"</em>, specify exact symptoms or targets, e.g.: <em>"Fix division by zero handling in divide() method and ensure ValueError is raised."</em>
              </span>
            </div>
          ) : null}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT PANEL */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-card-sm flex flex-col gap-4">
            <div className="flex items-center justify-between pb-1 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-emerald-600">account_tree</span>
                <span className="text-[15px] font-bold tracking-tight">Agent Execution Pipeline</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-[11px] text-text-secondary px-2.5 py-1 bg-slate-100 rounded-lg border border-slate-200">
                  {events.length} Events Logged
                </span>
              </div>
            </div>
            
            {/* STAGES LIST */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {stages.map((stage) => {
                const completed = hasEvent(stage.key);
                const isStageFailed = !completed && currentStatus === 'FAILED' && (
                  (stage.key === 'PLANNING' && !hasEvent('PLANNING')) ||
                  (stage.key === 'TESTING' && hasEvent('PLANNING') && !hasEvent('TESTING')) ||
                  (stage.key === 'VALIDATION' && hasEvent('TESTING') && !hasEvent('VALIDATION'))
                );

                return (
                  <div 
                    key={stage.key}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                      completed 
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' 
                        : isStageFailed
                          ? 'bg-rose-50/80 border-rose-300 text-rose-950'
                          : isRunning
                            ? 'bg-slate-50/50 border-slate-200 text-slate-400'
                            : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`material-symbols-outlined text-[18px] ${
                        completed ? 'text-emerald-600' : isStageFailed ? 'text-rose-600' : 'text-slate-400'
                      }`}>
                        {stage.icon}
                      </span>
                      <span className="text-[12px] font-semibold">{stage.label}</span>
                    </div>
                    {completed ? (
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                        <span className="material-symbols-outlined text-[12px]">check</span>Done
                      </span>
                    ) : isStageFailed ? (
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded border border-rose-300">
                        <span className="material-symbols-outlined text-[12px]">close</span>Failed
                      </span>
                    ) : (
                      <span className="font-mono text-[10px] uppercase text-slate-400">
                        Pending
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* TERMINAL EMULATOR */}
          <div className="bg-[#0F172A] rounded-xl border border-slate-800 shadow-terminal overflow-hidden">
            <div className="px-4 py-3 bg-[#1E293B] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
                </div>
                <span className="ml-2 font-mono text-[11px] font-semibold tracking-wider text-slate-300">LIVE AGENT TELEMETRY</span>
              </div>
              <span className="font-mono text-[10px] text-slate-400">STREAM ACTIVE</span>
            </div>
            <div className="p-4 font-mono text-[12px] leading-relaxed text-slate-200 flex flex-col gap-2 max-h-[380px] overflow-y-auto">
              {events.length === 0 ? (
                <div className="text-slate-500 py-4 text-center">
                  Waiting for agent events...
                </div>
              ) : (
                events.map((evt, idx) => {
                  const time = evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : '';
                  const isErr = evt.type === 'ERROR';
                  const isRej = evt.type === 'REJECTION';

                  return (
                    <div key={idx} className={`flex flex-col gap-1 pb-1.5 border-b border-slate-800/60 last:border-0 ${
                      isErr ? 'bg-rose-950/40 p-2.5 rounded-lg border border-rose-900/60' : ''
                    }`}>
                      <div className="flex items-baseline gap-2">
                        <span className="text-slate-500 select-none text-[11px]">{time}</span>
                        <span className={`font-semibold uppercase text-[11px] ${
                          isErr ? 'text-rose-400' : isRej ? 'text-amber-400' : 'text-cyan-400'
                        }`}>
                          [{evt.type}]
                        </span>
                        <span className={`font-medium ${
                          isErr ? 'text-rose-300 font-bold' : isRej ? 'text-amber-300' : 'text-emerald-300'
                        }`}>
                          {evt.name}
                        </span>
                      </div>
                      {evt.data && (
                        <div className={`pl-6 text-[11px] whitespace-pre-wrap font-mono ${
                          isErr ? 'text-rose-200' : isRej ? 'text-amber-200' : 'text-slate-400'
                        }`}>
                          {typeof evt.data === 'string' 
                            ? evt.data 
                            : evt.data.reason 
                              ? `Outcome: ${evt.data.reason}` 
                              : evt.data.goal 
                                ? `Goal: ${evt.data.goal}` 
                                : evt.data.status 
                                  ? `Status: ${evt.data.status}` 
                                  : JSON.stringify(evt.data, null, 2).slice(0, 300)}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
        
        {/* RIGHT PANEL */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-card-sm flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-amber-500">shield</span>
                <span className="text-[14px] font-bold">Active Invariant Rules</span>
              </div>
              <span className="font-mono text-[11px] text-amber-700 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 font-semibold">
                {invariants.length} Enforced
              </span>
            </div>
            <div className="flex flex-col gap-2.5">
              {invariants.length === 0 ? (
                <div className="p-3 rounded-xl bg-slate-50 text-slate-500 text-[12px] font-mono">
                  No strict invariants declared.
                </div>
              ) : (
                invariants.map((inv, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50/80 border border-slate-200 flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-emerald-600 text-[18px] mt-0.5 flex-shrink-0">lock</span>
                    <div className="flex flex-col min-w-0">
                      <span className="font-mono text-[12px] font-semibold leading-tight text-slate-800">{inv}</span>
                      <span className="text-[11px] text-text-muted mt-1">Preserved across change lifecycle</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Acceptance Criteria */}
          {acceptanceCriteria.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-card-sm flex flex-col gap-3.5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-emerald-600">checklist</span>
                <span className="text-[14px] font-bold">Acceptance Criteria</span>
              </div>
              <ul className="flex flex-col gap-2 text-[12px] text-slate-700 list-disc list-inside">
                {acceptanceCriteria.map((crit, idx) => (
                  <li key={idx} className="leading-relaxed font-sans">{crit}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
