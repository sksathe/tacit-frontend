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
import type { ManuFlowStep } from "@/types/manu";

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
    traceabilityOpen,
    setTraceabilityOpen,
    handleLaunch,
    resetFlow,
    goBack,
    handleMissionSelect,
    handleBundleMetadata,
  } = flow;

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
          documents={documents}
          onDocumentsChange={setDocuments}
          onMetadataFromBundle={handleBundleMetadata}
          onContinue={() => setStep("config")}
          onBack={goBack}
        />
      )}

      {step === "config" && (
        <ManuConfigStep
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
        />
      )}

      {step === "processing" && <ManuProcessingStep onComplete={() => setStep("workspace")} />}

      {step === "workspace" && run && (
        <ManuApprovalWorkspace
          run={run}
          onRunChange={setRun}
          traceabilityOpen={traceabilityOpen}
          onTraceabilityOpenChange={setTraceabilityOpen}
          onContinueToTranslation={() => setStep("translation")}
        />
      )}

      {step === "translation" && run && (
        <ManuTranslationStep run={run} onContinue={() => setStep("export")} onBack={() => setStep("workspace")} />
      )}

      {step === "export" && run && (
        <ManuExportStep run={run} onRunChange={setRun} onRestart={resetFlow} />
      )}
    </>
  );
}
