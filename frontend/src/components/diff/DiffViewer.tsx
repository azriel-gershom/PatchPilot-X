import { useEffect, useState } from 'react';
import type { RunDetail } from '../../types';

interface FileDiff {
  oldPath: string;
  newPath: string;
  additions: number;
  deletions: number;
  chunks: string[];
}

export default function DiffViewer({ runId }: { runId: string | null }) {
  const [patchText, setPatchText] = useState<string | null>(null);
  const [runDetail, setRunDetail] = useState<RunDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!runId) return;
    setLoading(true);
    setError(null);

    Promise.all([
      fetch(`/api/agent/runs/${runId}/patch`),
      fetch(`/api/agent/runs/${runId}`)
    ]).then(async ([patchRes, detailRes]) => {
      if (patchRes.ok) {
        const text = await patchRes.text();
        setPatchText(text);
      } else {
        setPatchText(null);
      }

      if (detailRes.ok) {
        const detail = await detailRes.json();
        setRunDetail(detail);
      }
    }).catch(err => {
      console.error(err);
      setError('Failed to fetch patch diff');
    }).finally(() => {
      setLoading(false);
    });
  }, [runId]);

  // Parse diff into files
  const files: FileDiff[] = [];
  if (patchText) {
    const lines = patchText.split('\n');
    let currentFile: FileDiff | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('--- a/') || line.startsWith('--- ')) {
        const oldPath = line.replace(/^---\s+(a\/)?/, '');
        let newPath = oldPath;
        if (i + 1 < lines.length && (lines[i + 1].startsWith('+++ b/') || lines[i + 1].startsWith('+++ '))) {
          newPath = lines[i + 1].replace(/^\+\+\+\s+(b\/)?/, '');
        }
        currentFile = {
          oldPath,
          newPath,
          additions: 0,
          deletions: 0,
          chunks: []
        };
        files.push(currentFile);
      } else if (currentFile) {
        if (line.startsWith('+') && !line.startsWith('+++')) {
          currentFile.additions++;
          currentFile.chunks.push(line);
        } else if (line.startsWith('-') && !line.startsWith('---')) {
          currentFile.deletions++;
          currentFile.chunks.push(line);
        } else {
          currentFile.chunks.push(line);
        }
      }
    }
  }

  const totalAdditions = files.reduce((acc, f) => acc + f.additions, 0);
  const totalDeletions = files.reduce((acc, f) => acc + f.deletions, 0);

  return (
    <div className="flex flex-col gap-4 text-text-primary">
      {/* DIFF COMMAND & OVERVIEW CONTROLS STRIP */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-2.5 rounded-xl border border-border-hairline shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-semibold tracking-tight">Run #{runId || 'None'} Changes</span>
            <span className="text-slate-300">·</span>
            <span className="font-mono text-[12px] text-text-secondary">
              {files.length} {files.length === 1 ? 'file' : 'files'} changed
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md font-mono font-semibold text-[11px] bg-emerald-100 text-emerald-800 border border-emerald-200">
              +{totalAdditions}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md font-mono font-semibold text-[11px] bg-rose-100 text-rose-800 border border-rose-200">
              −{totalDeletions}
            </span>
          </div>
        </div>
      </div>
      
      {/* MAIN 3-COLUMN COCKPIT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT: Compact File Tree Navigator */}
        <div className="lg:col-span-3 flex flex-col gap-3 bg-white p-3.5 rounded-xl border border-border-hairline shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-border-hairline">
            <span className="text-[11px] uppercase font-mono font-semibold text-text-muted tracking-wider">
              Changed Files ({files.length})
            </span>
          </div>
          <div className="flex flex-col gap-2 font-mono text-[12px]">
            {files.length === 0 ? (
              <span className="text-text-muted text-[11px] italic p-2">No files modified yet</span>
            ) : (
              files.map((file, idx) => (
                <a 
                  key={idx}
                  className="group flex flex-col p-2.5 rounded-lg bg-emerald-50/60 text-text-primary border border-emerald-300 shadow-xs hover:bg-emerald-50 transition-all" 
                  href={`#diff-${idx}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="material-symbols-outlined text-[15px] text-emerald-600 shrink-0">code</span>
                      <span className="truncate font-semibold text-[12px]">{file.newPath.split('/').pop()}</span>
                    </div>
                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">MODIFIED</span>
                  </div>
                  <span className="truncate text-[10px] text-text-muted pl-5">{file.newPath}</span>
                </a>
              ))
            )}
          </div>
        </div>
        
        {/* CENTER: GitHub/Linear Light Mode Inspired Diff Canvas */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-[12px] font-mono">
              {error}
            </div>
          )}
          {loading ? (
            <div className="bg-white p-8 rounded-xl border border-border-hairline text-center text-slate-500 font-mono text-[13px]">
              Loading patch diff...
            </div>
          ) : !patchText ? (
            <div className="bg-white p-8 rounded-xl border border-border-hairline text-center flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-slate-400 text-[32px]">difference</span>
              <p className="font-semibold text-[14px] text-text-primary">No patch generated for this run</p>
              <p className="text-[12px] text-text-muted">
                {runDetail?.status?.status === 'RUNNING' 
                  ? 'Agent is still running. The patch will appear once code changes are made.'
                  : 'This run did not produce a valid code patch or has failed.'}
              </p>
            </div>
          ) : (
            files.map((file, fileIdx) => (
              <section key={fileIdx} className="bg-white rounded-xl border border-border-hairline shadow-xs overflow-hidden" id={`diff-${fileIdx}`}>
                <div className="flex flex-wrap items-center justify-between bg-slate-50/90 border-b border-border-hairline px-4 py-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="material-symbols-outlined text-[18px] text-slate-600">description</span>
                    <span className="font-mono text-[12px] font-semibold truncate">{file.newPath}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-emerald-700 font-semibold">+{file.additions}</span>
                    <span className="text-rose-700 font-semibold">−{file.deletions}</span>
                  </div>
                </div>
                
                <div className="font-mono text-[12px] overflow-x-auto bg-white select-text leading-5">
                  {file.chunks.map((line, lineIdx) => {
                    const isAdd = line.startsWith('+') && !line.startsWith('+++');
                    const isDel = line.startsWith('-') && !line.startsWith('---');
                    const isHunk = line.startsWith('@@');

                    if (isHunk) {
                      return (
                        <div key={lineIdx} className="px-3 py-1 bg-slate-100 text-slate-500 border-y border-slate-200 text-[11px] font-semibold">
                          {line}
                        </div>
                      );
                    }

                    if (isDel) {
                      return (
                        <div key={lineIdx} className="flex items-stretch bg-rose-50 border-b border-rose-100/60">
                          <div className="w-8 text-center text-rose-600 font-bold select-none shrink-0 text-[12px] bg-rose-100/50">−</div>
                          <div className="px-2 py-0.5 text-rose-800 whitespace-pre overflow-x-auto flex-1">{line.substring(1)}</div>
                        </div>
                      );
                    }

                    if (isAdd) {
                      return (
                        <div key={lineIdx} className="flex items-stretch bg-emerald-50 border-b border-emerald-100/60">
                          <div className="w-8 text-center text-emerald-700 font-bold select-none shrink-0 text-[12px] bg-emerald-100/50">+</div>
                          <div className="px-2 py-0.5 text-emerald-800 whitespace-pre overflow-x-auto flex-1">{line.substring(1)}</div>
                        </div>
                      );
                    }

                    return (
                      <div key={lineIdx} className="flex items-stretch hover:bg-slate-50/50">
                        <div className="w-8 text-center text-slate-400 select-none shrink-0 text-[12px]">&nbsp;</div>
                        <div className="px-2 py-0.5 text-slate-700 whitespace-pre overflow-x-auto flex-1">{line}</div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>
        
        {/* RIGHT: Inspector Panel */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="bg-white p-4 rounded-xl border border-border-hairline shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-border-hairline">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-emerald-600">psychology</span>
                <span className="text-[13px] font-bold">Change Intent</span>
              </div>
            </div>
            
            <p className="text-[12px] text-text-secondary leading-relaxed">
              {runDetail?.contract?.goal || 'No task contract available for this run.'}
            </p>

            {runDetail?.contract?.must_change && runDetail.contract.must_change.length > 0 && (
              <div className="flex flex-col gap-1.5 mt-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider font-mono">Target Files</span>
                <ul className="text-[12px] text-slate-600 list-disc list-inside space-y-1">
                  {runDetail.contract.must_change.map((t, i) => (
                    <li key={i} className="truncate font-mono text-[11px]">{t}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
