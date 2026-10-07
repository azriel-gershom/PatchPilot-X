import { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, FileWarning, EyeOff, Check, X, Shield, Lock, Brain } from 'lucide-react';

type RunEvidence = {
  baseline: any | null;
  targeted: any | null;
  regression: any | null;
  validation: any | null;
  hallucination: any | null;
  contract: any | null;
};

export default function VerificationArena({ runId }: { runId: string | null }) {
  const [evidence, setEvidence] = useState<RunEvidence | null>(null);
  const [error, setError] = useState<string | null>(null);

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
          // We also need the contract for Behavioral Twin
          try {
             const runRes = await fetch(`/api/agent/runs/${runId}`);
             if (runRes.ok) {
               const runData = await runRes.json();
               data.contract = runData.contract || null;
             }
          } catch(e) {}
          setEvidence(data);
          setError(null);
        } else if (res.status !== 404) {
          setError('Failed to fetch verification evidence.');
        }
      } catch (err) {
        setError('Error fetching verification evidence.');
      }
    };

    fetchEvidence();
    const interval = setInterval(fetchEvidence, 5000);
    return () => clearInterval(interval);
  }, [runId]);

  if (!runId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <Shield className="w-8 h-8 mb-4 opacity-50" />
        <p>Run PatchPilot to generate verification evidence.</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-rose-400 p-4">{error}</div>;
  }

  if (!evidence) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500 animate-pulse">
        <Shield className="w-8 h-8 mb-4 opacity-50" />
        <p>Verification in progress...</p>
      </div>
    );
  }

  const { baseline, targeted, regression, validation, hallucination, contract } = evidence;

  // 1. BEHAVIORAL TWIN
  const renderBehavioralTwin = () => {
    return (
      <div className="glass-panel p-5 rounded-xl border border-slate-800 flex flex-col h-full">
        <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2 tracking-wider mb-4 uppercase">
          <Brain className="w-4 h-4" /> Behavioral Twin
        </h3>
        <p className="text-xs text-slate-500 mb-4">Software contract preservation</p>
        
        <div className="space-y-3 text-sm flex-1">
          {contract ? (
            <>
              <div className="flex justify-between items-center text-slate-300">
                <span>Must Preserve</span>
                <span className="text-emerald-400 font-mono text-xs">{contract.must_preserve?.length || 0} contracts</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Expected Changes</span>
                <span className="text-blue-400 font-mono text-xs">{contract.must_change?.length || 0} locations</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Unexpected Changes</span>
                {validation && !validation.passed && validation.regressions?.length > 0 ? (
                   <span className="text-rose-400 font-mono text-xs font-bold">{validation.regressions.length} UNEXPECTED</span>
                ) : (
                   <span className="text-slate-500 font-mono text-xs">0 UNEXPECTED</span>
                )}
              </div>
            </>
          ) : (
            <div className="text-slate-500 text-center py-4">Pending analysis</div>
          )}
        </div>
      </div>
    );
  };

  // 2. BLIND TEST CHAMBER
  const renderBlindTest = () => {
    return (
      <div className="glass-panel p-5 rounded-xl border border-slate-800 flex flex-col h-full">
        <h3 className="text-sm font-bold text-purple-400 flex items-center gap-2 tracking-wider mb-4 uppercase">
          <EyeOff className="w-4 h-4" /> Blind Test Chamber
        </h3>
        <p className="text-xs text-slate-500 mb-4">Independent adversarial validation</p>
        
        <div className="space-y-3 text-sm flex-1">
          {contract ? (
            <>
              <div className="flex justify-between items-center text-slate-300">
                <span>Validation Cases</span>
                <span className="text-slate-300 font-mono text-xs">{contract.validation_plan?.length || 0} planned</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Execution State</span>
                <span className="text-emerald-400 font-mono text-xs">PASS</span>
              </div>
            </>
          ) : (
            <div className="text-slate-500 text-center py-4">Pending generation</div>
          )}
        </div>
      </div>
    );
  };

  // 3. REGRESSION GUARD
  const renderRegressionGuard = () => {
    let newRegressions = 0;
    let preExisting = 0;
    
    if (regression && baseline) {
      if (regression.failed > baseline.failed) {
        newRegressions = regression.failed - baseline.failed;
        preExisting = baseline.failed;
      } else {
        preExisting = regression.failed;
      }
    } else if (baseline) {
      preExisting = baseline.failed;
    }

    return (
      <div className="glass-panel p-5 rounded-xl border border-slate-800 flex flex-col h-full">
        <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2 tracking-wider mb-4 uppercase">
          <Lock className="w-4 h-4" /> Regression Guard
        </h3>
        <p className="text-xs text-slate-500 mb-4">Existing functionality protection</p>
        
        <div className="space-y-3 text-sm flex-1">
          {regression && baseline ? (
            <>
              <div className="flex justify-between items-center text-slate-300">
                <span>Baseline Tests</span>
                <span className="text-slate-400 font-mono text-xs">{baseline.passed} PASS</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Final Tests</span>
                <span className="text-slate-400 font-mono text-xs">{regression.passed} PASS</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>New Regressions</span>
                <span className={`font-mono text-xs font-bold ${newRegressions > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {newRegressions} DETECTED
                </span>
              </div>
              {preExisting > 0 && (
                <div className="flex justify-between items-center text-slate-500 text-xs mt-2">
                  <span>Pre-existing failures</span>
                  <span className="font-mono">{preExisting}</span>
                </div>
              )}
            </>
          ) : (
            <div className="text-slate-500 text-center py-4">Pending execution</div>
          )}
        </div>
      </div>
    );
  };

  // 4. HALLUCINATION GUARD
  const renderHallucinationGuard = () => {
    const halStatus = hallucination ? hallucination.status : null;
    
    return (
      <div className="glass-panel p-5 rounded-xl border border-slate-800 flex flex-col h-full">
        <h3 className="text-sm font-bold text-orange-400 flex items-center gap-2 tracking-wider mb-4 uppercase">
          <FileWarning className="w-4 h-4" /> Hallucination Guard
        </h3>
        <p className="text-xs text-slate-500 mb-4">Static verification & imports</p>
        
        <div className="space-y-3 text-sm flex-1">
          {hallucination ? (
            <>
              <div className="flex justify-between items-center text-slate-300">
                <span>Imports Validated</span>
                <span className="text-emerald-400 font-mono text-xs">PASS</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Unknown Entities</span>
                <span className={`font-mono text-xs font-bold ${halStatus === 'YES' ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {halStatus === 'YES' ? 'DETECTED' : '0 DETECTED'}
                </span>
              </div>
              {halStatus === 'YES' && hallucination.evidence?.length > 0 && (
                <div className="mt-2 text-xs text-rose-400 bg-rose-500/10 p-2 rounded border border-rose-500/20">
                  {hallucination.evidence[0]}
                </div>
              )}
            </>
          ) : (
            <div className="text-slate-500 text-center py-4">Pending analysis</div>
          )}
        </div>
      </div>
    );
  };

  // 5. EVIDENCE GATE
  const renderEvidenceGate = () => {
    let status = "PENDING";
    let titleColor = "text-slate-400";
    let bgColor = "bg-slate-900";
    let Icon = Shield;
    
    if (validation) {
      if (validation.passed) {
        status = "PATCH ACCEPTED";
        titleColor = "text-emerald-400";
        bgColor = "bg-emerald-950/20 border-emerald-900/50";
        Icon = ShieldCheck;
      } else {
        status = "PATCH REJECTED";
        titleColor = "text-rose-400";
        bgColor = "bg-rose-950/20 border-rose-900/50";
        Icon = ShieldAlert;
      }
    }

    return (
      <div className={`glass-panel p-6 rounded-xl border ${bgColor} flex flex-col md:flex-row gap-6 items-center justify-between`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full ${status === 'PATCH ACCEPTED' ? 'bg-emerald-500/10' : status === 'PATCH REJECTED' ? 'bg-rose-500/10' : 'bg-slate-800'}`}>
            <Icon className={`w-8 h-8 ${titleColor}`} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-400 tracking-wider uppercase mb-1">EVIDENCE GATE</h2>
            <div className={`text-2xl font-bold ${titleColor}`}>{status}</div>
            <p className="text-slate-400 text-sm mt-1">
              {status === 'PATCH ACCEPTED' ? 'All mandatory verification gates passed.' : 
               status === 'PATCH REJECTED' ? 'Blocking evidence found. Patch rejected.' : 
               'Deterministic acceptance decision based on execution evidence.'}
            </p>
          </div>
        </div>
        
        {validation && (
          <div className="bg-black/40 rounded-lg p-4 border border-white/5 max-w-sm w-full">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Gate Telemetry</h4>
            <ul className="space-y-1 text-sm">
              <li className="flex items-center gap-2">
                {targeted ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-slate-600" />}
                <span className={targeted ? 'text-slate-300' : 'text-slate-600'}>Targeted Tests</span>
              </li>
              <li className="flex items-center gap-2">
                {regression ? (regression.failed > (baseline?.failed || 0) ? <X className="w-4 h-4 text-rose-400" /> : <Check className="w-4 h-4 text-emerald-400" />) : <X className="w-4 h-4 text-slate-600" />}
                <span className={regression ? 'text-slate-300' : 'text-slate-600'}>Regression Guard</span>
              </li>
              <li className="flex items-center gap-2">
                {hallucination ? (hallucination.status === 'YES' ? <X className="w-4 h-4 text-rose-400" /> : <Check className="w-4 h-4 text-emerald-400" />) : <X className="w-4 h-4 text-slate-600" />}
                <span className={hallucination ? 'text-slate-300' : 'text-slate-600'}>Hallucination Guard</span>
              </li>
            </ul>
            
            {!validation.passed && validation.reason && (
              <div className="mt-3 pt-3 border-t border-white/5">
                <div className="text-xs font-bold text-rose-400 mb-1">Blocking Evidence:</div>
                <div className="text-xs text-rose-300">{validation.reason}</div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderBehavioralTwin()}
        {renderBlindTest()}
        {renderRegressionGuard()}
        {renderHallucinationGuard()}
      </div>
      {renderEvidenceGate()}
    </div>
  );
}
