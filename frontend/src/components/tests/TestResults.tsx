import { useState, useEffect } from 'react';
import { Beaker, CheckCircle2, XCircle, AlertTriangle, TerminalSquare, Clock } from 'lucide-react';

type TestSummary = {
  passed: number;
  failed: number;
  skipped: number;
  exit_code: number;
  stdout: string;
  stderr: string;
};

type RunEvidence = {
  baseline: TestSummary | null;
  targeted: TestSummary | null;
  regression: TestSummary | null;
  validation: any | null;
};

export default function TestResults({ runId }: { runId: string | null }) {
  const [evidence, setEvidence] = useState<RunEvidence | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    if (!runId) {
      setEvidence(null);
      setError(null);
      return;
    }

    const fetchEvidence = async () => {
      try {
        const res = await fetch(`/api/agent/runs/${runId}/evidence`);
        if (res.ok) {
          const data = await res.json();
          setEvidence(data);
          setError(null);
        } else if (res.status !== 404) {
          setError('Failed to fetch test results.');
        }
      } catch (err) {
        setError('Error fetching test results.');
      }
    };

    fetchEvidence();
    
    // Poll every 5s while active
    const interval = setInterval(fetchEvidence, 5000);
    return () => clearInterval(interval);
  }, [runId]);

  if (!runId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <Beaker className="w-8 h-8 mb-4 opacity-50" />
        <p>Test results will appear here after execution.</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-rose-400 p-4">{error}</div>;
  }

  const renderCard = (title: string, summary: TestSummary | null, type: 'baseline' | 'targeted' | 'regression') => {
    if (!summary) {
      return (
        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col h-full">
          <h3 className="text-sm font-bold text-slate-400 tracking-wider mb-4 uppercase">{title}</h3>
          <div className="flex flex-col items-center justify-center flex-1 text-slate-500 text-sm">
            <Clock className="w-6 h-6 mb-2 opacity-50" />
            <span>Pending</span>
          </div>
        </div>
      );
    }

    // Determine regressions
    let newRegressions = 0;
    let preExisting = 0;
    
    if (type === 'regression' && evidence?.baseline) {
      if (summary.failed > evidence.baseline.failed) {
        newRegressions = summary.failed - evidence.baseline.failed;
        preExisting = evidence.baseline.failed;
      } else {
        preExisting = summary.failed;
      }
    } else if (type === 'baseline') {
      preExisting = summary.failed;
    } else {
      preExisting = summary.failed;
    }

    return (
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col h-full">
        <h3 className="text-sm font-bold text-slate-400 tracking-wider mb-4 uppercase">{title}</h3>
        
        <div className="space-y-3 flex-1">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" /> {summary.passed} PASS
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className={`flex items-center gap-2 ${newRegressions > 0 ? 'text-rose-400 font-bold' : 'text-slate-500'}`}>
              <XCircle className="w-4 h-4" /> {newRegressions > 0 ? `${newRegressions} NEW REGRESSIONS` : '0 NEW REGRESSIONS'}
            </span>
          </div>

          {preExisting > 0 && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-amber-500 text-xs">
                <AlertTriangle className="w-3 h-3" /> {preExisting} PRE-EXISTING {preExisting === 1 ? 'FAILURE' : 'FAILURES'}
              </span>
            </div>
          )}
        </div>

        <button 
          onClick={() => setExpandedLog(expandedLog === type ? null : type)}
          className="mt-4 flex items-center justify-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors w-full py-2 bg-slate-800/50 rounded-lg"
        >
          <TerminalSquare className="w-4 h-4" />
          {expandedLog === type ? 'Hide Output' : 'View Output'}
        </button>

        {expandedLog === type && (
          <div className="mt-4 p-3 bg-black rounded-lg border border-slate-800 font-mono text-xs overflow-x-auto max-h-48 overflow-y-auto">
            <div className="text-slate-500 mb-2">Exit Code: {summary.exit_code}</div>
            <div className="text-slate-300 whitespace-pre">{summary.stdout}</div>
            {summary.stderr && <div className="text-rose-400 whitespace-pre mt-2">{summary.stderr}</div>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {renderCard('Baseline', evidence?.baseline || null, 'baseline')}
      {renderCard('Targeted', evidence?.targeted || null, 'targeted')}
      {renderCard('Regression', evidence?.regression || null, 'regression')}
    </div>
  );
}
