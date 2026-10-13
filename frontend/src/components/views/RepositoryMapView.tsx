import { useEffect, useState } from 'react';
import type { RunDetail } from '../../types';

export default function RepositoryMapView({ runId }: { runId: string | null }) {
  const [runDetail, setRunDetail] = useState<RunDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<'all' | 'sources' | 'configs' | 'symbols'>('all');

  useEffect(() => {
    if (!runId) return;
    setLoading(true);
    fetch(`/api/agent/runs/${runId}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => setRunDetail(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [runId]);

  const map = runDetail?.repo_map;
  const framework = runDetail?.framework;
  const sourceFiles = map?.source_files || [];
  const configFiles = map?.config_files || [];
  const testFiles = map?.test_files || [];
  const functions = map?.functions || [];
  const classes = map?.classes || [];
  const imports = map?.imports || [];
  const apiRoutes = map?.api_routes || [];

  return (
    <div className="w-full max-w-[1600px] mx-auto p-5 lg:p-7 flex flex-col gap-5 text-text-primary">
      {/* Header Strip */}
      <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-card-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0 flex flex-col gap-1.5">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="material-symbols-outlined text-[24px] text-emerald-600">account_tree</span>
            <span className="text-[22px] font-bold tracking-tight">Repository Symbol Map</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[12px] font-semibold">
              Run #{runId || 'None'}
            </span>
            {framework?.language && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-mono font-semibold">
                {framework.language} {framework.framework ? `· ${framework.framework}` : ''}
              </span>
            )}
          </div>
          <p className="text-[14px] text-text-secondary font-medium leading-relaxed">
            AST-indexed code graph, discovered entrypoints, source modules, and dependencies mapped by PatchPilot.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl bg-surface-subtle p-0.5 border border-[#E2E8F0] text-[12px]">
            <button 
              onClick={() => setActiveSection('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${activeSection === 'all' ? 'bg-white text-text-primary shadow-2xs' : 'text-text-muted hover:text-text-primary'}`}
            >
              All
            </button>
            <button 
              onClick={() => setActiveSection('sources')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${activeSection === 'sources' ? 'bg-white text-text-primary shadow-2xs' : 'text-text-muted hover:text-text-primary'}`}
            >
              Files ({sourceFiles.length})
            </button>
            <button 
              onClick={() => setActiveSection('symbols')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${activeSection === 'symbols' ? 'bg-white text-text-primary shadow-2xs' : 'text-text-muted hover:text-text-primary'}`}
            >
              Symbols ({functions.length + classes.length})
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 font-mono text-[13px] bg-white rounded-2xl border border-[#E2E8F0]">
          Loading repository AST map...
        </div>
      ) : !map ? (
        <div className="p-12 text-center text-slate-500 font-mono text-[13px] bg-white rounded-2xl border border-[#E2E8F0]">
          No repository map index generated for this run yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* STATS OVERVIEW */}
          <div className="lg:col-span-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col gap-1">
              <span className="text-text-muted font-mono text-[11px] uppercase font-semibold">Source Files</span>
              <span className="text-[24px] font-bold text-text-primary font-mono">{sourceFiles.length}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col gap-1">
              <span className="text-text-muted font-mono text-[11px] uppercase font-semibold">Config Files</span>
              <span className="text-[24px] font-bold text-text-primary font-mono">{configFiles.length}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col gap-1">
              <span className="text-text-muted font-mono text-[11px] uppercase font-semibold">Test Files</span>
              <span className="text-[24px] font-bold text-emerald-600 font-mono">{testFiles.length}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col gap-1">
              <span className="text-text-muted font-mono text-[11px] uppercase font-semibold">Extracted Symbols</span>
              <span className="text-[24px] font-bold text-text-primary font-mono">{functions.length + classes.length + imports.length}</span>
            </div>
          </div>

          {/* LEFT: SOURCE & CONFIG FILES */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-card-sm flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                <h3 className="text-[14px] font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-emerald-600">folder_open</span>
                  Discovered Source Files ({sourceFiles.length})
                </h3>
              </div>
              <div className="flex flex-col gap-1.5 max-h-[360px] overflow-y-auto font-mono text-[12px]">
                {sourceFiles.length === 0 ? (
                  <span className="text-slate-400 p-2 italic text-[11px]">No source files detected</span>
                ) : (
                  sourceFiles.map((file, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-50/70 border border-slate-200/60 flex items-center justify-between hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-2 truncate">
                        <span className="material-symbols-outlined text-[16px] text-slate-500">description</span>
                        <span className="font-semibold truncate text-slate-800">{file}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-200/60 text-slate-700 font-semibold uppercase">SOURCE</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* CONFIG FILES */}
            <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-card-sm flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                <h3 className="text-[14px] font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-slate-600">settings</span>
                  Configuration & Manifests ({configFiles.length})
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {configFiles.length === 0 ? (
                  <span className="text-slate-400 p-2 italic text-[11px]">No config files found</span>
                ) : (
                  configFiles.map((conf, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-mono font-medium flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px] text-slate-400">tune</span>
                      {conf}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: AST SYMBOLS & FRAMEWORK EVIDENCE */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            {/* FRAMEWORK DETECTOR EVIDENCE */}
            {framework && (
              <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-card-sm flex flex-col gap-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                  <h3 className="text-[14px] font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-emerald-600">smart_toy</span>
                    Framework Detection Evidence
                  </h3>
                  <span className="font-mono text-[11px] text-emerald-700 font-semibold px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                    Confidence {Math.round((framework.confidence || 0.8) * 100)}%
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {framework.evidence && framework.evidence.map((ev, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-200/70 text-[12px] text-emerald-900 flex items-start gap-2">
                      <span className="material-symbols-outlined text-[16px] text-emerald-600 mt-0.5 flex-shrink-0">check_circle</span>
                      <span>{ev}</span>
                    </div>
                  ))}
                  {framework.test_command && (
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[12px] font-mono text-slate-700">
                      <span className="text-slate-500 font-bold">Test Command: </span>{framework.test_command}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SYMBOLS LIST */}
            <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-card-sm flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                <h3 className="text-[14px] font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-cyan-600">code_blocks</span>
                  AST Symbol Signatures
                </h3>
                <span className="font-mono text-[11px] text-text-muted">
                  {functions.length} funcs · {classes.length} classes
                </span>
              </div>
              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto font-mono text-[12px]">
                {functions.length === 0 && classes.length === 0 && apiRoutes.length === 0 ? (
                  <span className="text-slate-400 p-2 italic text-[11px]">
                    No explicit function or class symbol definitions found in map.
                  </span>
                ) : (
                  <>
                    {classes.map((c, i) => (
                      <div key={`c-${i}`} className="p-2 rounded bg-cyan-50 border border-cyan-200/70 text-cyan-900 flex items-center gap-2">
                        <span className="text-cyan-600 font-bold">class</span>
                        <span className="font-semibold">{c}</span>
                      </div>
                    ))}
                    {functions.map((f, i) => (
                      <div key={`f-${i}`} className="p-2 rounded bg-slate-50 border border-slate-200 text-slate-800 flex items-center gap-2">
                        <span className="text-emerald-600 font-bold">def/func</span>
                        <span>{f}</span>
                      </div>
                    ))}
                    {apiRoutes.map((r, i) => (
                      <div key={`r-${i}`} className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-2">
                        <span className="text-amber-600 font-bold">route</span>
                        <span>{r}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
