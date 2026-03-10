import { useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface AutomationOutputModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  icon: string;
  loading?: boolean;
  error?: string | null;
  textContent?: string | null;
  imageUrl?: string | null;
}

export function AutomationOutputModal({
  open,
  onClose,
  title,
  icon,
  loading = false,
  error = null,
  textContent = null,
  imageUrl = null,
}: AutomationOutputModalProps) {
  const markdownContentRef = useRef<HTMLDivElement | null>(null);
  if (!open) return null;

  const safeTitle = (title || "automation-output").replace(/[^a-z0-9]+/gi, "-").toLowerCase();

  const exportRenderedMarkdownAsPdf = () => {
    const contentNode = markdownContentRef.current;
    if (!contentNode) return;

    const printWindow = window.open("", "_blank", "width=1200,height=900");
    if (!printWindow) return;

    const styles = `
      <style>
        @page { size: A4; margin: 18mm; }
        body { font-family: Inter, Arial, sans-serif; color: #111; line-height: 1.5; font-size: 12px; }
        h1, h2, h3, h4 { margin: 1em 0 0.5em; line-height: 1.25; }
        h1 { font-size: 24px; } h2 { font-size: 20px; } h3 { font-size: 16px; } h4 { font-size: 14px; }
        p { margin: 0.5em 0; }
        ul, ol { margin: 0.5em 0 0.75em 1.3em; }
        li { margin: 0.2em 0; }
        code { background: #f3f4f6; padding: 0.1em 0.35em; border-radius: 4px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
        pre { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; overflow: auto; }
        table { width: 100%; border-collapse: collapse; margin: 0.75em 0; }
        th, td { border: 1px solid #d1d5db; padding: 6px 8px; text-align: left; vertical-align: top; }
        th { background: #f3f4f6; font-weight: 600; }
        blockquote { margin: 0.8em 0; padding-left: 0.9em; border-left: 3px solid #9ca3af; color: #4b5563; }
      </style>
    `;

    printWindow.document.open();
    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${safeTitle}.pdf</title>
          ${styles}
        </head>
        <body>
          ${contentNode.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="fixed inset-0 z-[1200] bg-background/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="mx-auto mt-4 w-[98%] max-w-[1500px] rounded-2xl border border-primary/25 bg-card/95 shadow-elegant"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-primary/20 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">{icon}</span>
            <div className="text-sm font-semibold text-foreground">{title}</div>
          </div>
          <div className="flex items-center gap-2">
            {!!textContent && (
              <button
                type="button"
                onClick={() => void navigator.clipboard.writeText(textContent)}
                className="rounded-lg border border-primary/20 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10"
              >
                Copy
              </button>
            )}
            {!!textContent && (
              <button
                type="button"
                onClick={exportRenderedMarkdownAsPdf}
                className="rounded-lg border border-primary/20 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10"
              >
                Download
              </button>
            )}
            {!!imageUrl && (
              <a
                href={imageUrl}
                download={`${safeTitle}.png`}
                className="rounded-lg border border-primary/20 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10"
              >
                Download
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-primary/20 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10"
            >
              Close
            </button>
          </div>
        </div>

        <div className="max-h-[90vh] overflow-auto px-6 py-5 text-sm leading-relaxed text-foreground">
          {loading ? (
            <div className="py-20 text-center text-muted-foreground">Loading output…</div>
          ) : error ? (
            <div className="py-20 text-center text-red-400">{error}</div>
          ) : imageUrl ? (
            <img src={imageUrl} alt={`${title} output`} className="h-auto w-full rounded-lg object-contain" />
          ) : textContent ? (
            <div ref={markdownContentRef} className="prose prose-invert max-w-none prose-sm md:prose-base prose-headings:font-display prose-headings:font-bold prose-headings:text-foreground prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:text-foreground/95 prose-strong:text-foreground prose-a:text-primary prose-ul:list-disc prose-ol:list-decimal prose-li:marker:text-primary prose-li:text-foreground/95 prose-hr:border-primary/25 prose-blockquote:border-primary/30 prose-blockquote:text-muted-foreground prose-table:w-full prose-th:border prose-th:border-primary/30 prose-th:bg-primary/10 prose-th:px-3 prose-th:py-2 prose-td:border prose-td:border-primary/20 prose-td:px-3 prose-td:py-2 prose-code:text-primary prose-pre:border prose-pre:border-primary/20 prose-pre:bg-black/35">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{textContent}</ReactMarkdown>
            </div>
          ) : (
            <div className="py-20 text-center text-muted-foreground">No output available.</div>
          )}
        </div>
      </div>
    </div>
  );
}
