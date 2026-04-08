import { useState, useEffect } from "react";
import type { TacitAgent } from "@/data/agents";
import type { SessionItem } from "@/components/dashboard/AutomateSessionsList";
import { apiClient } from "@/lib/apiClient";

function getMockSessions(agent: TacitAgent): SessionItem[] {
  const topics: Record<string, string[]> = {
    rachael: ["Finance Review", "Budget Planning", "Q4 Forecast"],
    ross: ["Compliance Review", "Policy Update", "Audit Prep"],
    monica: ["Operations Runbook", "Process Documentation", "Vendor Coordination"],
    chandler: ["Data Analysis", "Metrics Review", "Dashboard Design"],
    eagle: ["Inbound BOL batch — LAX", "Customs doc pack — ORD", "POD reconciliation — DFW"],
  };
  const list = topics[agent.id as keyof typeof topics] ?? ["Session 1", "Session 2", "Session 3"];
  return list.map((title, i) => ({
    sessionId: `SID-${agent.id}-${2024}-${String(i + 1).padStart(3, "0")}`,
    sessionName: title,
    agentName: agent.name,
  }));
}

export function useAgentSessions(agent: TacitAgent | null) {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!agent) {
      setSessions([]);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchSessions() {
      setLoading(true);
      setError(null);
      try {
        const {
          data: { session },
        } = await (await import("@/integrations/supabase/client")).supabase.auth.getSession();
        if (!session) {
          const mock = getMockSessions(agent);
          if (!cancelled) {
            setSessions(mock);
            setLoading(false);
          }
          return;
        }

        const projectsData = await apiClient.requestJson<any>("/api/projects", {
          token: session.access_token,
        });
        const projects = projectsData?.projects ?? projectsData ?? [];
        const projectId = Array.isArray(projects) && projects.length > 0 ? projects[0].id : null;

        if (!projectId) {
          const mock = getMockSessions(agent);
          if (!cancelled) {
            setSessions(mock);
            setLoading(false);
          }
          return;
        }

        const data = await apiClient.requestJson<any>(`/api/sessions/project/${projectId}`, {
          token: session.access_token,
        });
        const list = data?.sessions ?? [];
        const agentNameLower = agent.name.toLowerCase();
        const forThisAgent = list.filter((s: Record<string, unknown>) => {
          const meeting = s.meeting as Record<string, string> | undefined;
          const transcript = s.transcript as Record<string, string> | undefined;
          const meetingAgent = (meeting?.agent_name || "").toLowerCase();
          const transcriptAgent = (transcript?.agent_name || "").toLowerCase();
          return meetingAgent === agentNameLower || transcriptAgent === agentNameLower;
        });
        const items: SessionItem[] = forThisAgent.map((s: Record<string, unknown>) => {
          const meeting = s.meeting as Record<string, string> | undefined;
          const transcript = s.transcript as Record<string, string> | undefined;
          const id = String(s.id ?? "");
          return {
            sessionId: id,
            sessionName: meeting?.title ?? `Session ${id.slice(0, 8)}`,
            agentName: meeting?.agent_name || transcript?.agent_name || agent.name,
            meetingTitle: meeting?.title,
            startedAt: s.started_at as string | undefined,
            duration:
              s.duration_sec != null ? `${Math.round(Number(s.duration_sec) / 60)} min` : undefined,
          };
        });
        if (!cancelled) {
          setSessions(items);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load sessions");
          setSessions(getMockSessions(agent));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchSessions();
    return () => {
      cancelled = true;
    };
  }, [agent]);

  return { sessions, loading, error };
}
