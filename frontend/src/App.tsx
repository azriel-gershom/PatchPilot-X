import { useState } from 'react';
import { 
  ShieldCheck, 
  Terminal, 
  Activity, 
  Play, 
  RefreshCw,
  GitBranch,
  Search
} from 'lucide-react';
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
  const [isRunning, setIsRunning] = useState(false);
  const [activeRun, setActiveRun] = useState<RunStatus | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    addLog(`Syncing repository: ${githubUrl}...`);
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ github_url: githubUrl })
      });
      if (res.ok) {
        addLog(`Sync accepted. Framework detection and index building in background.`);
      } else {
        addLog(`Sync failed: ${res.statusText}`);
      }
    } catch (err) {
      addLog(`Error syncing: ${err}`);
    }
    setIsSyncing(false);
  };

  const handleRunAgent = async () => {
    setIsRunning(true);
    addLog(`Initializing Verification Arena for: ${githubUrl}`);
    addLog(`Mission: ${requestText}`);
    try {
      const res = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ github_url: githubUrl, request: requestText })
      });
      
      const data = await res.json();
      setActiveRun(data);
      
      if (data.status === 'COMPLETED_SUCCESS') {
        addLog(`✅ Verification Passed! Patch accepted deterministic validation.`);
        addLog(`Reason: ${data.reason}`);
      } else {
        addLog(`❌ Verification Failed! Patch rejected by Evidence Gate.`);
        addLog(`Reason: ${data.reason || data.error}`);
      }
    } catch (err) {
      addLog(`Error running agent: ${err}`);
    }
    setIsRunning(false);
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
        <div className="lg:col-span-5 flex flex-col gap-6">
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
                disabled={isRunning}
                className="w-full btn-primary px-4 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Engaging Behavioral Twin...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Deploy Agent to Blind Test Chamber
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Execution Logs & Status */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="glass-panel rounded-2xl p-6 flex-1 flex flex-col min-h-[500px]">
            <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Terminal className="w-5 h-5 text-purple-400" />
                Evidence Gate Telemetry
              </h2>
              {activeRun && (
                <div className={`px-3 py-1 rounded-full text-xs font-bold border ${activeRun.status === 'COMPLETED_SUCCESS' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                  {activeRun.status.replace(/_/g, ' ')}
                </div>
              )}
            </div>
            
            <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-sm overflow-y-auto relative">
              {logs.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-slate-600 flex-col gap-3">
                  <Search className="w-8 h-8 opacity-50" />
                  <p>Awaiting deployment orders...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {logs.map((log, i) => (
                    <div key={i} className={`${log.includes('✅') ? 'text-emerald-400' : log.includes('❌') ? 'text-rose-400' : 'text-slate-300'}`}>
                      {log}
                    </div>
                  ))}
                  {isRunning && (
                    <div className="text-blue-400 animate-pulse flex items-center gap-2 mt-4">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-75"></span>
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-150"></span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
