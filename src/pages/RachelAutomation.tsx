import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { SessionDetailView } from "@/components/dashboard/SessionDetailView";
import { AutomationConfigPanel } from "@/components/dashboard/AutomationConfigPanel";
import type { SessionItem } from "@/components/dashboard/AutomateSessionsList";

type AutomationParams = {
  agentId?: string;
  automationId?: string;
  sessionId?: string;
};

interface AutomationRouteState {
  session: {
    agentName: string;
    sessionName: string;
    sessionId: string;
  };
  sessionsForAgent?: SessionItem[];
}

export default function RachelAutomation() {
  const { agentId, automationId, sessionId } = useParams<AutomationParams>();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as AutomationRouteState | undefined;

  if (!agentId || !automationId || !sessionId) {
    return <Navigate to="/dashboard" replace />;
  }

  const sessionFromState = state?.session;

  if (!sessionFromState || sessionFromState.sessionId !== sessionId) {
    // If we don't have session context (e.g. direct URL visit), send user back to dashboard.
    return <Navigate to="/dashboard" replace />;
  }

  const sessionsForAgent = state.sessionsForAgent ?? [];

  const handleBack = () => {
    // Always go to dashboard home so we never send user back to login.
    navigate("/dashboard");
  };

  const automationLabel = automationId.replace(/-/g, " ");
  const automationMeta = {
    type: automationId,
    title: automationLabel
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" "),
    icon:
      automationId === "summary"
        ? "📄"
        : automationId === "clarity-scorer"
          ? "💎"
          : automationId === "soc2-document"
            ? "🛡️"
            : automationId === "compliance-gap-analysis"
              ? "📋"
          : automationId === "visual-concept-map" || automationId === "financial-concept-map"
            ? "📈"
            : "✅",
    sessionId,
  };

  return (
    <div className="relative isolate min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[-12rem] top-[-10rem] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.16),transparent_68%)]" />
        <div className="absolute right-[-10rem] top-[8rem] h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.12),transparent_70%)]" />
        <div className="absolute bottom-[-14rem] left-1/2 h-[30rem] w-[40rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.1),transparent_72%)]" />
      </div>

      <DashboardHeader />

      <main className="mx-auto max-w-[1700px] px-5 pb-20 pt-10 sm:px-8 sm:pt-14 lg:px-10">
        <div className="mb-5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="cursor-pointer border-none bg-transparent p-0 transition-colors hover:text-primary"
          >
            Home
          </button>
          <span className="text-primary/40">|</span>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="cursor-pointer border-none bg-transparent p-0 transition-colors hover:text-primary"
          >
            Sessions
          </button>
          <span className="text-primary/40">|</span>
          <span className="text-muted-foreground">Automate Past Session</span>
          <span className="text-primary/40">|</span>
          <span className="text-primary font-semibold">{sessionFromState.agentName}</span>
        </div>

        <section className="mb-6 flex flex-wrap items-center gap-4 rounded-lg border border-primary/20 bg-card/40 px-4 py-3">
          <span className="text-xs font-semibold text-foreground">{sessionFromState.sessionName}</span>
          {sessionsForAgent.length > 0 && (
            <select
              id="session-select-top"
              value={sessionFromState.sessionId}
              onChange={(e) => {
                const selected = sessionsForAgent.find((s) => s.sessionId === e.target.value);
                if (!selected) return;
                navigate(`/dashboard/${agentId}/${automationId}/${selected.sessionId}`, {
                  replace: true,
                  state: {
                    session: {
                      agentName: selected.agentName,
                      sessionName: selected.sessionName,
                      sessionId: selected.sessionId,
                    },
                    sessionsForAgent,
                  },
                });
              }}
              className="h-8 max-w-[340px] rounded-lg border border-primary/30 bg-background/70 px-3 text-xs text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {sessionsForAgent.map((s) => (
                <option key={s.sessionId} value={s.sessionId}>
                  {s.sessionName}
                  {s.startedAt ? ` · ${new Date(s.startedAt).toLocaleDateString()}` : ""}
                </option>
              ))}
            </select>
          )}
          <span className="rounded-full border border-primary/35 bg-primary/10 px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-[0.1em] text-primary">
            {sessionFromState.agentName}
          </span>
          <span className="rounded-full border border-primary/35 bg-primary/10 px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-[0.1em] text-primary">
            Transcript ready
          </span>
        </section>

        <div className="mb-6">
          <AutomationConfigPanel
            automation={automationMeta}
            agentName={sessionFromState.agentName}
            onSelectAutomation={(type) => {
              navigate(`/dashboard/${agentId}/${type}/${sessionFromState.sessionId}`, {
                replace: true,
                state: {
                  session: sessionFromState,
                  sessionsForAgent,
                },
              });
            }}
          />
        </div>

        <SessionDetailView
          session={sessionFromState}
          sessions={sessionsForAgent}
          onSessionChange={(s) =>
            navigate(`/dashboard/${agentId}/${automationId}/${s.sessionId}`, {
              replace: true,
              state: {
                session: {
                  agentName: s.agentName,
                  sessionName: s.sessionName,
                  sessionId: s.sessionId,
                },
                sessionsForAgent,
              },
            })
          }
          onBack={handleBack}
          onBackToSessions={sessionsForAgent.length > 0 ? handleBack : undefined}
          onOpenConfigDrawer={() => {}}
          initialAutomationId={automationId}
          hideBreadcrumb
          compactLayout
          hideSessionStrip
          hideCompactAutomationOptions
        />
      </main>
    </div>
  );
}
