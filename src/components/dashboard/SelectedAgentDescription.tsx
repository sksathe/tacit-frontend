import { X } from "lucide-react";
import type { TacitAgent } from "@/data/agents";
import { AgentAvatar } from "./AgentAvatar";

interface SelectedAgentDescriptionProps {
  agent: TacitAgent;
  onClear: () => void;
  /** Compact: just name + tagline (e.g. for small chips). Default false = full card. */
  compact?: boolean;
}

export function SelectedAgentDescription({ agent, onClear, compact }: SelectedAgentDescriptionProps) {
  if (compact) {
    return (
      <div className="mt-4 flex items-center gap-4 p-4 bg-primary/10 border border-primary/30 rounded-md">
        <div className="flex-shrink-0">
          <AgentAvatar agent={agent} size="sm" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-foreground font-semibold text-lg">{agent.name}</div>
          <div className="text-muted-foreground text-sm">{agent.tagline}</div>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
          aria-label="Clear selection"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 p-5 bg-card border-2 border-primary/30 rounded-xl text-left">
      {/* Header row: name + tagline + clear button */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <h3 className="text-xl font-bold text-foreground truncate">{agent.name}</h3>
          <p className="text-primary font-semibold text-sm">{agent.tagline}</p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
          aria-label="Clear selection"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content row: text on the left, large image on the right */}
      <div className="grid gap-6 md:grid-cols-[minmax(0,1.8fr)_minmax(0,1.2fr)] items-start">
        <div className="space-y-4 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Role:</span> {agent.role}
            </p>
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Persona:</span> {agent.persona}
            </p>
          </div>

          <div className="space-y-2">
            {agent.background && (
              <>
                <p className="font-medium text-foreground text-sm">Background:</p>
                <p className="text-muted-foreground text-sm leading-relaxed">{agent.background}</p>
              </>
            )}
            <p className="font-medium text-foreground text-sm mt-3">Description:</p>
            <p className="text-muted-foreground text-sm leading-relaxed">{agent.description}</p>
          </div>

          <div className="space-y-2">
            <p className="font-medium text-foreground text-sm">Specialties:</p>
            <ul className="text-muted-foreground text-sm list-none space-y-1 pl-0">
              {agent.specialties.map((s) => (
                <li key={s} className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {agent.image && (
          <div className="hidden md:block justify-self-end">
            <div className="w-44 h-44 rounded-3xl overflow-hidden border border-primary/40 bg-black/40 shadow-elegant">
              <img
                src={agent.image}
                alt={agent.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
