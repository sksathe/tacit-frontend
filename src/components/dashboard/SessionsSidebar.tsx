import { useState } from "react";
import { X } from "lucide-react";
import { TACIT_AGENTS } from "@/data/agents";
import { AgentAvatar } from "./AgentAvatar";

interface SessionsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionClick: (agentName: string, sessionName: string, sessionId: string) => void;
}

const MOCK_SESSIONS: Record<string, { sessionName: string; sessionId: string }[]> = {
  rachael: [
    { sessionName: "Finance Review", sessionId: "SID-rachael-2024-001" },
    { sessionName: "Budget Planning", sessionId: "SID-rachael-2024-002" },
    { sessionName: "Q4 Forecast", sessionId: "SID-rachael-2024-003" },
  ],
  ross: [
    { sessionName: "Compliance Review", sessionId: "SID-ross-2024-001" },
    { sessionName: "Policy Update", sessionId: "SID-ross-2024-002" },
    { sessionName: "Audit Prep", sessionId: "SID-ross-2024-003" },
  ],
  monica: [
    { sessionName: "Operations Runbook", sessionId: "SID-monica-2024-001" },
    { sessionName: "Process Documentation", sessionId: "SID-monica-2024-002" },
  ],
  chandler: [
    { sessionName: "Data Analysis", sessionId: "SID-chandler-2024-001" },
    { sessionName: "Metrics Review", sessionId: "SID-chandler-2024-002" },
    { sessionName: "Dashboard Design", sessionId: "SID-chandler-2024-003" },
  ],
  eagle: [
    { sessionName: "Inbound BOL batch — LAX", sessionId: "SID-eagle-2024-001" },
    { sessionName: "Customs doc pack — ORD", sessionId: "SID-eagle-2024-002" },
    { sessionName: "POD reconciliation — DFW", sessionId: "SID-eagle-2024-003" },
  ],
};

export function SessionsSidebar({ isOpen, onClose, onSessionClick }: SessionsSidebarProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    rachael: false,
    ross: false,
    monica: false,
    chandler: false,
    allAutomations: false,
    drafts: false,
  });

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  return (
    <div
      className={`fixed left-0 top-0 z-[999] h-screen w-[300px] transform overflow-y-auto border-r border-primary/25 bg-background/96 pb-8 pt-20 backdrop-blur-md transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <button
        onClick={onClose}
        className="absolute right-5 top-5 z-[1000] flex h-[44px] w-[44px] cursor-pointer items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary transition-all hover:border-primary hover:bg-primary/20 hover:shadow-glow"
      >
        <X className="w-6 h-6 stroke-primary stroke-[2]" />
      </button>

      <div className="mb-8">
        <div className="mb-4 px-6 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-primary/70">
          Past Sessions
        </div>

        {TACIT_AGENTS.map((agent) => {
          const sessions = MOCK_SESSIONS[agent.id] ?? [];
          const expanded = expandedGroups[agent.id];
          return (
            <div key={agent.id} className="mb-2">
              <div
                onClick={() => toggleGroup(agent.id)}
                className={`flex cursor-pointer items-center gap-3 border-l-[3px] px-6 py-3.5 text-foreground transition-all ${
                  expanded
                    ? "border-l-primary/50 bg-primary/10 text-primary"
                    : "border-l-transparent hover:border-l-primary/50 hover:bg-primary/8"
                }`}
              >
                <AgentAvatar agent={agent} size="sm" />
                <span className="flex-1 font-semibold text-[0.95rem]">{agent.name}</span>
                <span className={`text-[0.75rem] transition-transform duration-300 ${expanded ? "rotate-90" : ""}`}>▶</span>
              </div>
              {expanded && (
                <div className="flex flex-col bg-background/20">
                  {sessions.map((s) => (
                    <div
                      key={s.sessionId}
                      onClick={() => onSessionClick(agent.name, s.sessionName, s.sessionId)}
                      className="flex items-center gap-3 px-6 py-3 pl-12 text-muted-foreground cursor-pointer transition-all border-l-[3px] border-l-transparent hover:bg-primary/8 hover:text-foreground hover:border-l-primary/50 text-[0.9rem]"
                    >
                      {s.sessionName}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mb-8">
        <div className="mb-4 px-6 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-primary/70">
          Automations
        </div>

        <div className="mb-2">
          <div
            onClick={() => toggleGroup("allAutomations")}
            className={`flex cursor-pointer items-center gap-3 border-l-[3px] px-6 py-3.5 transition-all ${
              expandedGroups.allAutomations
                ? "border-l-primary/50 bg-primary/10 text-primary"
                : "border-l-transparent text-foreground hover:border-l-primary/50 hover:bg-primary/10"
            }`}
          >
            <span className="text-[1.2rem] w-6 flex items-center justify-center">⚡</span>
            <span className="flex-1 font-semibold text-[0.95rem]">All Automations</span>
            <span className={`text-[0.75rem] transition-transform duration-300 ${expandedGroups.allAutomations ? "rotate-90" : ""}`}>▶</span>
          </div>
          {expandedGroups.allAutomations && (
            <div className="flex flex-col bg-black/20">
              <div className="flex items-center gap-3 px-6 py-3 pl-12 text-muted-foreground cursor-pointer transition-all border-l-[3px] border-l-transparent hover:bg-primary-dashboard/10 hover:text-foreground hover:border-l-primary-dashboard/50 text-[0.9rem]">
                Workflow 1
              </div>
              <div className="flex items-center gap-3 px-6 py-3 pl-12 text-muted-foreground cursor-pointer transition-all border-l-[3px] border-l-transparent hover:bg-primary-dashboard/10 hover:text-foreground hover:border-l-primary-dashboard/50 text-[0.9rem]">
                Workflow 2
              </div>
              <div className="flex items-center gap-3 px-6 py-3 pl-12 text-muted-foreground cursor-pointer transition-all border-l-[3px] border-l-transparent hover:bg-primary-dashboard/10 hover:text-foreground hover:border-l-primary-dashboard/50 text-[0.9rem]">
                Workflow 3
              </div>
            </div>
          )}
        </div>

        <div className="mb-2">
          <div
            onClick={() => toggleGroup("drafts")}
            className={`flex cursor-pointer items-center gap-3 border-l-[3px] px-6 py-3.5 transition-all ${
              expandedGroups.drafts
                ? "border-l-primary/50 bg-primary/10 text-primary"
                : "border-l-transparent text-foreground hover:border-l-primary/50 hover:bg-primary/10"
            }`}
          >
            <span className="text-[1.2rem] w-6 flex items-center justify-center">📝</span>
            <span className="flex-1 font-semibold text-[0.95rem]">Drafts</span>
            <span className={`text-[0.75rem] transition-transform duration-300 ${expandedGroups.drafts ? "rotate-90" : ""}`}>▶</span>
          </div>
          {expandedGroups.drafts && (
            <div className="flex flex-col bg-black/20">
              <div className="flex items-center gap-3 px-6 py-3 pl-12 text-muted-foreground cursor-pointer transition-all border-l-[3px] border-l-transparent hover:bg-primary-dashboard/10 hover:text-foreground hover:border-l-primary-dashboard/50 text-[0.9rem]">
                Draft Automation 1
              </div>
              <div className="flex items-center gap-3 px-6 py-3 pl-12 text-muted-foreground cursor-pointer transition-all border-l-[3px] border-l-transparent hover:bg-primary-dashboard/10 hover:text-foreground hover:border-l-primary-dashboard/50 text-[0.9rem]">
                Draft Automation 2
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
