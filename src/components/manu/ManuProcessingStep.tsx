import { MANU_PROCESSING_STAGES } from "@/data/manuSections";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface ManuProcessingStepProps {
  onComplete: () => void;
}

export function ManuProcessingStep({ onComplete }: ManuProcessingStepProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (activeIndex >= MANU_PROCESSING_STAGES.length) {
      const t = setTimeout(onComplete, 600);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setActiveIndex((i) => i + 1), 900);
    return () => clearTimeout(t);
  }, [activeIndex, onComplete]);

  const progress = Math.min(100, (activeIndex / MANU_PROCESSING_STAGES.length) * 100);

  return (
    <div className="mx-auto max-w-xl space-y-8 py-12 text-center">
      <div>
        <h2 className="text-2xl font-bold">MANU is processing your document bundle</h2>
        <p className="mt-2 text-muted-foreground">Enterprise documentation pipeline — simulated for POC demo</p>
      </div>
      <Progress value={progress} className="h-2" />
      <ul className="space-y-3 text-left">
        {MANU_PROCESSING_STAGES.map((stage, idx) => {
          const done = idx < activeIndex;
          const active = idx === activeIndex;
          return (
            <li
              key={stage}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm ${active ? "border-primary/50 bg-primary/10" : done ? "border-border/40 opacity-80" : "border-transparent opacity-40"}`}
            >
              {done ? (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              ) : active ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : (
                <span className="h-5 w-5 rounded-full border border-muted" />
              )}
              {stage}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
