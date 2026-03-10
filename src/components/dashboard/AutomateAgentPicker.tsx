import { ChevronLeft } from "lucide-react";
import { TACIT_AGENTS, type TacitAgent } from "@/data/agents";
import { AgentAvatar } from "./AgentAvatar";

interface AutomateAgentPickerProps {
  onSelectAgent: (agent: TacitAgent) => void;
  onBack: () => void;
}

export function AutomateAgentPicker({ onSelectAgent, onBack }: AutomateAgentPickerProps) {
  return (
    <>
      <div className="mb-8 flex flex-wrap items-center gap-2 text-[0.88rem] text-muted-foreground">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 transition-colors hover:text-primary"
        >
          <ChevronLeft className="w-4 h-4" />
          Home
        </button>
        <span className="text-primary/40">|</span>
        <span className="text-primary font-semibold">Automate Knowledge Assets</span>
      </div>

      <div className="mb-12 rounded-2xl border border-primary/25 bg-card/55 p-8 md:p-10">
        <div className="mb-3 inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.13em] text-primary">
          Step 1 of 3
        </div>
        <h1 className="mb-2 text-[2rem] font-extrabold text-foreground md:text-[2.4rem]">Choose an agent</h1>
        <p className="max-w-[760px] text-[1rem] leading-relaxed text-muted-foreground">
          Select the agent whose past sessions you want to automate. You’ll see their sessions next.
        </p>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-5">
        {TACIT_AGENTS.map((agent) => (
          <button
            key={agent.id}
            type="button"
            onClick={() => onSelectAgent(agent)}
            className="group flex h-full flex-col items-start gap-3 rounded-2xl border border-primary/30 bg-card/55 p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-elegant"
          >
            <AgentAvatar agent={agent} size="lg" />
            <div className="space-y-1">
              <div className="text-[1.12rem] font-bold tracking-tight text-foreground">{agent.name}</div>
              <div className="text-[0.83rem] leading-relaxed text-muted-foreground">{agent.tagline}</div>
            </div>
            <span className="mt-auto rounded-full border border-primary/35 bg-primary/10 px-3 py-1 text-[0.73rem] font-semibold uppercase tracking-[0.1em] text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground">
              View sessions
            </span>
          </button>
        ))}
      </div>
    </>
  );
}
