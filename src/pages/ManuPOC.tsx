import { ManuLandingStep, prepareWorkspaceRun, type ManuWorkspaceEntry } from "@/components/manu/ManuLandingStep";
import { ManuFlowController } from "@/components/manu/ManuFlowController";
import { ManuWorkflowShell } from "@/components/manu/ManuWorkflowShell";
import { useManuFlow } from "@/components/manu/useManuFlow";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";

export default function ManuPOC() {
  const { toast } = useToast();
  const flow = useManuFlow("full");
  const { step, setStep, stepLabel, setMissionId, setDocuments, setManualConfig, setMode, setRun } = flow;
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);

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
    } catch {
      toast({
        title: "Could not load sample bundle",
        description: "Ensure labcorp sample files are copied to public/labcorp-samples/tacit_data.",
        variant: "destructive",
      });
    } finally {
      setLoadingWorkspace(false);
    }
  };

  return (
    <ManuWorkflowShell
      stepLabel={stepLabel}
      onBack={
        step === "landing"
          ? undefined
          : step === "workspace" || step === "translation" || step === "export"
            ? () => setStep("landing")
            : flow.goBack
      }
      showBackToHome={step === "landing"}
    >
      {step === "landing" && (
        <ManuLandingStep onStartFlow={() => setStep("mode")} onOpenWorkspace={handleOpenWorkspace} />
      )}

      {loadingWorkspace && (
        <p className="py-20 text-center text-muted-foreground">Loading LabCorp sample bundle…</p>
      )}

      {!loadingWorkspace && step !== "landing" && <ManuFlowController flow={flow} />}
    </ManuWorkflowShell>
  );
}
