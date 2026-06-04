import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { EAGLE_LOGISTICS_MISSION_OPTIONS } from "@/lib/eagleLogisticsMissions";
import { postLogisticsProcess } from "@/lib/logisticsApi";
import { downloadLogisticsExcel, downloadLogisticsJson } from "@/lib/logisticsExport";
import type { EagleLogisticsMissionId, LogisticsProcessResponse, LogisticsTable } from "@/types/logisticsExtraction";
import {
  EagleLogisticsExtractionTabs,
  type EagleLogisticsResultTabId,
} from "./EagleLogisticsExtractionTabs";
import { EagleLogisticsMissionPicker } from "./EagleLogisticsMissionPicker";
import { logisticsResultHasLineItemTables } from "./LogisticsExtractionView";

const ACCEPT = "application/pdf,image/png,image/jpeg,.pdf,.png,.jpg,.jpeg";

const EXTRACT_STEP_LABELS = [
  "Reading document",
  "Extracting text & tables",
  "Running analysis",
  "Structuring logistics fields",
  "Finalizing results",
] as const;

/** Time between advancing each step in the processing UI while the API runs */
const EXTRACT_STEP_ADVANCE_MS = 2000;

function nonEmptyLineTablesFromNormalized(n: LogisticsProcessResponse["normalized_logistics"]): LogisticsTable[] {
  return structuredClone(n.tables.filter((t) => t.columns.length > 0 || t.rows.length > 0));
}

export interface EagleLogisticsMissionPanelProps {
  onFileSelected?: (fileName: string | null) => void;
  onExtractionOutputChange?: (hasOutput: boolean) => void;
}

function EagleExtractStepProgress({ phase }: { phase: number }) {
  return (
    <div className="mission-brief-v4__eagle-extract-steps">
      <p className="mission-brief-v4__eagle-extract-steps-title">Processing your document</p>
      <ol className="mission-brief-v4__eagle-extract-steps-list">
        {EXTRACT_STEP_LABELS.map((label, i) => {
          const done = i < phase;
          const current = i === phase;
          return (
            <li
              key={label}
              className={cn(
                "mission-brief-v4__eagle-extract-step",
                done && "mission-brief-v4__eagle-extract-step--done",
                current && "mission-brief-v4__eagle-extract-step--current",
              )}
            >
              <span className="mission-brief-v4__eagle-extract-step-icon" aria-hidden>
                {done ? (
                  <Check className="h-4 w-4" strokeWidth={2.5} />
                ) : current ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span className="mission-brief-v4__eagle-extract-step-num">{i + 1}</span>
                )}
              </span>
              <span className="mission-brief-v4__eagle-extract-step-label">{label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function EagleLogisticsMissionPanel({ onFileSelected, onExtractionOutputChange }: EagleLogisticsMissionPanelProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [mission, setMission] = useState<EagleLogisticsMissionId | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [extractPhase, setExtractPhase] = useState(0);
  const [processResponse, setProcessResponse] = useState<LogisticsProcessResponse | null>(null);
  const [activeTab, setActiveTab] = useState<EagleLogisticsResultTabId>("summary");
  const [dropActive, setDropActive] = useState(false);
  const [lineItemTables, setLineItemTables] = useState<LogisticsTable[]>([]);

  const missionTitle = useMemo(() => {
    if (!mission) return "";
    return EAGLE_LOGISTICS_MISSION_OPTIONS.find((o) => o.id === mission)?.title ?? mission;
  }, [mission]);

  useEffect(() => {
    onFileSelected?.(file?.name ?? null);
  }, [file, onFileSelected]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!loading) {
      setExtractPhase(0);
      return;
    }
    setExtractPhase(0);
    const t = window.setInterval(() => {
      setExtractPhase((p) => (p < EXTRACT_STEP_LABELS.length - 1 ? p + 1 : p));
    }, EXTRACT_STEP_ADVANCE_MS);
    return () => clearInterval(t);
  }, [loading]);

  const lower = file?.name.toLowerCase() ?? "";
  const isPdf = file?.type === "application/pdf" || lower.endsWith(".pdf");
  const isImage = Boolean(file?.type.startsWith("image/"));

  const resetWorkspace = () => {
    setFile(null);
    setProcessResponse(null);
    setLineItemTables([]);
    setActiveTab("summary");
    if (inputRef.current) inputRef.current.value = "";
  };

  const clearFile = () => {
    resetWorkspace();
  };

  const changeMission = () => {
    setMission(null);
    resetWorkspace();
  };

  const pickFile = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setProcessResponse(null);
  };

  const onDropZoneDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDropActive(false);
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    setFile(f);
    setProcessResponse(null);
  };

  const runExtract = async () => {
    if (!mission) {
      toast({ title: "Choose a mission", description: "Select a document type first.", variant: "destructive" });
      return;
    }
    if (!file) {
      toast({ title: "Choose a file", description: "Upload a PDF, PNG, or JPEG first.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setActiveTab("summary");
    try {
      const res = await postLogisticsProcess(file, { mission });
      setExtractPhase(EXTRACT_STEP_LABELS.length);
      setProcessResponse(res);
      toast({ title: "Extraction complete", description: `Job ${res.jobId.slice(0, 8)}…` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Extraction failed";
      setProcessResponse(null);
      toast({ title: "Extraction failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const normalized = processResponse?.normalized_logistics;
  const hasExtractionOutput = Boolean(normalized && processResponse);

  useEffect(() => {
    const nl = processResponse?.normalized_logistics;
    if (!nl) {
      setLineItemTables([]);
      return;
    }
    setLineItemTables(nonEmptyLineTablesFromNormalized(nl));
  }, [processResponse?.jobId]);
  const hasLineItems = useMemo(
    () => (normalized ? logisticsResultHasLineItemTables(normalized) : false),
    [normalized],
  );
  const showSplit = Boolean(previewUrl && file);

  useEffect(() => {
    onExtractionOutputChange?.(hasExtractionOutput);
  }, [hasExtractionOutput, onExtractionOutputChange]);

  useEffect(() => {
    if (!hasLineItems && activeTab === "lineItems") {
      setActiveTab("summary");
    }
  }, [hasLineItems, activeTab]);

  const downloadExcelWithLineEdits = useCallback(() => {
    if (!processResponse?.excel_base64) return;
    downloadLogisticsExcel(
      processResponse.excel_base64,
      processResponse.excel_filename || "eagle_extraction.xlsx",
      { lineTables: lineItemTables },
    );
  }, [processResponse, lineItemTables]);

  const extractButton = (
    <Button
      type="button"
      disabled={!file || loading}
      onClick={runExtract}
      className="min-w-[11rem] shrink-0 px-8 py-5 text-base"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Working…
        </>
      ) : (
        "Extract info"
      )}
    </Button>
  );

  if (!mission) {
    return (
      <div className="mission-brief-v4__eagle-workspace">
        <EagleLogisticsMissionPicker variant="mission-brief" onSelect={setMission} />
      </div>
    );
  }

  return (
    <div className="mission-brief-v4__eagle-workspace">
      {!showSplit ? (
        <>
          <div className="mission-brief-v4__eagle-mission-row">
            <div className="mission-brief-v4__eagle-mission-chip">
              <span className="mission-brief-v4__eagle-mission-chip-label">Mission</span>
              <span>{missionTitle}</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 border-primary/35 bg-primary/5 text-sm"
              onClick={changeMission}
            >
              Change mission
            </Button>
          </div>

          <h1 className="mission-brief-v4__screen-title">Upload your document</h1>
        </>
      ) : (
        <header className="mission-brief-v4__eagle-split-header">
          <div className="mission-brief-v4__eagle-split-header-top">
            <div className="mission-brief-v4__eagle-split-header-titles">
              <p className="mission-brief-v4__eagle-split-header-mission">
                <span className="mission-brief-v4__eagle-mission-chip-label">Mission</span>{" "}
                <span>{missionTitle}</span>
              </p>
              <h1 className="mission-brief-v4__eagle-split-header-title">Document workspace</h1>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 self-start border-primary/35 bg-primary/5 text-sm sm:self-center"
              onClick={changeMission}
            >
              Change mission
            </Button>
          </div>
          <div className="mission-brief-v4__eagle-split-header-file">
            <span className="min-w-0 truncate text-sm text-muted-foreground" title={file?.name}>
              {file?.name}
            </span>
            <Button type="button" variant="ghost" size="sm" className="shrink-0" onClick={clearFile}>
              Remove file
            </Button>
          </div>
        </header>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="mission-brief-v4__eagle-file-input"
        onChange={onFileInputChange}
      />

      {!showSplit ? (
        <>
          <div className="mission-brief-v4__eagle-upload-section-line" role="presentation" />
          <div className="mission-brief-v4__eagle-upload-bar mission-brief-v4__eagle-upload-bar--solo">
            <button
              type="button"
              className={cn(
                "mission-brief-v4__eagle-drop-hero",
                dropActive && "mission-brief-v4__eagle-drop-hero--active",
              )}
              onClick={pickFile}
              onDragEnter={(e) => {
                e.preventDefault();
                setDropActive(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropActive(false);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDropZoneDrop}
            >
              <span className="mission-brief-v4__eagle-drop-hero-icon-wrap">
                <FileUp className="mission-brief-v4__eagle-drop-hero-icon" strokeWidth={1.75} aria-hidden />
              </span>
              <span className="mission-brief-v4__eagle-drop-hero-title">Drop a file here or click to browse</span>
              <span className="mission-brief-v4__eagle-drop-hero-hint">PDF, PNG, or JPEG · up to 25 MB</span>
            </button>
          </div>
        </>
      ) : null}

      {showSplit && (
        <div className="mission-brief-v4__eagle-split">
          <div className="mission-brief-v4__eagle-split-col mission-brief-v4__eagle-split-col--preview">
            <div className="mission-brief-v4__eagle-preview mission-brief-v4__eagle-preview--in-split">
              <div className="mission-brief-v4__eagle-preview-label">Document preview</div>
              <div className="mission-brief-v4__eagle-preview-frame mission-brief-v4__eagle-preview-frame--split">
                {isPdf && (
                  <iframe title="Document preview" src={previewUrl!} className="mission-brief-v4__eagle-preview-iframe" />
                )}
                {isImage && !isPdf && (
                  <img src={previewUrl!} alt="" className="mission-brief-v4__eagle-preview-img" />
                )}
                {!isPdf && !isImage && (
                  <p className="p-6 text-center text-sm text-muted-foreground">
                    Preview is not available for this file type.
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="mission-brief-v4__eagle-split-col mission-brief-v4__eagle-split-col--output">
            {loading && <EagleExtractStepProgress phase={extractPhase} />}
            {!loading && hasExtractionOutput && processResponse && normalized && (
              <div className="mission-brief-v4__eagle-results mission-brief-v4__eagle-results--split">
                <EagleLogisticsExtractionTabs
                  processResponse={processResponse}
                  normalized={normalized}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  lineItemTables={lineItemTables}
                  onLineItemTablesChange={setLineItemTables}
                  rawJsonClassName="mission-brief-v4__eagle-raw-json"
                  stickyToolbar
                  stickyStripClassName="mission-brief-v4__eagle-extraction-sticky"
                  stickyHeader={
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-primary">Extraction results</h2>
                      <Button type="button" variant="outline" size="sm" onClick={() => downloadLogisticsJson(processResponse)}>
                        Download JSON
                      </Button>
                      {processResponse.excel_base64 && (
                        <Button type="button" variant="outline" size="sm" onClick={downloadExcelWithLineEdits}>
                          Download Excel
                        </Button>
                      )}
                    </div>
                  }
                />
              </div>
            )}
            {!loading && !hasExtractionOutput && (
              <div className="mission-brief-v4__eagle-output-placeholder">
                <p className="mission-brief-v4__eagle-output-placeholder-title">Ready to extract</p>
                <p className="mission-brief-v4__eagle-output-placeholder-body">
                  Run Eagle on this {missionTitle.toLowerCase()}. Structured fields and tables will appear here after
                  extraction.
                </p>
                {extractButton}
              </div>
            )}
          </div>
        </div>
      )}

      {!previewUrl && hasExtractionOutput && processResponse && normalized && (
        <div className="mission-brief-v4__eagle-results mission-brief-v4__eagle-results--scroll-shell mt-8">
          <EagleLogisticsExtractionTabs
            processResponse={processResponse}
            normalized={normalized}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            lineItemTables={lineItemTables}
            onLineItemTablesChange={setLineItemTables}
            rawJsonClassName="mission-brief-v4__eagle-raw-json"
            stickyToolbar
            stickyStripClassName="mission-brief-v4__eagle-extraction-sticky"
            stickyHeader={
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-primary">Extraction results</h2>
                <Button type="button" variant="outline" size="sm" onClick={() => downloadLogisticsJson(processResponse)}>
                  Download JSON
                </Button>
                {processResponse.excel_base64 && (
                  <Button type="button" variant="outline" size="sm" onClick={downloadExcelWithLineEdits}>
                    Download Excel
                  </Button>
                )}
              </div>
            }
          />
        </div>
      )}
    </div>
  );
}
