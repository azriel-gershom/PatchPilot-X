import { useState, useEffect } from 'react';
import { FileCode, PlusCircle, MinusCircle, AlertCircle, FileText } from 'lucide-react';

export default function DiffViewer({ runId }: { runId: string | null }) {
  const [diff, setDiff] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!runId) {
      setDiff(null);
      setError(null);
      return;
    }

    const fetchDiff = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/agent/runs/${runId}/patch`);
        if (res.ok) {
          const text = await res.text();
          setDiff(text);
          setError(null);
        } else if (res.status === 404) {
          setDiff(null);
          setError(null); // not an error, just no diff yet
        } else {
          setError('Failed to fetch diff.');
        }
      } catch (err) {
        setError('Error fetching diff.');
      }
      setLoading(false);
    };

    fetchDiff();
    
    // Poll every 5s if no diff yet
    const interval = setInterval(() => {
      if (!diff && runId) fetchDiff();
    }, 5000);

    return () => clearInterval(interval);
  }, [runId, diff]);

  if (!runId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <FileCode className="w-8 h-8 mb-4 opacity-50" />
        <p>Patch diff will appear after PatchPilot generates a change.</p>
      </div>
    );
  }

  if (loading && !diff && !error) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-400">
        <p>Waiting for patch generation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400">
        <AlertCircle className="w-5 h-5 mb-2" />
        {error}
      </div>
    );
  }

  if (!diff) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <FileCode className="w-8 h-8 mb-4 opacity-50" />
        <p>No patch generated yet.</p>
      </div>
    );
  }

  // Parse diff stats
  const lines = diff.split('\n');
  let additions = 0;
  let deletions = 0;
  const files = new Set<string>();

  lines.forEach(line => {
    if (line.startsWith('+++ b/')) files.add(line.replace('+++ b/', ''));
    else if (line.startsWith('+') && !line.startsWith('+++')) additions++;
    else if (line.startsWith('-') && !line.startsWith('---')) deletions++;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-6 p-4 bg-slate-900 rounded-lg border border-slate-800">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-slate-400" />
          <span className="font-semibold text-slate-200">{files.size} files changed</span>
        </div>
        <div className="flex items-center gap-2 text-emerald-400">
          <PlusCircle className="w-5 h-5" />
          <span className="font-semibold">{additions} additions</span>
        </div>
        <div className="flex items-center gap-2 text-rose-400">
          <MinusCircle className="w-5 h-5" />
          <span className="font-semibold">{deletions} deletions</span>
        </div>
      </div>

      <div className="bg-[#1e1e1e] rounded-lg border border-slate-800 overflow-hidden font-mono text-sm">
        <div className="p-4 overflow-x-auto max-h-[500px] overflow-y-auto">
          {lines.map((line, i) => {
            let className = 'text-slate-300';
            let bgClass = '';
            
            if (line.startsWith('+') && !line.startsWith('+++')) {
              className = 'text-emerald-400';
              bgClass = 'bg-emerald-900/20';
            } else if (line.startsWith('-') && !line.startsWith('---')) {
              className = 'text-rose-400';
              bgClass = 'bg-rose-900/20';
            } else if (line.startsWith('@@')) {
              className = 'text-blue-400';
              bgClass = 'bg-blue-900/10';
            } else if (line.startsWith('---') || line.startsWith('+++')) {
              className = 'text-slate-100 font-bold';
              bgClass = 'bg-slate-800/50';
            }

            return (
              <div key={i} className={`whitespace-pre px-4 py-0.5 ${bgClass} ${className}`}>
                {line}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
