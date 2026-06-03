import { ManuApprovalWorkspace } from "@/components/manu/ManuApprovalWorkspace";
import { ManuConfigStep } from "@/components/manu/ManuConfigStep";
import { ManuDocumentBundleStep } from "@/components/manu/ManuDocumentBundleStep";
import { ManuExportStep } from "@/components/manu/ManuExportStep";
import { ManuLandingStep, prepareWorkspaceRun, type ManuWorkspaceEntry } from "@/components/manu/ManuLandingStep";
import { ManuMissionStep } from "@/components/manu/ManuMissionStep";
import { ManuModeStep } from "@/components/manu/ManuModeStep";
import { ManuProcessingStep } from "@/components/manu/ManuProcessingStep";
import { ManuReviewStep } from "@/components/manu/ManuReviewStep";
import { ManuStepNav } from "@/components/manu/ManuStepNav";
import { ManuTranslationStep } from "@/components/manu/ManuTranslationStep";
import { ManuWorkflowShell } from "@/components/manu/ManuWorkflowShell";
import { getDefaultSectionsForMission } from "@/data/manuLabcorp";
import { MANU_MISSION_IDS } from "@/data/manuLabcorp";
import { MANU_MISSIONS } from "@/data/manuMissions";
import { MANU_DEFAULT_SECTIONS } from "@/data/manuSections";
import { simulateManuRun } from "@/lib/manuSimulator";
import type { ManuFlowStep, ManuManualConfig, ManuMode, ManuRun, ManuUploadedDocument } from "@/types/manu";
import { useMemo, useState } from "react";
import { useToast } from "@/components/ui/use-toast";

const defaultMetadata = (): ManuManualConfig["metadata"] => ({
  productName: "",
  modelCode: "",
  manualType: "Equipment / Product Manual (IFU)",
  targetMarkets: ["USA", "EU", "Canada"],
  targetLanguages: ["es", "fr", "de"],
  intendedAudience: "Trained laboratory personnel",
  templateType: "LabCorp Equipment Manual Template v2.0",
  revision: "1.0",
  approverRole: "Documentation Quality Lead",
});

const defaultSectionIds = () => MANU_DEFAULT_SECTIONS.map((s) => s.id);

export default function ManuPOC() {
  const { toast } = useToast();
  const [step, setStep] = useState<ManuFlowStep>("landing");
  const [mode, setMode] = useState<ManuMode>("execute");
  const [missionId, setMissionId] = useState<string | null>(MANU_MISSION_IDS.productManualGen);
  const [documents, setDocuments] = useState<ManuUploadedDocument[]>([]);
  const [manualConfig, setManualConfig] = useState<ManuManualConfig>({
    selectedSectionIds: defaultSectionIds(),
    metadata: defaultMetadata(),
  });
  const [run, setRun] = useState<ManuRun | null>(null);
  const [traceabilityOpen, setTraceabilityOpen] = useState(false);
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);

  const stepLabel = useMemo(() => {
    const labels: Record<ManuFlowStep, string> = {
      landing: "LabCorp MANU Studio",
      mode: "Select mode",
      mission: "Select mission",
      documents: "Source document bundle",
      config: "Configure manual",
      review: "Review & launch",
      processing: "Processing",
      workspace: "Approval workspace",
      translation: "Translation QA",
      export: "Export package",
    };
    return labels[step];
  }, [step]);

  const handleLaunch = () => {
    const mission = MANU_MISSIONS.find((m) => m.id === missionId);
    if (!mission) return;
    const simulated = simulateManuRun({ mission, mode, documents, manualConfig });
    setRun(simulated);
    setStep("processing");
  };

  const resetFlow = () => {
    setStep("landing");
    setMode("execute");
    setMissionId(MANU_MISSION_IDS.productManualGen);
    setDocuments([]);
    setManualConfig({ selectedSectionIds: defaultSectionIds(), metadata: defaultMetadata() });
    setRun(null);
    setTraceabilityOpen(false);
  };

  const goBack = () => {
    const order: ManuFlowStep[] = ["mode", "mission", "documents", "config", "review"];
    const idx = order.indexOf(step);
    if (idx > 0) setStep(order[idx - 1]);
    else if (step === "mode") setStep("landing");
  };

  const handleMissionSelect = (id: string) => {
    setMissionId(id);
    setManualConfig((c) => ({
      ...c,
      selectedSectionIds: getDefaultSectionsForMission(id, c.selectedSectionIds),
    }));
  };

  const handleOpenWorkspace = async (entry: ManuWorkspaceEntry) => {
    if (entry.type === "flow") {
      setStep("mode");
      return;
    }
    setLoadingWorkspace(true);
    try {
      const { run: prepared, documents: docs, manualConfig: config, mode: m } = await prepareWorkspaceRun({
        missionId: entry.missionId,
        bundleKey: entry.bundleKey,
        preApprove: entry.preApprove,
      });
      setMissionId(entry.missionId);
      setDocuments(docs);
      setManualConfig(config);
      setMode(m);
      setRun(prepared);
      if (entry.jumpToTranslation) {
        setStep("translation");
        toast({ title: "Translation QA workspace", description: "English sections pre-approved per LabCorp demo." });
      } else {
        setStep("workspace");
      }
    } catch (e) {
      toast({
        title: "Could not load sample bundle",
        description: "Ensure labcorp sample files are copied to public/labcorp-samples/tacit_data.",
        variant: "destructive",
      });
    } finally {
      setLoadingWorkspace(false);
    }
  };

  const handleBundleMetadata = (meta: Partial<ManuManualConfig["metadata"]>) => {
    setManualConfig((c) => ({ ...c, metadata: { ...c.metadata, ...meta } }));
  };

  return (
    <ManuWorkflowShell
      stepLabel={stepLabel}
      onBack={
        step === "landing"
          ? undefined
          : step === "workspace" || step === "translation" || step === "export"
            ? () => setStep("landing")
            : goBack
      }
      showBackToHome={step === "landing"}
    >
      {step !== "processing" && step !== "landing" && <ManuStepNav current={step} />}

      {step === "landing" && (
        <ManuLandingStep onStartFlow={() => setStep("mode")} onOpenWorkspace={handleOpenWorkspace} />
      )}

      {loadingWorkspace && (
        <p className="py-20 text-center text-muted-foreground">Loading LabCorp sample bundle…</p>
      )}

      {!loadingWorkspace && step === "mode" && (
        <ManuModeStep
          onSelect={(m) => {
            setMode(m);
            setStep("mission");
          }}
        />
      )}

      {!loadingWorkspace && step === "mission" && (
        <ManuMissionStep
          selectedMissionId={missionId}
          onSelect={handleMissionSelect}
          onContinue={() => setStep("documents")}
        />
      )}

      {!loadingWorkspace && step === "documents" && (
        <ManuDocumentBundleStep
          documents={documents}
          onDocumentsChange={setDocuments}
          onMetadataFromBundle={handleBundleMetadata}
          onContinue={() => setStep("config")}
          onBack={goBack}
        />
      )}

      {!loadingWorkspace && step === "config" && (
        <ManuConfigStep
          metadata={manualConfig.metadata}
          selectedSectionIds={manualConfig.selectedSectionIds}
          onMetadataChange={(metadata) => setManualConfig((c) => ({ ...c, metadata }))}
          onSectionsChange={(selectedSectionIds) => setManualConfig((c) => ({ ...c, selectedSectionIds }))}
          onContinue={() => setStep("review")}
          onBack={goBack}
        />
      )}

      {!loadingWorkspace && step === "review" && missionId && (
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
    </ManuWorkflowShell>
  );
}
