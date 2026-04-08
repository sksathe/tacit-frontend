import * as XLSX from "xlsx";
import type { LogisticsProcessResponse, LogisticsTable } from "@/types/logisticsExtraction";

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Matches `eagle_logistics_poc/excel_writer.py` “Tables” sheet layout. */
export function logisticsTablesToSheetAoA(tables: LogisticsTable[]): (string | number)[][] {
  const aoa: (string | number)[][] = [];
  for (const tbl of tables) {
    if (tbl.columns.length === 0 && tbl.rows.length === 0) continue;
    aoa.push([tbl.title || tbl.id]);
    aoa.push([...tbl.columns]);
    for (const row of tbl.rows) {
      aoa.push(tbl.columns.map((c) => String(row[c] ?? "")));
    }
    aoa.push([]);
  }
  return aoa;
}

function replaceTablesSheet(wb: XLSX.WorkBook, tables: LogisticsTable[]): void {
  const aoa = logisticsTablesToSheetAoA(tables);
  const newWs = XLSX.utils.aoa_to_sheet(aoa);
  const name = "Tables";
  const idx = wb.SheetNames.indexOf(name);
  let insertAt: number;
  if (idx >= 0) {
    insertAt = idx;
    wb.SheetNames.splice(idx, 1);
    delete wb.Sheets[name];
  } else {
    const summaryIdx = wb.SheetNames.indexOf("Summary");
    insertAt = summaryIdx >= 0 ? summaryIdx + 1 : wb.SheetNames.length;
  }
  wb.SheetNames.splice(insertAt, 0, name);
  wb.Sheets[name] = newWs;
}

export function downloadLogisticsJson(response: LogisticsProcessResponse, filename = "eagle_extraction.json") {
  const blob = new Blob([JSON.stringify(response, null, 2)], { type: "application/json" });
  triggerDownload(blob, filename);
}

export interface DownloadLogisticsExcelOptions {
  /** When set, replaces the workbook’s “Tables” sheet to match these tables (user edits). */
  lineTables?: LogisticsTable[] | null;
}

export function downloadLogisticsExcel(
  base64: string,
  filename = "eagle_extraction.xlsx",
  options?: DownloadLogisticsExcelOptions,
) {
  if (options?.lineTables == null) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    triggerDownload(blob, filename);
    return;
  }

  const wb = XLSX.read(base64, { type: "base64" });
  replaceTablesSheet(wb, options.lineTables);
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([out], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  triggerDownload(blob, filename);
}

export function logisticsWarningsAsText(
  normalized: LogisticsProcessResponse["normalized_logistics"] | null | undefined
): string {
  if (!normalized?.warnings?.length) return "No validation notes.";
  return normalized.warnings
    .map((w) => {
      const code = w.code ? `[${w.code}] ` : "";
      return `${w.severity.toUpperCase()}: ${code}${w.message}`;
    })
    .join("\n");
}
