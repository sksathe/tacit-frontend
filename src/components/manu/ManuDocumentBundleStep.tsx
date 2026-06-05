import { MANU_DEMO_BUNDLES, type ManuDemoBundleKey } from "@/data/manuLabcorp";
import { MANU_DOCUMENT_CATEGORY_OPTIONS } from "@/data/manuSections";
import { getCategoryLabel } from "@/lib/manuSimulator";
import { postManuDocumentExtract } from "@/lib/manuApi";
import { buildUploadedDocumentFromFile, loadLabCorpDemoBundle } from "@/lib/manuSampleLoader";
import { getDefaultMetadataForBundle } from "@/data/manuLabcorp";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { ManuDocumentCategory, ManuUploadedDocument } from "@/types/manu";
import { AlertTriangle, CloudUpload, FileText, Trash2 } from "lucide-react";
import { useRef, useState } from "react";

interface ManuDocumentBundleStepProps {
  documents: ManuUploadedDocument[];
  onDocumentsChange: (docs: ManuUploadedDocument[]) => void;
  onMetadataFromBundle?: (meta: ReturnType<typeof getDefaultMetadataForBundle>) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function ManuDocumentBundleStep({
  documents,
  onDocumentsChange,
  onMetadataFromBundle,
  onContinue,
  onBack,
}: ManuDocumentBundleStepProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [demoKey, setDemoKey] = useState<ManuDemoBundleKey>("cs-ultra");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    setIsAdding(true);
    try {
      const built = await Promise.all(
        Array.from(fileList).map(async (f) => {
          try {
            return await postManuDocumentExtract(f);
          } catch {
            return buildUploadedDocumentFromFile(f);
          }
        }),
      );
      onDocumentsChange([...documents, ...built]);
    } finally {
      setIsAdding(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const updateDoc = (id: string, patch: Partial<ManuUploadedDocument>) => {
    onDocumentsChange(documents.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  };

  const removeDoc = (id: string) => {
    onDocumentsChange(documents.filter((d) => d.id !== id));
  };

  const hasFmea = documents.some((d) => d.category === "fmea");
  const hasRegulatory = documents.some((d) => d.category === "regulatory");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Source document bundle</h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Upload or select multiple files for this run. Classify each document so MANU can map evidence to manual sections, risks, and regulatory requirements.
        </p>
      </div>

      <Card
        className="cursor-pointer border-dashed border-border/70 transition-colors hover:border-primary/50 hover:bg-primary/5"
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center gap-3 py-12">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            accept=".pdf,.txt,.csv,.docx,.xlsx,.json,application/pdf,text/plain,text/csv"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <CloudUpload className="h-10 w-10 text-primary" />
          <p className="font-medium">Upload source documents</p>
          <p className="text-center text-sm text-muted-foreground">
            PDF, DOCX, XLSX, CSV, TXT, JSON — heterogeneous bundles supported
          </p>
          {isAdding && <p className="text-xs text-muted-foreground">Parsing uploads…</p>}
        </CardContent>
      </Card>

      <Card className="border-primary/25 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Demo sample bundles</CardTitle>
          <CardDescription>
            Load pre-configured LabCorp sample data from{" "}
            <code className="text-xs">labcorp/Sample Test Data/tacit_data</code> (served via public/labcorp-samples).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <select
            className="h-10 min-w-[240px] rounded-md border border-input bg-background px-3 text-sm"
            value={demoKey}
            onChange={(e) => setDemoKey(e.target.value as ManuDemoBundleKey)}
          >
            {(Object.keys(MANU_DEMO_BUNDLES) as ManuDemoBundleKey[]).map((k) => (
              <option key={k} value={k}>
                {MANU_DEMO_BUNDLES[k].label}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="secondary"
            disabled={isAdding}
            onClick={async () => {
              setIsAdding(true);
              try {
                const docs = await loadLabCorpDemoBundle(demoKey);
                onDocumentsChange(docs);
                onMetadataFromBundle?.(getDefaultMetadataForBundle(demoKey));
              } finally {
                setIsAdding(false);
              }
            }}
          >
            Load sample bundle
          </Button>
        </CardContent>
      </Card>

      {( !hasFmea || !hasRegulatory ) && documents.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <div>
            {!hasFmea && <p>Risk-to-warning mapping will be limited without a Risk Assessment / FMEA file.</p>}
            {!hasRegulatory && <p>Regulatory checklist may be incomplete without certification notes.</p>}
            <p className="mt-1 text-muted-foreground">You can continue — MANU will surface gaps in the approval workspace.</p>
          </div>
        </div>
      )}

      {documents.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Uploaded documents ({documents.length})</h3>
          {documents.map((doc) => (
            <Card
              key={doc.id}
              className="overflow-hidden border-border/60 bg-card/75 shadow-sm transition-colors hover:border-primary/30"
            >
              <CardHeader className="gap-3 border-b border-border/50 bg-muted/10 px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <CardTitle className="truncate text-[0.95rem] font-semibold leading-5">
                          {doc.fileName}
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="border-emerald-500/25 bg-emerald-500/10 text-[0.65rem] capitalize text-emerald-400">
                            {doc.extractionStatus}
                          </Badge>
                          <span>{new Date(doc.uploadedAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start lg:self-center">
                    <Badge variant="outline" className="border-primary/20 bg-primary/5 text-[0.65rem]">
                      {Math.round(doc.parsingConfidence * 100)}% parse confidence
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => removeDoc(doc.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 px-4 py-4 lg:grid-cols-[minmax(240px,0.9fr)_minmax(0,1.1fr)]">
                <div className="rounded-lg border border-border/50 bg-background/40 p-3">
                  <Label className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Document category
                  </Label>
                  <Select
                    value={doc.category}
                    onValueChange={(v) => updateDoc(doc.id, { category: v as ManuDocumentCategory })}
                  >
                    <SelectTrigger className="mt-2 h-10 bg-background/70">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MANU_DOCUMENT_CATEGORY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <CardDescription className="mt-2 text-xs leading-5">
                    {getCategoryLabel(doc.category)}
                  </CardDescription>
                </div>
                <div className="rounded-lg border border-border/50 bg-background/40 p-3">
                  <Label className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Notes optional
                  </Label>
                  <Textarea
                    className="mt-2 min-h-[72px] resize-y border-border/60 bg-background/70 py-2"
                    value={doc.notes ?? ""}
                    onChange={(e) => updateDoc(doc.id, { notes: e.target.value })}
                    placeholder="Version, market, or extraction hints..."
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          className="bg-gradient-primary"
          disabled={documents.length === 0}
          onClick={onContinue}
        >
          Continue to manual configuration
        </Button>
      </div>
    </div>
  );
}
