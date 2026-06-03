import { cn } from "@/lib/utils";
import type { ManuFlowStep } from "@/types/manu";

const STEPS: { id: ManuFlowStep; label: string }[] = [
  { id: "landing", label: "Home" },
  { id: "mode", label: "Mode" },
  { id: "mission", label: "Mission" },
  { id: "documents", label: "Source Bundle" },
  { id: "config", label: "Configure" },
  { id: "review", label: "Review" },
  { id: "processing", label: "Execute" },
  { id: "workspace", label: "Approve" },
  { id: "translation", label: "Translation QA" },
  { id: "export", label: "Export" },
];

interface ManuStepNavProps {
  current: ManuFlowStep;
}

export function ManuStepNav({ current }: ManuStepNavProps) {
  const currentIndex = STEPS.findIndex((s) => s.id === current);

  return (
    <nav className="mb-8 flex flex-wrap gap-1 rounded-xl border border-border/60 bg-card/40 p-2">
      {STEPS.map((step, idx) => {
        const done = idx < currentIndex;
        const active = step.id === current;
        return (
          <div
            key={step.id}
            className={cn(
              "rounded-lg px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-wide transition-colors",
              active && "bg-primary/15 text-primary",
              done && !active && "text-muted-foreground",
              !done && !active && "text-muted-foreground/50",
            )}
          >
            {step.label}
          </div>
        );
      })}
    </nav>
  );
}
