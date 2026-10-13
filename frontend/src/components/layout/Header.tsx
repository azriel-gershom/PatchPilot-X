import { useEffect } from 'react';
import type { RunItem } from '../../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (t: any) => void;
  run?: RunItem | null;
  status?: string;
  onCancelRun?: () => void;
}

export default function Header({
  activeTab,
  setActiveTab,
  run,
  status,
  onCancelRun
}: HeaderProps) {
  const currentStatus = run?.status || status || 'IDLE';
  const isRunning = currentStatus === 'RUNNING' || currentStatus === 'PENDING';

  // Extract repo short name from repository_url
  let repoName = 'PatchPilot-X';
  if (run?.repository_url) {
    const parts = run.repository_url.replace(/\.git$/, '').split('/');
    if (parts.length > 0 && parts[parts.length - 1]) {
      repoName = parts[parts.length - 1];
    }
  }

  const shortRunId = run?.run_id ? (run.run_id.length > 18 ? `${run.run_id.substring(0, 8)}...` : run.run_id) : 'None';

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'd' || e.key === 'D') {
        setActiveTab('diff');
      } else if (e.key === 't' || e.key === 'T') {
        setActiveTab('tests');
      } else if (e.key === 'v' || e.key === 'V') {
        setActiveTab('arena');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTab]);

  return (
    <header className="fixed top-0 left-[240px] right-0 h-[56px] bg-white/90 backdrop-blur-md border-b border-[#E2E8F0] z-30 flex items-center justify-between px-6 select-none">
      <div className="flex items-center gap-2 font-mono text-[13px]">
        <button
          onClick={() => setActiveTab('repo')}
          className="text-text-muted hover:text-text-primary transition-colors cursor-pointer"
        >
          {repoName}
        </button>
        <span className="text-slate-300">/</span>
        <button
          onClick={() => setActiveTab('timeline')}
          className="text-text-primary font-semibold flex items-center gap-1.5 hover:text-emerald-700 transition-colors cursor-pointer"
          title={run?.run_id || ''}
        >
          <span className="material-symbols-outlined text-[16px] text-emerald-600">commit</span>
          Run #{shortRunId}
        </button>
      </div>

      {/* Telemetry Pills in Header */}
      <div className="flex items-center gap-2.5 font-mono text-[11px]">
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-text-secondary font-medium">
          <span className="material-symbols-outlined text-[13px] text-slate-500">fork_right</span>
          <span>main</span>
        </div>
        {run?.created_at && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-text-muted">
            <span className="material-symbols-outlined text-[13px] text-slate-400">schedule</span>
            <span>{new Date(run.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        )}
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border tracking-wide font-semibold ${isRunning
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : currentStatus === 'FAILED' || currentStatus === 'COMPLETED_FAILED_VALIDATION' || currentStatus === 'CANCELLED'
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : currentStatus === 'COMPLETED_SUCCESS'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-slate-100 border-slate-200 text-slate-700'
          }`}>
          {isRunning && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
          <span>{currentStatus}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {isRunning && onCancelRun && (
          <button
            onClick={onCancelRun}
            className="h-8 px-3 rounded-lg bg-white border border-slate-200 text-text-secondary hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/50 transition-colors text-[12px] font-medium flex items-center gap-1.5 shadow-2xs cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[15px] text-rose-500">cancel</span>
            <span>Cancel Run</span>
          </button>
        )}
        <div className="h-4 w-px bg-slate-200 mx-0.5"></div>
        <button
          onClick={() => setActiveTab('diff')}
          className={`h-8 px-2.5 rounded-lg border transition-colors font-mono text-[11px] flex items-center gap-1 shadow-2xs cursor-pointer ${activeTab === 'diff' ? 'bg-slate-100 border-slate-300 text-text-primary font-bold' : 'bg-white border-slate-200 text-text-secondary hover:text-text-primary hover:bg-slate-50'
            }`}
        >
          Diff <kbd className="text-[9px] text-text-muted font-mono">(D)</kbd>
        </button>
        <button
          onClick={() => setActiveTab('tests')}
          className={`h-8 px-2.5 rounded-lg border transition-colors font-mono text-[11px] flex items-center gap-1 shadow-2xs cursor-pointer ${activeTab === 'tests' ? 'bg-slate-100 border-slate-300 text-text-primary font-bold' : 'bg-white border-slate-200 text-text-secondary hover:text-text-primary hover:bg-slate-50'
            }`}
        >
          Checks <kbd className="text-[9px] text-text-muted font-mono">(T)</kbd>
        </button>
        <button
          onClick={() => setActiveTab('arena')}
          className={`h-8 px-2.5 rounded-lg border transition-colors font-mono text-[11px] flex items-center gap-1 shadow-2xs cursor-pointer ${activeTab === 'arena' ? 'bg-slate-100 border-slate-300 text-text-primary font-bold' : 'bg-white border-slate-200 text-text-secondary hover:text-text-primary hover:bg-slate-50'
            }`}
        >
          Arena <kbd className="text-[9px] text-text-muted font-mono">(V)</kbd>
        </button>
      </div>
    </header>
  );
}
