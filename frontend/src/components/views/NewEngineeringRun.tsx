import { useState, useMemo } from 'react';
import type { RunItem } from '../../types';

interface NewEngineeringRunProps {
  onRun: (githubUrl: string, requestText: string) => void;
  runs?: RunItem[];
  onSelectRun?: (runId: string) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export default function NewEngineeringRun({ 
  onRun, 
  runs = [], 
  onSelectRun, 
  onRefresh,
  isLoading = false 
}: NewEngineeringRunProps) {
  const [githubUrl, setGithubUrl] = useState('https://github.com/azriel-gershom/cache-analyser.git');
  const [requestText, setRequestText] = useState('Update the README.md file by changing its main header to "# Cache Memory Analyzer (Interactive Architecture Tool)" and adding a concise "Features" section describing the tool\'s capabilities.');
  const [filter, setFilter] = useState<'all' | 'accepted' | 'rejected'>('all');
  const [search, setSearch] = useState('');

  const filteredRuns = useMemo(() => {
    return runs.filter(run => {
      // Filter by status
      if (filter === 'accepted' && run.status !== 'COMPLETED_SUCCESS') return false;
      if (filter === 'rejected' && run.status !== 'FAILED' && run.status !== 'COMPLETED_FAILED_VALIDATION') return false;
      
      // Filter by search query
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesId = run.run_id.toLowerCase().includes(query);
        const matchesRepo = (run.repository_url || '').toLowerCase().includes(query);
        const matchesTask = (run.task || '').toLowerCase().includes(query);
        return matchesId || matchesRepo || matchesTask;
      }
      return true;
    });
  }, [runs, filter, search]);

  const acceptedCount = runs.filter(r => r.status === 'COMPLETED_SUCCESS').length;
  const rejectedCount = runs.filter(r => r.status === 'FAILED' || r.status === 'COMPLETED_FAILED_VALIDATION').length;

  const formatTimeAgo = (iso?: string) => {
    if (!iso) return 'recently';
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const extractRepoName = (url?: string) => {
    if (!url) return 'Unknown Repo';
    const clean = url.replace(/\.git$/, '');
    const parts = clean.split('/');
    return parts[parts.length - 1] || url;
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto p-6 lg:p-8">
      <div className="flex flex-col w-full space-y-6">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium font-mono text-emerald-700 bg-emerald-50 border border-emerald-200/70 mb-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              Autonomous Pipeline
            </div>
            <h1 className="text-[26px] font-semibold text-text-primary tracking-tight leading-tight">New engineering run</h1>
            <p className="text-[14px] text-text-muted leading-relaxed max-w-2xl">
              Analyze an existing repository, implement a requested change, and verify that existing behavior remains intact.
            </p>
          </div>
        </div>

        {/* Operational Dispatch Form */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 lg:p-7 space-y-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="space-y-2">
            <label className="block text-[13px] font-semibold text-text-primary" htmlFor="repo-url">Repository</label>
            <div className="relative flex items-center group">
              <span className="absolute left-3.5 text-text-muted group-focus-within:text-text-primary transition-colors material-symbols-outlined text-[18px]">deployed_code</span>
              <input 
                id="repo-url" 
                type="text" 
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                className="w-full h-11 pl-11 pr-4 bg-surface-canvas border border-[#E2E8F0] rounded-xl text-[13px] font-mono text-text-primary placeholder:text-text-muted focus:bg-white focus:border-text-primary focus:ring-2 focus:ring-text-primary/10 focus:outline-none transition-all" 
                placeholder="https://github.com/org/repo" 
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[13px] font-semibold text-text-primary" htmlFor="spec-input">Engineering request</label>
              <span className="text-[12px] font-mono text-text-muted">Markdown supported</span>
            </div>
            <textarea 
              id="spec-input" 
              rows={4}
              value={requestText}
              onChange={(e) => setRequestText(e.target.value)}
              className="w-full bg-surface-canvas border border-[#E2E8F0] rounded-xl p-3.5 text-[14px] text-text-primary placeholder:text-text-muted focus:bg-white focus:border-text-primary focus:ring-2 focus:ring-text-primary/10 focus:outline-none transition-all leading-relaxed resize-none"
            />
          </div>
          
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-surface-subtle">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => onRun(githubUrl, requestText)}
                disabled={isLoading}
                className="px-5 py-2.5 rounded-xl bg-text-primary hover:bg-slate-800 disabled:opacity-60 text-white text-[13px] font-medium inline-flex items-center gap-2 shadow-sm hover:shadow transition-all cursor-pointer" 
                type="button"
              >
                {isLoading ? (
                  <span className="material-symbols-outlined text-[17px] animate-spin text-emerald-400">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-[17px] text-emerald-400">play_arrow</span>
                )}
                <span>{isLoading ? 'Starting run...' : 'Run PatchPilot'}</span>
              </button>
              <button 
                onClick={() => {
                  setGithubUrl('https://github.com/azriel-gershom/cache-analyser.git');
                  setRequestText('Update the README.md file by changing its main header to "# Cache Memory Analyzer (Interactive Architecture Tool)" and adding a concise "Features" section describing the tool\'s capabilities.');
                }}
                className="px-4 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-[13px] font-medium text-text-secondary hover:text-text-primary hover:bg-surface-canvas transition-colors shadow-2xs cursor-pointer" 
                type="button"
              >
                Reset Demo
              </button>
            </div>
            <div className="text-[12px] text-text-muted font-mono flex items-center gap-2 flex-wrap bg-surface-canvas px-3 py-1.5 rounded-lg border border-[#E2E8F0]/70">
              <span className="flex items-center gap-1.5">
                <span className="text-text-muted">Branch:</span>
                <span className="text-text-primary font-medium">main</span>
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <span className="text-text-muted">Provider:</span>
                <span className="text-text-primary font-medium">GitHub</span>
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <span className="text-text-muted">Engine:</span>
                <span className="text-text-primary font-medium">Multi-LLM Fallback</span>
              </span>
            </div>
          </div>
        </div>
        
        {/* Recent Runs Table Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl flex flex-col overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
            <div className="flex items-center gap-2.5">
              <h2 className="text-[15px] font-semibold text-text-primary">Recent Runs</h2>
              <span className="text-[12px] text-text-muted font-mono">({filteredRuns.length} of {runs.length} runs)</span>
              {onRefresh && (
                <button 
                  onClick={onRefresh} 
                  title="Refresh runs" 
                  className="p-1 text-text-muted hover:text-text-primary rounded hover:bg-slate-100 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">refresh</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="inline-flex rounded-xl bg-surface-subtle p-0.5 border border-[#E2E8F0] text-[12px]">
                <button 
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${filter === 'all' ? 'bg-white text-text-primary shadow-2xs' : 'text-text-muted hover:text-text-primary'}`} 
                  type="button"
                >
                  All ({runs.length})
                </button>
                <button 
                  onClick={() => setFilter('accepted')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${filter === 'accepted' ? 'bg-white text-text-primary shadow-2xs' : 'text-text-muted hover:text-text-primary'}`} 
                  type="button"
                >
                  Accepted ({acceptedCount})
                </button>
                <button 
                  onClick={() => setFilter('rejected')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${filter === 'rejected' ? 'bg-white text-text-primary shadow-2xs' : 'text-text-muted hover:text-text-primary'}`} 
                  type="button"
                >
                  Rejected ({rejectedCount})
                </button>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-text-muted material-symbols-outlined text-[16px]">search</span>
                <input 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8.5 w-52 pl-9 pr-3 bg-surface-canvas border border-[#E2E8F0] rounded-xl text-[12px] text-text-primary placeholder:text-text-muted focus:bg-white focus:outline-none focus:border-text-primary transition-all" 
                  placeholder="Filter requests..." 
                  type="text"
                />
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            {filteredRuns.length === 0 ? (
              <div className="p-8 text-center text-text-muted text-[13px] font-mono">
                No runs found matching your filter criteria.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="h-10 border-b border-[#E2E8F0] bg-surface-canvas text-[11px] uppercase font-mono font-semibold text-text-muted select-none tracking-wider">
                    <th className="w-12 px-5 text-center">Status</th>
                    <th className="w-36 px-3">Run ID</th>
                    <th className="w-36 px-3">Repository</th>
                    <th className="px-4">Request / Goal</th>
                    <th className="w-24 px-3">Patch</th>
                    <th className="w-40 px-3">Result</th>
                    <th className="w-24 px-5 text-right">Started</th>
                  </tr>
                </thead>
                <tbody className="text-[13px] divide-y divide-surface-subtle">
                  {filteredRuns.map((run) => {
                    const isSuccess = run.status === 'COMPLETED_SUCCESS';
                    const isFailed = run.status === 'FAILED' || run.status === 'COMPLETED_FAILED_VALIDATION';
                    const isPending = run.status === 'PENDING' || run.status === 'RUNNING';
                    const shortId = run.run_id.length > 16 ? `${run.run_id.substring(0, 8)}...` : run.run_id;

                    return (
                      <tr 
                        key={run.run_id}
                        onClick={() => onSelectRun && onSelectRun(run.run_id)}
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
                        <td className="px-4 text-[13px] text-text-primary font-medium max-w-[340px] truncate">
                          {run.task || 'Change requested'}
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
                          {formatTimeAgo(run.created_at)}
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
    </div>
  );
}
