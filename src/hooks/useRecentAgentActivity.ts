import { useCallback, useEffect, useMemo, useState } from "react";
import { loadRecentLaunches, recordLocalWorkspaceLaunch } from "@/features/dispatch/model";
import { apiClient } from "@/lib/apiClient";
import type {
  RecentAgentActivity,
  RecordWorkspaceLaunchInput,
} from "@/types/recentActivity";

async function getAuthToken(): Promise<string | undefined> {
  const { supabase } = await import("@/integrations/supabase/client");
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}

function localStorageFallback(): RecentAgentActivity[] {
  return loadRecentLaunches().map((rec) => ({
    id: rec.id,
    agentId: rec.agentId,
    kind: "workspace_launch" as const,
    title: rec.missionTitle,
    subtitle: rec.modeId ?? "Mission",
    status: "In progress",
    createdAt: new Date(rec.createdAt).toISOString(),
    resume: {
      kind: "workspace_launch" as const,
      agentId: rec.agentId,
      modeId: rec.modeId,
      missionTitle: rec.missionTitle,
    },
  }));
}

export function useRecentAgentActivity() {
  const [activities, setActivities] = useState<RecentAgentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAuthToken();
      if (!token) {
        setActivities(localStorageFallback());
        return;
      }

      const data = await apiClient.requestJson<{ activities: RecentAgentActivity[] }>(
        "/api/dashboard/recent-activity",
        { token },
      );
      setActivities(Array.isArray(data.activities) ? data.activities : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load recent activity";
      setError(message);
      setActivities(localStorageFallback());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const recordWorkspaceLaunch = useCallback(
    async (input: RecordWorkspaceLaunchInput) => {
      try {
        const token = await getAuthToken();
        if (!token) return;

        const data = await apiClient.requestJson<{
          launch?: unknown;
          storage?: string;
        }>("/api/mission-launches", {
          method: "POST",
          token,
          body: JSON.stringify({
            agentId: input.agentId,
            modeId: input.modeId ?? null,
            missionTitle: input.missionTitle,
            workspaceStep: input.workspaceStep ?? null,
            metadata: input.metadata ?? {},
          }),
        });

        if (data.storage === "skipped" || !data.launch) {
          recordLocalWorkspaceLaunch({
            agentId: input.agentId,
            modeId: input.modeId,
            missionTitle: input.missionTitle,
          });
        }
        await refresh();
      } catch {
        recordLocalWorkspaceLaunch({
          agentId: input.agentId,
          modeId: input.modeId,
          missionTitle: input.missionTitle,
        });
      }
    },
    [refresh],
  );

  const filteredActivities = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return activities.filter((a) => {
      if (agentFilter !== "all" && a.agentId !== agentFilter) return false;
      if (!q) return true;
      return (
        a.title.toLowerCase().includes(q) ||
        a.subtitle.toLowerCase().includes(q)
      );
    });
  }, [activities, agentFilter, searchQuery]);

  const agentIdsWithActivity = useMemo(() => {
    const ids = new Set(activities.map((a) => a.agentId));
    return Array.from(ids);
  }, [activities]);

  return {
    activities: filteredActivities,
    allActivities: activities,
    loading,
    error,
    agentFilter,
    setAgentFilter,
    searchQuery,
    setSearchQuery,
    agentIdsWithActivity,
    refresh,
    recordWorkspaceLaunch,
  };
}
