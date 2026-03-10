import { useState, useEffect } from "react";
import { ChevronLeft, Search } from "lucide-react";
import type { TacitAgent } from "@/data/agents";
import { apiClient } from "@/lib/apiClient";

export interface SessionItem {
  sessionId: string;
  sessionName: string;
  agentName: string;
  meetingTitle?: string;
  startedAt?: string;
  duration?: string;
}

interface AutomateSessionsListProps {
  agent: TacitAgent;
  onSelectSession: (session: SessionItem) => void;
  onSessionsLoaded?: (sessions: SessionItem[]) => void;
  onBack: () => void;
}

export function AutomateSessionsList({ agent, onSelectSession, onSessionsLoaded, onBack }: AutomateSessionsListProps) {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchSessions() {
      setLoading(true);
      setError(null);
      try {
        const { data: { session } } = await (await import("@/integrations/supabase/client")).supabase.auth.getSession();
        if (!session) {
          const mock = getMockSessions(agent);
          setSessions(mock);
          onSessionsLoaded?.(mock);
          setLoading(false);
          return;
        }

        const projectsData = await apiClient.requestJson<any>("/api/projects", {
          token: session.access_token,
        });
        const projects = projectsData?.projects ?? projectsData ?? [];
        const projectId = Array.isArray(projects) && projects.length > 0 ? projects[0].id : null;

        if (!projectId) {
          const mock = getMockSessions(agent);
          setSessions(mock);
          onSessionsLoaded?.(mock);
          setLoading(false);
          return;
        }

        const data = await apiClient.requestJson<any>(`/api/sessions/project/${projectId}`, {
          token: session.access_token,
        });
        const list = data?.sessions ?? [];
        // Only show sessions for this agent (meeting.agent_name or transcript.agent_name)
        const agentNameLower = agent.name.toLowerCase();
        const forThisAgent = list.filter((s: any) => {
          const meetingAgent = (s.meeting?.agent_name || "").toLowerCase();
          const transcriptAgent = (s.transcript?.agent_name || "").toLowerCase();
          return meetingAgent === agentNameLower || transcriptAgent === agentNameLower;
        });
        const items: SessionItem[] = forThisAgent.map((s: any) => ({
          sessionId: s.id,
          sessionName: s.meeting?.title ?? `Session ${s.id.slice(0, 8)}`,
          agentName: s.meeting?.agent_name || s.transcript?.agent_name || agent.name,
          meetingTitle: s.meeting?.title,
          startedAt: s.started_at,
          duration: s.duration_sec != null ? `${Math.round(Number(s.duration_sec) / 60)} min` : undefined,
        }));
        if (!cancelled) {
          setSessions(items);
          onSessionsLoaded?.(items);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load sessions");
          const mock = getMockSessions(agent);
          setSessions(mock);
          onSessionsLoaded?.(mock);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchSessions();
    return () => { cancelled = true; };
  }, [agent, onSessionsLoaded]);

  const filteredSessions = sessions.filter((session) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      session.sessionName.toLowerCase().includes(q) ||
      session.agentName.toLowerCase().includes(q) ||
      session.meetingTitle?.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center gap-2 text-[0.88rem] text-muted-foreground">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 transition-colors hover:text-primary"
        >
          <ChevronLeft className="w-4 h-4" />
          Agents
        </button>
        <span className="text-primary/40">|</span>
        <span className="text-primary font-semibold">{agent.name}</span>
      </div>

      <div className="mb-10 rounded-2xl border border-primary/25 bg-card/55 p-8 md:p-10">
        <div className="mb-3 inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.13em] text-primary">
          Step 2 of 3
        </div>
        <h1 className="mb-2 text-[2rem] font-extrabold text-foreground md:text-[2.4rem]">Sessions for {agent.name}</h1>
        <p className="mb-6 text-[1rem] leading-relaxed text-muted-foreground">
          Choose the session to automate. Call details and transcripts are available when you open a session.
        </p>

        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sessions"
            className="h-11 w-full rounded-lg border border-primary/30 bg-background/70 pl-10 pr-3 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-muted-foreground">Loading sessions…</div>
      ) : (
        <>
          {error && (
            <p className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-600 dark:text-amber-400">
              Could not load from server: {error}. Showing sample sessions.
            </p>
          )}
          {filteredSessions.length === 0 ? (
            <p className="rounded-xl border border-primary/20 bg-card/40 py-10 text-center text-muted-foreground">
              {sessions.length === 0 ? "No sessions yet for this agent." : "No sessions match your search."}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredSessions.map((session) => (
                <button
                  key={session.sessionId}
                  type="button"
                  onClick={() => onSelectSession(session)}
                  className="flex flex-col rounded-2xl border border-primary/25 bg-card/55 p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <div className="mb-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-lg">
                    📄
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-foreground leading-tight line-clamp-2">
                      {session.sessionName}
                    </div>
                    {(session.startedAt || session.duration) && (
                      <div className="mt-1.5 text-[0.8rem] text-muted-foreground">
                        {session.startedAt
                          ? new Date(session.startedAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : null}
                        {session.duration ? ` · ${session.duration}` : null}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}

function getMockSessions(agent: TacitAgent): SessionItem[] {
  const topics: Record<string, string[]> = {
    rachael: ["Finance Review", "Budget Planning", "Q4 Forecast"],
    ross: ["Compliance Review", "Policy Update", "Audit Prep"],
    monica: ["Operations Runbook", "Process Documentation", "Vendor Coordination"],
    chandler: ["Data Analysis", "Metrics Review", "Dashboard Design"],
  };
  const list = topics[agent.id as keyof typeof topics] ?? ["Session 1", "Session 2", "Session 3"];
  return list.map((title, i) => ({
    sessionId: `SID-${agent.id}-${2024}-${String(i + 1).padStart(3, "0")}`,
    sessionName: title,
    agentName: agent.name,
  }));
}
