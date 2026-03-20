import { useEffect, useMemo, useRef, useState } from "react";

// pdfjs-dist recommends using legacy build in bundlers.
// Types are not always shipped, so we keep imports loosely typed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";

type Rect = { left: number; top: number; width: number; height: number };

type HighlightState = {
  query: string;
  pageHighlights: Record<number, Rect[]>;
};

type PdfRedlineViewerProps = {
  fileUrl: string | null;
  query: string | null;
  maxPages?: number;
  heightClassName?: string;
};

function normalizeQuery(s: string): string {
  const raw = String(s ?? "");
  return raw
    .replace(/[\u00A0]/g, " ")
    .replace(/[$€£]/g, "")
    .replace(/,/g, "")
    .trim()
    .toLowerCase();
}

export function PdfRedlineViewer({
  fileUrl,
  query,
  maxPages = 20,
  heightClassName = "h-[680px]",
}: PdfRedlineViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageRects, setPageRects] = useState<Record<number, Rect[]>>({});
  const [highlight, setHighlight] = useState<HighlightState | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [renderedScale, setRenderedScale] = useState<number>(1);

  const normalized = useMemo(() => (query ? normalizeQuery(query) : ""), [query]);

  useEffect(() => {
    // Configure worker for pdf.js
    try {
      // Vite resolves this URL at build time.
      (pdfjsLib as any).GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/legacy/build/pdf.worker.mjs",
        import.meta.url,
      ).toString();
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setNumPages(0);
    setPdfDoc(null);
    setPageRects({});
    setHighlight(null);

    async function load() {
      if (!fileUrl) return;
      const loadingTask = (pdfjsLib as any).getDocument({ url: fileUrl });
      const doc = await loadingTask.promise;
      if (cancelled) return;
      setNumPages(doc.numPages);
      setPdfDoc(doc);
    }

    load().catch(() => {
      // ignore load errors for POC; viewer will simply not highlight
    });

    return () => {
      cancelled = true;
    };
  }, [fileUrl]);

  // Render pages (canvas + text metrics used for highlight matching).
  useEffect(() => {
    let cancelled = false;
    async function render() {
      if (!pdfDoc || !containerRef.current) return;
      const parent = containerRef.current;
      parent.innerHTML = "";

      const pagesToRender = Math.min(numPages, maxPages);
      const parentWidth = parent.clientWidth || 900;
      const availableWidth = Math.max(parentWidth - 2, 320);

      const wrappers: HTMLDivElement[] = [];
      for (let pageNum = 1; pageNum <= pagesToRender; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        if (cancelled) return;

        const viewportScale1 = page.getViewport({ scale: 1 });
        const scale = availableWidth / viewportScale1.width;
        setRenderedScale(scale);

        const viewport = page.getViewport({ scale });

        const wrap = document.createElement("div");
        wrap.className = "relative mb-3 overflow-hidden rounded-lg border border-border/50 bg-background/40";
        wrap.style.width = `${viewport.width}px`;
        wrap.style.height = `${viewport.height}px`;

        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        wrap.appendChild(canvas);

        const overlay = document.createElement("div");
        overlay.className = "absolute inset-0 pointer-events-none";
        wrap.appendChild(overlay);

        parent.appendChild(wrap);
        wrappers.push(wrap);

        const renderCtx = {
          canvasContext: canvas.getContext("2d"),
          viewport,
        };

        await page.render(renderCtx).promise;

        // We compute highlights in a separate effect when query changes.
      }

      // If query changes later, we'll update highlights without re-rendering.
      if (!cancelled) {
        wrappers.forEach((wrap) => {
          const pageNum = Number(wrap.getAttribute("data-page-num") || 0);
          void pageNum;
        });
      }
    }

    render().catch(() => {
      // ignore
    });

    return () => {
      cancelled = true;
    };
  }, [pdfDoc, numPages, maxPages]);

  useEffect(() => {
    if (!normalized) {
      setPageRects({});
      setHighlight(null);
      return;
    }
    if (!fileUrl) return;
    if (!pdfDoc) return;

    let cancelled = false;
    async function compute() {
      const pagesToRender = Math.min(numPages, maxPages);
      const next: Record<number, Rect[]> = {};

      for (let pageNum = 1; pageNum <= pagesToRender; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        if (cancelled) return;

        const parentWidth = containerRef.current?.clientWidth ?? 900;
        const availableWidth = Math.max(parentWidth - 2, 320);
        const viewportScale1 = page.getViewport({ scale: 1 });
        const scale = availableWidth / viewportScale1.width;
        const viewport = page.getViewport({ scale });

        const textContent = await page.getTextContent();
        const rects = findRectsForQuery(textContent?.items ?? [], viewport, normalized);
        next[pageNum] = rects;
      }

      if (!cancelled) {
        setPageRects(next);
        setHighlight({ query: normalized, pageHighlights: next });
      }
    }

    compute().catch(() => {
      // ignore
    });

    return () => {
      cancelled = true;
    };
  }, [normalized, pdfDoc, numPages, maxPages, fileUrl]);

  // Draw overlay rectangles whenever pageRects changes.
  useEffect(() => {
    if (!containerRef.current) return;
    const wraps = Array.from(containerRef.current.querySelectorAll<HTMLDivElement>(".relative"));
    for (let i = 0; i < wraps.length; i++) {
      const wrap = wraps[i];
      const overlay = wrap.querySelector<HTMLDivElement>(".absolute.inset-0");
      if (!overlay) continue;
      overlay.innerHTML = "";

      const pageNum = i + 1; // render order is sequential from 1..pagesToRender
      const rects = pageRects[pageNum] ?? [];
      for (const r of rects.slice(0, 8)) {
        // Shift up slightly so the marker sits behind glyphs instead of under baseline.
        const markerTop = Math.max(0, r.top - r.height * 0.58);
        const markerHeight = Math.max(10, r.height * 1.2);
        const d = document.createElement("div");
        d.style.position = "absolute";
        d.style.left = `${r.left}px`;
        d.style.top = `${markerTop}px`;
        d.style.width = `${r.width}px`;
        d.style.height = `${markerHeight}px`;
        d.style.background = "rgba(34, 197, 94, 0.34)"; // marker-style green fill
        d.style.border = "none";
        d.style.borderRadius = "4px";
        d.style.boxShadow = "inset 0 0 0 1px rgba(22, 163, 74, 0.45)";
        overlay.appendChild(d);
      }
    }
  }, [pageRects]);

  function findRectsForQuery(textItems: any[], viewport: any, q: string): Rect[] {
    const rects: Rect[] = [];

    for (const item of textItems) {
      const str = String(item?.str ?? "");
      if (!str) continue;

      // Normalize item text similarly (remove commas, $ etc).
      const norm = normalizeQuery(str);
      if (!norm) continue;

      // Match partials for robustness.
      if (!(norm.includes(q) || q.includes(norm) || norm === q)) continue;

      // Approximate rectangle from item transform:
      // item.transform = [a, b, c, d, e, f]
      const transform = item.transform as number[];
      if (!transform || transform.length < 6) continue;
      const x = transform[4] as number;
      const y = transform[5] as number;
      const w = Number(item.width ?? 0);
      const h = Number(item.height ?? 0) || 10;

      // PDF coordinate: origin bottom-left.
      const left = x;
      const right = x + w;
      const top = y;
      const bottom = y - h;

      // Convert to viewport coordinates (DOM top-left).
      // convertToViewportRectangle expects [x1,y1,x2,y2] in PDF coords.
      const vr = viewport.convertToViewportRectangle([left, bottom, right, top]);
      const [x1, y1, x2, y2] = vr;
      const leftPx = Math.min(x1, x2);
      const topPx = Math.min(y1, y2);
      const widthPx = Math.abs(x2 - x1);
      const heightPx = Math.abs(y2 - y1);

      if (widthPx <= 0 || heightPx <= 0) continue;
      rects.push({ left: leftPx, top: topPx, width: widthPx, height: heightPx });
      if (rects.length >= 20) break;
    }

    return rects;
  }

  return (
    <div
      className={`${heightClassName} overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden`}
      ref={containerRef}
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      aria-label="PDF Redline Viewer"
    />
  );
}

