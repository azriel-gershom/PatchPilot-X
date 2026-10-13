import { useState } from 'react';

interface WorkspaceRepoViewProps {
  currentRepoUrl?: string;
  onDispatchRepo: (url: string) => void;
}

export default function WorkspaceRepoView({ currentRepoUrl, onDispatchRepo }: WorkspaceRepoViewProps) {
  const [repoUrl, setRepoUrl] = useState(currentRepoUrl || 'https://github.com/azriel-gershom/cache-analyser.git');
  const [loading, setLoading] = useState(false);
  const [repoInfo, setRepoInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInspect = async () => {
    if (!repoUrl.trim()) return;
    setLoading(true);
    setError(null);
    try {
      let url = repoUrl.trim();
      if (url.match(/^https:\/\/(github|gitlab)\.com\//) && !url.endsWith('.git')) {
        url = url + '.git';
      }

      const res = await fetch('/api/repositories/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repository_url: url })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Inspection failed (${res.status})`);
      }

      const data = await res.json();
      setRepoInfo(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to inspect repository');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto p-5 lg:p-7 flex flex-col gap-6 text-text-primary">
      {/* Header Strip */}
      <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-card-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[24px] text-emerald-600">deployed_code</span>
            <h1 className="text-[22px] font-bold tracking-tight">Repository Workspace Inspector</h1>
          </div>
          <p className="text-[14px] text-text-secondary leading-relaxed">
            Live clone and deep analysis of git repositories using PatchPilot's framework detection and symbol extractor.
          </p>
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm flex flex-col gap-4">
        <label className="text-[13px] font-semibold text-text-primary">Repository Git URL</label>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 flex items-center">
            <span className="absolute left-3.5 text-text-muted material-symbols-outlined text-[18px]">link</span>
            <input 
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/org/repo.git"
              className="w-full h-11 pl-11 pr-4 bg-surface-canvas border border-[#E2E8F0] rounded-xl text-[13px] font-mono text-text-primary focus:bg-white focus:outline-none focus:border-text-primary transition-all"
            />
          </div>
          <button 
            onClick={handleInspect}
            disabled={loading}
            className="h-11 px-5 rounded-xl bg-text-primary hover:bg-slate-800 disabled:opacity-60 text-white font-medium text-[13px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            {loading ? (
              <span className="material-symbols-outlined text-[18px] animate-spin text-emerald-400">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-[18px] text-emerald-400">search_check</span>
            )}
            <span>{loading ? 'Cloning & Inspecting...' : 'Inspect Repository'}</span>
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[12px] font-mono flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* INSPECTION RESULTS */}
      {repoInfo && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-12 bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-card-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                <span className="material-symbols-outlined text-[22px]">source_environment</span>
              </span>
              <div className="flex flex-col">
                <span className="text-[16px] font-bold text-text-primary font-mono">{repoInfo.name || repoUrl.split('/').pop()}</span>
                <span className="text-[12px] text-text-muted font-mono">{repoUrl}</span>
              </div>
            </div>

            <button 
              onClick={() => onDispatchRepo(repoUrl)}
              className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[13px] flex items-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px]">play_arrow</span>
              <span>Start Engineering Run</span>
            </button>
          </div>

          {/* Details */}
          <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-card-sm flex flex-col gap-3">
            <h3 className="text-[14px] font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-emerald-600">tune</span>
              Metadata
            </h3>
            <div className="grid grid-cols-2 gap-3 text-[12px] font-mono">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col">
                <span className="text-slate-500 text-[10px] uppercase font-bold">Default Branch</span>
                <span className="text-slate-800 font-semibold mt-1">{repoInfo.default_branch || 'main'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col">
                <span className="text-slate-500 text-[10px] uppercase font-bold">Commit Hash</span>
                <span className="text-emerald-700 font-semibold mt-1 truncate">{repoInfo.commit_hash || 'HEAD'}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-card-sm flex flex-col gap-3">
            <h3 className="text-[14px] font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-cyan-600">code</span>
              Environment & Testing
            </h3>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[12px] text-slate-700 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Language:</span>
                <span className="font-semibold text-slate-800">{repoInfo.language || 'Detected'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Framework:</span>
                <span className="font-semibold text-slate-800">{repoInfo.framework || 'Standard'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="text-emerald-700 font-semibold">Cloned & Ready</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
