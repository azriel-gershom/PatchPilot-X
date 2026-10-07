import { useState } from 'react';
import { 
  ShieldCheck, 
  Activity, 
  Play, 
  RefreshCw,
  GitBranch,
  ListOrdered,
  FileCode,
  Beaker
} from 'lucide-react';
import AgentTimeline from './components/timeline/AgentTimeline';
import DiffViewer from './components/diff/DiffViewer';
import TestResults from './components/tests/TestResults';
import VerificationArena from './components/verification/VerificationArena';
import './index.css';

interface RunStatus {
  run_id: string;
  status: string;
  validation?: boolean;
  reason?: string;
}

export default function App() {
  const [githubUrl, setGithubUrl] = useState('https://github.com/azriel-gershom/PatchPilot-X');
  const [requestText, setRequestText] = useState('Fix the divide by zero bug in calculator.py');
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeRun, setActiveRun] = useState<RunStatus | null>(null);
  const [activeTab, setActiveTab] = useState<'arena' | 'timeline' | 'diff' | 'tests'>('arena');

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ github_url: githubUrl })
      });
    } catch (err) {
      console.error(err);
    }
    setIsSyncing(false);
  };

  const handleRunAgent = async () => {
    setActiveRun(null); // Reset active run on new start
    setActiveTab('arena'); // Switch back to arena
    try {
      const res = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ github_url: githubUrl, task: requestText })
      });
      
      const data = await res.json();
      setActiveRun(data); 
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#f8fafc] font-sans selection:bg-blue-500/30">
      {/* Header */}
      <header className="glass-panel sticky top-0 z-50 border-b border-white/10 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-blue-400" />
          <h1 className="text-2xl font-bold tracking-tight">PatchPilot <span className="gradient-text">X</span></h1>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Verification Arena Online
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Controls */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="glass-panel rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-blue-400" />
              Repository Context
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">GitHub URL</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="https://github.com/..."
                  />
                  <button 
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="btn-primary px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    Sync
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              Mission Briefing
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Change Request</label>
                <textarea 
                  value={requestText}
                  onChange={(e) => setRequestText(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors h-32 resize-none"
                  placeholder="Describe the bug or feature..."
                />
              </div>
              <button 
                onClick={handleRunAgent}
                className="w-full btn-primary px-4 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                Deploy Agent to Blind Test Chamber
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Execution Logs & Status */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="glass-panel rounded-2xl p-6 flex-1 flex flex-col min-h-[600px]">
            
            <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
              <div className="flex space-x-6">
                <button 
                  onClick={() => setActiveTab('arena')}
                  className={`flex items-center gap-2 font-semibold pb-2 border-b-2 transition-colors ${activeTab === 'arena' ? 'text-amber-400 border-amber-400' : 'text-slate-400 border-transparent hover:text-slate-200'}`}
                >
                  <ShieldCheck className="w-5 h-5" />
                  Arena
                </button>
                <button 
                  onClick={() => setActiveTab('timeline')}
                  className={`flex items-center gap-2 font-semibold pb-2 border-b-2 transition-colors ${activeTab === 'timeline' ? 'text-purple-400 border-purple-400' : 'text-slate-400 border-transparent hover:text-slate-200'}`}
                >
                  <ListOrdered className="w-5 h-5" />
                  Timeline
                </button>
                <button 
                  onClick={() => setActiveTab('diff')}
                  className={`flex items-center gap-2 font-semibold pb-2 border-b-2 transition-colors ${activeTab === 'diff' ? 'text-blue-400 border-blue-400' : 'text-slate-400 border-transparent hover:text-slate-200'}`}
                >
                  <FileCode className="w-5 h-5" />
                  Diff Viewer
                </button>
                <button 
                  onClick={() => setActiveTab('tests')}
                  className={`flex items-center gap-2 font-semibold pb-2 border-b-2 transition-colors ${activeTab === 'tests' ? 'text-emerald-400 border-emerald-400' : 'text-slate-400 border-transparent hover:text-slate-200'}`}
                >
                  <Beaker className="w-5 h-5" />
                  Test Results
                </button>
              </div>

              {activeRun && activeRun.status && activeRun.status !== 'PENDING' && (
                <div className={`px-3 py-1 rounded-full text-xs font-bold border ${activeRun.status === 'COMPLETED_SUCCESS' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                  {activeRun.status.replace(/_/g, ' ')}
                </div>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto relative p-2">
              {activeTab === 'arena' && <VerificationArena runId={activeRun ? activeRun.run_id : null} />}
              {activeTab === 'timeline' && <AgentTimeline runId={activeRun ? activeRun.run_id : null} isActive={!!activeRun} />}
              {activeTab === 'diff' && <DiffViewer runId={activeRun ? activeRun.run_id : null} />}
              {activeTab === 'tests' && <TestResults runId={activeRun ? activeRun.run_id : null} />}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
