import { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Circle, 
  XCircle, 
  Loader2,
  Clock
} from 'lucide-react';

export type TimelineEvent = {
  type: string;
  name: string;
  timestamp: string;
  data?: any;
};

export default function AgentTimeline({ runId, isActive }: { runId: string | null, isActive: boolean }) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!runId) {
      setEvents([]);
      return;
    }

    let intervalId: any;
    
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/agent/runs/${runId}/events`);
        if (res.ok) {
          const data = await res.json();
          setEvents(data.events || []);
          setError(null);
          
          // Check if terminal state reached
          const statusEvent = data.events.find((e: TimelineEvent) => e.name === "Run Status");
          if (statusEvent && statusEvent.data) {
            const status = statusEvent.data.status;
            if (status !== 'PENDING' && status !== 'RUNNING') {
              clearInterval(intervalId); // Terminal state, stop polling
            }
          }
        } else if (res.status !== 404) {
          setError('Unable to load agent timeline.');
        }
      } catch (err) {
        setError('Unable to load agent timeline.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
    
    if (isActive) {
      intervalId = setInterval(fetchEvents, 2000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [runId, isActive]);

  if (!runId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <Clock className="w-8 h-8 mb-4 opacity-50" />
        <p>Agent timeline will appear after you start a PatchPilot run.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400">
        {error}
      </div>
    );
  }

  const STAGES = [
    { key: "STATUS", label: "Repository cloned", eventName: "Run Status" },
    { key: "ANALYSIS", label: "Framework detected", eventName: "Framework detected" },
    { key: "MAPPING", label: "Repository mapped", eventName: "Repository mapped" },
    { key: "BASELINE", label: "Baseline established", eventName: "Baseline established" }, // Not fully separated in backend, but conceptual
    { key: "PLANNING", label: "Change Contract created", eventName: "Change Contract created" },
    { key: "PATCH", label: "Patch generated", eventName: "Patch generated" },
    { key: "TESTING", label: "Targeted tests complete", eventName: "Targeted tests complete" },
    { key: "VALIDATION_CHECK", label: "Hallucination guard", eventName: "Hallucination check complete" },
    { key: "EVIDENCE_GATE", label: "Evidence Gate evaluated", eventName: "Evidence Gate evaluated" }
  ];

  // Helper to determine stage status based on events
  const getStageStatus = (stageName: string, index: number) => {
    const event = events.find(e => e.name === stageName);
    if (event) {
      // Check if it's Evidence Gate and if it failed
      if (stageName === "Evidence Gate evaluated" && event.data && event.data.passed === false) {
        return { status: "FAILED", event };
      }
      return { status: "COMPLETED", event };
    }
    
    // Determine if it's the next pending one
    const completedCount = STAGES.filter(s => events.some(e => e.name === s.eventName)).length;
    if (index === completedCount && isActive) {
      return { status: "RUNNING", event: null };
    }
    
    return { status: "PENDING", event: null };
  };

  return (
    <div className="space-y-4">
      {events.length === 0 && loading && (
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading agent activity...</span>
        </div>
      )}
      
      <div className="relative pl-4 space-y-6 border-l border-slate-700/50 ml-2">
        {STAGES.map((stage, i) => {
          const { status, event } = getStageStatus(stage.eventName, i);
          
          // Skip mapping for stages we don't have events for if we're not running
          if (!isActive && status === "PENDING" && events.length > 0) return null;
          
          return (
            <div key={stage.key} className="relative">
              {/* Icon */}
              <div className="absolute -left-[21px] top-1 bg-[#0f172a]">
                {status === 'COMPLETED' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                {status === 'RUNNING' && <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />}
                {status === 'FAILED' && <XCircle className="w-5 h-5 text-rose-400" />}
                {status === 'PENDING' && <Circle className="w-5 h-5 text-slate-600" />}
              </div>
              
              {/* Content */}
              <div className={`pl-4 ${status === 'RUNNING' ? 'text-blue-100' : status === 'PENDING' ? 'text-slate-500' : 'text-slate-300'}`}>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{stage.label}</span>
                  {event && event.timestamp && (
                    <span className="text-xs text-slate-500">{new Date(event.timestamp).toLocaleTimeString()}</span>
                  )}
                </div>
                
                {/* Event Details */}
                {event && event.data && (
                  <div className="mt-1 text-sm text-slate-400">
                    {stage.eventName === 'Framework detected' && (
                      <span>{event.data.name} · {event.data.language}</span>
                    )}
                    {stage.eventName === 'Repository mapped' && (
                      <span>{event.data.files?.length || 0} source files</span>
                    )}
                    {stage.eventName === 'Evidence Gate evaluated' && (
                      <div className={event.data.passed ? 'text-emerald-400' : 'text-rose-400'}>
                        {event.data.passed ? 'PATCH ACCEPTED' : 'PATCH REJECTED'}
                        <p className="text-xs mt-1 text-slate-500">{event.data.reason}</p>
                      </div>
                    )}
                  </div>
                )}
                
                {status === 'RUNNING' && (
                  <div className="mt-1 text-sm text-blue-400">Processing...</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
