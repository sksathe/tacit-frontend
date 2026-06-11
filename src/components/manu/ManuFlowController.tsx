import { ManuApprovalWorkspace } from "@/components/manu/ManuApprovalWorkspace";
import { ManuConfigStep } from "@/components/manu/ManuConfigStep";
import { ManuDocumentBundleStep } from "@/components/manu/ManuDocumentBundleStep";
import { ManuExportStep } from "@/components/manu/ManuExportStep";
import { ManuMissionStep } from "@/components/manu/ManuMissionStep";
import { ManuModeStep } from "@/components/manu/ManuModeStep";
import { ManuProcessingStep } from "@/components/manu/ManuProcessingStep";
import { ManuReviewStep } from "@/components/manu/ManuReviewStep";
import { ManuStepNav } from "@/components/manu/ManuStepNav";
import { ManuTranslationStep } from "@/components/manu/ManuTranslationStep";
import type { ManuFlowApi } from "@/components/manu/useManuFlow";
import { MANU_MISSION_IDS } from "@/data/manuLabcorp";
import { needsTranslationQA } from "@/lib/manuTranslationUtils";
import type { ManuFlowStep } from "@/types/manu";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useRef } from "react";

export type ManuFlowControllerProps = {
  flow: ManuFlowApi;
  /** Hide step nav on processing */
  showStepNav?: boolean;
};

const NAV_STEPS: ManuFlowStep[] = [
  "mode",
  "mission",
  "documents",
  "config",
  "review",
  "processing",
  "workspace",
  "translation",
  "export",
];

export function ManuFlowController({ flow, showStepNav = true }: ManuFlowControllerProps) {
  const { toast } = useToast();
  const warnedFallbackRef = useRef(false);

  const {
    entry,
    step,
    setStep,
    mode,
    setMode,
    missionId,
    documents,
    setDocuments,
    manualConfig,
    setManualConfig,
    run,
    setRun,
    runId,
    runStorage,
    isLocalRun,
    isLaunching,
    usedSimulationFallback,
    launchError,
    traceabilityOpen,
    setTraceabilityOpen,
    handleLaunch,
    handleProcessingComplete,
    completeWithSimulation,
    resetFlow,
    goBack,
    handleMissionSelect,
    handleBundleMetadata,
    fallbackToSimulation,
  } = flow;

  useEffect(() => {
    if (usedSimulationFallback && launchError && !warnedFallbackRef.current) {
      warnedFallbackRef.current = true;
      toast({
        title: "Using offline simulation",
        description: launchError,
        variant: "destructive",
      });
      return;
    }
    if (runStorage === "local" && !warnedFallbackRef.current) {
      warnedFallbackRef.current = true;
      toast({
        title: "Using localStorage for MANU runs",
        description:
          "Supabase manu_runs table is unavailable. Runs are stored transiently in your browser until migrations are applied.",
      });
      return;
    }
    if (!usedSimulationFallback && runStorage !== "local") {
      warnedFallbackRef.current = false;
    }
  }, [usedSimulationFallback, runStorage, launchError, toast]);

  const showNav =
    showStepNav &&
    step !== "processing" &&
    step !== "landing" &&
    (entry === "full" || NAV_STEPS.includes(step));

  return (
    <>
      {showNav && <ManuStepNav current={step} />}

      {entry === "full" && step === "mode" && (
        <ManuModeStep
          onSelect={(m) => {
            setMode(m);
            setStep("mission");
          }}
        />
      )}

      {entry === "full" && step === "mission" && (
        <ManuMissionStep
          selectedMissionId={missionId}
          onSelect={handleMissionSelect}
          onContinue={() => setStep("documents")}
        />
      )}

      {step === "documents" && missionId && (
        <ManuDocumentBundleStep
          missionId={missionId}
          documents={documents}
          onDocumentsChange={setDocuments}
          onMetadataFromBundle={handleBundleMetadata}
          onContinue={() => setStep("config")}
          onBack={goBack}
        />
      )}

      {step === "config" && missionId && (
        <ManuConfigStep
          missionId={missionId}
          metadata={manualConfig.metadata}
          selectedSectionIds={manualConfig.selectedSectionIds}
          onMetadataChange={(metadata) => setManualConfig((c) => ({ ...c, metadata }))}
          onSectionsChange={(selectedSectionIds) => setManualConfig((c) => ({ ...c, selectedSectionIds }))}
          onContinue={() => setStep("review")}
          onBack={goBack}
        />
      )}

      {step === "review" && missionId && (
        <ManuReviewStep
          missionId={missionId}
          documents={documents}
          manualConfig={manualConfig}
          onLaunch={handleLaunch}
          onBack={goBack}
          isLaunching={isLaunching}
          launchError={launchError}
          onUseOfflineSimulation={() => {
            fallbackToSimulation();
            setStep("processing");
          }}
        />
      )}

      {step === "processing" && missionId && (
        <ManuProcessingStep
          runId={runId}
          isLocalRun={isLocalRun}
          usedSimulationFallback={usedSimulationFallback}
          simulationParams={
            usedSimulationFallback
              ? { missionId, mode, documents, manualConfig }
              : undefined
          }
          onComplete={handleProcessingComplete}
          onUseSimulationFallback={runId ? completeWithSimulation : undefined}
        />
      )}

      {step === "workspace" && run && (
        <ManuApprovalWorkspace
          run={run}
          onRunChange={setRun}
          traceabilityOpen={traceabilityOpen}
          onTraceabilityOpenChange={setTraceabilityOpen}
          onContinueToTranslation={() => {
            const skipTranslation =
              run.missionId === MANU_MISSION_IDS.riskCoverageQa ||
              run.missionId === MANU_MISSION_IDS.regulatoryQa ||
              !needsTranslationQA(run);
            setStep(skipTranslation ? "export" : "translation");
          }}
        />
      )}

      {step === "translation" && run && (
        <ManuTranslationStep
          run={run}
          onRunChange={setRun}
          onContinue={() => setStep("export")}
          onBack={() => setStep("workspace")}
        />
      )}

      {step === "export" && run && (
        <ManuExportStep run={run} onRunChange={setRun} onRestart={resetFlow} />
      )}
    </>
  );
}
