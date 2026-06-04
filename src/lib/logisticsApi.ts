import { apiClient } from "@/lib/apiClient";
import type {
  EagleLogisticsMissionId,
  LogisticsExtractionResult,
  LogisticsProcessResponse,
} from "@/types/logisticsExtraction";

function emptyResult(): LogisticsExtractionResult {
  return {
    documentType: "unknown",
    summary: { title: undefined, bullets: [] },
    fieldGroups: [],
    tables: [],
    warnings: [],
  };
}

function asString(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

/** Coerce backend / LLM output into the frontend contract. */
export function normalizeLogisticsExtractionResult(raw: unknown): LogisticsExtractionResult {
  if (!raw || typeof raw !== "object") return emptyResult();
  const o = raw as Record<string, unknown>;

  const documentType = (o.documentType as LogisticsExtractionResult["documentType"]) || "unknown";

  const summaryRaw = o.summary;
  const summary =
    summaryRaw && typeof summaryRaw === "object"
      ? {
          title: (summaryRaw as { title?: unknown }).title as string | undefined,
          bullets: Array.isArray((summaryRaw as { bullets?: unknown }).bullets)
            ? ((summaryRaw as { bullets: unknown[] }).bullets as unknown[]).map((b) => asString(b))
            : undefined,
        }
      : { title: undefined, bullets: [] };

  const fieldGroupsRaw = Array.isArray(o.fieldGroups) ? o.fieldGroups : [];
  const fieldGroups = fieldGroupsRaw.map((g, gi) => {
    const gr = g as Record<string, unknown>;
    const fieldsRaw = Array.isArray(gr.fields) ? gr.fields : [];
    return {
      id: asString(gr.id) || `group-${gi}`,
      label: asString(gr.label) || "Fields",
      fields: fieldsRaw.map((f, fi) => {
        const fr = f as Record<string, unknown>;
        return {
          key: asString(fr.key) || `field-${fi}`,
          label: asString(fr.label) || asString(fr.key) || "Field",
          value: fr.value == null ? null : asString(fr.value),
          highlight: Boolean(fr.highlight),
        };
      }),
    };
  });

  const entityGroupsRaw = Array.isArray(o.entityGroups) ? o.entityGroups : [];
  const entityGroups = entityGroupsRaw.map((g) => {
    const gr = g as Record<string, unknown>;
    const entitiesRaw = Array.isArray(gr.entities) ? gr.entities : [];
    return {
      label: asString(gr.label) || "Entities",
      entities: entitiesRaw.map((e) => {
        const er = e as Record<string, unknown>;
        const details = er.details && typeof er.details === "object" && !Array.isArray(er.details)
          ? Object.fromEntries(
              Object.entries(er.details as Record<string, unknown>).map(([k, v]) => [k, asString(v)])
            )
          : {};
        return {
          name: asString(er.name) || "—",
          role: er.role != null ? asString(er.role) : undefined,
          details,
        };
      }),
    };
  });

  const tablesRaw = Array.isArray(o.tables) ? o.tables : [];
  const tables = tablesRaw.map((t, ti) => {
    const tr = t as Record<string, unknown>;
    const columns = Array.isArray(tr.columns) ? (tr.columns as unknown[]).map((c) => asString(c)) : [];
    const rowsRaw = Array.isArray(tr.rows) ? tr.rows : [];
    const rows = rowsRaw.map((row) => {
      if (!row || typeof row !== "object") return {};
      return Object.fromEntries(
        Object.entries(row as Record<string, unknown>).map(([k, v]) => [k, asString(v)])
      );
    });
    return {
      id: asString(tr.id) || `table-${ti}`,
      title: asString(tr.title) || "Table",
      columns,
      rows,
    };
  });

  const warningsRaw = Array.isArray(o.warnings) ? o.warnings : [];
  const warnings = warningsRaw.map((w) => {
    const wr = w as Record<string, unknown>;
    const severity = wr.severity as LogisticsExtractionResult["warnings"][0]["severity"];
    return {
      severity: severity === "info" || severity === "warning" || severity === "error" ? severity : "info",
      code: wr.code != null ? asString(wr.code) : undefined,
      message: asString(wr.message) || "—",
    };
  });

  return {
    documentType,
    documentTypeLabel: o.documentTypeLabel != null ? asString(o.documentTypeLabel) : undefined,
    confidence: typeof o.confidence === "number" ? o.confidence : undefined,
    summary,
    fieldGroups,
    entityGroups: entityGroups.length ? entityGroups : undefined,
    tables,
    warnings,
  };
}

export function normalizeLogisticsProcessResponse(raw: unknown): LogisticsProcessResponse {
  if (!raw || typeof raw !== "object") {
    return {
      ok: false,
      jobId: "",
      normalized_logistics: emptyResult(),
    };
  }
  const o = raw as Record<string, unknown>;
  return {
    ok: Boolean(o.ok),
    jobId: asString(o.jobId),
    normalized_logistics: normalizeLogisticsExtractionResult(o.normalized_logistics),
    excel_filename: o.excel_filename != null ? asString(o.excel_filename) : undefined,
    excel_base64: o.excel_base64 != null ? asString(o.excel_base64) : undefined,
    python_stdout: o.python_stdout != null ? asString(o.python_stdout) : undefined,
    python_stderr: o.python_stderr != null ? asString(o.python_stderr) : undefined,
  };
}

export async function postLogisticsProcess(
  file: File,
  options?: { mission?: EagleLogisticsMissionId },
): Promise<LogisticsProcessResponse> {
  const fd = new FormData();
  fd.append("file", file);
  if (options?.mission) {
    fd.append("mission", options.mission);
  }
  const res = await apiClient.request("/api/logistics/process", {
    method: "POST",
    body: fd,
  });

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok) {
    const msg =
      body && typeof body === "object" && body !== null && "error" in body
        ? asString((body as { error?: unknown }).error)
        : `Request failed (${res.status})`;
    throw new Error(msg || `Request failed (${res.status})`);
  }

  return normalizeLogisticsProcessResponse(body);
}
