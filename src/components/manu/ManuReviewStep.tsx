import { MANU_MISSIONS } from "@/data/manuMissions";
import { MANU_ALL_SECTIONS } from "@/data/manuSections";
import { getCategoryLabel } from "@/lib/manuSimulator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ManuManualConfig, ManuUploadedDocument } from "@/types/manu";
import { Rocket } from "lucide-react";

interface ManuReviewStepProps {
  missionId: string;
  documents: ManuUploadedDocument[];
  manualConfig: ManuManualConfig;
  onLaunch: () => void | Promise<void>;
  onBack: () => void;
  isLaunching?: boolean;
}

export function ManuReviewStep({ missionId, documents, manualConfig, onLaunch, onBack, isLaunching }: ManuReviewStepProps) {
  const mission = MANU_MISSIONS.find((m) => m.id === missionId);
  const sectionTitles = MANU_ALL_SECTIONS.filter((s) => manualConfig.selectedSectionIds.includes(s.id)).map((s) => s.title);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Review and launch</h2>
        <p className="mt-2 text-muted-foreground">Confirm mission, source bundle, and manual configuration before MANU executes the pipeline.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Mission</CardTitle></CardHeader>
        <CardContent>
          <p className="font-medium">{mission?.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{mission?.description}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Source document bundle ({documents.length} files)</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {documents.map((d) => (
            <div key={d.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>{d.fileName}</span>
              <Badge variant="outline">{getCategoryLabel(d.category)}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Manual configuration</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p><span className="text-muted-foreground">Product:</span> {manualConfig.metadata.productName} ({manualConfig.metadata.modelCode})</p>
          <p><span className="text-muted-foreground">Markets:</span> {manualConfig.metadata.targetMarkets.join(", ") || "—"}</p>
          <p><span className="text-muted-foreground">Languages:</span> {manualConfig.metadata.targetLanguages.join(", ") || "English only"}</p>
          <p className="text-muted-foreground">Sections ({sectionTitles.length}):</p>
          <div className="flex flex-wrap gap-1.5">
            {sectionTitles.map((t) => (
              <Badge key={t} variant="secondary" className="text-[0.65rem]">{t}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>Back</Button>
        <Button className="gap-2 bg-gradient-primary" onClick={onLaunch} disabled={isLaunching}>
          <Rocket className="h-4 w-4" />
          {isLaunching ? "Launching…" : "Launch MANU"}
        </Button>
      </div>
    </div>
  );
}
