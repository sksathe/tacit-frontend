import { getDefaultSectionsForMission } from "@/data/manuLabcorp";
import { defaultSectionIdsForMission, getMissionUiProfile } from "@/data/manuMissionUi";
import { MANU_MISSION_IDS } from "@/data/manuLabcorp";
import { MANU_MISSIONS } from "@/data/manuMissions";
import { MANU_DEFAULT_SECTIONS } from "@/data/manuSections";
import { getDefaultProjectId, getManuRun, getManuRunStatus, isLocalManuRunId, postManuRun } from "@/lib/manuApi";
import { patchLocalManuRunResult } from "@/lib/manuLocalStore";
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
  const [run, setRunState] = useState<ManuRun | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [runStorage, setRunStorage] = useState<"remote" | "local" | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [usedSimulationFallback, setUsedSimulationFallback] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [traceabilityOpen, setTraceabilityOpen] = useState(false);

  const setRun = useCallback((next: ManuRun | null) => {
    setRunState(next);
    if (next?.runId && isLocalManuRunId(next.runId)) {
      try {
        patchLocalManuRunResult(next.runId, next);
      } catch {
        /* local persist best-effort */
      }
    }
  }, []);

  const missionTitle = useMemo(() => {
    if (!missionId) return "";
    return MANU_MISSIONS.find((m) => m.id === missionId)?.title ?? missionId;
  }, [missionId]);

  const stepLabel = useMemo(() => {
    if (step === "config" && missionId) {
      return getMissionUiProfile(missionId).configTitle;
    }
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
  }, [step, missionId]);

  const fallbackToSimulation = useCallback(() => {
    const mission = MANU_MISSIONS.find((m) => m.id === missionId);
    if (!mission) return;
    const simulated = simulateManuRun({ mission, mode, documents, manualConfig });
    setRun(simulated);
    setRunId(null);
    setUsedSimulationFallback(true);
    setStep("processing");
  }, [missionId, mode, documents, manualConfig]);

  const handleLaunch = useCallback(async () => {
    const mission = MANU_MISSIONS.find((m) => m.id === missionId);
    if (!mission || !documents.length) return;

    setIsLaunching(true);
    setLaunchError(null);
    setUsedSimulationFallback(false);
    setRun(null);
    setRunId(null);
    setRunStorage(null);

    try {
      const projectId = await getDefaultProjectId();

      const { runId: newRunId, storage } = await postManuRun({
        projectId,
        missionId: mission.id,
        mode,
        manualConfig,
        documents,
      });

      setRunId(newRunId);
      setRunStorage(storage);
      setUsedSimulationFallback(false);
      setStep("processing");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Backend launch failed";
      setLaunchError(message);
      // Stay on review — user can retry or explicitly choose offline simulation from processing if a runId exists
    } finally {
      setIsLaunching(false);
    }
  }, [missionId, mode, documents, manualConfig, fallbackToSimulation]);

  const handleProcessingComplete = useCallback((completedRun: ManuRun) => {
    setRun(completedRun);
    setRunId(null);
    setStep("workspace");
  }, []);

  const completeWithSimulation = useCallback(() => {
    const mission = MANU_MISSIONS.find((m) => m.id === missionId);
    if (!mission) return;
    setUsedSimulationFallback(true);
    setRunId(null);
    const simulated = simulateManuRun({ mission, mode, documents, manualConfig });
    setRun(simulated);
    setStep("workspace");
  }, [missionId, mode, documents, manualConfig]);

  const resetFlow = useCallback(() => {
    setStep(entry === "embedded" ? "documents" : "landing");
    setMode("execute");
    setMissionId(entry === "embedded" ? null : MANU_MISSION_IDS.productManualGen);
    setDocuments([]);
    setManualConfig({ selectedSectionIds: defaultSectionIds(), metadata: defaultMetadata() });
    setRun(null);
    setRunId(null);
    setRunStorage(null);
    setIsLaunching(false);
    setUsedSimulationFallback(false);
    setLaunchError(null);
    setTraceabilityOpen(false);
  }, [entry]);

  const goBack = useCallback(() => {
    if (entry === "embedded" && step === "documents") {
      setMissionId(null);
      setDocuments([]);
      setRun(null);
      setRunId(null);
      setStep("documents");
      return;
    }

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
    const profile = getMissionUiProfile(id);
    setManualConfig((c) => ({
      ...c,
      selectedSectionIds:
        profile.sectionMode === "locked"
          ? defaultSectionIdsForMission(id)
          : getDefaultSectionsForMission(id, c.selectedSectionIds),
    }));
    if (entry === "embedded") {
      setStep("documents");
    }
  }, [entry]);

  const clearMission = useCallback(() => {
    setMissionId(null);
    setDocuments([]);
    setRun(null);
    setRunId(null);
    if (entry === "embedded") {
      setStep("documents");
    } else {
      setStep("mission");
    }
  }, [entry]);

  const handleBundleMetadata = useCallback((meta: Partial<ManuManualConfig["metadata"]>) => {
    setManualConfig((c) => ({ ...c, metadata: { ...c.metadata, ...meta } }));
  }, []);

  const resumeRun = useCallback(async (runId: string, mission: string) => {
    setMissionId(mission);
    setManualConfig((c) => ({
      ...c,
      selectedSectionIds: getDefaultSectionsForMission(mission, c.selectedSectionIds),
    }));
    setRunId(runId);
    setRunStorage("remote");
    setUsedSimulationFallback(false);
    setLaunchError(null);

    try {
      const status = await getManuRunStatus(runId);
      if (status.status === "ready") {
        const completed = await getManuRun(runId);
        setRun(completed);
        setStep("workspace");
        return;
      }
      if (status.status === "failed") {
        setLaunchError(status.error || "MANU run failed");
        setStep("documents");
        return;
      }
      setStep("processing");
    } catch (err) {
      setLaunchError(err instanceof Error ? err.message : "Failed to resume MANU run");
      setStep("documents");
    }
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
    runId,
    runStorage,
    isLocalRun: runId ? isLocalManuRunId(runId) : runStorage === "local",
    isLaunching,
    usedSimulationFallback,
    launchError,
    traceabilityOpen,
    setTraceabilityOpen,
    stepLabel,
    handleLaunch,
    handleProcessingComplete,
    completeWithSimulation,
    fallbackToSimulation,
    resetFlow,
    goBack,
    handleMissionSelect,
    clearMission,
    handleBundleMetadata,
    resumeRun,
  };
}

export type ManuFlowApi = ReturnType<typeof useManuFlow>;
