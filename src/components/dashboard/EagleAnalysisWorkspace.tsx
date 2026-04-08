import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { EAGLE_LOGISTICS_MISSION_OPTIONS, isEagleLogisticsMissionId } from "@/lib/eagleLogisticsMissions";
import { normalizeLogisticsExtractionResult, postLogisticsProcess } from "@/lib/logisticsApi";
import { downloadLogisticsExcel, downloadLogisticsJson } from "@/lib/logisticsExport";
import type {
  EagleLogisticsMissionId,
  EagleWorkspaceSnapshot,
  LogisticsProcessResponse,
  LogisticsTable,
} from "@/types/logisticsExtraction";
import {
  EagleLogisticsExtractionTabs,
  type EagleLogisticsResultTabId,
} from "./EagleLogisticsExtractionTabs";
import { EagleLogisticsMissionPicker } from "./EagleLogisticsMissionPicker";
import { logisticsResultHasLineItemTables } from "./LogisticsExtractionView";

const ACCEPT = "application/pdf,image/png,image/jpeg,.pdf,.png,.jpg,.jpeg";

function nonEmptyLineTablesFromNormalized(n: LogisticsProcessResponse["normalized_logistics"]): LogisticsTable[] {
  return structuredClone(n.tables.filter((t) => t.columns.length > 0 || t.rows.length > 0));
}

function storageKey(sessionId: string | undefined) {
  return sessionId ? `tacit-eagle-logistics:${sessionId}` : "tacit-eagle-logistics:global";
}

function stashableFromResponse(res: LogisticsProcessResponse, mission: EagleLogisticsMissionId | null) {
  return JSON.stringify({
    jobId: res.jobId,
    ok: res.ok,
    normalized_logistics: res.normalized_logistics,
    excel_filename: res.excel_filename,
    mission: mission ?? undefined,
  });
}

function parseStashed(json: string): Partial<LogisticsProcessResponse> | null {
  try {
    const o = JSON.parse(json) as Record<string, unknown>;
    if (!o || typeof o !== "object") return null;
    return {
      ok: Boolean(o.ok),
      jobId: String(o.jobId ?? ""),
      normalized_logistics: normalizeLogisticsExtractionResult(o.normalized_logistics),
      excel_filename: o.excel_filename != null ? String(o.excel_filename) : undefined,
    };
  } catch {
    return null;
  }
}

function inferMissionFromPartial(
  o: Record<string, unknown>,
  partial: Partial<LogisticsProcessResponse>,
): EagleLogisticsMissionId | null {
  const raw = o.mission;
  if (typeof raw === "string" && isEagleLogisticsMissionId(raw)) return raw;
  const dt = partial.normalized_logistics?.documentType;
  if (dt && dt !== "unknown" && isEagleLogisticsMissionId(dt)) return dt;
  return null;
}

export interface EagleAnalysisWorkspaceProps {
  sessionId?: string;
  /** Compact layout for sessions list embed */
  compact?: boolean;
  onExtractionResult?: (result: LogisticsProcessResponse["normalized_logistics"] | null) => void;
  onExcelReady?: (filename: string | undefined, hasBase64: boolean) => void;
  onProcessingChange?: (processing: boolean) => void;
  onWorkspaceStateChange?: (snapshot: EagleWorkspaceSnapshot) => void;
  /** When set, shows “Back to session list” after a result; clears local result and invokes this. */
  onBackToSessionList?: () => void;
  className?: string;
}

export function EagleAnalysisWorkspace({
  sessionId,
  compact = false,
  onExtractionResult,
  onExcelReady,
  onProcessingChange,
  onWorkspaceStateChange,
  onBackToSessionList,
  className,
}: EagleAnalysisWorkspaceProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [mission, setMission] = useState<EagleLogisticsMissionId | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processResponse, setProcessResponse] = useState<LogisticsProcessResponse | null>(null);
  const [activeTab, setActiveTab] = useState<EagleLogisticsResultTabId>("summary");
  const [lineItemTables, setLineItemTables] = useState<LogisticsTable[]>([]);

  const emitSnapshot = useCallback(
    (next: EagleWorkspaceSnapshot) => {
      onWorkspaceStateChange?.(next);
    },
    [onWorkspaceStateChange],
  );

  useEffect(() => {
    onProcessingChange?.(processing);
  }, [processing, onProcessingChange]);

  useEffect(() => {
    onExtractionResult?.(processResponse?.normalized_logistics ?? null);
  }, [processResponse, onExtractionResult]);

  useEffect(() => {
    const hasB64 = Boolean(processResponse?.excel_base64);
    onExcelReady?.(processResponse?.excel_filename, hasB64);
  }, [processResponse, onExcelReady]);

  useEffect(() => {
    emitSnapshot({ processing, processResponse, lineItemTablesDraft: lineItemTables });
  }, [processing, processResponse, lineItemTables, emitSnapshot]);

  useEffect(() => {
    const nl = processResponse?.normalized_logistics;
    if (!nl) {
      setLineItemTables([]);
      return;
    }
    setLineItemTables(nonEmptyLineTablesFromNormalized(nl));
  }, [processResponse?.jobId]);

  useEffect(() => {
    const key = storageKey(sessionId);
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return;
      const o = JSON.parse(raw) as Record<string, unknown>;
      const partial = parseStashed(raw);
      if (!partial?.normalized_logistics) return;
      setProcessResponse({
        ok: partial.ok ?? true,
        jobId: partial.jobId ?? "",
        normalized_logistics: partial.normalized_logistics,
        excel_filename: partial.excel_filename,
      });
      const inferred = inferMissionFromPartial(o, partial);
      setMission(inferred ?? "bill_of_lading");
    } catch {
      // ignore corrupt stash
    }
  }, [sessionId]);

  const persist = useCallback(
    (res: LogisticsProcessResponse | null) => {
      const key = storageKey(sessionId);
      try {
        if (!res) sessionStorage.removeItem(key);
        else sessionStorage.setItem(key, stashableFromResponse(res, mission));
      } catch {
        // quota / private mode
      }
    },
    [sessionId, mission],
  );

  const clearResult = useCallback(() => {
    setProcessResponse(null);
    setLineItemTables([]);
    setFile(null);
    setMission(null);
    if (inputRef.current) inputRef.current.value = "";
    persist(null);
    onExtractionResult?.(null);
    onExcelReady?.(undefined, false);
  }, [persist, onExtractionResult, onExcelReady]);

  const changeMission = useCallback(() => {
    setMission(null);
    setProcessResponse(null);
    setLineItemTables([]);
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
    persist(null);
    onExtractionResult?.(null);
    onExcelReady?.(undefined, false);
  }, [persist, onExtractionResult, onExcelReady]);

  const runExtract = async () => {
    if (!mission) {
      toast({ title: "Choose a mission", description: "Select a document type first.", variant: "destructive" });
      return;
    }
    if (!file) {
      toast({ title: "Choose a file", description: "Select a PDF, PNG, or JPEG first.", variant: "destructive" });
      return;
    }
    setProcessing(true);
    setActiveTab("summary");
    try {
      const res = await postLogisticsProcess(file, { mission });
      setProcessResponse(res);
      persist(res);
      toast({ title: "Extraction complete", description: `Job ${res.jobId.slice(0, 8)}…` });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Extraction failed";
      toast({ title: "Extraction failed", description: msg, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const normalized = processResponse?.normalized_logistics;
  const hasLineItems = useMemo(
    () => (normalized ? logisticsResultHasLineItemTables(normalized) : false),
    [normalized],
  );

  useEffect(() => {
    if (!hasLineItems && activeTab === "lineItems") {
      setActiveTab("summary");
    }
  }, [hasLineItems, activeTab]);

  const missionLabel = mission
    ? EAGLE_LOGISTICS_MISSION_OPTIONS.find((x) => x.id === mission)?.title ?? mission
    : "";

  if (!mission) {
    return (
      <div className={className}>
        <EagleLogisticsMissionPicker
          variant="card"
          className="rounded-xl border border-primary/25 bg-card/55 p-4 md:p-5"
        />
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        className={
          compact
            ? "mb-4 space-y-3 rounded-xl border border-primary/25 bg-card/55 p-4"
            : "mb-6 space-y-4 rounded-xl border border-primary/25 bg-card/55 p-5 md:p-6"
        }
      >
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="font-semibold text-primary">Mission</span>
          <span>{missionLabel}</span>
          <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={changeMission}>
            Change mission
          </Button>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="min-w-0 flex-1">
            <label className="mb-1.5 block text-[0.65rem] font-bold uppercase tracking-wide text-primary/80">
              Logistics document
            </label>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              className="block w-full max-w-md cursor-pointer text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary/15 file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setFile(f);
              }}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" onClick={runExtract} disabled={processing || !file}>
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Extracting…
                </>
              ) : (
                <>
                  <FileUp className="h-4 w-4" />
                  Extract
                </>
              )}
            </Button>
            {processResponse && (
              <>
                <Button type="button" variant="outline" size="sm" onClick={() => downloadLogisticsJson(processResponse)}>
                  Download JSON
                </Button>
                {processResponse.excel_base64 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      downloadLogisticsExcel(
                        processResponse.excel_base64!,
                        processResponse.excel_filename || "eagle_extraction.xlsx",
                        { lineTables: lineItemTables },
                      )
                    }
                  >
                    Download Excel
                  </Button>
                )}
                {onBackToSessionList && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      clearResult();
                      onBackToSessionList();
                    }}
                  >
                    Back to session list
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
        {processing && (
          <p className="text-xs text-muted-foreground">
            Running logistics pipeline on the server… Large PDFs may take a minute.
          </p>
        )}
      </div>

      {normalized && processResponse && (
        <div className="flex max-h-[min(78vh,880px)] min-h-0 flex-col">
          <EagleLogisticsExtractionTabs
            processResponse={processResponse}
            normalized={normalized}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            lineItemTables={lineItemTables}
            onLineItemTablesChange={setLineItemTables}
            stickyToolbar
          />
        </div>
      )}
    </div>
  );
}
