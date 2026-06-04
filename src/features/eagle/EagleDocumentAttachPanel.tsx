import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { PdfRedlineViewer } from "@/components/pdf/PdfRedlineViewer";
import { Textarea } from "@/components/ui/textarea";
import { EagleExtractionReview } from "@/components/dashboard/EagleExtractionReview";
import type { EagleExtractionResult } from "@/features/eagle/eagleExtractionTypes";

const ACCEPT_EAGLE = ".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg";

function eagleAllowedMime(f: File): boolean {
  const t = (f.type || "").toLowerCase();
  const n = f.name.toLowerCase();
  return (
    t.includes("pdf") ||
    n.endsWith(".pdf") ||
    t.includes("png") ||
    n.endsWith(".png") ||
    t.includes("jpeg") ||
    t.includes("jpg") ||
    n.endsWith(".jpg") ||
    n.endsWith(".jpeg")
  );
}

function isPdfFile(f: File): boolean {
  const t = (f.type || "").toLowerCase();
  return t.includes("pdf") || f.name.toLowerCase().endsWith(".pdf");
}

function isImageFile(f: File): boolean {
  const t = (f.type || "").toLowerCase();
  const n = f.name.toLowerCase();
  return t.includes("png") || t.includes("jpeg") || t.includes("jpg") || /\.(png|jpe?g)$/i.test(n);
}

export type EagleExtractOptions = {
  llmExtraInstructions?: string;
};

type EagleDocumentAttachPanelProps = {
  loading: boolean;
  processStepIndex: number;
  apiError: string | null;
  result: EagleExtractionResult | null;
  onExtract: (file: File, options: EagleExtractOptions) => void | Promise<void>;
};

const PROCESS_STEPS = ["Ingest document", "Run extraction model", "Validate & normalize"];

export function EagleDocumentAttachPanel({
  loading,
  processStepIndex,
  apiError,
  result,
  onExtract,
}: EagleDocumentAttachPanelProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [filePickError, setFilePickError] = useState<string | null>(null);
  const [llmExtraInstructions, setLlmExtraInstructions] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const selectedFile = useMemo(() => {
    if (!selectedSourceId?.startsWith("file-")) return null;
    const index = Number(selectedSourceId.replace("file-", ""));
    if (!Number.isFinite(index) || index < 0 || index >= files.length) return null;
    return files[index] ?? null;
  }, [selectedSourceId, files]);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const addFiles = useCallback((incoming: File[]) => {
    const ok = incoming.filter(eagleAllowedMime);
    const bad = incoming.length - ok.length;
    if (bad > 0) {
      setFilePickError("Some files were skipped. Eagle accepts PDF, PNG, and JPEG only.");
    } else {
      setFilePickError(null);
    }
    if (ok.length === 0) return;
    setFiles((prev) => [...prev, ...ok]);
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list?.length) return;
    addFiles(Array.from(list));
    e.target.value = "";
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const dt = e.dataTransfer.files;
    if (dt?.length) addFiles(Array.from(dt));
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      setSelectedSourceId((cur) => {
        if (!cur?.startsWith("file-")) return cur;
        const si = Number(cur.replace("file-", ""));
        if (!Number.isFinite(si)) return cur;
        if (si === index) {
          if (next.length === 0) return null;
          return `file-${Math.min(Math.max(0, si - 1), next.length - 1)}`;
        }
        if (si > index) return `file-${si - 1}`;
        return cur;
      });
      return next;
    });
  };

  useEffect(() => {
    if (files.length === 0) {
      setSelectedSourceId(null);
      return;
    }
    if (selectedSourceId === null) {
      setSelectedSourceId("file-0");
      return;
    }
    if (selectedSourceId.startsWith("file-")) {
      const i = Number(selectedSourceId.replace("file-", ""));
      if (Number.isFinite(i) && i >= files.length) {
        setSelectedSourceId(`file-${files.length - 1}`);
      }
    }
  }, [files.length, selectedSourceId]);

  const handleProcess = () => {
    if (!selectedFile) return;
    void onExtract(selectedFile, {
      llmExtraInstructions: llmExtraInstructions.trim() || undefined,
    });
  };

  return (
    <div className="mission-brief-v4__eagle-workspace">
      <div className="mission-brief-v4__eagle-grid">
        <div className="mission-brief-v4__eagle-col">
          <div className="mission-brief-v4__doc-label">Document</div>
          <div
            className={`mission-brief-v4__eagle-dropzone${dragActive ? " mission-brief-v4__eagle-dropzone--active" : ""}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            role="presentation"
          >
            <div className="mission-brief-v4__eagle-dropzone-inner">
              <UploadCloud className="mission-brief-v4__eagle-drop-icon" aria-hidden />
              <div className="mission-brief-v4__eagle-drop-title">Drop files here or click to browse</div>
              <p className="mission-brief-v4__eagle-drop-sub">PDF, PNG, or JPEG — up to 25 MB (backend limit).</p>
              <button
                type="button"
                className="mission-brief-v4__btn mission-brief-v4__btn--primary mission-brief-v4__eagle-choose"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="mission-brief-v4__file-input-hidden"
                accept={ACCEPT_EAGLE}
                multiple
                onChange={onInputChange}
              />
              {files.length > 0 && (
                <p className="mission-brief-v4__eagle-queued">{files.length} document(s) queued</p>
              )}
            </div>
          </div>
          {filePickError && <p className="mission-brief-v4__eagle-file-error">{filePickError}</p>}

          {files.length > 0 && (
            <ul className="mission-brief-v4__eagle-file-pick-list">
              {files.map((f, i) => {
                const id = `file-${i}`;
                const selected = selectedSourceId === id;
                return (
                  <li key={`${f.name}-${i}`}>
                    <button
                      type="button"
                      className={`mission-brief-v4__eagle-file-pick${selected ? " mission-brief-v4__eagle-file-pick--selected" : ""}`}
                      onClick={() => setSelectedSourceId(id)}
                    >
                      <span className="mission-brief-v4__eagle-file-pick-name">{f.name}</span>
                      <span className="mission-brief-v4__eagle-file-pick-meta">
                        {(f.size / 1024).toFixed(1)} KB
                      </span>
                    </button>
                    <button
                      type="button"
                      className="mission-brief-v4__eagle-file-pick-remove"
                      aria-label={`Remove ${f.name}`}
                      onClick={() => removeFile(i)}
                    >
                      Remove
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="mission-brief-v4__eagle-col mission-brief-v4__eagle-col--preview">
          <div className="mission-brief-v4__doc-label">Preview</div>
          {!selectedFile && (
            <div className="mission-brief-v4__eagle-preview-empty">Select a file from the list to preview.</div>
          )}
          {selectedFile && isPdfFile(selectedFile) && previewUrl && (
            <PdfRedlineViewer fileUrl={previewUrl} query={null} maxPages={8} heightClassName="h-[340px]" />
          )}
          {selectedFile && isImageFile(selectedFile) && previewUrl && !isPdfFile(selectedFile) && (
            <div className="mission-brief-v4__eagle-img-wrap">
              <img src={previewUrl} alt="" className="mission-brief-v4__eagle-img" />
            </div>
          )}
        </div>
      </div>

      <div className="mission-brief-v4__eagle-settings">
        <div className="mission-brief-v4__doc-label">Extraction settings (optional)</div>
        <p className="mission-brief-v4__eagle-settings-hint">
          Extra instructions are sent to the model with your document, same as the contract workspace.
        </p>
        <Textarea
          value={llmExtraInstructions}
          onChange={(e) => setLlmExtraInstructions(e.target.value)}
          placeholder="e.g. Focus on container numbers and seal IDs; flag missing weights."
          className="mission-brief-v4__eagle-textarea min-h-[72px] resize-y text-sm"
        />
      </div>

      {loading && (
        <ol className="mission-brief-v4__eagle-steps" aria-label="Processing progress">
          {PROCESS_STEPS.map((label, i) => (
            <li
              key={label}
              className={`mission-brief-v4__eagle-step${i <= processStepIndex ? " mission-brief-v4__eagle-step--done" : ""}${i === processStepIndex ? " mission-brief-v4__eagle-step--current" : ""}`}
            >
              {label}
            </li>
          ))}
        </ol>
      )}

      <div className="mission-brief-v4__eagle-process-row">
        <button
          type="button"
          className="mission-brief-v4__btn mission-brief-v4__btn--primary"
          disabled={loading || !selectedFile}
          onClick={handleProcess}
        >
          {loading ? "Processing…" : "Process information"}
        </button>
        {!selectedFile && files.length === 0 && (
          <span className="mission-brief-v4__eagle-process-hint">Add a document to enable processing.</span>
        )}
      </div>

      {apiError && (
        <p className="mission-brief-v4__eagle-api-error" role="alert">
          {apiError}
        </p>
      )}

      {result && (
        <div className="mission-brief-v4__eagle-results">
          <div className="mission-brief-v4__doc-label">Extraction result</div>
          <EagleExtractionReview result={result} />
        </div>
      )}
    </div>
  );
}
