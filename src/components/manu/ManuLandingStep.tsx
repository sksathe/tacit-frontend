import { MANU_DEMO_BUNDLES, MANU_MISSION_IDS } from "@/data/manuLabcorp";
import { MANU_MISSIONS } from "@/data/manuMissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ManuDemoBundleKey } from "@/data/manuLabcorp";
import type { ManuManualConfig, ManuMode, ManuRun, ManuUploadedDocument } from "@/types/manu";
import { simulateManuRun } from "@/lib/manuSimulator";
import { loadLabCorpDemoBundle } from "@/lib/manuSampleLoader";
import { getDefaultMetadataForBundle, getDefaultSectionsForMission } from "@/data/manuLabcorp";
import { MANU_DEFAULT_SECTIONS } from "@/data/manuSections";

export type ManuWorkspaceEntry =
  | { type: "flow" }
  | {
      type: "workspace";
      missionId: string;
      bundleKey: ManuDemoBundleKey;
      preApprove?: boolean;
      jumpToTranslation?: boolean;
    };

interface ManuLandingStepProps {
  onStartFlow: () => void;
  onOpenWorkspace: (entry: ManuWorkspaceEntry) => void;
}

const RECENT_CARDS: Array<{
  id: string;
  product: string;
  missionId: string;
  meta: string;
  time: string;
  chip: string;
  chipClass: string;
  bundleKey: ManuDemoBundleKey;
  preApprove?: boolean;
  jumpToTranslation?: boolean;
}> = [
  {
    id: "rm-1",
    product: "CentraSpin Ultra 24R",
    missionId: MANU_MISSION_IDS.productManualGen,
    meta: "MANU � Product Manual Generation",
    time: "Today � 4 source files",
    chip: "Awaiting Approval",
    chipClass: "border-amber-500/40 bg-amber-500/10 text-amber-600",
    bundleKey: "cs-ultra",
  },
  {
    id: "rm-2",
    product: "CentraSpin Ultra 24R",
    missionId: MANU_MISSION_IDS.translationQa,
    meta: "MANU � Translation Accuracy QA",
    time: "Yesterday � approved English source",
    chip: "Translation QA Complete",
    chipClass: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600",
    bundleKey: "cs-ultra",
    preApprove: true,
    jumpToTranslation: true,
  },
  {
    id: "rm-3",
    product: "HemaCount Pro 5000",
    missionId: MANU_MISSION_IDS.productManualGen,
    meta: "MANU � Product Manual Generation",
    time: "6 source files",
    chip: "Draft � Traceability review",
    chipClass: "border-border text-muted-foreground",
    bundleKey: "hcp-5000",
  },
];

export async function prepareWorkspaceRun(params: {
  missionId: string;
  bundleKey: ManuDemoBundleKey;
  preApprove?: boolean;
}): Promise<{ run: ManuRun; documents: ManuUploadedDocument[]; manualConfig: ManuManualConfig; mode: ManuMode }> {
  const documents = await loadLabCorpDemoBundle(params.bundleKey);
  const metadata = getDefaultMetadataForBundle(params.bundleKey);
  const manualConfig: ManuManualConfig = {
    selectedSectionIds: getDefaultSectionsForMission(
      params.missionId,
      MANU_DEFAULT_SECTIONS.map((s) => s.id),
    ),
    metadata,
  };
  const mission = MANU_MISSIONS.find((m) => m.id === params.missionId)!;
  let run = simulateManuRun({ mission, mode: "execute", documents, manualConfig });
  if (params.preApprove) {
    run = {
      ...run,
      generatedSections: run.generatedSections.map((s) => ({ ...s, status: "approved" as const })),
      approvalStatus: {
        allRequiredApproved: true,
        approvedCount: run.generatedSections.length,
        flaggedCount: 0,
        requiredCount: run.generatedSections.length,
      },
    };
  }
  return { run, documents, manualConfig, mode: "execute" };
}

export function ManuLandingStep({ onStartFlow, onOpenWorkspace }: ManuLandingStepProps) {
  return (
    <div className="space-y-10">
      <div className="text-center">
        <div className="mb-3 inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
          LabCorp � MANU Agent
        </div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Equipment Manual <span className="text-primary">Intelligence Workflow</span>
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          MANU ingests mixed technical source documents�PRDs, FMEA, regulatory notes, and validation reports�generates
          traceable product manuals, maps risks to warnings, and routes sections for approval before translation QA and audit export.
        </p>
        <div className="mx-auto mt-6 flex max-w-lg justify-center gap-8 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">5</div>
            <div className="text-xs text-muted-foreground">Mission types</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">13+</div>
            <div className="text-xs text-muted-foreground">Manual sections</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">4</div>
            <div className="text-xs text-muted-foreground">Sample products</div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted-foreground">Recent manuals</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {RECENT_CARDS.map((card) => (
            <Card
              key={card.id}
              className="cursor-pointer border-border/60 transition-all hover:border-primary/40 hover:shadow-md"
              onClick={() =>
                onOpenWorkspace({
                  type: "workspace",
                  missionId: card.missionId,
                  bundleKey: card.bundleKey,
                  preApprove: card.preApprove,
                  jumpToTranslation: card.jumpToTranslation,
                })
              }
            >
              <CardHeader className="pb-2">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-sm font-bold text-primary">
                  MANU
                </div>
                <CardTitle className="text-lg">{card.product}</CardTitle>
                <CardDescription>{card.meta}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-xs text-muted-foreground">{card.time}</p>
                <Badge variant="outline" className={card.chipClass}>
                  {card.chip}
                </Badge>
                <Button variant="secondary" className="mt-4 w-full" size="sm">
                  Open workspace ?
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted-foreground">Launch a new manual</h2>
        <Card className="border-primary/30 bg-card/60">
          <CardContent className="flex flex-col items-center gap-4 py-10 sm:flex-row sm:justify-between">
            <div className="text-left">
              <p className="font-semibold">MANU � Manual Intelligence Agent</p>
              <p className="text-sm text-muted-foreground">
                Client: LabCorp � Sample bundles: {Object.values(MANU_DEMO_BUNDLES).map((b) => b.modelCode).join(", ")}
              </p>
            </div>
            <Button className="bg-gradient-primary" onClick={onStartFlow}>
              Launch new mission ?
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
