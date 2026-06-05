import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { downloadManuExportPdf } from "@/lib/manuPdfExport";
import type { ManuExportKind, ManuRun } from "@/types/manu";
import { useToast } from "@/components/ui/use-toast";
import { Download, FileText, Package } from "lucide-react";

const EXPORT_OPTIONS: { kind: ManuExportKind; title: string; description: string }[] = [
  { kind: "approved_manual", title: "Approved Manual", description: "Final approved sections as a formatted PDF for release records." },
  { kind: "traceability_matrix", title: "Source Traceability Matrix", description: "Section-to-source evidence mapping." },
  { kind: "risk_coverage", title: "Risk Coverage Report", description: "FMEA hazards mapped to manual warnings." },
  { kind: "regulatory_checklist", title: "Regulatory Checklist", description: "Market-specific certification and gaps." },
  { kind: "translation_qa", title: "Translation QA Report", description: "Section-level translation accuracy scores." },
  { kind: "audit_package", title: "Full Audit Package", description: "Combined export for LabCorp documentation audit." },
];

interface ManuExportStepProps {
  run: ManuRun;
  onRunChange: (run: ManuRun) => void;
  onRestart: () => void;
}

export function ManuExportStep({ run, onRunChange, onRestart }: ManuExportStepProps) {
  const { toast } = useToast();

  const markExported = (kind: ManuExportKind) => {
    onRunChange({
      ...run,
      exportStatus: { ...run.exportStatus, [kind]: "exported" },
      updatedAt: new Date().toISOString(),
    });
  };

  const exportApprovedManualPdf = () => {
    const sections = run.generatedSections.filter((s) => s.status === "approved");
    if (sections.length === 0) {
      toast({
        title: "No approved sections",
        description: "Approve sections in the workspace before exporting the manual.",
        variant: "destructive",
      });
      return;
    }
    downloadManuExportPdf("approved_manual", run);
    markExported("approved_manual");
    toast({
      title: "PDF ready",
      description: `Approved manual downloaded (${sections.length} sections).`,
    });
  };

  const exportOne = (kind: ManuExportKind) => {
    if (kind === "approved_manual") {
      exportApprovedManualPdf();
      return;
    }
    downloadManuExportPdf(kind, run);
    markExported(kind);
    toast({ title: "PDF ready", description: `${kind.replaceAll("_", " ")} downloaded as PDF.` });
  };

  const exportAll = () => {
    EXPORT_OPTIONS.forEach((o) => exportOne(o.kind));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Export documentation package</h2>
        <p className="mt-2 text-muted-foreground">
          Download auditable artifacts for LabCorp quality and regulatory records. All exports are generated as formatted PDF reports.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {EXPORT_OPTIONS.map((opt) => (
          <Card key={opt.kind}>
            <CardHeader>
              <CardTitle className="text-base">{opt.title}</CardTitle>
              <CardDescription>{opt.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full gap-2" onClick={() => exportOne(opt.kind)}>
                {opt.kind === "approved_manual" ? (
                  <FileText className="h-4 w-4" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Download PDF
                {run.exportStatus[opt.kind] === "exported" && (
                  <span className="text-xs text-emerald-500">✓</span>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button className="gap-2 bg-gradient-primary" onClick={exportAll}>
          <Package className="h-4 w-4" />
          Export full audit package
        </Button>
        <Button variant="outline" onClick={onRestart}>
          Start new MANU run
        </Button>
      </div>
    </div>
  );
}
