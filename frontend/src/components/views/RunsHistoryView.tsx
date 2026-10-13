import { useState, useMemo } from 'react';
import type { RunItem } from '../../types';

interface RunsHistoryViewProps {
  runs: RunItem[];
  onSelectRun: (runId: string) => void;
  onRefresh: () => void;
}

export default function RunsHistoryView({ runs, onSelectRun, onRefresh }: RunsHistoryViewProps) {
  const [filter, setFilter] = useState<'all' | 'success' | 'failed' | 'pending'>('all');
  const [search, setSearch] = useState('');

  const filteredRuns = useMemo(() => {
    return runs.filter(run => {
      if (filter === 'success' && run.status !== 'COMPLETED_SUCCESS') return false;
      if (filter === 'failed' && run.status !== 'FAILED' && run.status !== 'COMPLETED_FAILED_VALIDATION') return false;
      if (filter === 'pending' && run.status !== 'RUNNING' && run.status !== 'PENDING') return false;

      if (search.trim()) {
        const query = search.toLowerCase();
        return (
          run.run_id.toLowerCase().includes(query) ||
          (run.repository_url || '').toLowerCase().includes(query) ||
          (run.task || '').toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [runs, filter, search]);

  const successCount = runs.filter(r => r.status === 'COMPLETED_SUCCESS').length;
  const failedCount = runs.filter(r => r.status === 'FAILED' || r.status === 'COMPLETED_FAILED_VALIDATION').length;
  const runningCount = runs.filter(r => r.status === 'RUNNING' || r.status === 'PENDING').length;
  const successRate = runs.length > 0 ? Math.round((successCount / runs.length) * 100) : 0;

  const extractRepoName = (url?: string) => {
    if (!url) return 'Unknown Repo';
    const clean = url.replace(/\.git$/, '');
    const parts = clean.split('/');
    return parts[parts.length - 1] || url;
  };

  const formatTime = (iso?: string) => {
    if (!iso) return 'recently';
    return new Date(iso).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto p-5 lg:p-7 flex flex-col gap-6 text-text-primary">
      {/* Header Strip */}
      <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-card-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[24px] text-emerald-600">history</span>
            <h1 className="text-[22px] font-bold tracking-tight">Engineering Runs History</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-mono font-semibold">
              {runs.length} Total Runs
            </span>
          </div>
          <p className="text-[14px] text-text-secondary leading-relaxed">
            Audit trail of autonomous AI engineering runs, verified patches, and evidence results.
          </p>
        </div>

        <button 
          onClick={onRefresh}
          className="h-9 px-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-text-primary font-medium text-[13px] flex items-center gap-1.5 transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <span className="material-symbols-outlined text-[17px] text-emerald-600">refresh</span>
          <span>Refresh Runs</span>
        </button>
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col gap-1">
          <span className="text-text-muted font-mono text-[11px] uppercase font-semibold">Total Runs</span>
          <span className="text-[24px] font-bold text-text-primary font-mono">{runs.length}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col gap-1">
          <span className="text-text-muted font-mono text-[11px] uppercase font-semibold">Verified Patches</span>
          <span className="text-[24px] font-bold text-emerald-600 font-mono">{successCount}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col gap-1">
          <span className="text-text-muted font-mono text-[11px] uppercase font-semibold">Verification Rate</span>
          <span className="text-[24px] font-bold text-cyan-600 font-mono">{successRate}%</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col gap-1">
          <span className="text-text-muted font-mono text-[11px] uppercase font-semibold">Regressed / Failed</span>
          <span className="text-[24px] font-bold text-rose-600 font-mono">{failedCount}</span>
        </div>
      </div>

      {/* TABLE CARD */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl flex flex-col overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-semibold">Runs Ledger</span>
            <span className="text-[12px] font-mono text-text-muted">({filteredRuns.length} matching)</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="inline-flex rounded-xl bg-surface-subtle p-0.5 border border-[#E2E8F0] text-[12px]">
              <button 
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${filter === 'all' ? 'bg-white text-text-primary shadow-2xs' : 'text-text-muted hover:text-text-primary'}`}
              >
                All ({runs.length})
              </button>
              <button 
                onClick={() => setFilter('success')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${filter === 'success' ? 'bg-white text-text-primary shadow-2xs' : 'text-text-muted hover:text-text-primary'}`}
              >
                Success ({successCount})
              </button>
              <button 
                onClick={() => setFilter('failed')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${filter === 'failed' ? 'bg-white text-text-primary shadow-2xs' : 'text-text-muted hover:text-text-primary'}`}
              >
                Failed ({failedCount})
              </button>
              {runningCount > 0 && (
                <button 
                  onClick={() => setFilter('pending')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${filter === 'pending' ? 'bg-white text-text-primary shadow-2xs' : 'text-text-muted hover:text-text-primary'}`}
                >
                  Active ({runningCount})
                </button>
              )}
            </div>

            <div className="relative flex items-center">
              <span className="absolute left-3 text-text-muted material-symbols-outlined text-[16px]">search</span>
              <input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8.5 w-56 pl-9 pr-3 bg-surface-canvas border border-[#E2E8F0] rounded-xl text-[12px] text-text-primary placeholder:text-text-muted focus:bg-white focus:outline-none focus:border-text-primary transition-all" 
                placeholder="Search run ID, repo, task..." 
                type="text"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredRuns.length === 0 ? (
            <div className="p-12 text-center text-text-muted text-[13px] font-mono">
              No runs matching current filters.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="h-10 border-b border-[#E2E8F0] bg-surface-canvas text-[11px] uppercase font-mono font-semibold text-text-muted select-none tracking-wider">
                  <th className="w-12 px-5 text-center">Status</th>
                  <th className="w-36 px-3">Run ID</th>
                  <th className="w-40 px-3">Repository</th>
                  <th className="px-4">Change Request</th>
                  <th className="w-24 px-3">Diff</th>
                  <th className="w-44 px-3">Status Badge</th>
                  <th className="w-36 px-5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="text-[13px] divide-y divide-surface-subtle">
                {filteredRuns.map((run) => {
                  const isSuccess = run.status === 'COMPLETED_SUCCESS';
                  const isFailed = run.status === 'FAILED' || run.status === 'COMPLETED_FAILED_VALIDATION';
                  const isPending = run.status === 'RUNNING' || run.status === 'PENDING';
                  const shortId = run.run_id.length > 16 ? `${run.run_id.substring(0, 8)}...` : run.run_id;

                  return (
                    <tr 
                      key={run.run_id}
                      onClick={() => onSelectRun(run.run_id)}
                      className="h-12 hover:bg-surface-canvas transition-colors cursor-pointer group"
                    >
                      <td className="px-5 text-center">
                        {isSuccess && (
                          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                            <span className="material-symbols-outlined text-[14px] font-bold">check</span>
                          </span>
                        )}
                        {isFailed && (
                          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                            <span className="material-symbols-outlined text-[14px] font-bold">close</span>
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                            <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
                          </span>
                        )}
                        {!isSuccess && !isFailed && !isPending && (
                          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                            <span className="material-symbols-outlined text-[14px]">help</span>
                          </span>
                        )}
                      </td>
                      <td className="px-3 font-mono font-medium text-text-primary" title={run.run_id}>
                        #{shortId}
                      </td>
                      <td className="px-3 font-medium text-text-secondary group-hover:text-text-primary">
                        {extractRepoName(run.repository_url)}
                      </td>
                      <td className="px-4 text-[13px] text-text-primary font-medium max-w-[360px] truncate">
                        {run.task || 'Autonomous code modification'}
                      </td>
                      <td className="px-3 text-text-muted font-mono text-[12px]">
                        {run.has_patch ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                            <span className="material-symbols-outlined text-[13px]">description</span>diff
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">none</span>
                        )}
                      </td>
                      <td className="px-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold font-mono border ${
                          isSuccess 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                            : isFailed 
                              ? 'bg-rose-50 border-rose-200 text-rose-700' 
                              : isPending
                                ? 'bg-amber-50 border-amber-200 text-amber-700'
                                : 'bg-slate-100 border-slate-200 text-slate-700'
                        }`}>
                          <span className="material-symbols-outlined text-[13px]">
                            {isSuccess ? 'check' : isFailed ? 'close' : isPending ? 'sync' : 'info'}
                          </span>
                          {run.status}
                        </span>
                      </td>
                      <td className="px-5 text-right text-text-muted font-mono text-[12px]">
                        {formatTime(run.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
