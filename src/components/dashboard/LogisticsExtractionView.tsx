import { useCallback, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { LogisticsExtractionResult, LogisticsTable, LogisticsWarningSeverity } from "@/types/logisticsExtraction";

function severityStyles(sev: LogisticsWarningSeverity): string {
  switch (sev) {
    case "error":
      return "border-destructive/40 bg-destructive/10 text-destructive";
    case "warning":
      return "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400";
    default:
      return "border-primary/30 bg-primary/5 text-foreground";
  }
}

/** Light: visible royal-blue segmentation; dark: softer dividers */
const flatSectionClass =
  "border-b-2 border-primary/35 pb-5 last:border-b-0 last:pb-0 dark:border-b dark:border-border/45";

const lineTableHeaderRowClass =
  "border-b-2 border-primary-foreground/25 bg-primary hover:bg-primary dark:border-border/55 dark:bg-muted dark:hover:bg-muted";

const lineTableHeadClass =
  "whitespace-nowrap py-3 text-left font-semibold text-primary-foreground dark:text-foreground";

/** `summary` = doc summary, warnings, field groups, entities (no tables). `tables` = line-item tables only. */
export type LogisticsExtractionSections = "all" | "summary" | "tables";

export interface LogisticsExtractionViewProps {
  data: LogisticsExtractionResult;
  className?: string;
  /** flat: dividers only (use inside Mission Brief / full-width shells). Default: Card blocks. */
  variant?: "card" | "flat";
  /** Default `all`. Use `summary` / `tables` to split into separate tabs. */
  sections?: LogisticsExtractionSections;
  /** Controlled line-item tables (clone of `data.tables`); required with `onLineTablesChange` for edits. */
  lineTables?: LogisticsTable[];
  onLineTablesChange?: (tables: LogisticsTable[]) => void;
  /** Shows “Edit table” to toggle cell inputs; use with `lineTables` + `onLineTablesChange`. */
  lineTablesEditable?: boolean;
}

export function logisticsResultHasLineItemTables(data: LogisticsExtractionResult): boolean {
  return data.tables.some((t) => t.columns.length > 0 || t.rows.length > 0);
}

export function LogisticsExtractionView({
  data,
  className,
  variant = "card",
  sections = "all",
  lineTables,
  onLineTablesChange,
  lineTablesEditable,
}: LogisticsExtractionViewProps) {
  const flat = variant === "flat";
  const [lineTableEditMode, setLineTableEditMode] = useState(false);
  const fieldGroups = data.fieldGroups.filter((g) => g.fields.length > 0);
  const entityGroups = (data.entityGroups ?? []).filter((eg) => eg.entities.length > 0);
  const tablesFromData = data.tables.filter((t) => t.columns.length > 0 || t.rows.length > 0);
  const tables = lineTables !== undefined ? lineTables : tablesFromData;

  const updateLineCell = useCallback(
    (tableId: string, rowIndex: number, col: string, value: string) => {
      if (!onLineTablesChange) return;
      const next = tables.map((t) => {
        if (t.id !== tableId) return t;
        const rows = t.rows.map((r, i) => (i === rowIndex ? { ...r, [col]: value } : r));
        return { ...t, rows };
      });
      onLineTablesChange(next);
    },
    [onLineTablesChange, tables],
  );
  const showSummaryParts = sections === "all" || sections === "summary";
  const showTablesParts = sections === "all" || sections === "tables";
  const docLabel =
    data.documentTypeLabel ||
    data.documentType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const summaryInner = (
    <>
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
        <span className="rounded-full border border-primary/35 bg-primary/10 px-2 py-0.5 font-bold uppercase tracking-wide text-primary">
          {docLabel}
        </span>
        {data.confidence != null && <span>Confidence: {Math.round(data.confidence * 100) / 100}</span>}
      </div>
      <div className="mt-3 space-y-3 text-sm">
        {data.summary.title && <p className="font-bold text-foreground">{data.summary.title}</p>}
        {data.summary.bullets && data.summary.bullets.length > 0 && (
          <ul className="list-disc space-y-1 pl-5 font-medium text-muted-foreground">
            {data.summary.bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        )}
        {!data.summary.title && (!data.summary.bullets || data.summary.bullets.length === 0) && (
          <p className="font-medium text-muted-foreground">No summary bullets returned.</p>
        )}
      </div>
    </>
  );

  return (
    <div className={cn(flat ? "space-y-8" : "space-y-6", className)}>
      {showSummaryParts &&
        (flat ? (
          <section className={flatSectionClass}>
            <h2 className="mb-3 text-lg font-bold text-primary">Summary</h2>
            {summaryInner}
          </section>
        ) : (
          <Card className="border-primary/25 bg-card/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-extrabold text-primary">Summary</CardTitle>
              {summaryInner}
            </CardHeader>
          </Card>
        ))}

      {showSummaryParts && data.warnings.length > 0 && (
        <div className={cn(flat && flatSectionClass, !flat && "space-y-2")}>
          <h3 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-primary">Warnings</h3>
          <ul className="space-y-2">
            {data.warnings.map((w, i) => (
              <li
                key={i}
                className={cn("rounded-lg border px-3 py-2 text-sm", severityStyles(w.severity))}
              >
                {w.code && <span className="mr-2 font-mono text-[0.7rem] opacity-80">{w.code}</span>}
                {w.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {showSummaryParts &&
        fieldGroups.map((group) =>
        flat ? (
          <section key={group.id} className={flatSectionClass}>
            <h3 className="mb-3 text-base font-extrabold text-foreground">{group.label}</h3>
            <dl className="grid gap-2 sm:grid-cols-2">
              {group.fields.map((f) => (
                <div
                  key={f.key}
                  className={cn(
                    "rounded-md border border-primary/30 bg-primary/[0.04] px-3 py-2 dark:border-border/55 dark:bg-muted/25",
                    f.highlight && "border-primary/55 bg-primary/[0.1] dark:border-primary/45 dark:bg-primary/10",
                  )}
                >
                  <dt className="text-[0.65rem] font-extrabold uppercase tracking-wide text-primary/80">
                    {f.label}
                  </dt>
                  <dd className="mt-0.5 break-words text-sm font-medium text-foreground">{f.value ?? "—"}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : (
          <Card key={group.id} className="border-primary/20 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-extrabold text-foreground">{group.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <dl className="grid gap-2 sm:grid-cols-2">
                {group.fields.map((f) => (
                  <div
                    key={f.key}
                    className={cn(
                      "rounded-md border border-primary/15 bg-background/50 px-3 py-2",
                      f.highlight && "border-primary/50 bg-primary/5",
                    )}
                  >
                    <dt className="text-[0.65rem] font-extrabold uppercase tracking-wide text-primary/80">
                      {f.label}
                    </dt>
                    <dd className="mt-0.5 break-words text-sm font-medium text-foreground">{f.value ?? "—"}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        ),
      )}

      {showSummaryParts &&
        entityGroups.map((eg, gi) =>
        flat ? (
          <section key={`eg-${gi}`} className={flatSectionClass}>
            <h3 className="mb-3 text-base font-extrabold text-foreground">{eg.label}</h3>
            <div className="space-y-4">
              {eg.entities.map((ent, ei) => (
                <div
                  key={`${ent.name}-${ei}`}
                  className="border-b-2 border-primary/25 pb-4 last:border-0 last:pb-0 dark:border-b dark:border-border/40"
                >
                  <div className="font-bold text-foreground">{ent.name}</div>
                  {ent.role && <div className="text-xs font-medium text-muted-foreground">{ent.role}</div>}
                  {Object.keys(ent.details).length > 0 && (
                    <dl className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
                      {Object.entries(ent.details).map(([k, v]) => (
                        <div key={k}>
                          <dt className="text-[0.65rem] font-semibold uppercase text-muted-foreground">{k}</dt>
                          <dd className="font-medium text-foreground">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : (
          <Card key={`eg-${gi}`} className="border-primary/20 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-foreground">{eg.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {eg.entities.map((ent, ei) => (
                <div key={`${ent.name}-${ei}`} className="rounded-lg border border-primary/15 bg-background/40 p-3">
                  <div className="font-semibold text-foreground">{ent.name}</div>
                  {ent.role && <div className="text-xs text-muted-foreground">{ent.role}</div>}
                  {Object.keys(ent.details).length > 0 && (
                    <dl className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
                      {Object.entries(ent.details).map(([k, v]) => (
                        <div key={k}>
                          <dt className="text-[0.65rem] uppercase text-muted-foreground">{k}</dt>
                          <dd className="text-foreground">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ),
      )}

      {showTablesParts && sections === "tables" && tables.length === 0 && (
        <p className="text-sm font-medium text-muted-foreground">No line item tables in this extraction.</p>
      )}

      {showTablesParts && tables.length > 0 && lineTablesEditable && onLineTablesChange && (
        <div className="mb-4 flex items-center gap-2">
          <Switch
            id="logistics-line-table-edit"
            checked={lineTableEditMode}
            onCheckedChange={setLineTableEditMode}
          />
          <Label htmlFor="logistics-line-table-edit" className="cursor-pointer text-sm font-semibold text-foreground">
            Edit table
          </Label>
        </div>
      )}

      {showTablesParts &&
        tables.map((tbl) =>
        flat ? (
          <section key={tbl.id} className={flatSectionClass}>
            <h3 className="mb-3 text-base font-extrabold text-foreground">{tbl.title}</h3>
            <div className="overflow-x-auto rounded-md border border-primary/30 dark:border-border/50">
              <Table>
                <TableHeader>
                  <TableRow className={lineTableHeaderRowClass}>
                    {tbl.columns.map((col) => (
                      <TableHead key={col} className={lineTableHeadClass}>
                        {col}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tbl.rows.map((row, ri) => (
                    <TableRow
                      key={ri}
                      className="border-b border-primary/30 odd:bg-background even:bg-primary/[0.05] hover:bg-primary/[0.08] dark:border-border/45 dark:even:bg-muted/20 dark:hover:bg-muted/35"
                    >
                      {tbl.columns.map((col) => (
                        <TableCell key={col} className="max-w-[min(100%,280px)] break-words px-3 py-2.5 text-sm font-medium">
                          {lineTableEditMode && onLineTablesChange ? (
                            <input
                              type="text"
                              className="w-full min-w-[5rem] rounded-md border border-input bg-background px-2 py-1.5 text-sm font-medium text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              value={row[col] ?? ""}
                              aria-label={`${tbl.title} row ${ri + 1} ${col}`}
                              onChange={(e) => updateLineCell(tbl.id, ri, col, e.target.value)}
                            />
                          ) : (
                            <span>{row[col]?.trim() ? row[col] : "—"}</span>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        ) : (
          <Card key={tbl.id} className="overflow-hidden border-primary/20 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-extrabold text-foreground">{tbl.title}</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0 sm:p-6 sm:pt-0">
              <Table>
                <TableHeader>
                  <TableRow className={lineTableHeaderRowClass}>
                    {tbl.columns.map((col) => (
                      <TableHead key={col} className={lineTableHeadClass}>
                        {col}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tbl.rows.map((row, ri) => (
                    <TableRow key={ri}>
                      {tbl.columns.map((col) => (
                        <TableCell key={col} className="max-w-[min(100%,280px)] break-words text-sm font-medium">
                          {lineTableEditMode && onLineTablesChange ? (
                            <input
                              type="text"
                              className="w-full min-w-[5rem] rounded-md border border-input bg-background px-2 py-1.5 text-sm font-medium text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              value={row[col] ?? ""}
                              aria-label={`${tbl.title} row ${ri + 1} ${col}`}
                              onChange={(e) => updateLineCell(tbl.id, ri, col, e.target.value)}
                            />
                          ) : (
                            <span>{row[col]?.trim() ? row[col] : "—"}</span>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ),
      )}
    </div>
  );
}
