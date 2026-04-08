export type EagleFlagSeverity = "info" | "warning" | "error";

export type EagleFlag = {
  severity: EagleFlagSeverity;
  message: string;
};

export type EagleFieldGroupItem = {
  label: string;
  value: unknown;
  confidence?: number;
};

export type EagleEntityGroupItem = {
  label: string;
  value: Record<string, unknown>;
  confidence?: number;
};

export type EagleSection =
  | { type: "field_group"; title: string; items: EagleFieldGroupItem[] }
  | { type: "entity_group"; title: string; items: EagleEntityGroupItem[] }
  | { type: "table"; title: string; columns: string[]; rows: (string | number)[][] }
  | { type: "text_block"; title: string; value: string };

export type EagleExtractionResult = {
  document_type: string;
  document_label: string;
  summary: Record<string, string | number>;
  sections: EagleSection[];
  flags?: EagleFlag[];
};
