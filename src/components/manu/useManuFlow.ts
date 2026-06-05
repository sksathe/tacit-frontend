import { getDefaultSectionsForMission } from "@/data/manuLabcorp";
import { MANU_MISSION_IDS } from "@/data/manuLabcorp";
import { MANU_MISSIONS } from "@/data/manuMissions";
import { MANU_DEFAULT_SECTIONS } from "@/data/manuSections";
import { simulateManuRun } from "@/lib/manuSimulator";
import type { ManuFlowStep, ManuManualConfig, ManuMode, ManuRun, ManuUploadedDocument } from "@/types/manu";
import { useCallback, useMemo, useState } from "react";

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

export type ManuFlowEntry = "full" | "embedded";

export function useManuFlow(entry: ManuFlowEntry = "full") {
  const initialStep: ManuFlowStep = entry === "embedded" ? "documents" : "landing";
  const [step, setStep] = useState<ManuFlowStep>(initialStep);
  const [mode, setMode] = useState<ManuMode>("execute");
  const [missionId, setMissionId] = useState<string | null>(
    entry === "embedded" ? null : MANU_MISSION_IDS.productManualGen,
  );
  const [documents, setDocuments] = useState<ManuUploadedDocument[]>([]);
  const [manualConfig, setManualConfig] = useState<ManuManualConfig>({
    selectedSectionIds: defaultSectionIds(),
    metadata: defaultMetadata(),
  });
  const [run, setRun] = useState<ManuRun | null>(null);
  const [traceabilityOpen, setTraceabilityOpen] = useState(false);

  const missionTitle = useMemo(() => {
    if (!missionId) return "";
    return MANU_MISSIONS.find((m) => m.id === missionId)?.title ?? missionId;
  }, [missionId]);

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

  const handleLaunch = useCallback(() => {
    const mission = MANU_MISSIONS.find((m) => m.id === missionId);
    if (!mission) return;
    const simulated = simulateManuRun({ mission, mode, documents, manualConfig });
    setRun(simulated);
    setStep("processing");
  }, [missionId, mode, documents, manualConfig]);

  const resetFlow = useCallback(() => {
    setStep(entry === "embedded" ? "documents" : "landing");
    setMode("execute");
    setMissionId(entry === "embedded" ? null : MANU_MISSION_IDS.productManualGen);
    setDocuments([]);
    setManualConfig({ selectedSectionIds: defaultSectionIds(), metadata: defaultMetadata() });
    setRun(null);
    setTraceabilityOpen(false);
  }, [entry]);

  const goBack = useCallback(() => {
    const order: ManuFlowStep[] =
      entry === "embedded"
        ? ["documents", "config", "review"]
        : ["mode", "mission", "documents", "config", "review"];
    const idx = order.indexOf(step);
    if (idx > 0) setStep(order[idx - 1]);
    else if (step === "mode") setStep("landing");
  }, [entry, step]);

  const handleMissionSelect = useCallback((id: string) => {
    setMissionId(id);
    setManualConfig((c) => ({
      ...c,
      selectedSectionIds: getDefaultSectionsForMission(id, c.selectedSectionIds),
    }));
    if (entry === "embedded") {
      setStep("documents");
    }
  }, [entry]);

  const clearMission = useCallback(() => {
    setMissionId(null);
    setDocuments([]);
    setRun(null);
    if (entry === "embedded") {
      setStep("documents");
    } else {
      setStep("mission");
    }
  }, [entry]);

  const handleBundleMetadata = useCallback((meta: Partial<ManuManualConfig["metadata"]>) => {
    setManualConfig((c) => ({ ...c, metadata: { ...c.metadata, ...meta } }));
  }, []);

  return {
    entry,
    step,
    setStep,
    mode,
    setMode,
    missionId,
    missionTitle,
    documents,
    setDocuments,
    manualConfig,
    setManualConfig,
    run,
    setRun,
    traceabilityOpen,
    setTraceabilityOpen,
    stepLabel,
    handleLaunch,
    resetFlow,
    goBack,
    handleMissionSelect,
    clearMission,
    handleBundleMetadata,
  };
}

export type ManuFlowApi = ReturnType<typeof useManuFlow>;
