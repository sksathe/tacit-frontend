import { MANU_PROCESSING_STAGES } from "@/data/manuSections";
import { getManuRunStatus, isLocalManuRunId, pollManuRunUntilReady } from "@/lib/manuApi";
import { simulateManuRun } from "@/lib/manuSimulator";
import { MANU_MISSIONS } from "@/data/manuMissions";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { ManuManualConfig, ManuMode, ManuRun, ManuUploadedDocument } from "@/types/manu";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ManuProcessingStepProps {
  runId?: string | null;
  isLocalRun?: boolean;
  usedSimulationFallback?: boolean;
  simulationParams?: {
    missionId: string;
    mode: ManuMode;
    documents: ManuUploadedDocument[];
    manualConfig: ManuManualConfig;
  };
  onComplete: (run: ManuRun) => void;
  onFallbackComplete?: () => void;
  onUseSimulationFallback?: () => void;
}

export function ManuProcessingStep({
  runId,
  isLocalRun,
  usedSimulationFallback,
  simulationParams,
  onComplete,
  onFallbackComplete,
  onUseSimulationFallback,
}: ManuProcessingStepProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const startedRef = useRef(false);

  // Simulated path (offline fallback or pre-built run)
  useEffect(() => {
    if (runId || !usedSimulationFallback || !simulationParams) return;

    if (activeIndex >= MANU_PROCESSING_STAGES.length) {
      const mission = MANU_MISSIONS.find((m) => m.id === simulationParams.missionId);
      if (!mission) return;
      const simulated = simulateManuRun({
        mission,
        mode: simulationParams.mode,
        documents: simulationParams.documents,
        manualConfig: simulationParams.manualConfig,
      });
      const t = setTimeout(() => {
        onComplete(simulated);
        onFallbackComplete?.();
      }, 400);
      return () => clearTimeout(t);
    }

    const t = setTimeout(() => setActiveIndex((i) => i + 1), 900);
    return () => clearTimeout(t);
  }, [activeIndex, runId, usedSimulationFallback, simulationParams, onComplete, onFallbackComplete]);

  // Backend polling path
  useEffect(() => {
    if (!runId || startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;

    (async () => {
      try {
        const run = await pollManuRunUntilReady(runId, {
          intervalMs: 1500,
          onStatus: (status) => {
            if (cancelled) return;
            if (status.status === "ready") {
              setActiveIndex(MANU_PROCESSING_STAGES.length);
              setProgress(100);
              return;
            }
            if (status.status === "failed") {
              setError(status.error || "MANU pipeline failed");
            }
            const visualIndex =
              status.status === "processing"
                ? Math.min(status.stageIndex, MANU_PROCESSING_STAGES.length - 1)
                : Math.min(status.stageIndex + 1, MANU_PROCESSING_STAGES.length);
            setActiveIndex(visualIndex);
            setProgress(status.progress);
          },
        });
        if (!cancelled) onComplete(run);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Processing failed";
        setError(message);
        try {
          const status = await getManuRunStatus(runId);
          setActiveIndex(Math.min(status.stageIndex + 1, MANU_PROCESSING_STAGES.length));
          setProgress(status.progress);
        } catch {
          /* ignore */
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [runId, onComplete]);

  const localRun = Boolean(runId && (isLocalRun ?? isLocalManuRunId(runId)));

  const displayProgress =
    runId && !usedSimulationFallback
      ? progress
      : Math.min(100, (activeIndex / MANU_PROCESSING_STAGES.length) * 100);

  const pipelineLabel = localRun
    ? "Local dev — run stored in browser; OpenAI generation uses tacit-backend on port 3001"
    : runId && !usedSimulationFallback
      ? "Enterprise documentation pipeline — powered by backend LLM"
      : "Offline simulation — backend unavailable or not configured";

  const errorHint =
    error && /failed to fetch|network|fetch failed/i.test(error)
      ? "Start the API server: cd tacit-backend && npm run dev (should listen on http://localhost:3001)"
      : null;

  return (
    <div className="mx-auto max-w-xl space-y-8 py-12 text-center">
      <div>
        <h2 className="text-2xl font-bold">MANU is processing your document bundle</h2>
        <p className="mt-2 text-muted-foreground">{pipelineLabel}</p>
      </div>
      <Progress value={displayProgress} className="h-2" />
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
      {error && (
        <div className="space-y-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-left text-sm text-destructive">
          <p>{error}</p>
          {errorHint && <p className="text-destructive/90">{errorHint}</p>}
          {onUseSimulationFallback && (
            <Button type="button" variant="outline" size="sm" onClick={onUseSimulationFallback}>
              Use offline simulation
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
