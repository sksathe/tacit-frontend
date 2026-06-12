import { MANU_LANGUAGES } from "@/data/manuLabcorp";
import { matchesTranslationLanguage } from "@/lib/manuTranslationUtils";
import type { jsPDF } from "jspdf";
import notoArabicUrl from "@fontsource/noto-sans-arabic/files/noto-sans-arabic-arabic-400-normal.woff2?url";
import notoDevanagariUrl from "@fontsource/noto-sans-devanagari/files/noto-sans-devanagari-devanagari-400-normal.woff2?url";
import notoJpUrl from "@fontsource/noto-sans-jp/files/noto-sans-jp-japanese-400-normal.woff2?url";
import notoScUrl from "@fontsource/noto-sans-sc/files/noto-sans-sc-chinese-simplified-400-normal.woff2?url";

export type UnicodePdfFont = {
  url: string;
  family: string;
};

const UNICODE_PDF_FONTS: Record<string, UnicodePdfFont> = {
  hi: { url: notoDevanagariUrl, family: "ManuNotoDevanagari" },
  ja: { url: notoJpUrl, family: "ManuNotoJP" },
  zh: { url: notoScUrl, family: "ManuNotoSC" },
  ar: { url: notoArabicUrl, family: "ManuNotoArabic" },
};

const loadedFontUrls = new Set<string>();
const MM_TO_PX = 96 / 25.4;

export function getUnicodeFontForLang(langCode: string): UnicodePdfFont | null {
  return UNICODE_PDF_FONTS[langCode] ?? null;
}

export function resolveLangCodeFromLabel(languageLabel: string): string | null {
  const match = MANU_LANGUAGES.find((l) => matchesTranslationLanguage(languageLabel, l.code));
  return match?.code ?? null;
}

export function needsUnicodePdfFont(langCode: string | null | undefined, text?: string): boolean {
  if (langCode && UNICODE_PDF_FONTS[langCode]) return true;
  if (!text) return false;
  return /[\u0900-\u097F\u3040-\u30FF\u4E00-\u9FFF\u0600-\u06FF]/.test(text);
}

async function ensureUnicodeFont(font: UnicodePdfFont): Promise<string> {
  if (loadedFontUrls.has(font.url)) {
    await document.fonts.ready;
    return font.family;
  }
  const face = new FontFace(font.family, `url(${font.url})`);
  await face.load();
  document.fonts.add(face);
  await document.fonts.ready;
  loadedFontUrls.add(font.url);
  return font.family;
}

export type UnicodeTextBlockImage = {
  pngBytes: Uint8Array;
  widthPt: number;
  heightPt: number;
};

const PT_TO_PX = 96 / 72;

export async function renderUnicodeTextBlockPng(
  text: string,
  font: UnicodePdfFont,
  options: {
    maxWidthPt: number;
    fontSizePt?: number;
    lineHeightPt?: number;
    color?: { r: number; g: number; b: number };
  },
): Promise<UnicodeTextBlockImage | null> {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const fontSizePt = options.fontSizePt ?? 9;
  const lineHeightPt = options.lineHeightPt ?? fontSizePt * 1.45;
  const scale = 2;
  const fontSizePx = fontSizePt * PT_TO_PX * scale;
  const maxWidthPx = options.maxWidthPt * PT_TO_PX * scale;
  const lineHeightPx = lineHeightPt * PT_TO_PX * scale;

  const family = await ensureUnicodeFont(font);

  const measureCanvas = document.createElement("canvas");
  const measureCtx = measureCanvas.getContext("2d");
  if (!measureCtx) return null;
  measureCtx.font = `${fontSizePx}px "${family}"`;
  const lines = wrapTextCanvas(measureCtx, trimmed, maxWidthPx);

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(maxWidthPx));
  canvas.height = Math.max(1, Math.ceil(lines.length * lineHeightPx));
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.font = `${fontSizePx}px "${family}"`;
  const color = options.color ?? { r: 0, g: 0, b: 0 };
  ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
  ctx.textBaseline = "top";
  lines.forEach((line, index) => {
    ctx.fillText(line, 0, index * lineHeightPx);
  });

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) return null;

  return {
    pngBytes: new Uint8Array(await blob.arrayBuffer()),
    widthPt: options.maxWidthPt,
    heightPt: canvas.height / scale / PT_TO_PX,
  };
}

/** Devanagari shaping is unreliable in fontkit outside browsers — rasterize instead. */
export function prefersCanvasUnicodeRendering(langCode: string): boolean {
  return langCode === "hi";
}

function wrapTextCanvas(ctx: CanvasRenderingContext2D, text: string, maxWidthPx: number): string[] {
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
      if (ctx.measureText(candidate).width > maxWidthPx && line) {
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

export async function drawUnicodeTextBlock(
  doc: jsPDF,
  text: string,
  options: {
    x: number;
    yRef: { y: number };
    maxWidthMm: number;
    font: UnicodePdfFont;
    fontSizePt?: number;
    lineHeightMm?: number;
    ensureSpace: (mm: number) => void;
    color?: [number, number, number];
  },
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;

  const fontSizePt = options.fontSizePt ?? 9;
  const lineHeightMm = options.lineHeightMm ?? 4.5;
  const scale = 2;
  const fontSizePx = fontSizePt * scale * (96 / 72);
  const maxWidthPx = options.maxWidthMm * MM_TO_PX * scale;
  const lineHeightPx = lineHeightMm * MM_TO_PX * scale;

  const family = await ensureUnicodeFont(options.font);

  const measureCanvas = document.createElement("canvas");
  const measureCtx = measureCanvas.getContext("2d");
  if (!measureCtx) return;
  measureCtx.font = `${fontSizePx}px "${family}"`;
  const lines = wrapTextCanvas(measureCtx, trimmed, maxWidthPx);

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(maxWidthPx));
  canvas.height = Math.max(1, Math.ceil(lines.length * lineHeightPx));
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.font = `${fontSizePx}px "${family}"`;
  ctx.fillStyle = options.color ? `rgb(${options.color.join(",")})` : "#111111";
  ctx.textBaseline = "top";
  lines.forEach((line, index) => {
    ctx.fillText(line, 0, index * lineHeightPx);
  });

  const blockHeightMm = canvas.height / scale / MM_TO_PX;
  options.ensureSpace(blockHeightMm);
  doc.addImage(
    canvas.toDataURL("image/png"),
    "PNG",
    options.x,
    options.yRef.y,
    options.maxWidthMm,
    blockHeightMm,
  );
  options.yRef.y += blockHeightMm;
}

export async function drawPdfText(
  doc: jsPDF,
  text: string,
  options: {
    x: number;
    yRef: { y: number };
    maxWidthMm: number;
    margin: number;
    ensureSpace: (mm: number) => void;
    langCode?: string | null;
    fontSizePt?: number;
    lineHeightMm?: number;
    color?: [number, number, number];
    fontStyle?: "normal" | "italic" | "bold";
  },
): Promise<void> {
  const font = options.langCode ? getUnicodeFontForLang(options.langCode) : null;
  if (font && needsUnicodePdfFont(options.langCode, text)) {
    await drawUnicodeTextBlock(doc, text, {
      x: options.x,
      yRef: options.yRef,
      maxWidthMm: options.maxWidthMm,
      font,
      fontSizePt: options.fontSizePt,
      lineHeightMm: options.lineHeightMm,
      ensureSpace: options.ensureSpace,
      color: options.color,
    });
    return;
  }

  const fontSizePt = options.fontSizePt ?? 9;
  doc.setFont("helvetica", options.fontStyle === "italic" ? "italic" : "normal");
  doc.setFontSize(fontSizePt);
  if (options.color) doc.setTextColor(...options.color);
  else doc.setTextColor(0, 0, 0);

  const lines = doc.splitTextToSize(text, options.maxWidthMm) as string[];
  lines.forEach((line) => {
    options.ensureSpace(options.lineHeightMm ?? 4.5);
    doc.text(line, options.x, options.yRef.y);
    options.yRef.y += options.lineHeightMm ?? 4.5;
  });
}
