export type RecentActivityResume =
  | { kind: "call_session"; sessionId: string; agentName: string }
  | { kind: "manu_run"; runId: string; missionId: string }
  | {
      kind: "workspace_launch";
      agentId: string;
      modeId: string | null;
      missionTitle: string;
      workspaceStep?: string | null;
      metadata?: Record<string, unknown>;
    };

export type RecentAgentActivity = {
  id: string;
  agentId: string;
  kind: "call_session" | "manu_run" | "workspace_launch";
  title: string;
  subtitle: string;
  status: string;
  createdAt: string;
  resume: RecentActivityResume;
};

export type RecordWorkspaceLaunchInput = {
  agentId: string;
  modeId?: string | null;
  missionTitle: string;
  workspaceStep?: string | null;
  metadata?: Record<string, unknown>;
};
