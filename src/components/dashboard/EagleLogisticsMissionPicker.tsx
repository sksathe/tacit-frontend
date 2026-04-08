import { FileSpreadsheet, Package, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";
import { EAGLE_LOGISTICS_MISSION_OPTIONS } from "@/lib/eagleLogisticsMissions";
import type { EagleLogisticsMissionId } from "@/types/logisticsExtraction";

const ICONS: Record<EagleLogisticsMissionId, typeof ScrollText> = {
  bill_of_lading: ScrollText,
  packing_list: Package,
  freight_quotation: FileSpreadsheet,
};

export interface EagleLogisticsMissionPickerProps {
  className?: string;
  /** mission-brief: v4 CSS classes. card: Tailwind panel for Automate workspace. */
  variant?: "mission-brief" | "card";
  onSelect: (mission: EagleLogisticsMissionId) => void;
}

export function EagleLogisticsMissionPicker({
  className,
  variant = "mission-brief",
  onSelect,
}: EagleLogisticsMissionPickerProps) {
  const mb = variant === "mission-brief";

  return (
    <div className={cn(mb ? "mission-brief-v4__eagle-mission-picker" : "space-y-4", className)}>
      {mb ? (
        <>
          <h1 className="mission-brief-v4__screen-title">Choose your mission</h1>
          <p className="mission-brief-v4__screen-desc">
            Pick the document type you are working with. Eagle will tune extraction toward that format before you
            upload a file.
          </p>
        </>
      ) : (
        <>
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-foreground">Choose your mission</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Select the document type so extraction focuses on the right fields.
            </p>
          </div>
        </>
      )}

      <div className={cn(mb ? "mission-brief-v4__eagle-mission-grid" : "grid gap-3 sm:grid-cols-3")}>
        {EAGLE_LOGISTICS_MISSION_OPTIONS.map((opt) => {
          const Icon = ICONS[opt.id];
          return (
            <button
              key={opt.id}
              type="button"
              className={cn(
                mb && "mission-brief-v4__eagle-mission-tile",
                !mb &&
                  "flex flex-col items-start gap-2 rounded-xl border border-primary/20 bg-card/40 p-4 text-left transition-colors hover:border-primary/45 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              )}
              onClick={() => onSelect(opt.id)}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className={cn("font-bold text-foreground", mb ? "mission-brief-v4__eagle-mission-tile-title" : "text-base")}>
                {opt.title}
              </span>
              <span
                className={cn(
                  "text-sm leading-snug text-muted-foreground",
                  mb && "mission-brief-v4__eagle-mission-tile-desc",
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
