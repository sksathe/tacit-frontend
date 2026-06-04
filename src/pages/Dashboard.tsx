import { useReducer, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { MissionBriefV4 } from "@/components/dashboard/MissionBriefV4";
import {
  dispatchReducer,
  initialDispatchState,
  loadRecentLaunches,
  type MissionLaunchRecord,
} from "@/features/dispatch/model";
import { AutomateAgentPicker } from "@/components/dashboard/AutomateAgentPicker";
import { AutomateSessionsList } from "@/components/dashboard/AutomateSessionsList";
import { SessionDetailView } from "@/components/dashboard/SessionDetailView";
import { StartSessionModal } from "@/components/dashboard/StartSessionModal";
import { ScheduleSessionModal } from "@/components/dashboard/ScheduleSessionModal";
import { ConfigDrawer } from "@/components/dashboard/ConfigDrawer";
import { ChooseMeetingTypeModal } from "@/components/dashboard/ChooseMeetingTypeModal";
import type { SessionModalPrefill } from "@/components/dashboard/sessionModalPrefill";
import type { TacitAgent } from "@/data/agents";
import type { SessionItem } from "@/components/dashboard/AutomateSessionsList";

const hybridDispatchEnabled = import.meta.env.VITE_ENABLE_HYBRID_DISPATCH !== "false";

const Dashboard = () => {
  const [dispatchState, dispatchMission] = useReducer(dispatchReducer, initialDispatchState);
  const [recentLaunches, setRecentLaunches] = useState<MissionLaunchRecord[]>(() => loadRecentLaunches());
  const [activeRecentId, setActiveRecentId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<"dashboard" | "automate-agents" | "automate-sessions" | "session">("dashboard");
  const [selectedAgent, setSelectedAgent] = useState<TacitAgent | null>(null);
  const [sessionsForAgent, setSessionsForAgent] = useState<SessionItem[]>([]);
  const [selectedSession, setSelectedSession] = useState<{
    agentName: string;
    sessionName: string;
    sessionId: string;
  } | null>(null);
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isConfigDrawerOpen, setIsConfigDrawerOpen] = useState(false);
  const [currentAutomation, setCurrentAutomation] = useState<{
    type: string;
    title: string;
    icon: string;
    sessionId?: string | null;
  } | null>(null);

  const [meetingTypeFlow, setMeetingTypeFlow] = useState<"start" | "schedule" | null>(null);
  const [sessionModalPrefs, setSessionModalPrefs] = useState<SessionModalPrefill | null>(null);

  const handleMeetingChannelContinue = (channel: "phone" | "virtual") => {
    const flow = meetingTypeFlow;
    const mode = channel === "virtual" ? "web" : "phone";
    const fromMission = hybridDispatchEnabled && !!dispatchState.agentId;
    setSessionModalPrefs({
      initialMeetingMode: mode,
      ...(fromMission
        ? {
            initialSessionTitle: dispatchState.missionTitle?.trim() || undefined,
            initialAgentId: dispatchState.agentId!,
            initialSessionNotes: dispatchState.missionBrief?.trim() || undefined,
          }
        : {}),
    });
    setMeetingTypeFlow(null);
    if (flow === "start") setIsStartModalOpen(true);
    else if (flow === "schedule") setIsScheduleModalOpen(true);
  };

  const openAutomateFlow = () => {
    setCurrentView("automate-agents");
    setSelectedAgent(null);
    setSessionsForAgent([]);
    setSelectedSession(null);
  };

  const openAgentSessions = (agent: TacitAgent) => {
    setSelectedAgent(agent);
    setCurrentView("automate-sessions");
  };

  const openSessionDetail = (session: SessionItem) => {
    setSelectedSession({
      agentName: session.agentName,
      sessionName: session.sessionName,
      sessionId: session.sessionId,
    });
    setCurrentView("session");
  };

  const backToDashboard = () => {
    setCurrentView("dashboard");
    setSelectedAgent(null);
    setSessionsForAgent([]);
    setSelectedSession(null);
  };

  const backToAgents = () => {
    setCurrentView("automate-agents");
    setSelectedAgent(null);
    setSessionsForAgent([]);
  };

  const backToSessionsList = () => {
    setCurrentView("automate-sessions");
  };

  const openConfigDrawer = (type: string, title: string, icon: string) => {
    setCurrentAutomation({ type, title, icon, sessionId: selectedSession?.sessionId ?? null });
    setIsConfigDrawerOpen(true);
  };

  const closeConfigDrawer = () => {
    setIsConfigDrawerOpen(false);
    setCurrentAutomation(null);
  };

  const missionBriefActive = currentView === "dashboard" && hybridDispatchEnabled;

  return (
    <div
      className={`relative isolate flex flex-col bg-dashboard-canvas text-foreground dark:bg-dashboard-canvas ${
        missionBriefActive
          ? "dashboard--mission-studio h-dvh max-h-dvh min-h-0 overflow-hidden"
          : "min-h-screen min-h-dvh overflow-x-hidden"
      }`}
    >
      <div
        className={`pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,hsl(var(--dashboard-surface-muted)),hsl(var(--dashboard-canvas))_40%)] dark:bg-[radial-gradient(120%_80%_at_50%_0%,hsl(var(--dashboard-surface-muted)),hsl(var(--dashboard-canvas))_60%)] ${missionBriefActive ? "opacity-0" : ""}`}
        aria-hidden="true"
      />
      <DashboardHeader />

      {/* Main Content — min-h-0 + flex-1 so Mission Brief can own internal scroll without a second page scrollbar */}
      <main
        className={
          missionBriefActive
            ? "flex min-h-0 w-full max-w-none flex-1 flex-col overflow-hidden px-0 py-0"
            : "flex min-h-0 w-full max-w-none flex-1 flex-col px-3 pb-10 pt-7 sm:px-5 sm:pt-9 lg:px-6"
        }
      >
        {currentView === "dashboard" && hybridDispatchEnabled && (
          <MissionBriefV4
            dispatchState={dispatchState}
            dispatchAction={dispatchMission}
            recentLaunches={recentLaunches}
            setRecentLaunches={setRecentLaunches}
            activeRecentId={activeRecentId}
            setActiveRecentId={setActiveRecentId}
            onOpenMeetingFlow={(flow) => setMeetingTypeFlow(flow)}
          />
        )}
        {currentView === "dashboard" && !hybridDispatchEnabled && (
          <DashboardView
            onStartSession={() => setMeetingTypeFlow("start")}
            onScheduleSession={() => setMeetingTypeFlow("schedule")}
            onAutomateSessions={openAutomateFlow}
          />
        )}
        {currentView === "automate-agents" && (
          <AutomateAgentPicker onSelectAgent={openAgentSessions} onBack={backToDashboard} />
        )}
        {currentView === "automate-sessions" && selectedAgent && (
          <AutomateSessionsList
            agent={selectedAgent}
            onSelectSession={(session) => {
              openSessionDetail(session);
            }}
            onSessionsLoaded={setSessionsForAgent}
            onBack={backToAgents}
          />
        )}
        {currentView === "session" && selectedSession && (
          <SessionDetailView
            session={selectedSession}
            sessions={sessionsForAgent}
            onSessionChange={(s) =>
              setSelectedSession({ agentName: s.agentName, sessionName: s.sessionName, sessionId: s.sessionId })
            }
            onBack={backToDashboard}
            onBackToSessions={sessionsForAgent.length > 0 ? backToSessionsList : undefined}
            onOpenConfigDrawer={openConfigDrawer}
          />
        )}
      </main>

      {/* Meeting type chooser + modals */}
      <ChooseMeetingTypeModal
        open={meetingTypeFlow !== null}
        flow={meetingTypeFlow}
        onClose={() => setMeetingTypeFlow(null)}
        onContinue={handleMeetingChannelContinue}
      />

      <StartSessionModal
        open={isStartModalOpen}
        prefill={sessionModalPrefs}
        onClose={() => {
          setIsStartModalOpen(false);
          setSessionModalPrefs(null);
        }}
      />
      <ScheduleSessionModal
        open={isScheduleModalOpen}
        prefill={sessionModalPrefs}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setSessionModalPrefs(null);
        }}
      />

      {/* Configuration Drawer */}
      <ConfigDrawer
        open={isConfigDrawerOpen}
        onClose={closeConfigDrawer}
        automation={currentAutomation}
      />
    </div>
  );
};

export default Dashboard;




