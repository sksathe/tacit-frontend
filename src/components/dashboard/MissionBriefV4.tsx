import "./mission-brief-v4.css";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, PanelLeftClose, PanelLeftOpen, Plus, Search, Upload, X } from "lucide-react";
import { TACIT_AGENTS, type TacitAgent } from "@/data/agents";
import { getDispatchProfile, getExecutionExperience, type DispatchMode } from "@/features/dispatch/catalog";
import { useAgentSessions } from "@/hooks/useAgentSessions";
import {
  orderedSteps,
  persistRecentLaunches,
  POST_LAUNCH_STEP_ORDER,
  STEP_LABELS,
  type DispatchAction,
  type DispatchState,
  type DispatchStepId,
  type MissionLaunchRecord,
} from "@/features/dispatch/model";
import { AgentAvatar } from "@/components/dashboard/AgentAvatar";
import { EagleLogisticsMissionPanel } from "@/components/dashboard/EagleLogisticsMissionPanel";
import { cn } from "@/lib/utils";

const MAX_RECENT = 12;

function agentById(id: string | null): TacitAgent | undefined {
  if (!id) return undefined;
  return TACIT_AGENTS.find((a) => a.id === id);
}

function modeBadgeModifier(m: DispatchMode, index: number): string {
  const s = m.shortLabel.toUpperCase();
  if (s === "D" || index % 3 === 0) return "mission-brief-v4__mode-badge--d";
  if (s === "E" || index % 3 === 1) return "mission-brief-v4__mode-badge--e";
  return "mission-brief-v4__mode-badge--h";
}

function stepIndex(state: DispatchState): number {
  const ord = orderedSteps(state);
  return ord.indexOf(state.currentStep);
}

function canProceed(state: DispatchState): boolean {
  const profile = state.agentId ? getDispatchProfile(state.agentId) : undefined;
  switch (state.currentStep) {
    case "agent":
      return !!state.agentId;
    case "mode":
      if (!profile?.modes?.length) return false;
      return !!state.modeId;
    case "mission":
      return state.missionTitle.trim().length > 0;
    case "input":
      return true;
    case "outputContract":
      if (!profile?.outputContracts?.length) return true;
      return !!state.outputContractId;
    case "review":
      return true;
    case "eagleWorkspace":
      return false;
    case "execution":
      return true;
    case "outputReview":
      return false;
    default:
      return false;
  }
}

function canGoBack(state: DispatchState): boolean {
  if (state.currentStep === "execution") return false;
  const ord = orderedSteps(state);
  const idx = ord.indexOf(state.currentStep);
  return idx > 0;
}

export type MissionBriefV4Props = {
  dispatchState: DispatchState;
  dispatchAction: (a: DispatchAction) => void;
  recentLaunches: MissionLaunchRecord[];
  setRecentLaunches: Dispatch<SetStateAction<MissionLaunchRecord[]>>;
  activeRecentId: string | null;
  setActiveRecentId: (id: string | null) => void;
  onOpenMeetingFlow: (flow: "start" | "schedule") => void;
};

export function MissionBriefV4({
  dispatchState,
  dispatchAction,
  recentLaunches,
  setRecentLaunches,
  activeRecentId,
  setActiveRecentId,
  onOpenMeetingFlow,
}: MissionBriefV4Props) {
  const navigate = useNavigate();
  const [eagleFileLabel, setEagleFileLabel] = useState<string | null>(null);
  const [eagleHasExtraction, setEagleHasExtraction] = useState(false);
  const [eagleSidebarExpanded, setEagleSidebarExpanded] = useState(false);
  const ord = useMemo(() => orderedSteps(dispatchState), [dispatchState]);
  const curIdx = stepIndex(dispatchState);
  const agent = agentById(dispatchState.agentId);
  const profile = dispatchState.agentId ? getDispatchProfile(dispatchState.agentId) : undefined;
  const selectedMode = profile?.modes.find((m) => m.id === dispatchState.modeId);
  const experience = useMemo(
    () => getExecutionExperience(dispatchState.agentId, dispatchState.modeId),
    [dispatchState.agentId, dispatchState.modeId],
  );

  const [execFiles, setExecFiles] = useState<File[]>([]);
  const [sessionPickerOpen, setSessionPickerOpen] = useState(false);
  const [sessionQuery, setSessionQuery] = useState("");
  const [linkedSessionName, setLinkedSessionName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadSessionsForPicker =
    agent && experience === "document" && dispatchState.currentStep === "execution";
  const { sessions: agentSessions, loading: sessionsLoading, error: sessionsError } = useAgentSessions(
    loadSessionsForPicker ? agent : null,
  );

  useEffect(() => {
    setExecFiles([]);
  }, [dispatchState.agentId]);

  useEffect(() => {
    if (dispatchState.agentId !== "eagle" || dispatchState.currentStep !== "eagleWorkspace") {
      setEagleFileLabel(null);
      setEagleHasExtraction(false);
      setEagleSidebarExpanded(false);
    }
  }, [dispatchState.agentId, dispatchState.currentStep]);

  useEffect(() => {
    if (!eagleHasExtraction) {
      setEagleSidebarExpanded(false);
    }
  }, [eagleHasExtraction]);

  const eagleOutputFocus =
    dispatchState.agentId === "eagle" &&
    dispatchState.currentStep === "eagleWorkspace" &&
    eagleHasExtraction &&
    !eagleSidebarExpanded;
  const eagleSidebarCanMinify =
    dispatchState.agentId === "eagle" &&
    dispatchState.currentStep === "eagleWorkspace" &&
    eagleHasExtraction &&
    eagleSidebarExpanded;

  useEffect(() => {
    if (!dispatchState.linkedSessionId) setLinkedSessionName(null);
  }, [dispatchState.linkedSessionId]);

  const filteredPickerSessions = useMemo(() => {
    const q = sessionQuery.trim().toLowerCase();
    if (!q) return agentSessions;
    return agentSessions.filter(
      (s) =>
        s.sessionName.toLowerCase().includes(q) ||
        s.agentName.toLowerCase().includes(q) ||
        s.sessionId.toLowerCase().includes(q),
    );
  }, [agentSessions, sessionQuery]);

  const onExecFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list?.length) return;
    setExecFiles((prev) => [...prev, ...Array.from(list)]);
    e.target.value = "";
  };

  const removeExecFile = (index: number) => {
    setExecFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const stepStatuses = useMemo(() => {
    const map = new Map<DispatchStepId, "done" | "current" | "future">();
    for (let i = 0; i < ord.length; i++) {
      const s = ord[i];
      if (i < curIdx) map.set(s, "done");
      else if (i === curIdx) map.set(s, "current");
      else map.set(s, "future");
    }
    return map;
  }, [ord, curIdx]);

  const handleNewMission = () => {
    dispatchAction({ type: "NEW_MISSION" });
    setActiveRecentId(null);
  };

  const handleRecentClick = (rec: MissionLaunchRecord) => {
    setActiveRecentId(rec.id);
    dispatchAction({ type: "APPLY_RECENT", payload: rec });
  };

  const appendLaunch = () => {
    if (!dispatchState.agentId || !dispatchState.missionTitle.trim()) return;
    const rec: MissionLaunchRecord = {
      id: crypto.randomUUID(),
      agentId: dispatchState.agentId,
      modeId: dispatchState.modeId,
      missionTitle: dispatchState.missionTitle.trim(),
      createdAt: Date.now(),
    };
    setRecentLaunches((prev) => {
      const next = [rec, ...prev.filter((x) => x.id !== rec.id)].slice(0, MAX_RECENT);
      persistRecentLaunches(next);
      return next;
    });
    setActiveRecentId(rec.id);
  };

  const onContinue = () => {
    if (!canProceed(dispatchState)) return;
    if (
      dispatchState.currentStep === "review" ||
      (dispatchState.currentStep === "mission" && dispatchState.modeId === "facilitate")
    ) {
      appendLaunch();
    }
    dispatchAction({ type: "GO_FORWARD" });
  };

  const continueLabel =
    dispatchState.currentStep === "review"
      ? "Launch mission"
      : dispatchState.currentStep === "mission" && dispatchState.modeId === "facilitate"
        ? "Set up meeting"
        : "Continue";

  const preLaunchStepCount = dispatchState.launched
    ? ord.length - POST_LAUNCH_STEP_ORDER.length
    : ord.length;
  const sidebarSteps = ord.map((stepId, i) => {
    const st = stepStatuses.get(stepId) ?? "future";
    const canJump = dispatchState.launched
      ? i >= preLaunchStepCount && i <= curIdx
      : dispatchState.agentId === "eagle"
        ? false
        : i <= curIdx;
    return (
      <button
        key={stepId}
        type="button"
        className={`mission-brief-v4__step mission-brief-v4__step--${st}`}
        disabled={!canJump}
        onClick={() => {
          if (canJump) dispatchAction({ type: "SET_STEP", step: stepId });
        }}
      >
        <span className="mission-brief-v4__step-num">{i + 1}</span>
        <span className="mission-brief-v4__step-label">{STEP_LABELS[stepId]}</span>
      </button>
    );
  });

  return (
    <div className="mission-brief-v4">
      <div className="mission-brief-v4__breadcrumb">
        <button type="button" className="mission-brief-v4__new-btn" onClick={handleNewMission}>
          <Plus className="h-4 w-4 shrink-0 text-primary" strokeWidth={2.5} />
          New Mission
        </button>
        <div className="mission-brief-v4__breadcrumb-scroll">
          {recentLaunches.map((rec) => {
            const a = agentById(rec.agentId);
            return (
              <button
                key={rec.id}
                type="button"
                className={`mission-brief-v4__chip${activeRecentId === rec.id ? " mission-brief-v4__chip--active" : ""}`}
                title={rec.missionTitle}
                onClick={() => handleRecentClick(rec)}
              >
                {a?.name ?? rec.agentId}: {rec.missionTitle}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className={`mission-brief-v4__layout${eagleOutputFocus ? " mission-brief-v4__layout--eagle-output" : ""}`}
      >
        <aside
          className={[
            "mission-brief-v4__sidebar",
            "mission-brief-v4__left-panel",
            eagleOutputFocus ? "mission-brief-v4__sidebar--collapsed" : "",
            eagleSidebarCanMinify ? "mission-brief-v4__sidebar--can-minify" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {eagleSidebarCanMinify && (
            <button
              type="button"
              className="mission-brief-v4__sidebar-minify"
              aria-label="Collapse agent sidebar"
              title="Collapse sidebar"
              onClick={() => setEagleSidebarExpanded(false)}
            >
              <PanelLeftClose className="h-4 w-4" strokeWidth={2} />
            </button>
          )}
          <div className="mission-brief-v4__agent-block">
            <span className="mission-brief-v4__agent-label">Agent</span>
            {agent ? (
              <>
                <div className="mission-brief-v4__agent-avatar-shell">
                  <AgentAvatar agent={agent} size="lg" />
                </div>
                <div className={`mission-brief-v4__agent-name mission-brief-v4__agent-name--active`}>
                  {agent.name}
                </div>
                <div className="mission-brief-v4__agent-role">{agent.role}</div>
              </>
            ) : (
              <>
                <div className="mission-brief-v4__agent-name">None selected</div>
                <div className="mission-brief-v4__agent-role">Choose an agent to begin</div>
              </>
            )}
          </div>
          <div className="mission-brief-v4__divider" />
          <div className="mission-brief-v4__steps">{sidebarSteps}</div>
          <div className="mission-brief-v4__divider" />
          <div className="mission-brief-v4__context">
            <div className="mission-brief-v4__context-title">Mission context</div>
            <div className="mission-brief-v4__ctx-row">
              <div className="mission-brief-v4__ctx-label">Mode</div>
              <div
                className={`mission-brief-v4__ctx-value${selectedMode ? " mission-brief-v4__ctx-value--filled" : ""}`}
              >
                {selectedMode?.label ?? "—"}
              </div>
            </div>
            <div className="mission-brief-v4__ctx-row">
              <div className="mission-brief-v4__ctx-label">Title</div>
              <div
                className={`mission-brief-v4__ctx-value${dispatchState.missionTitle.trim() ? " mission-brief-v4__ctx-value--filled" : ""}`}
              >
                {dispatchState.missionTitle.trim() || "—"}
              </div>
            </div>
            {dispatchState.agentId === "eagle" && dispatchState.currentStep === "eagleWorkspace" && (
              <div className="mission-brief-v4__ctx-row">
                <div className="mission-brief-v4__ctx-label">File</div>
                <div
                  className={`mission-brief-v4__ctx-value${eagleFileLabel ? " mission-brief-v4__ctx-value--filled" : ""}`}
                >
                  {eagleFileLabel ?? "—"}
                </div>
              </div>
            )}
            {dispatchState.agentId !== "eagle" && (
              <div className="mission-brief-v4__ctx-row">
                <div className="mission-brief-v4__ctx-label">Output</div>
                <div
                  className={`mission-brief-v4__ctx-value${dispatchState.outputContractId ? " mission-brief-v4__ctx-value--filled" : ""}`}
                >
                  {profile?.outputContracts.find((o) => o.id === dispatchState.outputContractId)?.label ?? "—"}
                </div>
              </div>
            )}
            {experience === "document" && dispatchState.modeId && (
              <div className="mission-brief-v4__ctx-row">
                <div className="mission-brief-v4__ctx-label">Linked session</div>
                <div
                  className={`mission-brief-v4__ctx-value${dispatchState.linkedSessionId ? " mission-brief-v4__ctx-value--filled" : ""}`}
                >
                  {linkedSessionName ??
                    (dispatchState.linkedSessionId ? dispatchState.linkedSessionId.slice(0, 12) + "…" : "—")}
                </div>
              </div>
            )}
          </div>
          <button
            type="button"
            className="mission-brief-v4__sidebar-expand"
            aria-label="Expand agent sidebar"
            title="Expand sidebar"
            onClick={() => setEagleSidebarExpanded(true)}
          >
            <PanelLeftOpen className="h-4 w-4" strokeWidth={2} />
          </button>
        </aside>

        <div className="mission-brief-v4__main mission-brief-v4__right-panel">
          <div
            className={cn(
              "mission-brief-v4__content mission-brief-v4__step-content",
              dispatchState.currentStep === "eagleWorkspace" &&
                eagleFileLabel &&
                "mission-brief-v4__content--eagle-split-fill",
            )}
          >
            {dispatchState.currentStep === "agent" && (
              <>
                <div className="mission-brief-v4__screen mission-brief-v4__screen--agent">
                  <div className="mission-brief-v4__screen-header">
                    <h1 className="mission-brief-v4__screen-title">Choose your agent</h1>
                    <p className="mission-brief-v4__screen-desc">
                      Select who will run this mission. Modes and output options depend on the agent profile.
                    </p>
                  </div>
                <div className="mission-brief-v4__agent-grid">
                  {TACIT_AGENTS.map((a) => {
                    const p = getDispatchProfile(a.id);
                    const selected = dispatchState.agentId === a.id;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        className={`mission-brief-v4__agent-card${selected ? " mission-brief-v4__agent-card--selected" : ""}`}
                        onClick={() => dispatchAction({ type: "SELECT_AGENT", agentId: a.id })}
                      >
                        <AgentAvatar agent={a} size="md" />
                        <div className="mission-brief-v4__agent-meta">
                          <div className="mission-brief-v4__agent-card-name">{a.name}</div>
                          <div className="mission-brief-v4__agent-card-role">{a.role}</div>
                          {a.id === "eagle" ? (
                            <div className="mission-brief-v4__badges">
                              <span className="mission-brief-v4__mode-badge mission-brief-v4__mode-badge--d">
                                PDF · PNG · JPEG
                              </span>
                              <span className="mission-brief-v4__mode-badge mission-brief-v4__mode-badge--e">
                                Upload &amp; extract
                              </span>
                            </div>
                          ) : p?.modes?.length ? (
                            <div className="mission-brief-v4__badges">
                              {p.modes.slice(0, 4).map((m, idx) => (
                                <span
                                  key={m.id}
                                  className={`mission-brief-v4__mode-badge ${modeBadgeModifier(m, idx)}`}
                                >
                                  {m.label}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="mission-brief-v4__soon">Missions coming soon</span>
                          )}
                        </div>
                        <span className="mission-brief-v4__check">✓</span>
                      </button>
                    );
                  })}
                </div>
                {recentLaunches.length > 0 && (
                  <>
                    <div className="mission-brief-v4__recent-title">Recent missions</div>
                    <div className="mission-brief-v4__recent-list">
                      {recentLaunches.map((rec) => {
                        const a = agentById(rec.agentId);
                        const date = new Date(rec.createdAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                        return (
                          <button
                            key={rec.id}
                            type="button"
                            className="mission-brief-v4__recent-card"
                            onClick={() => handleRecentClick(rec)}
                          >
                            <div>
                              <div className="mission-brief-v4__recent-name">{rec.missionTitle}</div>
                              <div className="mission-brief-v4__recent-meta">
                                {a?.name ?? rec.agentId} · {date}
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
                </div>
              </>
            )}

            {dispatchState.currentStep === "eagleWorkspace" && (
              <EagleLogisticsMissionPanel
                onFileSelected={setEagleFileLabel}
                onExtractionOutputChange={setEagleHasExtraction}
              />
            )}

            {dispatchState.currentStep === "mode" && (
              <>
                <h1 className="mission-brief-v4__screen-title">Mission mode</h1>
                <p className="mission-brief-v4__screen-desc">
                  Pick how this run should behave.{" "}
                  {!profile?.modes?.length && agent
                    ? `${agent.name} does not have hybrid dispatch modes yet.`
                    : ""}
                </p>
                {profile?.modes?.length ? (
                  <div className="mission-brief-v4__mode-grid">
                    {profile.modes.map((m) => {
                      const sel = dispatchState.modeId === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          className={`mission-brief-v4__mode-option${sel ? " mission-brief-v4__mode-option--selected" : ""}`}
                          onClick={() => dispatchAction({ type: "SELECT_MODE", modeId: m.id })}
                        >
                          <div className="mission-brief-v4__mode-option-title">{m.label}</div>
                          <div className="mission-brief-v4__mode-option-desc">{m.description}</div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mission-brief-v4__placeholder">
                    Missions for this agent are coming soon. Select another agent or check back later.
                  </div>
                )}
              </>
            )}

            {dispatchState.currentStep === "mission" && (
              <>
                <h1 className="mission-brief-v4__screen-title">Mission brief</h1>
                <p className="mission-brief-v4__screen-desc">
                  Name this run and add context your team will see in the workspace.
                </p>
                <div className="mission-brief-v4__field">
                  <label className="mission-brief-v4__label" htmlFor="mb-v4-title">
                    Title
                  </label>
                  <input
                    id="mb-v4-title"
                    className="mission-brief-v4__input"
                    value={dispatchState.missionTitle}
                    onChange={(e) =>
                      dispatchAction({ type: "SET_MISSION", missionTitle: e.target.value })
                    }
                    placeholder="e.g. Q1 renewal playbook — Acme Corp"
                  />
                </div>
                <div className="mission-brief-v4__field">
                  <label className="mission-brief-v4__label" htmlFor="mb-v4-brief">
                    Context (optional)
                  </label>
                  <textarea
                    id="mb-v4-brief"
                    className="mission-brief-v4__textarea"
                    value={dispatchState.missionBrief}
                    onChange={(e) =>
                      dispatchAction({ type: "SET_MISSION", missionBrief: e.target.value })
                    }
                    placeholder="Goals, scope, links, or constraints for this mission."
                  />
                </div>
              </>
            )}

            {dispatchState.currentStep === "input" && (
              <>
                <h1 className="mission-brief-v4__screen-title">Inputs</h1>
                <p className="mission-brief-v4__screen-desc">
                  {dispatchState.agentId === "lexa" ? (
                    <>
                      Optional notes about what you’ll process. Use{" "}
                      <strong>Execution</strong> after launch to attach contract files, or open the full contract
                      workspace from there.
                    </>
                  ) : (
                    <>
                      Describe what you will attach or connect for this run. File upload wiring can plug in here
                      later.
                    </>
                  )}
                </p>
                <div className="mission-brief-v4__field">
                  <label className="mission-brief-v4__label" htmlFor="mb-v4-input">
                    Notes
                  </label>
                  <textarea
                    id="mb-v4-input"
                    className="mission-brief-v4__textarea"
                    value={dispatchState.inputNotes}
                    onChange={(e) =>
                      dispatchAction({ type: "SET_INPUT_NOTES", inputNotes: e.target.value })
                    }
                    placeholder="Documents, systems, SMEs, or data sources involved."
                  />
                </div>
              </>
            )}

            {dispatchState.currentStep === "outputContract" && (
              <>
                <h1 className="mission-brief-v4__screen-title">Output contract</h1>
                <p className="mission-brief-v4__screen-desc">
                  Choose the primary artifact shape for downstream automation and review.
                </p>
                {(profile?.outputContracts?.length ? profile.outputContracts : []).map((o) => {
                  const sel = dispatchState.outputContractId === o.id;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      className={`mission-brief-v4__mode-option${sel ? " mission-brief-v4__mode-option--selected" : ""}`}
                      style={{ marginBottom: "0.65rem" }}
                      onClick={() =>
                        dispatchAction({ type: "SET_OUTPUT_CONTRACT", outputContractId: o.id })
                      }
                    >
                      <div className="mission-brief-v4__mode-option-title">{o.label}</div>
                      <div className="mission-brief-v4__mode-option-desc">{o.description}</div>
                    </button>
                  );
                })}
                {!profile?.outputContracts?.length && (
                  <div className="mission-brief-v4__placeholder">No contracts defined for this agent.</div>
                )}
              </>
            )}

            {dispatchState.currentStep === "review" && (
              <>
                <h1 className="mission-brief-v4__screen-title">Review & launch</h1>
                <p className="mission-brief-v4__screen-desc">
                  Confirm details before launching. You can go back to any step to adjust.
                </p>
                <div className="mission-brief-v4__review-block">
                  <h3>Agent</h3>
                  <p>{agent?.name ?? "—"}</p>
                </div>
                <div className="mission-brief-v4__review-block">
                  <h3>Mode</h3>
                  <p>{selectedMode?.label ?? "—"}</p>
                </div>
                <div className="mission-brief-v4__review-block">
                  <h3>Mission</h3>
                  <p>{dispatchState.missionTitle || "—"}</p>
                  {dispatchState.missionBrief ? <p className="text-muted-foreground mt-2 text-sm">{dispatchState.missionBrief}</p> : null}
                </div>
                <div className="mission-brief-v4__review-block">
                  <h3>Inputs</h3>
                  <p>{dispatchState.inputNotes.trim() || "No notes added."}</p>
                </div>
                <div className="mission-brief-v4__review-block">
                  <h3>Output</h3>
                  <p>
                    {profile?.outputContracts.find((o) => o.id === dispatchState.outputContractId)?.label ?? "—"}
                  </p>
                </div>
              </>
            )}

            {dispatchState.currentStep === "execution" && agent && experience === "meeting" && (
              <>
                <div className="mission-brief-v4__hero">
                  <AgentAvatar agent={agent} size="xl" />
                  <div className="mission-brief-v4__hero-title">Set up a live session</div>
                </div>
                <p className="mission-brief-v4__screen-desc mx-auto max-w-xl text-center">
                  Run this facilitation as a Tacit session. Choose phone or web (Zoom/Meet) in the next step—we’ll
                  prefill your mission title and agent when possible.
                </p>
                <div className="mission-brief-v4__meeting-actions">
                  <button
                    type="button"
                    className="mission-brief-v4__btn mission-brief-v4__btn--primary"
                    onClick={() => onOpenMeetingFlow("start")}
                  >
                    Start meeting
                  </button>
                  <button
                    type="button"
                    className="mission-brief-v4__btn mission-brief-v4__btn--ghost"
                    onClick={() => onOpenMeetingFlow("schedule")}
                  >
                    Schedule meeting
                  </button>
                </div>
              </>
            )}

            {dispatchState.currentStep === "execution" && agent && experience === "document" && (
              <>
                <div className="mission-brief-v4__hero">
                  <AgentAvatar agent={agent} size="xl" />
                  <div className="mission-brief-v4__hero-title">
                    {dispatchState.agentId === "eagle"
                      ? "Extract logistics documents"
                      : "Prepare documents &amp; sources"}
                  </div>
                </div>
                <p className="mission-brief-v4__screen-desc">
                  {dispatchState.agentId === "eagle" ? (
                    <>
                      Extraction runs on the <strong>Input</strong> step. Use this screen to optionally link a past
                      session for transcript-style context.
                    </>
                  ) : (
                    <>
                      Attach files to process (e.g. PDF contracts), or point to an existing session transcript to
                      automate. Full parsing pipeline wiring can connect here later.
                    </>
                  )}
                </p>

                {dispatchState.agentId !== "eagle" && (
                  <div className="mission-brief-v4__doc-section">
                    <div className="mission-brief-v4__doc-label">Attached files</div>
                    <button
                      type="button"
                      className="mission-brief-v4__dropzone"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mission-brief-v4__dropzone-icon" aria-hidden />
                      <span>Click to add files</span>
                      <span className="mission-brief-v4__dropzone-hint">PDF, DOCX, or other supported types</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="mission-brief-v4__file-input-hidden"
                      multiple
                      onChange={onExecFilesChange}
                    />
                    {execFiles.length > 0 && (
                      <ul className="mission-brief-v4__file-list">
                        {execFiles.map((f, i) => (
                          <li key={`${f.name}-${i}`} className="mission-brief-v4__file-row">
                            <span className="mission-brief-v4__file-name">{f.name}</span>
                            <span className="mission-brief-v4__file-size">
                              {(f.size / 1024).toFixed(1)} KB
                            </span>
                            <button
                              type="button"
                              className="mission-brief-v4__file-remove"
                              aria-label={`Remove ${f.name}`}
                              onClick={() => removeExecFile(i)}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                <div className="mission-brief-v4__doc-section">
                  <div className="mission-brief-v4__doc-label">Past session transcript</div>
                  <button
                    type="button"
                    className="mission-brief-v4__btn mission-brief-v4__btn--ghost mission-brief-v4__btn--block"
                    onClick={() => setSessionPickerOpen((o) => !o)}
                  >
                    {sessionPickerOpen ? "Hide session list" : "Choose a past session"}
                  </button>
                  {dispatchState.linkedSessionId && (
                    <p className="mission-brief-v4__linked-pill">
                      Selected: <strong>{linkedSessionName ?? dispatchState.linkedSessionId}</strong>
                      <button
                        type="button"
                        className="mission-brief-v4__link-inline"
                        onClick={() => {
                          dispatchAction({ type: "SET_LINKED_SESSION", sessionId: null });
                          setLinkedSessionName(null);
                        }}
                      >
                        Clear
                      </button>
                    </p>
                  )}
                  {sessionPickerOpen && (
                    <div className="mission-brief-v4__session-panel">
                      <div className="mission-brief-v4__session-search">
                        <Search className="mission-brief-v4__session-search-icon" aria-hidden />
                        <input
                          type="search"
                          className="mission-brief-v4__session-search-input"
                          placeholder="Search sessions…"
                          value={sessionQuery}
                          onChange={(e) => setSessionQuery(e.target.value)}
                        />
                      </div>
                      {sessionsError && (
                        <p className="mission-brief-v4__session-error">{sessionsError} (showing sample data if any)</p>
                      )}
                      {sessionsLoading ? (
                        <p className="mission-brief-v4__session-loading">Loading sessions…</p>
                      ) : filteredPickerSessions.length === 0 ? (
                        <p className="mission-brief-v4__session-empty">No sessions found for {agent.name}.</p>
                      ) : (
                        <ul className="mission-brief-v4__session-list">
                          {filteredPickerSessions.map((s) => (
                            <li key={s.sessionId}>
                              <button
                                type="button"
                                className={`mission-brief-v4__session-item${dispatchState.linkedSessionId === s.sessionId ? " mission-brief-v4__session-item--selected" : ""}`}
                                onClick={() => {
                                  dispatchAction({ type: "SET_LINKED_SESSION", sessionId: s.sessionId });
                                  setLinkedSessionName(s.sessionName);
                                }}
                              >
                                <span className="mission-brief-v4__session-item-title">{s.sessionName}</span>
                                {s.startedAt && (
                                  <span className="mission-brief-v4__session-item-meta">
                                    {new Date(s.startedAt).toLocaleDateString()}
                                    {s.duration ? ` · ${s.duration}` : ""}
                                  </span>
                                )}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>

                {dispatchState.agentId === "lexa" && (
                  <p className="mission-brief-v4__contract-link-wrap">
                    <button
                      type="button"
                      className="mission-brief-v4__link-contract"
                      onClick={() => navigate("/contract-revrec")}
                    >
                      Open full contract workspace
                    </button>
                    <span className="mission-brief-v4__contract-link-hint">
                      {" "}
                      for Clara’s end-to-end parse and export tools.
                    </span>
                  </p>
                )}

                {dispatchState.agentId !== "eagle" && (
                  <div className="mission-brief-v4__placeholder mission-brief-v4__placeholder--tight">
                    Run status, progress, and backend jobs will mount here when wired.
                  </div>
                )}
              </>
            )}

            {dispatchState.currentStep === "execution" && agent && experience === "generic" && (
              <>
                <div className="mission-brief-v4__hero">
                  <AgentAvatar agent={agent} size="xl" />
                  <div className="mission-brief-v4__hero-title">Mission running</div>
                </div>
                <p className="mission-brief-v4__screen-desc mx-auto text-center">
                  {agent.name} is executing “{dispatchState.missionTitle}”. This is a placeholder for live status,
                  streaming, and tool calls.
                </p>
                <div className="mission-brief-v4__placeholder">
                  Execution UI (progress, logs, cancel) will mount here.
                </div>
              </>
            )}

            {dispatchState.currentStep === "outputReview" && (
              <>
                <h1 className="mission-brief-v4__screen-title">Output review</h1>
                <p className="mission-brief-v4__screen-desc">
                  Inspect artifacts, approve exports, or send results to your downstream systems.
                </p>
                <div className="mission-brief-v4__placeholder">
                  Structured outputs, diff view, and export actions will appear here after the run completes.
                </div>
              </>
            )}
          </div>

          <footer className="mission-brief-v4__footer">
            <button
              type="button"
              className="mission-brief-v4__btn mission-brief-v4__btn--ghost"
              disabled={!canGoBack(dispatchState)}
              onClick={() => dispatchAction({ type: "GO_BACK" })}
            >
              Back
            </button>
            {dispatchState.currentStep !== "eagleWorkspace" && (
              <button
                type="button"
                className="mission-brief-v4__btn mission-brief-v4__btn--primary"
                disabled={!canProceed(dispatchState) || dispatchState.currentStep === "outputReview"}
                onClick={onContinue}
              >
                {continueLabel}
              </button>
            )}
          </footer>
        </div>
      </div>
    </div>
  );
}

