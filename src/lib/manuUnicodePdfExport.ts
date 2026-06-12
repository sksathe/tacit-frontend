import {
  getUnicodeFontForLang,
  prefersCanvasUnicodeRendering,
  renderUnicodeTextBlockPng,
  resolveLangCodeFromLabel,
} from "@/lib/manuPdfFonts";
import { getLangLabel, getTranslationRowsForLanguage } from "@/lib/manuTranslationUtils";
import type { ManuRun, ManuTranslationQARow } from "@/types/manu";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";

const PT_PER_MM = 72 / 25.4;
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 18 * PT_PER_MM;
const CONTENT_W = PAGE_W - MARGIN * 2;
const HEADER_H = 24 * PT_PER_MM;

const COLORS = {
  primary: rgb(12 / 255, 41 / 255, 84 / 255),
  muted: rgb(90 / 255, 95 / 255, 110 / 255),
  black: rgb(0, 0, 0),
  white: rgb(1, 1, 1),
};

const fontBytesCache = new Map<string, Uint8Array>();

async function loadFontBytes(url: string): Promise<Uint8Array> {
  const cached = fontBytesCache.get(url);
  if (cached) return cached;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load PDF font (${res.status})`);
  }
  const bytes = new Uint8Array(await res.arrayBuffer());
  fontBytesCache.set(url, bytes);
  return bytes;
}

async function embedBodyFont(pdfDoc: PDFDocument, langCode: string): Promise<PDFFont> {
  const config = getUnicodeFontForLang(langCode);
  if (config) {
    return pdfDoc.embedFont(await loadFontBytes(config.url));
  }
  return pdfDoc.embedFont(StandardFonts.Helvetica);
}

function safeName(value: string): string {
  return value.replace(/[^\w.-]+/g, "_").slice(0, 48);
}

function downloadPdfBytes(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)], {
    type: "application/pdf",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function wrapLines(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const lines: string[] = [];
  const paragraphs = text.split(/\n/);

  for (const paragraph of paragraphs) {
    if (!paragraph) {
      lines.push("");
      continue;
    }

    let line = "";
    for (const char of paragraph) {
      const candidate = line + char;
      const width = font.widthOfTextAtSize(candidate, fontSize);
      if (width > maxWidth && line) {
        lines.push(line);
        line = char;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);
  }

  return lines.length ? lines : [""];
}

type LayoutState = {
  pdfDoc: PDFDocument;
  page: PDFPage;
  yTop: number;
  bodyFont: PDFFont;
  latinFont: PDFFont;
  latinBold: PDFFont;
  langCode: string;
};

function ensureSpace(state: LayoutState, neededPt: number): void {
  if (state.yTop + neededPt <= PAGE_H - MARGIN) return;
  state.page = state.pdfDoc.addPage([PAGE_W, PAGE_H]);
  state.yTop = MARGIN;
}

function drawTextLine(
  state: LayoutState,
  text: string,
  font: PDFFont,
  fontSize: number,
  color = COLORS.black,
  lineHeight = fontSize * 1.45,
): void {
  ensureSpace(state, lineHeight);
  state.page.drawText(text, {
    x: MARGIN,
    y: PAGE_H - state.yTop - fontSize,
    size: fontSize,
    font,
    color,
  });
  state.yTop += lineHeight;
}

function drawWrappedText(
  state: LayoutState,
  text: string,
  font: PDFFont,
  fontSize: number,
  color = COLORS.black,
  lineHeight = fontSize * 1.45,
): void {
  for (const line of wrapLines(text, font, fontSize, CONTENT_W)) {
    if (!line) {
      state.yTop += lineHeight * 0.5;
      continue;
    }
    drawTextLine(state, line, font, fontSize, color, lineHeight);
  }
}

async function drawUnicodeTextBlockImage(
  state: LayoutState,
  text: string,
  fontSize: number,
  color = COLORS.black,
  langCode?: string | null,
): Promise<void> {
  const resolvedLang = langCode ?? state.langCode;
  const fontConfig = getUnicodeFontForLang(resolvedLang);
  if (!fontConfig) {
    drawWrappedText(state, text, state.bodyFont, fontSize, color);
    return;
  }

  const block = await renderUnicodeTextBlockPng(text, fontConfig, {
    maxWidthPt: CONTENT_W,
    fontSizePt: fontSize,
    lineHeightPt: fontSize * 1.45,
    color: { r: color.red, g: color.green, b: color.blue },
  });
  if (!block) return;

  ensureSpace(state, block.heightPt);
  const image = await state.pdfDoc.embedPng(block.pngBytes);
  state.page.drawImage(image, {
    x: MARGIN,
    y: PAGE_H - state.yTop - block.heightPt,
    width: block.widthPt,
    height: block.heightPt,
  });
  state.yTop += block.heightPt;
}

async function drawWrappedUnicodeSafe(
  state: LayoutState,
  text: string,
  fontSize: number,
  color = COLORS.black,
): Promise<void> {
  if (prefersCanvasUnicodeRendering(state.langCode)) {
    await drawUnicodeTextBlockImage(state, text, fontSize, color);
    return;
  }

  try {
    drawWrappedText(state, text, state.bodyFont, fontSize, color);
  } catch {
    await drawUnicodeTextBlockImage(state, text, fontSize, color);
  }
}

function drawReportHeader(state: LayoutState, title: string, subtitle: string): void {
  state.page.drawRectangle({
    x: 0,
    y: PAGE_H - HEADER_H,
    width: PAGE_W,
    height: HEADER_H,
    color: COLORS.primary,
  });
  state.page.drawText(title, {
    x: MARGIN,
    y: PAGE_H - 10 * PT_PER_MM,
    size: 14,
    font: state.latinBold,
    color: COLORS.white,
  });
  state.page.drawText(subtitle, {
    x: MARGIN,
    y: PAGE_H - 16 * PT_PER_MM,
    size: 9,
    font: state.latinFont,
    color: COLORS.white,
  });
  state.yTop = 32 * PT_PER_MM;
}

function drawSectionTitle(state: LayoutState, title: string): void {
  ensureSpace(state, 18);
  drawTextLine(state, title, state.latinBold, 12, COLORS.primary, 14);
  state.page.drawLine({
    start: { x: MARGIN, y: PAGE_H - state.yTop },
    end: { x: PAGE_W - MARGIN, y: PAGE_H - state.yTop },
    thickness: 0.5,
    color: rgb(220 / 255, 225 / 255, 235 / 255),
  });
  state.yTop += 6;
}

function drawKeyValueRows(
  state: LayoutState,
  rows: Array<{ key: string; value: string; langCode?: string | null }>,
  fonts: Map<string, PDFFont>,
): void {
  for (const row of rows) {
    const fontKey = row.langCode ?? "latin";
    const font = fonts.get(fontKey) ?? state.latinFont;
    drawWrappedText(state, `${row.key}: ${row.value || "-"}`, font, 9.5);
  }
  state.yTop += 4;
}

async function drawKeyValueRowsAsync(
  state: LayoutState,
  rows: Array<{ key: string; value: string; langCode?: string | null }>,
  fonts: Map<string, PDFFont>,
): Promise<void> {
  for (const row of rows) {
    if (row.langCode && prefersCanvasUnicodeRendering(row.langCode)) {
      drawTextLine(state, `${row.key}:`, state.latinFont, 9.5);
      await drawUnicodeTextBlockImage(state, row.value || "-", 9.5, COLORS.black, row.langCode);
      continue;
    }
    const fontKey = row.langCode ?? "latin";
    const font = fonts.get(fontKey) ?? state.latinFont;
    drawWrappedText(state, `${row.key}: ${row.value || "-"}`, font, 9.5);
  }
  state.yTop += 4;
}

async function createLayoutState(langCode: string): Promise<LayoutState> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const latinFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const latinBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const bodyFont = await embedBodyFont(pdfDoc, langCode);

  return {
    pdfDoc,
    page: pdfDoc.addPage([PAGE_W, PAGE_H]),
    yTop: MARGIN,
    bodyFont,
    latinFont,
    latinBold,
    langCode,
  };
}

async function saveTranslatedPdf(state: LayoutState, runId: string, langCode: string, productLabel: string): Promise<void> {
  const bytes = await state.pdfDoc.save();
  downloadPdfBytes(bytes, `manu-${runId.slice(0, 8)}-manual_${langCode}-${safeName(productLabel)}.pdf`);
}

export async function buildTranslatedManualPdfLib(run: ManuRun, langCode: string): Promise<void> {
  const langLabel = getLangLabel(langCode);
  const approvedRows = getTranslationRowsForLanguage(run.translationQA, langCode).filter(
    (row) => row.status === "approved",
  );
  if (approvedRows.length === 0) return;

  const metadata = run.manualConfig.metadata;
  const state = await createLayoutState(langCode);
  const latinOnly = new Map<string, PDFFont>([["latin", state.latinFont]]);

  drawReportHeader(
    state,
    `Approved Manual  ${langLabel}`,
    `${metadata.productName || "Product"} | Revision ${metadata.revision} | Exported ${new Date().toLocaleString()}`,
  );

  drawSectionTitle(state, "Manual Metadata");
  drawKeyValueRows(
    state,
    [
      { key: "Product", value: metadata.productName || "-" },
      { key: "Model", value: metadata.modelCode || "-" },
      { key: "Language", value: langLabel },
      { key: "Markets", value: metadata.targetMarkets.join(", ") || "-" },
      { key: "Approver Role", value: metadata.approverRole || "-" },
      { key: "Run ID", value: run.runId },
    ],
    latinOnly,
  );

  const sectionOrder = run.generatedSections.map((s) => s.id);
  const orderedRows = [...approvedRows].sort((a, b) => {
    const ai = sectionOrder.indexOf(a.sectionId);
    const bi = sectionOrder.indexOf(b.sectionId);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  for (const [index, row] of orderedRows.entries()) {
    drawSectionTitle(state, `${index + 1}. ${row.sectionTitle}`);
    drawTextLine(
      state,
      `Accuracy: ${Math.round(row.accuracyScore * 100)}% | Status: ${row.status ?? "approved"}`,
      state.latinFont,
      9,
      COLORS.muted,
    );
    await drawWrappedUnicodeSafe(state, row.translatedText, 9);
    if (row.approverNotes?.trim()) {
      await drawWrappedUnicodeSafe(state, `Approver notes: ${row.approverNotes}`, 9, COLORS.muted);
    }
    state.yTop += 8;
  }

  await saveTranslatedPdf(state, run.runId, langCode, metadata.modelCode || metadata.productName);
}

export async function buildTranslationQAPdfLib(run: ManuRun): Promise<void> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const latinFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const latinBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const fontByLang = new Map<string, PDFFont>();
  fontByLang.set("latin", latinFont);

  for (const row of run.translationQA) {
    const langCode = resolveLangCodeFromLabel(row.language);
    if (langCode && getUnicodeFontForLang(langCode) && !fontByLang.has(langCode)) {
      fontByLang.set(langCode, await embedBodyFont(pdfDoc, langCode));
    }
  }

  const state: LayoutState = {
    pdfDoc,
    page: pdfDoc.addPage([PAGE_W, PAGE_H]),
    yTop: MARGIN,
    bodyFont: latinFont,
    latinFont,
    latinBold,
    langCode: "en",
  };

  drawReportHeader(state, "Translation QA Report", `${run.client} | Run ${run.runId.slice(0, 8)}`);

  for (const [index, row] of run.translationQA.entries()) {
    const langCode = resolveLangCodeFromLabel(row.language);
    drawSectionTitle(state, `${index + 1}. ${row.sectionTitle} (${row.language})`);
    await drawKeyValueRowsAsync(
      state,
      [
        { key: "Approval Status", value: row.status ?? "draft" },
        { key: "Accuracy Score", value: `${Math.round(row.accuracyScore * 100)}%` },
        { key: "Source Text", value: row.sourceText },
        { key: "Translated Text", value: row.translatedText, langCode },
        { key: "Terminology Flags", value: row.terminologyFlags.join(" | ") || "-" },
        { key: "Missing Warnings", value: row.missingWarnings.join(" | ") || "-" },
        { key: "Approver Notes", value: row.approverNotes?.trim() || "-" },
        { key: "Flag Reason", value: row.flagReason?.trim() || "-" },
      ],
      fontByLang,
    );
  }

  const bytes = await pdfDoc.save();
  downloadPdfBytes(
    bytes,
    `manu-${run.runId.slice(0, 8)}-translation_qa-${safeName(run.manualConfig.metadata.modelCode || run.manualConfig.metadata.productName)}.pdf`,
  );
}

export function rowHasNonLatinScript(text: string): boolean {
  return /[\u0900-\u097F\u3040-\u30FF\u4E00-\u9FFF\u0600-\u06FF]/.test(text);
}

export function translationRowNeedsUnicodeFont(row: ManuTranslationQARow): boolean {
  const langCode = resolveLangCodeFromLabel(row.language);
  return Boolean(langCode && getUnicodeFontForLang(langCode)) || rowHasNonLatinScript(row.translatedText);
}
