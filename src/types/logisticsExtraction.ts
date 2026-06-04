/**
 * Canonical logistics document extraction payload (Eagle agent).
 * Backend Python POC must emit this shape (camelCase keys).
 */

export type LogisticsDocumentType =
  | "bill_of_lading"
  | "packing_list"
  | "freight_quotation"
  | "unknown";

/** Eagle “mission” choice (user-selected before upload). Matches document types except unknown. */
export type EagleLogisticsMissionId = Exclude<LogisticsDocumentType, "unknown">;

export type LogisticsWarningSeverity = "info" | "warning" | "error";

export interface LogisticsField {
  key: string;
  label: string;
  value: string | null;
  highlight?: boolean;
}

export interface LogisticsFieldGroup {
  id: string;
  label: string;
  fields: LogisticsField[];
}

export interface LogisticsEntity {
  name: string;
  role?: string;
  details: Record<string, string>;
}

export interface LogisticsEntityGroup {
  label: string;
  entities: LogisticsEntity[];
}

export interface LogisticsTable {
  id: string;
  title: string;
  columns: string[];
  rows: Array<Record<string, string>>;
}

export interface LogisticsWarning {
  severity: LogisticsWarningSeverity;
  code?: string;
  message: string;
}

export interface LogisticsSummary {
  title?: string;
  bullets?: string[];
}

export interface LogisticsExtractionResult {
  documentType: LogisticsDocumentType;
  documentTypeLabel?: string;
  confidence?: number;
  summary: LogisticsSummary;
  fieldGroups: LogisticsFieldGroup[];
  entityGroups?: LogisticsEntityGroup[];
  tables: LogisticsTable[];
  warnings: LogisticsWarning[];
}

export interface LogisticsProcessResponse {
  ok: boolean;
  jobId: string;
  normalized_logistics: LogisticsExtractionResult;
  excel_filename?: string;
  excel_base64?: string;
  python_stdout?: string;
  python_stderr?: string;
}

/** Latest Eagle workspace state for studio export actions and parent layouts. */
export interface EagleWorkspaceSnapshot {
  processing: boolean;
  processResponse: LogisticsProcessResponse | null;
  /** Line-item tables (may include user edits); used when rebuilding the Excel “Tables” sheet on export. */
  lineItemTablesDraft?: LogisticsTable[] | null;
}
