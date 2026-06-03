import { jsPDF } from "jspdf";
import type { ManuGeneratedSection, ManuManualMetadata } from "@/types/manu";

function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth) as string[];
}

export function downloadApprovedManualPdf(
  metadata: ManuManualMetadata,
  sections: ManuGeneratedSection[],
  runId: string,
): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (needed: number) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(metadata.productName || "Product Manual", margin, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const metaLines = [
    `Model: ${metadata.modelCode || "�"}`,
    `Type: ${metadata.manualType}`,
    `Revision: ${metadata.revision}`,
    `Markets: ${metadata.targetMarkets.join(", ") || "�"}`,
    `Audience: ${metadata.intendedAudience}`,
    `Approver role: ${metadata.approverRole}`,
    `Exported: ${new Date().toLocaleString()}`,
    `Run ID: ${runId.slice(0, 8)}`,
  ];
  metaLines.forEach((line) => {
    doc.text(line, margin, y);
    y += 5;
  });
  y += 4;

  doc.setDrawColor(180);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  sections.forEach((section, index) => {
    ensureSpace(24);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    const titleLines = wrapText(doc, `${index + 1}. ${section.title}`, contentWidth);
    titleLines.forEach((line) => {
      ensureSpace(7);
      doc.text(line, margin, y);
      y += 6;
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Confidence: ${Math.round(section.confidence * 100)}% � Status: ${section.status}`, margin, y);
    y += 5;
    doc.setTextColor(0);

    const bodyLines = wrapText(doc, section.content, contentWidth);
    bodyLines.forEach((line) => {
      ensureSpace(5);
      doc.text(line, margin, y);
      y += 4.5;
    });

    if (section.approverNotes?.trim()) {
      ensureSpace(10);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(80);
      const noteLines = wrapText(doc, `Approver notes: ${section.approverNotes}`, contentWidth);
      noteLines.forEach((line) => {
        ensureSpace(5);
        doc.text(line, margin, y);
        y += 4.5;
      });
      doc.setTextColor(0);
      doc.setFont("helvetica", "normal");
    }

    y += 6;
  });

  const safeName = (metadata.modelCode || metadata.productName || "manual")
    .replace(/[^\w.-]+/g, "_")
    .slice(0, 40);
  doc.save(`manu-${runId.slice(0, 8)}-approved_manual-${safeName}.pdf`);
}
