import type { EagleExtractionResult, EagleSection } from "@/features/eagle/eagleExtractionTypes";

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v, null, 2);
  return String(v);
}

function SectionBlock({ section }: { section: EagleSection }) {
  switch (section.type) {
    case "field_group":
      return (
        <div className="mission-brief-v4__eagle-section">
          <h4 className="mission-brief-v4__eagle-section-title">{section.title}</h4>
          <ul className="mission-brief-v4__eagle-field-list">
            {section.items.map((it, i) => (
              <li key={i} className="mission-brief-v4__eagle-field-row">
                <span className="mission-brief-v4__eagle-field-label">{it.label}</span>
                <span className="mission-brief-v4__eagle-field-value">{formatValue(it.value)}</span>
                {typeof it.confidence === "number" && (
                  <span className="mission-brief-v4__eagle-confidence">
                    {(it.confidence * 100).toFixed(0)}% conf.
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      );
    case "entity_group":
      return (
        <div className="mission-brief-v4__eagle-section">
          <h4 className="mission-brief-v4__eagle-section-title">{section.title}</h4>
          <ul className="mission-brief-v4__eagle-field-list">
            {section.items.map((it, i) => (
              <li key={i} className="mission-brief-v4__eagle-entity">
                <div className="mission-brief-v4__eagle-entity-label">{it.label}</div>
                <pre className="mission-brief-v4__eagle-entity-json">{formatValue(it.value)}</pre>
                {typeof it.confidence === "number" && (
                  <span className="mission-brief-v4__eagle-confidence">
                    {(it.confidence * 100).toFixed(0)}% conf.
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      );
    case "table":
      return (
        <div className="mission-brief-v4__eagle-section">
          <h4 className="mission-brief-v4__eagle-section-title">{section.title}</h4>
          <div className="mission-brief-v4__eagle-table-wrap">
            <table className="mission-brief-v4__eagle-table">
              <thead>
                <tr>
                  {section.columns.map((c, i) => (
                    <th key={i}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {section.rows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci}>{formatValue(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    case "text_block":
      return (
        <div className="mission-brief-v4__eagle-section">
          <h4 className="mission-brief-v4__eagle-section-title">{section.title}</h4>
          <p className="mission-brief-v4__eagle-text-block">{section.value}</p>
        </div>
      );
    default:
      return null;
  }
}

export type EagleExtractionReviewProps = {
  result: EagleExtractionResult;
};

export function EagleExtractionReview({ result }: EagleExtractionReviewProps) {
  const flags = result.flags ?? [];

  return (
    <div className="mission-brief-v4__eagle-review">
      <div className="mission-brief-v4__eagle-header">
        <span className="mission-brief-v4__eagle-doc-type">{result.document_label || result.document_type}</span>
        <span className="mission-brief-v4__eagle-doc-meta">{result.document_type}</span>
      </div>

      {flags.length > 0 && (
        <ul className="mission-brief-v4__eagle-flags">
          {flags.map((f, i) => (
            <li key={i} className={`mission-brief-v4__eagle-flag mission-brief-v4__eagle-flag--${f.severity}`}>
              {f.message}
            </li>
          ))}
        </ul>
      )}

      {Object.keys(result.summary).length > 0 && (
        <div className="mission-brief-v4__eagle-summary">
          <h4 className="mission-brief-v4__eagle-section-title">Summary</h4>
          <div className="mission-brief-v4__eagle-summary-grid">
            {Object.entries(result.summary).map(([k, v]) => (
              <div key={k} className="mission-brief-v4__eagle-summary-card">
                <span className="mission-brief-v4__eagle-summary-key">{k.replace(/_/g, " ")}</span>
                <span className="mission-brief-v4__eagle-summary-val">{formatValue(v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.sections.map((sec, i) => (
        <SectionBlock key={i} section={sec} />
      ))}
    </div>
  );
}
