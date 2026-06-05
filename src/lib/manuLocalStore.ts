import { MANU_PROCESSING_STAGES } from "@/data/manuSections";
import type {
  ManuManualConfig,
  ManuMode,
  ManuRun,
  ManuRunJobStatus,
  ManuRunStatus,
  ManuUploadedDocument,
} from "@/types/manu";

export const MANU_LOCAL_RUN_PREFIX = "local-";
const STORAGE_KEY = "tacit-manu-runs";
const MAX_STORED_RUNS = 24;

export interface StoredManuRunRecord {
  id: string;
  projectId: string | null;
  missionId: string;
  mode: ManuMode;
  status: ManuRunStatus;
  stage: string;
  stageIndex: number;
  progress: number;
  errorMessage?: string;
  manualConfig: ManuManualConfig;
  uploadedDocuments: ManuUploadedDocument[];
  resultJson?: ManuRun;
  createdAt: string;
  updatedAt: string;
}

function readAll(): StoredManuRunRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredManuRunRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(records: StoredManuRunRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, MAX_STORED_RUNS)));
}

function upsert(record: StoredManuRunRecord) {
  const all = readAll().filter((r) => r.id !== record.id);
  writeAll([record, ...all]);
}

export function isLocalManuRunId(runId: string): boolean {
  return runId.startsWith(MANU_LOCAL_RUN_PREFIX);
}

export function isSupabaseTableMissingError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("manu_runs") ||
    m.includes("does not exist") ||
    m.includes("relation") ||
    m.includes("pgrst205") ||
    m.includes("schema cache") ||
    m.includes("could not find the table")
  );
}

export function createLocalManuRun(payload: {
  projectId?: string | null;
  missionId: string;
  mode: ManuMode;
  manualConfig: ManuManualConfig;
  documents: ManuUploadedDocument[];
}): { runId: string; status: ManuRunStatus } {
  const now = new Date().toISOString();
  const id = `${MANU_LOCAL_RUN_PREFIX}${crypto.randomUUID()}`;

  const record: StoredManuRunRecord = {
    id,
    projectId: payload.projectId ?? null,
    missionId: payload.missionId,
    mode: payload.mode,
    status: "queued",
    stage: MANU_PROCESSING_STAGES[0],
    stageIndex: 0,
    progress: 0,
    manualConfig: payload.manualConfig,
    uploadedDocuments: payload.documents,
    createdAt: now,
    updatedAt: now,
  };

  upsert(record);
  return { runId: id, status: "queued" };
}

export function getLocalManuRunStatus(runId: string): ManuRunJobStatus | null {
  const record = readAll().find((r) => r.id === runId);
  if (!record) return null;

  return {
    runId: record.id,
    status: record.status,
    stageIndex: record.stageIndex,
    stageLabel: record.stage,
    progress: record.progress,
    error: record.errorMessage,
  };
}

export function getLocalManuRun(runId: string): ManuRun | null {
  const record = readAll().find((r) => r.id === runId);
  if (!record?.resultJson) return null;
  return record.resultJson;
}

export function patchLocalManuRunResult(runId: string, resultJson: ManuRun): ManuRun {
  const record = readAll().find((r) => r.id === runId);
  if (!record) throw new Error("Local run not found");

  const updated: StoredManuRunRecord = {
    ...record,
    resultJson: { ...resultJson, runId, updatedAt: new Date().toISOString() },
    updatedAt: new Date().toISOString(),
  };
  upsert(updated);
  return updated.resultJson!;
}

export function listLocalManuRuns(): StoredManuRunRecord[] {
  return readAll();
}

const activePipelines = new Set<string>();

function updateLocalRun(runId: string, patch: Partial<StoredManuRunRecord>) {
  const record = readAll().find((r) => r.id === runId);
  if (!record) return;
  upsert({ ...record, ...patch, updatedAt: new Date().toISOString() });
}

/** Visual progress only — capped below final stage until OpenAI generation completes. */
function setVisualStage(runId: string, stageIndex: number) {
  const capped = Math.min(stageIndex, MANU_PROCESSING_STAGES.length - 2);
  const progress = Math.min(92, Math.round(((capped + 1) / MANU_PROCESSING_STAGES.length) * 100));
  updateLocalRun(runId, {
    status: "processing",
    stage: MANU_PROCESSING_STAGES[capped],
    stageIndex: capped,
    progress,
  });
}

export function kickLocalManuPipeline(runId: string, generator: () => Promise<ManuRun>): void {
  if (activePipelines.has(runId)) return;
  activePipelines.add(runId);

  const record = readAll().find((r) => r.id === runId);
  if (!record) {
    activePipelines.delete(runId);
    return;
  }

  updateLocalRun(runId, { status: "processing", stageIndex: 0, progress: 5 });

  let visualStage = 0;
  const visualTimer = window.setInterval(() => {
    const current = readAll().find((r) => r.id === runId);
    if (!current || current.status !== "processing") {
      window.clearInterval(visualTimer);
      return;
    }
    if (visualStage < MANU_PROCESSING_STAGES.length - 2) {
      visualStage += 1;
      setVisualStage(runId, visualStage);
    }
  }, 2500);

  void generator()
    .then((run) => {
      window.clearInterval(visualTimer);
      const completed: ManuRun = { ...run, runId, updatedAt: new Date().toISOString() };
      updateLocalRun(runId, {
        status: "ready",
        stage: MANU_PROCESSING_STAGES[MANU_PROCESSING_STAGES.length - 1],
        stageIndex: MANU_PROCESSING_STAGES.length - 1,
        progress: 100,
        resultJson: completed,
        errorMessage: undefined,
      });
      activePipelines.delete(runId);
    })
    .catch((err) => {
      window.clearInterval(visualTimer);
      updateLocalRun(runId, {
        status: "failed",
        errorMessage: err instanceof Error ? err.message : "OpenAI generation failed",
      });
      activePipelines.delete(runId);
    });
}

export function createLocalManuRunWithGenerator(
  payload: {
    projectId?: string | null;
    missionId: string;
    mode: ManuMode;
    manualConfig: ManuManualConfig;
    documents: ManuUploadedDocument[];
  },
  generator: () => Promise<ManuRun>,
): { runId: string; status: ManuRunStatus } {
  const created = createLocalManuRun(payload);
  kickLocalManuPipeline(created.runId, generator);
  return created;
}
