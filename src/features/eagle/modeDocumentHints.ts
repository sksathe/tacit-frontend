/** Maps Mission Brief dispatch mode id -> backend EAGLE_DOCUMENT_TYPE_HINT */
export type EagleDocumentTypeHint = "bill_of_lading" | "packing_list" | "freight_quote";

const MAP: Record<string, EagleDocumentTypeHint> = {
  "freight-bol": "bill_of_lading",
  "receiving-wms": "packing_list",
  "freight-quote": "freight_quote",
};

export function eagleDocumentHintForMode(modeId: string | null | undefined): EagleDocumentTypeHint | undefined {
  if (!modeId) return undefined;
  return MAP[modeId];
}
