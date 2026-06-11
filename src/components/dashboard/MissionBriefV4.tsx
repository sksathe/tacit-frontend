import "./mission-brief-v4.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mic,
  Plus,
  Search,
  Zap,
  Upload,
  X,
} from "lucide-react";
import { TACIT_AGENTS, type TacitAgent } from "@/data/agents";
import { getDispatchProfile, getExecutionExperience, type DispatchMode } from "@/features/dispatch/catalog";
import { useAgentSessions } from "@/hooks/useAgentSessions";
import {
  orderedSteps,
  POST_LAUNCH_STEP_ORDER,
  STEP_LABELS,
  type DispatchAction,
  type DispatchState,
  type DispatchStepId,
} from "@/features/dispatch/model";
import { RecentActivityPanel } from "@/components/dashboard/RecentActivityPanel";
import type { useRecentAgentActivity } from "@/hooks/useRecentAgentActivity";
import type { RecentAgentActivity } from "@/types/recentActivity";
import { AgentAvatar } from "@/components/dashboard/AgentAvatar";
import { ClaraContractMissionPanel } from "@/components/dashboard/ClaraContractMissionPanel";
import { EagleLogisticsMissionPanel } from "@/components/dashboard/EagleLogisticsMissionPanel";
import { ManuMissionBriefPanel } from "@/components/dashboard/ManuMissionBriefPanel";
import { getAgentCardDisplay } from "@/lib/agentMissionDisplay";
import { cn } from "@/lib/utils";

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

type MissionTemplate = {
  id: string;
  name: string;
  description?: string;
  defaultOutputs: string[];
};

const MISSION_TEMPLATES_BY_AGENT: Partial<Record<string, MissionTemplate[]>> = {
  sage: [
    {
      id: "soc2-control-evidence",
      name: "SOC 2 Control Evidence Interview",
      defaultOutputs: ["Control Evidence Map", "Gap Analysis Report", "Follow-up Action List"],
    },
    {
      id: "vendor-risk-assessment",
      name: "Vendor Risk Assessment",
      defaultOutputs: ["Risk Register Update", "Vendor Risk Score", "Remediation Recommendations"],
    },
    {
      id: "security-posture-review",
      name: "Security Posture Review",
      defaultOutputs: ["Posture Score Report", "Control Gap Matrix", "Audit Artifact Pack"],
    },
    {
      id: "audit-prep-interview",
      name: "Audit Prep Stakeholder Interview",
      defaultOutputs: ["Readiness Summary", "Evidence Checklist", "Stakeholder Briefing Doc"],
    },
  ],
  mason: [
    {
      id: "contract-extraction",
      name: "Contract Extraction & CRM Push",
      defaultOutputs: ["CRM Data Push", "Contract Summary", "Audit Trail Export"],
    },
    {
      id: "invoice-terms",
      name: "Invoice Terms Extraction",
      defaultOutputs: ["Invoice Data (CSV)", "GL Code Assignment", "Payment Schedule"],
    },
    {
      id: "redline-review",
      name: "Redline Review Session",
      defaultOutputs: ["Redline Delta Report", "Negotiation Summary", "Risk Flags"],
    },
    {
      id: "vendor-onboarding",
      name: "Vendor Onboarding Interview",
      defaultOutputs: ["Vendor Profile", "Contract Draft", "CRM Data Push"],
    },
  ],
  aria: [
    {
      id: "practice-intake",
      name: "Practice Intake Interview",
      defaultOutputs: ["Practice Profile", "CRM Setup Push", "Compliance Checklist"],
    },
    {
      id: "advisor-registration",
      name: "Advisor Registration Collection",
      defaultOutputs: ["Registration Data Package", "Form U4 Pre-fill", "Compliance Checklist"],
    },
    {
      id: "compliance-discovery",
      name: "Compliance Discovery Session",
      defaultOutputs: ["Compliance Flag Report", "Regulatory Checklist", "Disclosure Summary"],
    },
    {
      id: "book-review",
      name: "Book of Business Review",
      defaultOutputs: ["Book of Business Summary", "AUM Breakdown", "Account Migration Plan"],
    },
  ],
  lexa: [
    {
      id: "parse-order",
      name: "Order form parse",
      defaultOutputs: ["Structured contract JSON", "Line items table", "Confidence scores"],
    },
    {
      id: "revrec",
      name: "RevRec mapping",
      defaultOutputs: ["RevRec schedule", "Billing term mapping", "ASC 606 alignment notes"],
    },
    {
      id: "batch",
      name: "Multi-document batch",
      defaultOutputs: ["Normalized contract pack", "Excel export", "Audit trail"],
    },
  ],
};

function missionTemplatesForAgent(agentId: string | null): MissionTemplate[] {
  if (!agentId) return [];
  return MISSION_TEMPLATES_BY_AGENT[agentId] ?? [];
}

function getModeUiCards(profile: ReturnType<typeof getDispatchProfile> | undefined) {
  const modes = profile?.modes ?? [];
  const facilitate = modes.find((m) => m.id === "facilitate") ?? null;
  const execute = modes.find((m) => m.id !== "facilitate") ?? null;

  if (facilitate && execute) {
    return [
      {
        id: facilitate.id,
        title: "Facilitate",
        description:
          "Agent joins a live session and facilitates structured data collection via conversation.",
        details: ["Live session (Zoom/Meet/phone)", "Great for stakeholder interviews", "Outputs notes + next steps"],
        Icon: Mic,
      },
      {
        id: execute.id,
        title: "Execute",
        description: "Agent processes documents and data autonomously without a live session.",
        details: ["Upload docs (PDF/DOCX/etc.)", "Best for extraction + classification", "Outputs structured data + summary"],
        Icon: Zap,
      },
    ] as const;
  }

  return modes.map((m, idx) => ({
    id: m.id,
    title: m.label,
    description: m.description,
    details: idx % 2 === 0 ? ["Autonomous run", "Structured output", "Fast turnaround"] : ["Live session", "Guided capture", "Collaborative"],
    Icon: idx % 2 === 0 ? Zap : Mic,
  }));
}

function stepIndex(state: DispatchState): number {
  const ord = orderedSteps(state);
  return ord.indexOf(state.currentStep);
}

const LIGHT_CONFIGURE_STEPS = new Set<DispatchStepId>([
  "mode",
  "mission",
  "input",
  "outputContract",
  "review",
]);

function isLightConfigureStep(step: DispatchStepId): boolean {
  return LIGHT_CONFIGURE_STEPS.has(step);
}

type RecentActivityApi = ReturnType<typeof useRecentAgentActivity>;

export type MissionBriefV4Props = {
  dispatchState: DispatchState;
  dispatchAction: (a: DispatchAction) => void;
  recentActivity: RecentActivityApi;
  activeRecentId: string | null;
  setActiveRecentId: (id: string | null) => void;
  onActivitySelect: (activity: RecentAgentActivity) => void;
  pendingManuResume: { runId: string; missionId: string } | null;
  onClearManuResume: () => void;
  onOpenMeetingFlow: (flow: "start" | "schedule") => void;
};

export function MissionBriefV4({
  dispatchState,
  dispatchAction,
  recentActivity,
  activeRecentId,
  setActiveRecentId,
  onActivitySelect,
  pendingManuResume,
  onClearManuResume,
  onOpenMeetingFlow,
}: MissionBriefV4Props) {
  const {
    activities,
    loading: activitiesLoading,
    error: activitiesError,
    agentFilter,
    setAgentFilter,
    searchQuery,
    setSearchQuery,
    recordWorkspaceLaunch,
  } = recentActivity;
  const navigate = useNavigate();
  const [eagleFileLabel, setEagleFileLabel] = useState<string | null>(null);
  const [eagleHasExtraction, setEagleHasExtraction] = useState(false);
  const [eagleSidebarExpanded, setEagleSidebarExpanded] = useState(false);
  const [navSidebarExpanded, setNavSidebarExpanded] = useState(false);
  const [manuMissionLabel, setManuMissionLabel] = useState<string | null>(null);
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
  const [missionMenuOpen, setMissionMenuOpen] = useState(false);
  const [missionMenuQuery, setMissionMenuQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isLightWorkspace =
    isLightConfigureStep(dispatchState.currentStep) ||
    dispatchState.currentStep === "claraWorkspace";
  const phaseLabel = useMemo(() => {
    if (dispatchState.agentId === "eagle") return "Document";
    if (dispatchState.agentId === "manu") return "Manual";
    if (dispatchState.agentId === "lexa") return "Contract";
    if (dispatchState.modeId === "facilitate") return "Facilitation";
    return "Configuration";
  }, [dispatchState.agentId, dispatchState.modeId]);

  const stepAnnouncement = `${STEP_LABELS[dispatchState.currentStep] ?? dispatchState.currentStep}. Step ${curIdx + 1} of ${ord.length}.`;

  useEffect(() => {
    if (!isLightWorkspace) return;
    window.requestAnimationFrame(() => {
      document.getElementById("mb-wizard-heading")?.focus();
    });
  }, [dispatchState.currentStep, isLightWorkspace]);

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
    if (dispatchState.agentId !== "manu" || dispatchState.currentStep !== "manuWorkspace") {
      setManuMissionLabel(null);
    }
  }, [dispatchState.agentId, dispatchState.currentStep]);

  useEffect(() => {
    if (!eagleHasExtraction) {
      setEagleSidebarExpanded(false);
    }
  }, [eagleHasExtraction]);

  useEffect(() => {
    const onHomepage = dispatchState.currentStep === "agent" && !dispatchState.agentId;
    if (onHomepage) {
      setNavSidebarExpanded(false);
    } else if (dispatchState.agentId) {
      setNavSidebarExpanded(true);
    }
  }, [dispatchState.currentStep, dispatchState.agentId]);

  const eagleOutputFocus =
    dispatchState.agentId === "eagle" &&
    dispatchState.currentStep === "eagleWorkspace" &&
    eagleHasExtraction &&
    !eagleSidebarExpanded;
  const sidebarCollapsed = eagleOutputFocus || !navSidebarExpanded;

  const collapseSidebar = () => {
    if (dispatchState.agentId === "eagle" && eagleHasExtraction) {
      setEagleSidebarExpanded(false);
      return;
    }
    setNavSidebarExpanded(false);
  };

  const expandSidebar = () => {
    if (dispatchState.agentId === "eagle" && eagleHasExtraction) {
      setEagleSidebarExpanded(true);
      return;
    }
    setNavSidebarExpanded(true);
  };

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

  const handleContinue = () => {
    if (dispatchState.currentStep === "review" && dispatchState.agentId) {
      void recordWorkspaceLaunch({
        agentId: dispatchState.agentId,
        modeId: dispatchState.modeId,
        missionTitle: dispatchState.missionTitle.trim() || "Mission",
        workspaceStep: "review",
      });
    }
    dispatchAction({ type: "GO_FORWARD" });
  };

  const showConfigProgressStrip = isLightWorkspace;
  const progressStepLabel = ord[curIdx] ? STEP_LABELS[ord[curIdx]] : "";
  const progressPct = ord.length > 0 ? Math.round(((curIdx + 1) / ord.length) * 100) : 0;

  const preLaunchStepCount = dispatchState.launched
    ? ord.length - POST_LAUNCH_STEP_ORDER.length
    : ord.length;
  const sidebarSteps = ord.map((stepId, i) => {
    const st = stepStatuses.get(stepId) ?? "future";
    const canJump = dispatchState.launched
      ? i >= preLaunchStepCount && i <= curIdx
      : dispatchState.agentId === "eagle" || dispatchState.agentId === "manu"
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
    <div className="mission-brief-v4 mission-brief-v4--v52">
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {stepAnnouncement}
      </p>

      <div
        className={cn(
          "mission-brief-v4__layout",
          sidebarCollapsed && "mission-brief-v4__layout--sidebar-collapsed",
        )}
      >
        <aside
          className={cn(
            "mission-brief-v4__sidebar",
            "mission-brief-v4__left-panel",
            sidebarCollapsed && "mission-brief-v4__sidebar--collapsed",
          )}
        >
          <div className="mission-brief-v4__sidebar-toggle">
            <button
              type="button"
              className="mission-brief-v4__sidebar-toggle-btn"
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={sidebarCollapsed ? expandSidebar : collapseSidebar}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-4 w-4" strokeWidth={2} />
              ) : (
                <ChevronLeft className="h-4 w-4" strokeWidth={2} />
              )}
            </button>
          </div>
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
            <div className="mission-brief-v4__context-title">Live summary</div>
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
            {dispatchState.agentId === "manu" && dispatchState.currentStep === "manuWorkspace" && (
              <div className="mission-brief-v4__ctx-row">
                <div className="mission-brief-v4__ctx-label">Mission</div>
                <div
                  className={`mission-brief-v4__ctx-value${manuMissionLabel ? " mission-brief-v4__ctx-value--filled" : ""}`}
                >
                  {manuMissionLabel ?? "—"}
                </div>
              </div>
            )}
            {dispatchState.agentId === "lexa" && dispatchState.currentStep === "claraWorkspace" && (
              <>
                <div className="mission-brief-v4__ctx-row">
                  <div className="mission-brief-v4__ctx-label">Mode</div>
                  <div
                    className={`mission-brief-v4__ctx-value${dispatchState.modeId ? " mission-brief-v4__ctx-value--filled" : ""}`}
                  >
                    {profile?.modes.find((m) => m.id === dispatchState.modeId)?.label ?? "—"}
                  </div>
                </div>
                <div className="mission-brief-v4__ctx-row">
                  <div className="mission-brief-v4__ctx-label">Output</div>
                  <div
                    className={`mission-brief-v4__ctx-value${dispatchState.outputContractId ? " mission-brief-v4__ctx-value--filled" : ""}`}
                  >
                    {profile?.outputContracts.find((o) => o.id === dispatchState.outputContractId)?.label ?? "—"}
                  </div>
                </div>
              </>
            )}
            {dispatchState.agentId !== "eagle" &&
              dispatchState.agentId !== "manu" &&
              dispatchState.agentId !== "lexa" && (
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
        </aside>

        <div
          className={cn(
            "mission-brief-v4__main mission-brief-v4__right-panel",
            isLightWorkspace && "mission-brief-v4__main--light",
          )}
        >
          <div
            className={cn(
              "mission-brief-v4__content mission-brief-v4__step-content",
              isLightWorkspace && "mission-brief-v4__content--configure-light",
              dispatchState.currentStep === "eagleWorkspace" &&
                eagleFileLabel &&
                "mission-brief-v4__content--eagle-split-fill",
            )}
          >
            {showConfigProgressStrip && (
              <div className="mission-brief-v4__progress-strip mission-brief-v4__progress-strip--light">
                <div className="mission-brief-v4__progress-meta">
                  <span className="mission-brief-v4__progress-phase">{phaseLabel}</span>
                  <span className="mission-brief-v4__progress-count">
                    Step {curIdx + 1} of {ord.length}
                  </span>
                </div>
                <div className="mission-brief-v4__progress-bar-track">
                  <div
                    className="mission-brief-v4__progress-bar-fill"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="mission-brief-v4__progress-current">{progressStepLabel}</div>
              </div>
            )}

            {dispatchState.currentStep === "agent" && (
              <>
                <div className="mission-brief-v4__screen mission-brief-v4__screen--agent">
                  <div className="mission-brief-v4__screen-header mission-brief-v4__screen-header--hero">
                    <p className="mission-brief-v4__eyebrow">Tacit · AI agents for real work</p>
                    <h1 className="mission-brief-v4__screen-title">Design your next mission</h1>
                    <p className="mission-brief-v4__screen-desc mission-brief-v4__screen-desc--hero">
                      Pair the right specialist with your workflow—live facilitation, document extraction, or
                      policy-heavy review. Resume a recent run or start a new mission below.
                    </p>
                  </div>

                  <RecentActivityPanel
                    activities={activities}
                    loading={activitiesLoading}
                    error={activitiesError}
                    agentFilter={agentFilter}
                    onAgentFilterChange={setAgentFilter}
                    searchQuery={searchQuery}
                    onSearchQueryChange={setSearchQuery}
                    activeId={activeRecentId}
                    onSelect={onActivitySelect}
                  />

                  <div className="mission-brief-v4__landing-divider" role="separator" />

                  <section className="mission-brief-v4__landing-zone" aria-label="Choose an agent">
                    <h2 className="mission-brief-v4__landing-heading">Start a new mission</h2>
                    <p className="mission-brief-v4__landing-sub">
                      Each profile ships with its own operating modes and output contracts.
                    </p>
                  </section>

                <div className="mission-brief-v4__agent-grid">
                  {TACIT_AGENTS.map((a) => {
                    const selected = dispatchState.agentId === a.id;
                    const card = getAgentCardDisplay(a);
                    const modeChips = card.modeChips;
                    const missionLines = card.missionLines;
                    const domainLines = a.specialties.slice(0, 2);
                    const inLines = card.inLines;
                    const outLines = card.outLines;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        className={`mission-brief-v4__agent-card${selected ? " mission-brief-v4__agent-card--selected" : ""}`}
                        onClick={() => dispatchAction({ type: "SELECT_AGENT", agentId: a.id })}
                      >
                        <div className="mission-brief-v4__agent-card-top">
                          <div className="mission-brief-v4__agent-meta">
                            <div className="mission-brief-v4__agent-card-name">{a.name.toUpperCase()}</div>
                            <div className="mission-brief-v4__agent-card-role">{a.role}</div>
                          </div>
                          <div className="mission-brief-v4__agent-avatar-corner" aria-hidden>
                            <AgentAvatar agent={a} size="lg" />
                          </div>
                        </div>

                        <div className="mission-brief-v4__agent-card-divider" />

                        <div className="mission-brief-v4__agent-card-sections">
                          <div className="mission-brief-v4__badges mission-brief-v4__badges--mission">
                            {modeChips.length > 0 ? (
                              modeChips.map((label, idx) => (
                                <span
                                  key={`${a.id}-chip-${label}`}
                                  className={`mission-brief-v4__mode-badge mission-brief-v4__mode-badge--${idx === 0 ? "e" : "d"}`}
                                >
                                  {label}
                                </span>
                              ))
                            ) : (
                              <span className="mission-brief-v4__soon">Coming soon</span>
                            )}
                          </div>

                          <div className="mission-brief-v4__agent-section">
                            <span className="mission-brief-v4__agent-section-label">MISSIONS</span>
                            <p className="mission-brief-v4__agent-section-value">{missionLines}</p>
                          </div>
                          <div className="mission-brief-v4__agent-section">
                            <span className="mission-brief-v4__agent-section-label">DOMAIN</span>
                            <p className="mission-brief-v4__agent-section-value">{domainLines.join(" · ")}</p>
                          </div>
                          <div className="mission-brief-v4__agent-section">
                            <span className="mission-brief-v4__agent-section-label">IN</span>
                            <p className="mission-brief-v4__agent-section-value">{inLines}</p>
                          </div>
                          <div className="mission-brief-v4__agent-section">
                            <span className="mission-brief-v4__agent-section-label">OUT</span>
                            <p className="mission-brief-v4__agent-section-value">{outLines}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="mission-brief-v4__agent-launch"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            dispatchAction({ type: "SELECT_AGENT", agentId: a.id });
                            void recordWorkspaceLaunch({
                              agentId: a.id,
                              modeId:
                                a.id === "manu"
                                  ? "execute"
                                  : a.id === "lexa"
                                    ? "parse-order"
                                    : null,
                              missionTitle: `${a.name} workspace`,
                              workspaceStep: "launch",
                            });
                            if (a.id !== "eagle" && a.id !== "manu" && a.id !== "lexa") {
                              dispatchAction({ type: "SET_STEP", step: "mode" });
                            }
                          }}
                        >
                          ▸ Launch Mission
                        </button>
                        <span className="mission-brief-v4__check">✓</span>
                      </button>
                    );
                  })}
                </div>
                </div>
              </>
            )}

            {dispatchState.currentStep === "eagleWorkspace" && (
              <EagleLogisticsMissionPanel
                onFileSelected={setEagleFileLabel}
                onExtractionOutputChange={setEagleHasExtraction}
              />
            )}

            {dispatchState.currentStep === "manuWorkspace" && (
              <ManuMissionBriefPanel
                onMissionTitleChange={setManuMissionLabel}
                resumeRunId={pendingManuResume?.runId}
                resumeMissionId={pendingManuResume?.missionId}
                onResumeComplete={onClearManuResume}
                onMissionSelect={(missionId, title) => {
                  void recordWorkspaceLaunch({
                    agentId: "manu",
                    modeId: "execute",
                    missionTitle: title,
                    workspaceStep: "manu-mission",
                    metadata: { missionId },
                  });
                }}
              />
            )}

            {dispatchState.currentStep === "claraWorkspace" && (
              <ClaraContractMissionPanel
                modeId={dispatchState.modeId}
                outputContractId={dispatchState.outputContractId}
                dispatchAction={dispatchAction}
              />
            )}

            {dispatchState.currentStep === "mode" && (
              <div className="mission-brief-v4__wizard-pane mission-brief-v4__wizard-pane--mode">
                <h1 id="mb-wizard-heading" tabIndex={-1} className="mission-brief-v4__screen-title">
                  How will input be provided?
                </h1>
                <p className="mission-brief-v4__screen-desc">
                  Select the operating mode for this mission run.{" "}
                  {!profile?.modes?.length && agent
                    ? `${agent.name} does not have hybrid dispatch modes yet.`
                    : ""}
                </p>
                {profile?.modes?.length ? (
                  <>
                    <div className="mission-brief-v4__mode-grid mission-brief-v4__mode-grid--hero">
                      {getModeUiCards(profile).map(({ id, title, description, details, Icon }) => {
                        const sel = dispatchState.modeId === id;
                        const dimmed = dispatchState.modeId !== null && !sel;
                        return (
                          <button
                            key={id}
                            type="button"
                            className={cn(
                              "mission-brief-v4__mode-option",
                              "mission-brief-v4__mode-option--hero",
                              sel && "mission-brief-v4__mode-option--selected",
                              dimmed && "mission-brief-v4__mode-option--dimmed",
                            )}
                            onClick={() => dispatchAction({ type: "SELECT_MODE", modeId: id })}
                          >
                            <span className="mission-brief-v4__mode-hero-check" aria-hidden>
                              ✓
                            </span>
                            <div className="mission-brief-v4__mode-hero-icon" aria-hidden>
                              <Icon className="h-6 w-6" />
                            </div>
                            <div className="mission-brief-v4__mode-option-title">{title}</div>
                            <div className="mission-brief-v4__mode-option-desc">{description}</div>
                            <div className="mission-brief-v4__mode-hero-divider" aria-hidden />
                            <ul className="mission-brief-v4__mode-hero-details" aria-label={`${title} details`}>
                              {details.slice(0, 3).map((d) => (
                                <li key={d}>{d}</li>
                              ))}
                            </ul>
                          </button>
                        );
                      })}
                    </div>
                    <div className="mission-brief-v4__mode-next" role="note">
                      <Zap className="h-4 w-4" aria-hidden />
                      <span>
                        <strong>Next:</strong>{" "}
                        {dispatchState.modeId === "facilitate"
                          ? "Schedule or start your live session."
                          : "Upload your documents and configure extraction settings."}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="mission-brief-v4__placeholder">
                    Missions for this agent are coming soon. Select another agent or check back later.
                  </div>
                )}
              </div>
            )}

            {dispatchState.currentStep === "mission" && (
              <div className="mission-brief-v4__wizard-pane mission-brief-v4__wizard-pane--mission">
                <h1 id="mb-wizard-heading" tabIndex={-1} className="mission-brief-v4__screen-title">
                  What is the mission?
                </h1>
                <p className="mission-brief-v4__screen-desc">
                  Choose from this agent&apos;s mission repertoire.
                </p>
                {(() => {
                  const templates = missionTemplatesForAgent(dispatchState.agentId);
                  const selected =
                    templates.find((t) => t.id === dispatchState.missionTemplateId) ?? null;
                  const filtered = missionMenuQuery.trim()
                    ? templates.filter((t) =>
                        t.name.toLowerCase().includes(missionMenuQuery.trim().toLowerCase()),
                      )
                    : templates;
                  return (
                    <>
                      <div className="mission-brief-v4__field">
                        <label className="mission-brief-v4__label" htmlFor="mb-v4-mission-trigger">
                          Mission
                        </label>
                        <div
                          className="mission-brief-v4__combo"
                          onBlur={(e) => {
                            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                              setMissionMenuOpen(false);
                              setMissionMenuQuery("");
                            }
                          }}
                        >
                          <button
                            id="mb-v4-mission-trigger"
                            type="button"
                            className={cn(
                              "mission-brief-v4__combo-trigger",
                              !dispatchState.missionTemplateId && "mission-brief-v4__combo-trigger--placeholder",
                            )}
                            aria-haspopup="listbox"
                            aria-expanded={missionMenuOpen}
                            onClick={() => setMissionMenuOpen((o) => !o)}
                          >
                            <span className="mission-brief-v4__combo-value">
                              {selected?.name ?? "— Select a mission —"}
                            </span>
                            <span className="mission-brief-v4__combo-chevron" aria-hidden>
                              ▾
                            </span>
                          </button>

                          {missionMenuOpen ? (
                            <div className="mission-brief-v4__combo-pop" role="dialog" aria-label="Choose a mission">
                              <div className="mission-brief-v4__combo-search">
                                <input
                                  autoFocus
                                  value={missionMenuQuery}
                                  onChange={(e) => setMissionMenuQuery(e.target.value)}
                                  className="mission-brief-v4__combo-search-input"
                                  placeholder="Search missions…"
                                />
                              </div>
                              <div className="mission-brief-v4__combo-list" role="listbox" aria-label="Mission options">
                                {filtered.length ? (
                                  filtered.map((t) => {
                                    const isSel = t.id === dispatchState.missionTemplateId;
                                    return (
                                      <button
                                        key={t.id}
                                        type="button"
                                        role="option"
                                        aria-selected={isSel}
                                        className={cn(
                                          "mission-brief-v4__combo-option",
                                          isSel && "mission-brief-v4__combo-option--selected",
                                        )}
                                        onClick={() => {
                                          dispatchAction({
                                            type: "SET_MISSION_TEMPLATE",
                                            missionTemplateId: t.id,
                                          });
                                          dispatchAction({ type: "SET_MISSION", missionTitle: t.name });
                                          setMissionMenuOpen(false);
                                          setMissionMenuQuery("");
                                        }}
                                      >
                                        <div className="mission-brief-v4__combo-option-title">{t.name}</div>
                                        {t.defaultOutputs?.length ? (
                                          <div className="mission-brief-v4__combo-option-meta">
                                            {t.defaultOutputs.slice(0, 3).join(" · ")}
                                          </div>
                                        ) : null}
                                      </button>
                                    );
                                  })
                                ) : (
                                  <div className="mission-brief-v4__combo-empty">No missions match your search.</div>
                                )}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      {selected ? (
                        <div className="mission-brief-v4__mission-preview" aria-label="Default outputs for this mission">
                          <div className="mission-brief-v4__mission-preview-title">
                            Default outputs for this mission
                          </div>
                          <div className="mission-brief-v4__mission-preview-chips">
                            {selected.defaultOutputs.map((o) => (
                              <span key={o} className="mission-brief-v4__mission-output-chip">
                                {o}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      <div className="mission-brief-v4__field">
                        <label className="mission-brief-v4__label" htmlFor="mb-v4-brief">
                          Additional context <span className="mission-brief-v4__label-optional">(optional)</span>
                        </label>
                        <textarea
                          id="mb-v4-brief"
                          className="mission-brief-v4__textarea"
                          value={dispatchState.missionBrief}
                          onChange={(e) =>
                            dispatchAction({ type: "SET_MISSION", missionBrief: e.target.value })
                          }
                          placeholder="Any specific instructions or parameters for this run…"
                          rows={3}
                        />
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {dispatchState.currentStep === "input" && (
              <div className="mission-brief-v4__wizard-pane">
                <h1 id="mb-wizard-heading" tabIndex={-1} className="mission-brief-v4__screen-title">
                  What goes into this run?
                </h1>
                <p className="mission-brief-v4__screen-desc">
                  {dispatchState.agentId === "lexa" ? (
                    <>
                      Optional notes about what you’ll process. Use{" "}
                      <strong>Launch</strong> to attach contract files, or open the full contract workspace
                      afterward.
                    </>
                  ) : (
                    <>
                      Capture the systems, documents, or stakeholders involved so the handoff to execution is
                      explicit.
                    </>
                  )}
                </p>
                {dispatchState.modeId === "facilitate" && (
                  <div className="mission-brief-v4__field">
                    <label className="mission-brief-v4__label" htmlFor="mb-v4-meeting-link">
                      Meeting link
                    </label>
                    <input
                      id="mb-v4-meeting-link"
                      className="mission-brief-v4__input"
                      value={dispatchState.meetingLink}
                      onChange={(e) =>
                        dispatchAction({ type: "SET_MEETING_LINK", meetingLink: e.target.value })
                      }
                      placeholder="https://zoom.us/j/… or https://meet.google.com/…"
                    />
                  </div>
                )}
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
              </div>
            )}

            {dispatchState.currentStep === "outputContract" && (
              <div className="mission-brief-v4__wizard-pane">
                <h1 id="mb-wizard-heading" tabIndex={-1} className="mission-brief-v4__screen-title">
                  What should we produce?
                </h1>
                <p className="mission-brief-v4__screen-desc">
                  Pick the primary deliverable shape—reports, structured JSON, approvals, or handoff packets—for
                  automation and review downstream.
                </p>
                <div className="mission-brief-v4__output-contract-list">
                  {(profile?.outputContracts?.length ? profile.outputContracts : []).map((o) => {
                    const sel = dispatchState.outputContractId === o.id;
                    return (
                      <button
                        key={o.id}
                        type="button"
                        className={`mission-brief-v4__mode-option mission-brief-v4__output-contract-option${sel ? " mission-brief-v4__mode-option--selected" : ""}`}
                        onClick={() =>
                          dispatchAction({ type: "SET_OUTPUT_CONTRACT", outputContractId: o.id })
                        }
                      >
                        <div className="mission-brief-v4__mode-option-title">{o.label}</div>
                        <div className="mission-brief-v4__mode-option-desc">{o.description}</div>
                      </button>
                    );
                  })}
                </div>
                {!profile?.outputContracts?.length && (
                  <div className="mission-brief-v4__placeholder">No contracts defined for this agent.</div>
                )}
              </div>
            )}

            {dispatchState.currentStep === "review" && (
              <div className="mission-brief-v4__wizard-pane">
                <h1 id="mb-wizard-heading" tabIndex={-1} className="mission-brief-v4__screen-title">
                  Ready to launch
                </h1>
                <p className="mission-brief-v4__screen-desc">
                  Double-check the contract with the rail summary. You can jump back to any completed step from
                  the left.
                </p>
                <div className="mission-brief-v4__review-summary">
                  <div className="mission-brief-v4__review-summary-grid">
                    <div className="mission-brief-v4__review-block mission-brief-v4__review-block--compact">
                      <h3>Agent</h3>
                      <p>{agent?.name ?? "—"}</p>
                    </div>
                    <div className="mission-brief-v4__review-block mission-brief-v4__review-block--compact">
                      <h3>Mode</h3>
                      <p>{selectedMode?.label ?? "—"}</p>
                    </div>
                    <div className="mission-brief-v4__review-block mission-brief-v4__review-block--span">
                      <h3>Mission</h3>
                      <p>{dispatchState.missionTitle || "—"}</p>
                      {dispatchState.missionBrief ? (
                        <p className="mission-brief-v4__review-brief-secondary">{dispatchState.missionBrief}</p>
                      ) : null}
                    </div>
                    <div className="mission-brief-v4__review-block mission-brief-v4__review-block--compact">
                      <h3>Inputs</h3>
                      <p>
                        {dispatchState.modeId === "facilitate" && dispatchState.meetingLink.trim()
                          ? `Meeting link: ${dispatchState.meetingLink.trim()}`
                          : null}
                        {dispatchState.modeId === "facilitate" && dispatchState.meetingLink.trim() ? (
                          <br />
                        ) : null}
                        {dispatchState.inputNotes.trim() || "No notes added."}
                      </p>
                    </div>
                    <div className="mission-brief-v4__review-block mission-brief-v4__review-block--compact">
                      <h3>Output</h3>
                      <p>
                        {profile?.outputContracts.find((o) => o.id === dispatchState.outputContractId)?.label ??
                          "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
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
                        <div className="mission-brief-v4__session-alert mission-brief-v4__session-alert--error">
                          <AlertCircle className="mission-brief-v4__session-alert-icon h-4 w-4 shrink-0" aria-hidden />
                          <p>{sessionsError}</p>
                          <p className="mission-brief-v4__session-alert-hint">
                            Check your connection or try again. Some environments fall back to sample data.
                          </p>
                        </div>
                      )}
                      {sessionsLoading ? (
                        <div className="mission-brief-v4__session-skeleton" aria-busy="true" aria-label="Loading sessions">
                          <div className="mission-brief-v4__session-skeleton-row" />
                          <div className="mission-brief-v4__session-skeleton-row" />
                          <div className="mission-brief-v4__session-skeleton-row" />
                          <p className="mission-brief-v4__session-loading-caption">
                            <Loader2 className="mission-brief-v4__session-loading-icon mr-1.5 inline h-3.5 w-3.5 animate-spin" />
                            Loading sessions…
                          </p>
                        </div>
                      ) : filteredPickerSessions.length === 0 ? (
                        <div className="mission-brief-v4__session-empty-state">
                          <p className="mission-brief-v4__session-empty-title">No sessions match</p>
                          <p className="mission-brief-v4__session-empty-desc">
                            {sessionQuery.trim()
                              ? "Try a different search or clear the filter."
                              : `No sessions found for ${agent.name}.`}
                          </p>
                        </div>
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
              <div className="mission-brief-v4__wizard-pane mission-brief-v4__wizard-pane--wide">
                <h1 className="mission-brief-v4__screen-title">Output review</h1>
                <p className="mission-brief-v4__screen-desc">
                  Inspect artifacts, approve exports, or send results to downstream systems once the run
                  finishes.
                </p>
                <div className="mission-brief-v4__placeholder">
                  Structured outputs, diff view, and export actions will appear here after the run completes.
                </div>
              </div>
            )}
          </div>

          {dispatchState.currentStep !== "agent" &&
            dispatchState.currentStep !== "eagleWorkspace" &&
            dispatchState.currentStep !== "manuWorkspace" &&
            dispatchState.currentStep !== "claraWorkspace" && (
            <footer className="mission-brief-v4__footer mission-brief-v4__footer--light">
              <div />
              <div className="mission-brief-v4__footer-right">
                <p className="mission-brief-v4__footer-hint">
                  Step {curIdx + 1} of {ord.length}
                </p>
                <div className="mission-brief-v4__meeting-actions">
                  <button
                    type="button"
                    className="mission-brief-v4__btn mission-brief-v4__btn--ghost mission-brief-v4__btn--ghost-light"
                    onClick={() => dispatchAction({ type: "GO_BACK" })}
                    disabled={curIdx === 0}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className="mission-brief-v4__btn mission-brief-v4__btn--primary"
                    onClick={handleContinue}
                  >
                    Continue
                  </button>
                </div>
              </div>
            </footer>
          )}
        </div>
      </div>
    </div>
  );
}

