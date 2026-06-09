import { jsPDF } from "jspdf";
import { getLangLabel, getTranslationRowsForLanguage } from "@/lib/manuTranslationUtils";
import type { ManuExportKind, ManuGeneratedSection, ManuManualMetadata, ManuRun } from "@/types/manu";

function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth) as string[];
}

const COLORS = {
  primary: [12, 41, 84] as [number, number, number],
  accent: [26, 188, 156] as [number, number, number],
  textMuted: [90, 95, 110] as [number, number, number],
  border: [220, 225, 235] as [number, number, number],
};

function safeName(value: string): string {
  return value.replace(/[^\w.-]+/g, "_").slice(0, 48);
}

function createPdf(): { doc: jsPDF; margin: number; pageWidth: number; contentWidth: number } {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  return { doc, margin, pageWidth, contentWidth };
}

function createEnsureSpace(doc: jsPDF, margin: number, yRef: { y: number }) {
  return (needed: number) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    if (yRef.y + needed > pageHeight - margin) {
      doc.addPage();
      yRef.y = margin;
    }
  };
}

function drawReportHeader(
  doc: jsPDF,
  title: string,
  subtitle: string,
  margin: number,
  pageWidth: number,
  yRef: { y: number },
) {
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 24, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title, margin, 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(subtitle, margin, 16);
  doc.setTextColor(0, 0, 0);
  yRef.y = 32;
}

function drawSectionTitle(doc: jsPDF, title: string, margin: number, yRef: { y: number }) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.primary);
  doc.text(title, margin, yRef.y);
  yRef.y += 4;
  doc.setDrawColor(...COLORS.border);
  doc.line(margin, yRef.y, doc.internal.pageSize.getWidth() - margin, yRef.y);
  doc.setTextColor(0, 0, 0);
  yRef.y += 6;
}

function drawKeyValueRows(
  doc: jsPDF,
  rows: Array<{ key: string; value: string }>,
  margin: number,
  contentWidth: number,
  yRef: { y: number },
  ensureSpace: (needed: number) => void,
) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  rows.forEach((row) => {
    const line = `${row.key}: ${row.value || "-"}`;
    const lines = wrapText(doc, line, contentWidth);
    lines.forEach((lineText) => {
      ensureSpace(5);
      doc.text(lineText, margin, yRef.y);
      yRef.y += 4.2;
    });
  });
  yRef.y += 2;
}

function savePdf(doc: jsPDF, runId: string, suffix: string, modelCodeOrProduct: string) {
  const base = safeName(modelCodeOrProduct || "manual");
  doc.save(`manu-${runId.slice(0, 8)}-${suffix}-${base}.pdf`);
}

export function downloadApprovedManualPdf(metadata: ManuManualMetadata, sections: ManuGeneratedSection[], runId: string): void {
  const { doc, margin, pageWidth, contentWidth } = createPdf();
  const yRef = { y: margin };
  const ensureSpace = createEnsureSpace(doc, margin, yRef);

  drawReportHeader(
    doc,
    "Approved Manual",
    `${metadata.productName || "Product"} | Revision ${metadata.revision} | Exported ${new Date().toLocaleString()}`,
    margin,
    pageWidth,
    yRef,
  );

  drawSectionTitle(doc, "Manual Metadata", margin, yRef);
  drawKeyValueRows(
    doc,
    [
      { key: "Product", value: metadata.productName || "-" },
      { key: "Model", value: metadata.modelCode || "-" },
      { key: "Manual Type", value: metadata.manualType || "-" },
      { key: "Markets", value: metadata.targetMarkets.join(", ") || "-" },
      { key: "Languages", value: metadata.targetLanguages.join(", ") || "-" },
      { key: "Audience", value: metadata.intendedAudience || "-" },
      { key: "Approver Role", value: metadata.approverRole || "-" },
      { key: "Run ID", value: runId },
    ],
    margin,
    contentWidth,
    yRef,
    ensureSpace,
  );

  sections.forEach((section, index) => {
    ensureSpace(20);
    drawSectionTitle(doc, `${index + 1}. ${section.title}`, margin, yRef);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.textMuted);
    doc.text(`Confidence: ${Math.round(section.confidence * 100)}% | Status: ${section.status}`, margin, yRef.y);
    yRef.y += 5;
    doc.setTextColor(0, 0, 0);

    const bodyLines = wrapText(doc, section.content, contentWidth);
    bodyLines.forEach((line) => {
      ensureSpace(5);
      doc.text(line, margin, yRef.y);
      yRef.y += 4.5;
    });
    if (section.approverNotes?.trim()) {
      yRef.y += 2;
      doc.setFont("helvetica", "italic");
      doc.setTextColor(...COLORS.textMuted);
      wrapText(doc, `Approver notes: ${section.approverNotes}`, contentWidth).forEach((line) => {
        ensureSpace(5);
        doc.text(line, margin, yRef.y);
        yRef.y += 4.2;
      });
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
    }
    yRef.y += 6;
  });

  savePdf(doc, runId, "approved_manual", metadata.modelCode || metadata.productName);
}

export function downloadTraceabilityMatrixPdf(run: ManuRun): void {
  const { doc, margin, pageWidth, contentWidth } = createPdf();
  const yRef = { y: margin };
  const ensureSpace = createEnsureSpace(doc, margin, yRef);
  drawReportHeader(doc, "Source Traceability Matrix", `${run.client} | Run ${run.runId.slice(0, 8)}`, margin, pageWidth, yRef);

  run.traceabilityMatrix.forEach((row, index) => {
    ensureSpace(18);
    drawSectionTitle(doc, `${index + 1}. ${row.sectionTitle}`, margin, yRef);
    drawKeyValueRows(
      doc,
      [
        { key: "Section ID", value: row.sectionId },
        { key: "Fact", value: row.fact },
        { key: "Source Document", value: row.sourceDocument },
        { key: "Excerpt", value: row.excerpt },
        { key: "Confidence", value: `${Math.round(row.confidence * 100)}%` },
        { key: "Status", value: row.status },
      ],
      margin,
      contentWidth,
      yRef,
      ensureSpace,
    );
  });

  savePdf(doc, run.runId, "traceability_matrix", run.manualConfig.metadata.modelCode || run.manualConfig.metadata.productName);
}

export function downloadRiskCoveragePdf(run: ManuRun): void {
  const { doc, margin, pageWidth, contentWidth } = createPdf();
  const yRef = { y: margin };
  const ensureSpace = createEnsureSpace(doc, margin, yRef);
  drawReportHeader(doc, "Risk Coverage Report", `${run.client} | Run ${run.runId.slice(0, 8)}`, margin, pageWidth, yRef);

  run.riskCoverage.forEach((row, index) => {
    ensureSpace(22);
    drawSectionTitle(doc, `${index + 1}. Hazard: ${row.hazard || "-"}`, margin, yRef);
    drawKeyValueRows(
      doc,
      [
        { key: "Cause", value: row.cause },
        { key: "Effect", value: row.effect },
        { key: "Mitigation", value: row.mitigation },
        { key: "Manual Warning", value: row.manualWarning },
        { key: "Coverage Status", value: row.coverageStatus },
      ],
      margin,
      contentWidth,
      yRef,
      ensureSpace,
    );
  });

  savePdf(doc, run.runId, "risk_coverage", run.manualConfig.metadata.modelCode || run.manualConfig.metadata.productName);
}

export function downloadRegulatoryChecklistPdf(run: ManuRun): void {
  const { doc, margin, pageWidth, contentWidth } = createPdf();
  const yRef = { y: margin };
  const ensureSpace = createEnsureSpace(doc, margin, yRef);
  drawReportHeader(doc, "Regulatory Checklist", `${run.client} | Run ${run.runId.slice(0, 8)}`, margin, pageWidth, yRef);

  run.regulatoryChecklist.forEach((row, index) => {
    ensureSpace(22);
    drawSectionTitle(doc, `${index + 1}. ${row.market} - ${row.standard}`, margin, yRef);
    drawKeyValueRows(
      doc,
      [
        { key: "Certification Status", value: row.certificationStatus },
        { key: "Required Statement", value: row.requiredStatement },
        { key: "Missing Info", value: row.missingInfo || "-" },
        { key: "Post Market Obligation", value: row.postMarketObligation || "-" },
      ],
      margin,
      contentWidth,
      yRef,
      ensureSpace,
    );
  });

  savePdf(doc, run.runId, "regulatory_checklist", run.manualConfig.metadata.modelCode || run.manualConfig.metadata.productName);
}

export function downloadTranslationQAPdf(run: ManuRun): void {
  const { doc, margin, pageWidth, contentWidth } = createPdf();
  const yRef = { y: margin };
  const ensureSpace = createEnsureSpace(doc, margin, yRef);
  drawReportHeader(doc, "Translation QA Report", `${run.client} | Run ${run.runId.slice(0, 8)}`, margin, pageWidth, yRef);

  run.translationQA.forEach((row, index) => {
    ensureSpace(26);
    drawSectionTitle(doc, `${index + 1}. ${row.sectionTitle} (${row.language})`, margin, yRef);
    drawKeyValueRows(
      doc,
      [
        { key: "Approval Status", value: row.status ?? "draft" },
        { key: "Accuracy Score", value: `${Math.round(row.accuracyScore * 100)}%` },
        { key: "Source Text", value: row.sourceText },
        { key: "Translated Text", value: row.translatedText },
        { key: "Terminology Flags", value: row.terminologyFlags.join(" | ") || "-" },
        { key: "Missing Warnings", value: row.missingWarnings.join(" | ") || "-" },
        { key: "Approver Notes", value: row.approverNotes?.trim() || "-" },
        { key: "Flag Reason", value: row.flagReason?.trim() || "-" },
      ],
      margin,
      contentWidth,
      yRef,
      ensureSpace,
    );
  });

  savePdf(doc, run.runId, "translation_qa", run.manualConfig.metadata.modelCode || run.manualConfig.metadata.productName);
}

export function downloadTranslatedManualPdf(run: ManuRun, langCode: string): void {
  const langLabel = getLangLabel(langCode);
  const approvedRows = getTranslationRowsForLanguage(run.translationQA, langCode).filter(
    (row) => row.status === "approved",
  );
  if (approvedRows.length === 0) return;

  const { doc, margin, pageWidth, contentWidth } = createPdf();
  const yRef = { y: margin };
  const ensureSpace = createEnsureSpace(doc, margin, yRef);
  const metadata = run.manualConfig.metadata;

  drawReportHeader(
    doc,
    `Approved Manual — ${langLabel}`,
    `${metadata.productName || "Product"} | Revision ${metadata.revision} | Exported ${new Date().toLocaleString()}`,
    margin,
    pageWidth,
    yRef,
  );

  drawSectionTitle(doc, "Manual Metadata", margin, yRef);
  drawKeyValueRows(
    doc,
    [
      { key: "Product", value: metadata.productName || "-" },
      { key: "Model", value: metadata.modelCode || "-" },
      { key: "Language", value: langLabel },
      { key: "Markets", value: metadata.targetMarkets.join(", ") || "-" },
      { key: "Approver Role", value: metadata.approverRole || "-" },
      { key: "Run ID", value: run.runId },
    ],
    margin,
    contentWidth,
    yRef,
    ensureSpace,
  );

  const sectionOrder = run.generatedSections.map((s) => s.id);
  const orderedRows = [...approvedRows].sort((a, b) => {
    const ai = sectionOrder.indexOf(a.sectionId);
    const bi = sectionOrder.indexOf(b.sectionId);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  orderedRows.forEach((row, index) => {
    ensureSpace(20);
    drawSectionTitle(doc, `${index + 1}. ${row.sectionTitle}`, margin, yRef);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.textMuted);
    doc.text(
      `Accuracy: ${Math.round(row.accuracyScore * 100)}% | Status: ${row.status ?? "approved"}`,
      margin,
      yRef.y,
    );
    yRef.y += 5;
    doc.setTextColor(0, 0, 0);

    const bodyLines = wrapText(doc, row.translatedText, contentWidth);
    bodyLines.forEach((line) => {
      ensureSpace(5);
      doc.text(line, margin, yRef.y);
      yRef.y += 4.5;
    });

    if (row.approverNotes?.trim()) {
      yRef.y += 2;
      doc.setFont("helvetica", "italic");
      doc.setTextColor(...COLORS.textMuted);
      wrapText(doc, `Approver notes: ${row.approverNotes}`, contentWidth).forEach((line) => {
        ensureSpace(5);
        doc.text(line, margin, yRef.y);
        yRef.y += 4.2;
      });
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
    }
    yRef.y += 6;
  });

  savePdf(doc, run.runId, `manual_${langCode}`, metadata.modelCode || metadata.productName);
}

export function downloadAuditPackagePdf(run: ManuRun): void {
  const { doc, margin, pageWidth, contentWidth } = createPdf();
  const yRef = { y: margin };
  const ensureSpace = createEnsureSpace(doc, margin, yRef);
  drawReportHeader(doc, "Full Audit Package", `${run.client} | Run ${run.runId.slice(0, 8)}`, margin, pageWidth, yRef);

  drawSectionTitle(doc, "Run Summary", margin, yRef);
  drawKeyValueRows(
    doc,
    [
      { key: "Mission", value: run.missionId },
      { key: "Mode", value: run.mode },
      { key: "Product", value: run.manualConfig.metadata.productName },
      { key: "Model", value: run.manualConfig.metadata.modelCode },
      { key: "Approved Sections", value: String(run.generatedSections.filter((s) => s.status === "approved").length) },
      { key: "Traceability Rows", value: String(run.traceabilityMatrix.length) },
      { key: "Risk Mappings", value: String(run.riskCoverage.length) },
      { key: "Regulatory Rows", value: String(run.regulatoryChecklist.length) },
      { key: "Translation Rows", value: String(run.translationQA.length) },
      { key: "Approved Translations", value: String(run.translationQA.filter((r) => r.status === "approved").length) },
      { key: "Gaps", value: run.gaps.join(" | ") || "-" },
    ],
    margin,
    contentWidth,
    yRef,
    ensureSpace,
  );

  drawSectionTitle(doc, "Evidence Documents", margin, yRef);
  run.uploadedDocuments.forEach((d) => {
    ensureSpace(6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text(`- ${d.fileName} (${d.category})`, margin, yRef.y);
    yRef.y += 4.5;
  });

  savePdf(doc, run.runId, "audit_package", run.manualConfig.metadata.modelCode || run.manualConfig.metadata.productName);
}

export function downloadManuExportPdf(kind: ManuExportKind, run: ManuRun): void {
  switch (kind) {
    case "approved_manual":
      downloadApprovedManualPdf(
        run.manualConfig.metadata,
        run.generatedSections.filter((s) => s.status === "approved"),
        run.runId,
      );
      return;
    case "traceability_matrix":
      downloadTraceabilityMatrixPdf(run);
      return;
    case "risk_coverage":
      downloadRiskCoveragePdf(run);
      return;
    case "regulatory_checklist":
      downloadRegulatoryChecklistPdf(run);
      return;
    case "translation_qa":
      downloadTranslationQAPdf(run);
      return;
    case "audit_package":
      downloadAuditPackagePdf(run);
      return;
  }
}
