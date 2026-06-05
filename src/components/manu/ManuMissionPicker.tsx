import {
  BookOpen,
  FileCheck,
  FilePen,
  Languages,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MANU_MISSIONS } from "@/data/manuMissions";
import { MANU_MISSION_IDS } from "@/data/manuLabcorp";
import type { LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  [MANU_MISSION_IDS.productManualGen]: BookOpen,
  [MANU_MISSION_IDS.manualUpdate]: FilePen,
  [MANU_MISSION_IDS.riskCoverageQa]: ShieldCheck,
  [MANU_MISSION_IDS.regulatoryQa]: FileCheck,
  [MANU_MISSION_IDS.translationQa]: Languages,
};

export interface ManuMissionPickerProps {
  className?: string;
  variant?: "mission-brief" | "card";
  onSelect: (missionId: string) => void;
}

export function ManuMissionPicker({ className, variant = "mission-brief", onSelect }: ManuMissionPickerProps) {
  const mb = variant === "mission-brief";

  return (
    <div className={cn(mb ? "mission-brief-v4__manu-mission-picker" : "space-y-4", className)}>
      {mb ? (
        <>
          <h1 className="mission-brief-v4__screen-title">Choose your mission</h1>
          <p className="mission-brief-v4__screen-desc">
            Pick the documentation workflow MANU will run against your source document bundle.
          </p>
        </>
      ) : (
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-foreground">Choose your mission</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Select the workflow for manual generation, revision, or QA.
          </p>
        </div>
      )}

      <div className={cn(mb ? "mission-brief-v4__manu-mission-grid" : "grid gap-3 sm:grid-cols-2 lg:grid-cols-3")}>
        {MANU_MISSIONS.map((opt) => {
          const Icon = ICONS[opt.id] ?? BookOpen;
          return (
            <button
              key={opt.id}
              type="button"
              className={cn(
                mb && "mission-brief-v4__manu-mission-tile",
                !mb &&
                  "flex flex-col items-start gap-2 rounded-xl border border-primary/20 bg-card/40 p-4 text-left transition-colors hover:border-primary/45 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              )}
              onClick={() => onSelect(opt.id)}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span
                className={cn("font-bold text-foreground", mb ? "mission-brief-v4__manu-mission-tile-title" : "text-base")}
              >
                {opt.title}
              </span>
              <span
                className={cn(
                  "text-sm leading-snug text-muted-foreground",
                  mb && "mission-brief-v4__manu-mission-tile-desc",
                )}
              >
                {opt.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
