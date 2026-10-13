import type { RunItem } from '../../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (t: any) => void;
  activeRun?: RunItem | null;
  runsCount?: number;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  activeRun,
  runsCount = 0 
}: SidebarProps) {
  // Extract repo short name from activeRun
  let repoName = 'PatchPilot-X';
  if (activeRun?.repository_url) {
    const parts = activeRun.repository_url.replace(/\.git$/, '').split('/');
    if (parts.length > 0 && parts[parts.length - 1]) {
      repoName = parts[parts.length - 1];
    }
  }

  const shortRunId = activeRun?.run_id 
    ? (activeRun.run_id.length > 12 ? `${activeRun.run_id.substring(0, 8)}...` : activeRun.run_id) 
    : 'PP-042';

  return (
    <aside className="fixed left-0 top-0 h-screen w-[240px] bg-white border-r border-[#E2E8F0] z-40 flex flex-col justify-between overflow-y-auto select-none">
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="h-[56px] px-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div 
            onClick={() => setActiveTab('new')}
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 border border-emerald-200 text-brand-emerald">
              <span className="material-symbols-outlined text-[17px] text-emerald-600">terminal</span>
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-text-primary">PatchPilot X</span>
          </div>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200">v1.4</span>
        </div>
        
        {/* Active Repository Switcher */}
        <div className="p-3">
          <button 
            onClick={() => setActiveTab('repo')}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl border text-left transition-all shadow-xs cursor-pointer ${
              activeTab === 'repo' 
                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950' 
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70 hover:border-slate-300 text-text-primary'
            }`}
            type="button"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className={`material-symbols-outlined text-[18px] ${activeTab === 'repo' ? 'text-emerald-600' : 'text-slate-500'}`}>deployed_code</span>
              <div className="flex flex-col truncate">
                <span className="font-mono text-[11px] font-semibold truncate">{repoName}</span>
                <span className="font-mono text-[10px] text-text-muted flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px] text-emerald-600">fork_right</span>main
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-slate-400 text-[16px]">unfold_more</span>
          </button>
        </div>
        
        {/* Workspace Links */}
        <div className="px-3">
          <div className="px-2 pb-1.5 text-[10px] uppercase font-mono tracking-wider font-semibold text-text-muted">Workspace</div>
          <nav className="flex flex-col space-y-0.5">
            <button 
              onClick={() => setActiveTab('new')}
              className={`w-full flex items-center px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
                activeTab === 'new' 
                  ? 'bg-slate-100 text-text-primary font-semibold' 
                  : 'text-text-secondary hover:bg-slate-50 hover:text-text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[17px] mr-2 text-slate-400">grid_view</span>Overview
            </button>
            <button 
              onClick={() => setActiveTab('runs')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[13px] transition-colors cursor-pointer font-medium ${
                activeTab === 'runs' 
                  ? 'bg-slate-100 text-text-primary font-semibold' 
                  : 'text-text-secondary hover:bg-slate-50 hover:text-text-primary'
              }`}
            >
              <div className="flex items-center">
                <span className="material-symbols-outlined text-[17px] mr-2 text-slate-400">play_circle</span>Runs
              </div>
              <span className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                {runsCount}
              </span>
            </button>
            <button 
              onClick={() => setActiveTab('repo')}
              className={`w-full flex items-center px-2.5 py-1.5 rounded-lg text-[13px] transition-colors cursor-pointer font-medium ${
                activeTab === 'repo' 
                  ? 'bg-slate-100 text-text-primary font-semibold' 
                  : 'text-text-secondary hover:bg-slate-50 hover:text-text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[17px] mr-2 text-slate-400">folder</span>Repository
            </button>
            <button 
              onClick={() => setActiveTab('diff')}
              className={`w-full flex items-center px-2.5 py-1.5 rounded-lg text-[13px] transition-colors cursor-pointer font-medium ${
                activeTab === 'diff' 
                  ? 'bg-slate-100 text-text-primary font-semibold' 
                  : 'text-text-secondary hover:bg-slate-50 hover:text-text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[17px] mr-2 text-slate-400">difference</span>Changes
            </button>
            <button 
              onClick={() => setActiveTab('arena')}
              className={`w-full flex items-center px-2.5 py-1.5 rounded-lg text-[13px] transition-colors cursor-pointer font-medium ${
                activeTab === 'arena' 
                  ? 'bg-slate-100 text-text-primary font-semibold' 
                  : 'text-text-secondary hover:bg-slate-50 hover:text-text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[17px] mr-2 text-slate-400">verified</span>Verification
            </button>
            <button 
              onClick={() => setActiveTab('runs')}
              className={`w-full flex items-center px-2.5 py-1.5 rounded-lg text-[13px] transition-colors cursor-pointer font-medium ${
                activeTab === 'runs' 
                  ? 'bg-slate-100 text-text-primary font-semibold' 
                  : 'text-text-secondary hover:bg-slate-50 hover:text-text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[17px] mr-2 text-slate-400">history</span>History
            </button>
          </nav>
        </div>
        
        {/* Current Run Section */}
        <div className="px-3 pt-4">
          <div className="px-2 pb-1.5 flex items-center justify-between text-[10px] uppercase font-mono tracking-wider font-semibold text-text-muted">
            <span>Current Run</span>
            <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-semibold" title={activeRun?.run_id || ''}>
              #{shortRunId}
            </span>
          </div>
          <nav className="flex flex-col space-y-0.5">
            <button 
              onClick={() => setActiveTab('timeline')}
              className={`w-full flex items-center px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer text-[13px] ${
                activeTab === 'timeline' 
                  ? 'bg-emerald-50/80 text-emerald-800 border border-emerald-200/60 font-semibold shadow-xs' 
                  : 'text-text-secondary hover:bg-slate-50 hover:text-text-primary font-medium'
              }`}
            >
              <span className={`material-symbols-outlined text-[17px] mr-2 ${activeTab === 'timeline' ? 'text-emerald-600' : 'text-slate-400'}`}>insights</span>Run Overview
            </button>
            <button 
              onClick={() => setActiveTab('map')}
              className={`w-full flex items-center px-2.5 py-1.5 rounded-lg text-[13px] transition-colors cursor-pointer ${
                activeTab === 'map' 
                  ? 'bg-emerald-50/80 text-emerald-800 border border-emerald-200/60 font-semibold shadow-xs' 
                  : 'text-text-secondary hover:bg-slate-50 hover:text-text-primary font-medium'
              }`}
            >
              <span className={`material-symbols-outlined text-[17px] mr-2 ${activeTab === 'map' ? 'text-emerald-600' : 'text-slate-400'}`}>account_tree</span>Repository Map
            </button>
            <button 
              onClick={() => setActiveTab('contract')}
              className={`w-full flex items-center px-2.5 py-1.5 rounded-lg text-[13px] transition-colors cursor-pointer ${
                activeTab === 'contract' 
                  ? 'bg-emerald-50/80 text-emerald-800 border border-emerald-200/60 font-semibold shadow-xs' 
                  : 'text-text-secondary hover:bg-slate-50 hover:text-text-primary font-medium'
              }`}
            >
              <span className={`material-symbols-outlined text-[17px] mr-2 ${activeTab === 'contract' ? 'text-emerald-600' : 'text-slate-400'}`}>contract</span>Change Contract
            </button>
            <button 
              onClick={() => setActiveTab('plan')}
              className={`w-full flex items-center px-2.5 py-1.5 rounded-lg text-[13px] transition-colors cursor-pointer ${
                activeTab === 'plan' 
                  ? 'bg-emerald-50/80 text-emerald-800 border border-emerald-200/60 font-semibold shadow-xs' 
                  : 'text-text-secondary hover:bg-slate-50 hover:text-text-primary font-medium'
              }`}
            >
              <span className={`material-symbols-outlined text-[17px] mr-2 ${activeTab === 'plan' ? 'text-emerald-600' : 'text-slate-400'}`}>alt_route</span>Plan
            </button>
            <button 
              onClick={() => setActiveTab('diff')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer text-[13px] ${
                activeTab === 'diff' 
                  ? 'bg-emerald-50/80 text-emerald-800 border border-emerald-200/60 font-semibold shadow-xs' 
                  : 'text-text-secondary hover:bg-slate-50 hover:text-text-primary font-medium'
              }`}
            >
              <div className="flex items-center">
                <span className={`material-symbols-outlined text-[17px] mr-2 ${activeTab === 'diff' ? 'text-emerald-600' : 'text-slate-400'}`}>compare_arrows</span>Diff
              </div>
              <span className="font-mono text-[10px] text-slate-600 font-semibold">
                {activeRun?.has_patch ? (
                  <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">ready</span>
                ) : (
                  <span className="text-slate-400">none</span>
                )}
              </span>
            </button>
            <button 
              onClick={() => setActiveTab('tests')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer text-[13px] ${
                activeTab === 'tests' 
                  ? 'bg-emerald-50/80 text-emerald-800 border border-emerald-200/60 font-semibold shadow-xs' 
                  : 'text-text-secondary hover:bg-slate-50 hover:text-text-primary font-medium'
              }`}
            >
              <div className="flex items-center">
                <span className={`material-symbols-outlined text-[17px] mr-2 ${activeTab === 'tests' ? 'text-emerald-600' : 'text-slate-400'}`}>task_alt</span>Tests
              </div>
              <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1 rounded font-semibold border border-emerald-200">
                active
              </span>
            </button>
            <button 
              onClick={() => setActiveTab('arena')}
              className={`w-full flex items-center px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer text-[13px] ${
                activeTab === 'arena' 
                  ? 'bg-emerald-50/80 text-emerald-800 border border-emerald-200/60 font-semibold shadow-xs' 
                  : 'text-text-secondary hover:bg-slate-50 hover:text-text-primary font-medium'
              }`}
            >
              <span className={`material-symbols-outlined text-[17px] mr-2 ${activeTab === 'arena' ? 'text-emerald-600' : 'text-slate-400'}`}>shield</span>Verification Arena
            </button>
            <button 
              onClick={() => setActiveTab('evidence')}
              className={`w-full flex items-center px-2.5 py-1.5 rounded-lg text-[13px] transition-colors cursor-pointer ${
                activeTab === 'evidence' 
                  ? 'bg-emerald-50/80 text-emerald-800 border border-emerald-200/60 font-semibold shadow-xs' 
                  : 'text-text-secondary hover:bg-slate-50 hover:text-text-primary font-medium'
              }`}
            >
              <span className={`material-symbols-outlined text-[17px] mr-2 ${activeTab === 'evidence' ? 'text-emerald-600' : 'text-slate-400'}`}>assignment</span>Evidence
            </button>
          </nav>
        </div>
      </div>
      
      {/* Sidebar Footer */}
      <div className="flex flex-col border-t border-[#E2E8F0] bg-white">
        <div className="p-3 border-b border-[#E2E8F0]/70">
          <button 
            onClick={() => setActiveTab('new')}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-text-secondary hover:text-text-primary hover:bg-slate-100 transition-colors cursor-pointer" 
            type="button"
          >
            <span className="flex items-center text-[12px] font-medium">
              <span className="material-symbols-outlined text-[15px] mr-1.5 text-slate-400">add_task</span>New Run
            </span>
            <kbd className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-white border border-slate-200 text-slate-500 shadow-2xs">⌘N</kbd>
          </button>
        </div>
        <div className="px-3 py-1.5 flex items-center justify-between text-[12px] text-text-secondary">
          <button 
            onClick={() => setActiveTab('repo')}
            className="flex items-center px-2 py-1 rounded-md hover:text-text-primary hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px] mr-1 text-slate-400">settings</span>Inspector
          </button>
          <a 
            href="/docs" 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center px-2 py-1 rounded-md hover:text-text-primary hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined text-[15px] mr-1 text-slate-400">menu_book</span>API Docs
          </a>
        </div>
        <div className="p-3 border-t border-[#E2E8F0]/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5 truncate">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-mono text-[12px] font-bold ring-2 ring-emerald-200">
              PP
            </span>
            <div className="flex flex-col truncate">
              <span className="text-[13px] font-semibold text-text-primary truncate leading-tight">Autonomous Agent</span>
              <span className="text-[11px] text-text-muted truncate leading-tight">PatchPilot Core</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
