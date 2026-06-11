import { apiClient } from "@/lib/apiClient";
import { getDefaultProjectId as resolveDefaultProjectId } from "@/lib/defaultProject";
import {
  createLocalManuRunWithGenerator,
  getLocalManuRun,
  getLocalManuRunStatus,
  isLocalManuRunId,
  isSupabaseTableMissingError,
  patchLocalManuRunResult,
} from "@/lib/manuLocalStore";
import type {
  ManuManualConfig,
  ManuMode,
  ManuRun,
  ManuRunJobStatus,
  ManuRunStatus,
  ManuTranslationQARow,
  ManuUploadedDocument,
} from "@/types/manu";
import { computeTranslationApprovalStatus, normalizeTranslationRow } from "@/lib/manuTranslationUtils";

export { isLocalManuRunId } from "@/lib/manuLocalStore";

function asString(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

async function getAuthToken(): Promise<string | undefined> {
  const { supabase } = await import("@/integrations/supabase/client");
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}

export async function getDefaultProjectId(): Promise<string | null> {
  const token = await getAuthToken();
  if (!token) return null;
  return resolveDefaultProjectId(token);
}

export function normalizeManuUploadedDocument(raw: unknown): ManuUploadedDocument | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const category = asString(o.category) as ManuUploadedDocument["category"];
  return {
    id: asString(o.id) || `doc-${crypto.randomUUID()}`,
    fileName: asString(o.fileName),
    fileType: asString(o.fileType),
    category: category || "other",
    uploadedAt: asString(o.uploadedAt) || new Date().toISOString(),
    extractedText: asString(o.extractedText),
    extractionStatus: (asString(o.extractionStatus) || "simulated") as ManuUploadedDocument["extractionStatus"],
    parsingConfidence: typeof o.parsingConfidence === "number" ? o.parsingConfidence : 0.75,
    notes: o.notes != null ? asString(o.notes) : undefined,
  };
}

export function normalizeManuRun(raw: unknown): ManuRun | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const manualConfig = o.manualConfig as ManuManualConfig | undefined;
  if (!manualConfig?.metadata || !Array.isArray(manualConfig.selectedSectionIds)) return null;

  return {
    runId: asString(o.runId),
    agentId: asString(o.agentId) || "manu",
    missionId: asString(o.missionId),
    mode: (asString(o.mode) || "execute") as ManuMode,
    client: asString(o.client) || "LabCorp",
    uploadedDocuments: Array.isArray(o.uploadedDocuments)
      ? (o.uploadedDocuments.map(normalizeManuUploadedDocument).filter(Boolean) as ManuUploadedDocument[])
      : [],
    documentClassifications: (o.documentClassifications as Record<string, ManuUploadedDocument["category"]>) || {},
    extractedFacts: Array.isArray(o.extractedFacts) ? (o.extractedFacts as ManuRun["extractedFacts"]) : [],
    manualConfig,
    generatedSections: Array.isArray(o.generatedSections) ? (o.generatedSections as ManuRun["generatedSections"]) : [],
    traceabilityMatrix: Array.isArray(o.traceabilityMatrix) ? (o.traceabilityMatrix as ManuRun["traceabilityMatrix"]) : [],
    riskCoverage: Array.isArray(o.riskCoverage) ? (o.riskCoverage as ManuRun["riskCoverage"]) : [],
    regulatoryChecklist: Array.isArray(o.regulatoryChecklist)
      ? (o.regulatoryChecklist as ManuRun["regulatoryChecklist"])
      : [],
    approvalStatus: (o.approvalStatus as ManuRun["approvalStatus"]) || {
      allRequiredApproved: false,
      approvedCount: 0,
      flaggedCount: 0,
      requiredCount: 0,
    },
    translationQA: Array.isArray(o.translationQA)
      ? (o.translationQA as Partial<ManuTranslationQARow>[]).map(normalizeTranslationRow)
      : [],
    translationApprovalStatus:
      (o.translationApprovalStatus as ManuRun["translationApprovalStatus"]) ||
      computeTranslationApprovalStatus(
        Array.isArray(o.translationQA)
          ? (o.translationQA as Partial<ManuTranslationQARow>[]).map(normalizeTranslationRow)
          : [],
      ),
    exportStatus: (o.exportStatus as ManuRun["exportStatus"]) || {
      approved_manual: "idle",
      traceability_matrix: "idle",
      risk_coverage: "idle",
      regulatory_checklist: "idle",
      translation_qa: "idle",
      audit_package: "idle",
    },
    gaps: Array.isArray(o.gaps) ? o.gaps.map(asString) : [],
    missionFocus: o.missionFocus as ManuRun["missionFocus"],
    createdAt: asString(o.createdAt) || new Date().toISOString(),
    updatedAt: asString(o.updatedAt) || new Date().toISOString(),
  };
}

function shouldFallbackToLocalStorage(err: unknown): boolean {
  const message = err instanceof Error ? err.message : asString(err);
  if (isSupabaseTableMissingError(message)) return true;
  if (/request failed \(5\d\d\)/i.test(message)) return true;
  if (/request failed \(404\)/i.test(message)) return true;
  if (/default project not found/i.test(message)) return true;
  if (/failed to create run/i.test(message)) return true;
  if (/network|fetch failed|failed to fetch/i.test(message)) return true;
  return false;
}

export async function postManuDocumentExtract(
  file: File,
  options?: { category?: ManuUploadedDocument["category"] },
): Promise<ManuUploadedDocument> {
  const token = await getAuthToken();
  const fd = new FormData();
  fd.append("file", file);
  if (options?.category) fd.append("category", options.category);

  const res = await apiClient.request("/api/manu/documents/extract", {
    method: "POST",
    body: fd,
    token,
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const msg =
      body && typeof body === "object" && "error" in body ? asString((body as { error?: unknown }).error) : `Request failed (${res.status})`;
    throw new Error(msg);
  }

  const doc = normalizeManuUploadedDocument((body as { document?: unknown })?.document);
  if (!doc) throw new Error("Invalid document response");
  return doc;
}

export type ManuRunCreateResult = {
  runId: string;
  status: ManuRunStatus;
  storage: "remote" | "local";
};

export async function postManuRun(payload: {
  projectId?: string | null;
  missionId: string;
  mode: ManuMode;
  manualConfig: ManuManualConfig;
  documents: ManuUploadedDocument[];
}): Promise<ManuRunCreateResult> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error("Sign in required for OpenAI MANU generation");
  }

  const generateLocal = () =>
    createLocalManuRunWithGenerator(payload, async () => {
      const res = await apiClient.request("/api/manu/runs/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: payload.projectId ?? null,
          missionId: payload.missionId,
          mode: payload.mode,
          manualConfig: payload.manualConfig,
          documents: payload.documents,
        }),
        token,
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        const msg =
          body && typeof body === "object" && "error" in body
            ? asString((body as { error?: unknown }).error)
            : `OpenAI generation failed (${res.status})`;
        throw new Error(msg);
      }
      const run = normalizeManuRun((body as { run?: unknown })?.run);
      if (!run) throw new Error("Invalid OpenAI generation response");
      return run;
    });

  if (!payload.projectId) {
    const local = await generateLocal();
    return { ...local, storage: "local" };
  }

  try {
    const res = await apiClient.request("/api/manu/runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: payload.projectId,
        missionId: payload.missionId,
        mode: payload.mode,
        manualConfig: payload.manualConfig,
        documents: payload.documents,
      }),
      token,
    });

    const body = await res.json().catch(() => null);
    if (!res.ok) {
      const msg =
        body && typeof body === "object" && "error" in body
          ? asString((body as { error?: unknown }).error)
          : `Request failed (${res.status})`;
      throw new Error(msg);
    }

    return {
      runId: asString((body as { runId?: unknown })?.runId),
      status: (asString((body as { status?: unknown })?.status) || "queued") as ManuRunStatus,
      storage: "remote",
    };
  } catch (err) {
    if (shouldFallbackToLocalStorage(err)) {
      const local = await generateLocal();
      return { ...local, storage: "local" };
    }
    throw err;
  }
}

export async function getManuRunStatus(runId: string): Promise<ManuRunJobStatus> {
  if (isLocalManuRunId(runId)) {
    const status = getLocalManuRunStatus(runId);
    if (!status) throw new Error("Local run not found");
    return status;
  }

  const token = await getAuthToken();
  const body = await apiClient.requestJson<Record<string, unknown>>(`/api/manu/runs/${runId}/status`, { token });

  return {
    runId: asString(body.runId) || runId,
    status: (asString(body.status) || "queued") as ManuRunStatus,
    stageIndex: typeof body.stageIndex === "number" ? body.stageIndex : 0,
    stageLabel: asString(body.stageLabel) || "Processing",
    progress: typeof body.progress === "number" ? body.progress : 0,
    error: body.error != null ? asString(body.error) : undefined,
  };
}

export async function getManuRun(runId: string): Promise<ManuRun> {
  if (isLocalManuRunId(runId)) {
    const run = getLocalManuRun(runId);
    if (!run) throw new Error("Local run not ready");
    return run;
  }

  const token = await getAuthToken();
  const body = await apiClient.requestJson<{ run?: unknown }>(`/api/manu/runs/${runId}`, { token });
  const run = normalizeManuRun(body?.run);
  if (!run) throw new Error("Invalid run response");
  return run;
}

export async function patchManuRun(runId: string, resultJson: ManuRun): Promise<ManuRun> {
  if (isLocalManuRunId(runId)) {
    return patchLocalManuRunResult(runId, resultJson);
  }

  const token = await getAuthToken();
  const body = await apiClient.requestJson<{ run?: unknown }>(`/api/manu/runs/${runId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resultJson }),
    token,
  });
  const run = normalizeManuRun(body?.run);
  if (!run) throw new Error("Invalid run response");
  return run;
}

export async function generateManuTranslationQA(run: ManuRun): Promise<ManuRun["translationQA"]> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error("Sign in required for translation QA generation");
  }

  const res = await apiClient.request("/api/manu/translation-qa/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      missionId: run.missionId,
      manualConfig: run.manualConfig,
      sections: run.generatedSections,
      documents: run.uploadedDocuments,
    }),
    token,
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const msg =
      body && typeof body === "object" && "error" in body
        ? asString((body as { error?: unknown }).error)
        : `Translation QA generation failed (${res.status})`;
    throw new Error(msg);
  }

  const rows = (body as { translationQA?: unknown })?.translationQA;
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => normalizeTranslationRow(row as Partial<ManuTranslationQARow>));
}

export async function pollManuRunUntilReady(
  runId: string,
  options?: { intervalMs?: number; maxAttempts?: number; onStatus?: (status: ManuRunJobStatus) => void },
): Promise<ManuRun> {
  const intervalMs = options?.intervalMs ?? 1500;
  const maxAttempts = options?.maxAttempts ?? 120;

  for (let i = 0; i < maxAttempts; i++) {
    const status = await getManuRunStatus(runId);
    options?.onStatus?.(status);

    if (status.status === "ready") {
      return getManuRun(runId);
    }
    if (status.status === "failed") {
      throw new Error(status.error || "MANU pipeline failed");
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }

  throw new Error("MANU pipeline timed out");
}
