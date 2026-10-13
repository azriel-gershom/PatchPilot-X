import { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import NewEngineeringRun from './components/views/NewEngineeringRun';
import AgentTimeline from './components/timeline/AgentTimeline';
import DiffViewer from './components/diff/DiffViewer';
import TestResults from './components/tests/TestResults';
import VerificationArena from './components/verification/VerificationArena';
import RepositoryMapView from './components/views/RepositoryMapView';
import ChangeContractView from './components/views/ChangeContractView';
import PlanView from './components/views/PlanView';
import EvidenceView from './components/views/EvidenceView';
import RunsHistoryView from './components/views/RunsHistoryView';
import WorkspaceRepoView from './components/views/WorkspaceRepoView';
import type { RunItem } from './types';
import './index.css';

export type AppTab = 
  | 'new' 
  | 'runs' 
  | 'repo' 
  | 'timeline' 
  | 'map' 
  | 'contract' 
  | 'plan' 
  | 'diff' 
  | 'tests' 
  | 'arena' 
  | 'evidence';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('new');
  const [runs, setRuns] = useState<RunItem[]>([]);
  const [activeRun, setActiveRun] = useState<RunItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch runs list from backend
  const fetchRuns = useCallback(async () => {
    try {
      const res = await fetch('/api/agent/runs');
      if (res.ok) {
        const data = await res.json();
        const runList: RunItem[] = data.runs || [];
        setRuns(runList);

        // If no active run selected yet, pick the most recent one
        setActiveRun((prev) => {
          if (!prev && runList.length > 0) {
            return runList[0];
          }
          if (prev) {
            const updated = runList.find(r => r.run_id === prev.run_id);
            if (updated) return updated;
          }
          return prev;
        });
      }
    } catch (err) {
      console.error('Failed to load runs:', err);
    }
  }, []);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  // Polling for active run status when running or pending
  useEffect(() => {
    if (!activeRun || !activeRun.run_id || (activeRun.status !== 'RUNNING' && activeRun.status !== 'PENDING')) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/agent/runs/${activeRun.run_id}`);
        if (res.ok) {
          const data = await res.json();
          const newStatus = data.status?.status || activeRun.status;
          
          if (newStatus !== activeRun.status) {
            setActiveRun(prev => prev ? { ...prev, status: newStatus } : null);
            fetchRuns();
          }
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [activeRun, fetchRuns]);

  // Handle starting a new agent run
  const handleRunAgent = async (githubUrl: string, requestText: string) => {
    setIsSubmitting(true);
    try {
      let url = githubUrl.trim();
      if (url.match(/^https:\/\/(github|gitlab)\.com\//) && !url.endsWith('.git')) {
        url = url + '.git';
      }

      const res = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ github_url: url, task: requestText })
      });

      if (!res.ok) {
        throw new Error(`Failed to dispatch run: ${res.statusText}`);
      }

      const data = await res.json();
      const newRun: RunItem = {
        run_id: data.run_id,
        status: data.status,
        repository_url: data.repository_url,
        task: requestText,
        created_at: data.created_at,
        has_patch: false,
      };

      setActiveRun(newRun);
      setRuns(prev => [newRun, ...prev]);
      setActiveTab('timeline');
    } catch (err) {
      console.error('Run dispatch failed:', err);
      alert('Failed to start engineering run. Please verify the backend is running.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelRun = async () => {
    if (!activeRun || !activeRun.run_id) return;
    try {
      const res = await fetch(`/api/agent/runs/${activeRun.run_id}/cancel`, {
        method: 'POST'
      });
      if (res.ok) {
        setActiveRun(prev => prev ? { ...prev, status: 'CANCELLED' } : null);
        fetchRuns();
      }
    } catch (err) {
      console.error('Cancel run error', err);
    }
  };

  const handleSelectRun = (runId: string) => {
    const selected = runs.find(r => r.run_id === runId);
    if (selected) {
      setActiveRun(selected);
      setActiveTab('timeline');
    }
  };

  const handleDispatchRepo = (_url: string) => {
    setActiveTab('new');
  };

  return (
    <div className="min-h-screen bg-surface-canvas text-text-primary font-sans">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        activeRun={activeRun}
        runsCount={runs.length}
      />

      <div className="pl-[240px]">
        {activeTab !== 'new' && (
          <Header 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            run={activeRun}
            status={activeRun?.status || 'IDLE'} 
            onCancelRun={handleCancelRun}
          />
        )}

        <main className={`relative min-h-screen bg-surface-canvas ${activeTab !== 'new' ? 'pt-[56px]' : ''}`}>
          {activeTab === 'new' && (
            <NewEngineeringRun 
              onRun={handleRunAgent} 
              runs={runs}
              onSelectRun={handleSelectRun}
              onRefresh={fetchRuns}
              isLoading={isSubmitting}
            />
          )}

          {activeTab === 'runs' && (
            <RunsHistoryView 
              runs={runs}
              onSelectRun={handleSelectRun}
              onRefresh={fetchRuns}
            />
          )}

          {activeTab === 'repo' && (
            <WorkspaceRepoView 
              currentRepoUrl={activeRun?.repository_url}
              onDispatchRepo={handleDispatchRepo}
            />
          )}

          {activeTab === 'timeline' && (
            <div className="w-full max-w-[1600px] mx-auto p-5 lg:p-7">
              <AgentTimeline runId={activeRun ? activeRun.run_id : null} status={activeRun?.status || 'UNKNOWN'} />
            </div>
          )}

          {activeTab === 'map' && (
            <RepositoryMapView runId={activeRun ? activeRun.run_id : null} />
          )}

          {activeTab === 'contract' && (
            <ChangeContractView runId={activeRun ? activeRun.run_id : null} />
          )}

          {activeTab === 'plan' && (
            <PlanView runId={activeRun ? activeRun.run_id : null} />
          )}

          {activeTab === 'diff' && (
            <div className="w-full max-w-[1680px] mx-auto p-4 lg:p-6">
              <DiffViewer runId={activeRun ? activeRun.run_id : null} />
            </div>
          )}

          {activeTab === 'arena' && (
            <div className="w-full max-w-[1600px] mx-auto p-5 lg:p-7">
              <VerificationArena runId={activeRun ? activeRun.run_id : null} />
            </div>
          )}

          {activeTab === 'tests' && (
            <div className="w-full max-w-[1600px] mx-auto p-5 lg:p-7">
              <TestResults runId={activeRun ? activeRun.run_id : null} />
            </div>
          )}

          {activeTab === 'evidence' && (
            <EvidenceView runId={activeRun ? activeRun.run_id : null} />
          )}
        </main>
      </div>
    </div>
  );
}
