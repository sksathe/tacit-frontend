import { getCategoryLabel } from "@/lib/manuSimulator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { manuSectionCardPalette } from "@/components/manu/manuTheme";
import type { ManuRun, ManuSectionStatus } from "@/types/manu";
import { AlertTriangle, CheckCircle2, Flag, Link2, ShieldAlert } from "lucide-react";
import { useMemo } from "react";

interface ManuApprovalWorkspaceProps {
  run: ManuRun;
  onRunChange: (run: ManuRun) => void;
  onContinueToTranslation: () => void;
  traceabilityOpen: boolean;
  onTraceabilityOpenChange: (open: boolean) => void;
}

function statusBadge(status: ManuSectionStatus, approvedClass?: string) {
  if (status === "approved") return <Badge className={approvedClass ?? "bg-emerald-600/90"}>Approved</Badge>;
  if (status === "flagged") return <Badge variant="destructive">Flagged</Badge>;
  return <Badge variant="secondary">Draft</Badge>;
}

function sectionCardClass(
  status: ManuSectionStatus,
  palette: (typeof manuSectionCardPalette)[number],
) {
  const base = `border-l-4 shadow-sm ${palette.card}`;
  if (status === "flagged") return `${base} border-l-destructive ring-1 ring-destructive/25`;
  if (status === "approved") return `${base} ring-1 ring-black/5 dark:ring-white/10`;
  return `${base} opacity-95`;
}

export function ManuApprovalWorkspace({
  run,
  onRunChange,
  onContinueToTranslation,
  traceabilityOpen,
  onTraceabilityOpenChange,
}: ManuApprovalWorkspaceProps) {
  const totalSections = run.generatedSections.length;
  const allSectionsApproved =
    totalSections > 0 && run.generatedSections.every((s) => s.status === "approved");
  const approvedCount = run.generatedSections.filter((s) => s.status === "approved").length;
  const focus = run.missionFocus;

  const updateSection = (id: string, patch: Partial<(typeof run.generatedSections)[0]>) => {
    const generatedSections = run.generatedSections.map((s) => (s.id === id ? { ...s, ...patch } : s));
    onRunChange({
      ...run,
      generatedSections,
      updatedAt: new Date().toISOString(),
      approvalStatus: {
        allRequiredApproved: generatedSections.every((s) => s.status === "approved"),
        approvedCount: generatedSections.filter((s) => s.status === "approved").length,
        flaggedCount: generatedSections.filter((s) => s.status === "flagged").length,
        requiredCount: generatedSections.length,
      },
    });
  };

  const approveAll = () => {
    onRunChange({
      ...run,
      generatedSections: run.generatedSections.map((s) => ({ ...s, status: "approved" as const, flagReason: undefined })),
      updatedAt: new Date().toISOString(),
      approvalStatus: {
        allRequiredApproved: true,
        approvedCount: run.generatedSections.length,
        flaggedCount: 0,
        requiredCount: run.generatedSections.length,
      },
    });
  };

  const coverageSummary = useMemo(() => {
    const covered = run.riskCoverage.filter((r) => r.coverageStatus === "covered").length;
    const missing = run.riskCoverage.filter((r) => r.coverageStatus === "missing").length;
    return { covered, missing, total: run.riskCoverage.length };
  }, [run.riskCoverage]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Manual approval workspace</h2>
          <p className="mt-1 text-muted-foreground">
            Review source intelligence and approve generated sections before translation or export.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Dialog open={traceabilityOpen} onOpenChange={onTraceabilityOpenChange}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Link2 className="h-4 w-4" />
                Traceability matrix
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[85vh]">
              <DialogHeader>
                <DialogTitle>Source traceability matrix</DialogTitle>
              </DialogHeader>
              <ScrollArea className="h-[60vh] pr-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Section</TableHead>
                      <TableHead>Fact</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {run.traceabilityMatrix.map((row, i) => (
                      <TableRow key={`${row.sectionId}-${i}`}>
                        <TableCell className="font-medium">{row.sectionTitle}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs">{row.fact}</TableCell>
                        <TableCell className="text-xs">{row.sourceDocument}</TableCell>
                        <TableCell>{Math.round(row.confidence * 100)}%</TableCell>
                        <TableCell>{row.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={approveAll}>Approve all sections</Button>
          <Button
            className="bg-gradient-primary"
            disabled={!allSectionsApproved}
            onClick={onContinueToTranslation}
          >
            Continue to translation QA
          </Button>
        </div>
      </div>

      {focus && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
          <p className="font-semibold text-primary">{focus.title}</p>
          <p className="mt-1 text-muted-foreground">{focus.description}</p>
        </div>
      )}

      {run.gaps.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
          {run.gaps.map((g) => (
            <p key={g} className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {g}
            </p>
          ))}
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        Approval progress: {approvedCount} of {totalSections} sections approved
        {!allSectionsApproved && " — approve all sections before translation or export (LabCorp workflow)."}
      </p>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Left: source intelligence */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wide text-primary">Source intelligence</h3>
          {run.extractedFacts.map((fact) => (
            <Card key={fact.id} className={fact.uncertain ? "border-amber-500/40" : "border-border/60"}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">{fact.group}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs font-medium text-muted-foreground">{fact.label}</p>
                <p className="mt-1 text-sm">{fact.value}</p>
                <p className="mt-2 text-xs text-muted-foreground">Confidence {Math.round(fact.confidence * 100)}%</p>
              </CardContent>
            </Card>
          ))}

          {(focus?.emphasizeRisk || run.riskCoverage.length > 0) && (
            <Card className={`border-border/60 ${focus?.emphasizeRisk ? "ring-1 ring-primary/40" : ""}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldAlert className="h-4 w-4 text-primary" />
                  Risk-to-warning mapping
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {run.riskCoverage.length > 0 ? (
                  <>
                <p className="text-xs text-muted-foreground">
                  {coverageSummary.covered} covered · {coverageSummary.missing} missing / needs review
                </p>
                {run.riskCoverage.map((r) => (
                  <div key={r.id} className="rounded-lg border border-border/50 p-3 text-sm">
                    <div className="flex justify-between gap-2">
                      <span className="font-medium">{r.hazard}</span>
                      <Badge variant={r.coverageStatus === "covered" ? "default" : "destructive"}>{r.coverageStatus}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Cause: {r.cause}</p>
                    <p className="text-xs text-muted-foreground">Mitigation: {r.mitigation}</p>
                    {r.manualWarning ? (
                      <p className="mt-2 rounded bg-muted/50 p-2 text-xs">{r.manualWarning}</p>
                    ) : (
                      <p className="mt-2 text-xs text-amber-500">No manual warning generated</p>
                    )}
                  </div>
                ))}
                  </>
                ) : (
                  <p className="text-sm text-amber-600">Risk-to-warning mapping unavailable or limited — no FMEA uploaded.</p>
                )}
              </CardContent>
            </Card>
          )}

          {(focus?.emphasizeRegulatory || run.regulatoryChecklist.length > 0) && (
            <Card className={`border-border/60 ${focus?.emphasizeRegulatory ? "ring-1 ring-primary/40" : ""}`}>
              <CardHeader>
                <CardTitle className="text-base">Regulatory mapping</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {run.regulatoryChecklist.length > 0 ? (
                  run.regulatoryChecklist.map((row) => (
                  <div key={row.id} className="rounded-lg border border-border/50 p-3 text-sm">
                    <p className="font-medium">{row.market}</p>
                    <p className="text-xs text-muted-foreground">{row.standard} · {row.certificationStatus}</p>
                    {row.requiredStatement && <p className="mt-1 text-xs">{row.requiredStatement}</p>}
                    {row.missingInfo && <p className="mt-1 text-xs text-amber-500">{row.missingInfo}</p>}
                  </div>
                  ))
                ) : (
                  <p className="text-sm text-amber-600">Regulatory checklist incomplete — no certification notes uploaded.</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: generated sections */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wide text-primary">Generated manual sections</h3>
          {run.generatedSections.map((section, index) => {
            const palette = manuSectionCardPalette[index % manuSectionCardPalette.length];
            return (
            <Card
              key={section.id}
              className={sectionCardClass(section.status, palette)}
            >
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <CardTitle className={`text-base ${palette.header}`}>{section.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    {statusBadge(section.status, palette.approvedBadge)}
                    <Badge variant="outline" className="border-border/80 bg-background/60">
                      {Math.round(section.confidence * 100)}% confidence
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {section.sourceReferences.map((ref) => (
                    <Badge
                      key={ref.documentId}
                      variant="outline"
                      className={`text-[0.6rem] ${palette.sourceChip}`}
                    >
                      {getCategoryLabel(ref.category)}
                    </Badge>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{section.content}</p>
                {section.riskFlags.map((f) => (
                  <p key={f} className="flex gap-2 text-xs text-amber-500">
                    <AlertTriangle className="h-3 w-3 shrink-0" /> {f}
                  </p>
                ))}
                {section.complianceFlags.map((f) => (
                  <p key={f} className="text-xs text-amber-500">{f}</p>
                ))}
                {section.flagReason && (
                  <p className="text-xs text-destructive">Flag reason: {section.flagReason}</p>
                )}
                <Textarea
                  placeholder="Approver notes…"
                  value={section.approverNotes ?? ""}
                  onChange={(e) => updateSection(section.id, { approverNotes: e.target.value })}
                  className="min-h-[60px] text-xs"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className={`gap-1 border-current/20 ${palette.header}`}
                    onClick={() => updateSection(section.id, { status: "approved", flagReason: undefined })}
                  >
                    <CheckCircle2 className="h-3 w-3" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-destructive"
                    onClick={() =>
                      updateSection(section.id, {
                        status: "flagged",
                        flagReason: section.approverNotes || "Requires revision — safety or compliance language",
                      })
                    }
                  >
                    <Flag className="h-3 w-3" /> Flag
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
          })}
        </div>
      </div>
    </div>
  );
}
