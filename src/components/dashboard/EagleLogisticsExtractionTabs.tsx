import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { LogisticsExtractionResult, LogisticsProcessResponse, LogisticsTable } from "@/types/logisticsExtraction";
import { LogisticsExtractionView, logisticsResultHasLineItemTables } from "./LogisticsExtractionView";

export type EagleLogisticsResultTabId = "summary" | "lineItems" | "raw";

export interface EagleLogisticsExtractionTabsProps {
  processResponse: LogisticsProcessResponse;
  normalized: LogisticsExtractionResult;
  activeTab: EagleLogisticsResultTabId;
  onTabChange: (tab: EagleLogisticsResultTabId) => void;
  /** Mission Brief uses theme class; workspace uses Tailwind defaults. */
  rawJsonClassName?: string;
  /** Title + actions row; kept sticky with the tab bar when stickyToolbar is set. */
  stickyHeader?: ReactNode;
  /**
   * Tab panels scroll inside a flex child; header + TabsList stay visible.
   * Parent should give a max-height (e.g. split column or results wrapper).
   */
  stickyToolbar?: boolean;
  /** Extra classes on the sticky strip (e.g. mission-brief background). */
  stickyStripClassName?: string;
  /** Controlled line-item tables for editing + Excel export. */
  lineItemTables: LogisticsTable[];
  onLineItemTablesChange: (tables: LogisticsTable[]) => void;
}

export function EagleLogisticsExtractionTabs({
  processResponse,
  normalized,
  activeTab,
  onTabChange,
  rawJsonClassName,
  stickyHeader,
  stickyToolbar,
  stickyStripClassName,
  lineItemTables,
  onLineItemTablesChange,
}: EagleLogisticsExtractionTabsProps) {
  const hasLineItems = logisticsResultHasLineItemTables(normalized);

  const rawPreClass = cn(
    rawJsonClassName ??
      "rounded-md border border-border/50 bg-muted/15 p-4 text-xs text-muted-foreground",
    !rawJsonClassName && !stickyToolbar && "max-h-[min(70vh,720px)] overflow-auto",
  );

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => onTabChange(v as EagleLogisticsResultTabId)}
      className={cn(stickyToolbar && "flex min-h-0 flex-1 flex-col")}
    >
      <div
        className={cn(
          "shrink-0 border-b border-primary/30 pb-2 dark:border-border/50",
          stickyToolbar
            ? cn("sticky top-0 z-10 bg-background px-3 sm:px-5", stickyStripClassName)
            : "px-1 sm:px-2",
        )}
      >
        {stickyHeader ? <div className="mb-3">{stickyHeader}</div> : null}
        <TabsList className="flex-wrap">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          {hasLineItems ? <TabsTrigger value="lineItems">Line items</TabsTrigger> : null}
          <TabsTrigger value="raw">Raw JSON</TabsTrigger>
        </TabsList>
      </div>
      <div
        className={cn(
          stickyToolbar && "min-h-0 flex-1 overflow-y-auto overflow-x-auto px-3 pb-2 pt-4 sm:px-5",
        )}
      >
        <TabsContent value="summary" className={cn(stickyToolbar ? "mt-0" : "mt-4")}>
          <LogisticsExtractionView data={normalized} variant="flat" sections="summary" />
        </TabsContent>
        <TabsContent value="lineItems" className={cn(stickyToolbar ? "mt-0" : "mt-4")}>
          <LogisticsExtractionView
            data={normalized}
            variant="flat"
            sections="tables"
            lineTables={lineItemTables}
            onLineTablesChange={onLineItemTablesChange}
            lineTablesEditable
          />
        </TabsContent>
        <TabsContent value="raw" className={cn(stickyToolbar ? "mt-0" : "mt-4")}>
          <pre
            className={rawPreClass}
            style={
              stickyToolbar
                ? ({ maxHeight: "none", overflowY: "visible", overflowX: "auto" } as const)
                : undefined
            }
          >
            {JSON.stringify(processResponse, null, 2)}
          </pre>
        </TabsContent>
      </div>
    </Tabs>
  );
}
