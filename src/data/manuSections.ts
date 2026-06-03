export interface ManuSectionDefinition {
  id: string;
  title: string;
  required: boolean;
  advanced?: boolean;
}

export const MANU_DEFAULT_SECTIONS: ManuSectionDefinition[] = [
  { id: "product-overview", title: "Product Overview", required: true },
  { id: "intended-use", title: "Intended Use", required: true },
  { id: "system-description", title: "System Description", required: true },
  { id: "technical-specifications", title: "Technical Specifications", required: true },
  { id: "safety-warnings", title: "Safety Warnings and Precautions", required: true },
  { id: "installation-setup", title: "Installation / Setup", required: true },
  { id: "operating-instructions", title: "Operating Instructions", required: true },
  { id: "performance-characteristics", title: "Performance Characteristics", required: false },
  { id: "maintenance-cleaning", title: "Maintenance and Cleaning", required: true },
  { id: "troubleshooting", title: "Troubleshooting", required: false },
  { id: "regulatory-compliance", title: "Regulatory Compliance", required: true },
  { id: "country-certification", title: "Country-Specific Certification Notes", required: false },
  { id: "revision-history", title: "Revision History", required: true },
];

export const MANU_ADVANCED_SECTIONS: ManuSectionDefinition[] = [
  { id: "accessories-rotor", title: "Accessories / Rotor Compatibility", required: false, advanced: true },
  { id: "environmental-conditions", title: "Environmental Conditions", required: false, advanced: true },
  { id: "storage-transport", title: "Storage and Transport", required: false, advanced: true },
  { id: "decontamination", title: "Decontamination", required: false, advanced: true },
  { id: "service-instructions", title: "Service Instructions", required: false, advanced: true },
  { id: "quality-control", title: "Quality Control Requirements", required: false, advanced: true },
  { id: "post-market", title: "Post-Market / Reporting Obligations", required: false, advanced: true },
  { id: "labeling-requirements", title: "Labeling Requirements", required: false, advanced: true },
  { id: "risk-controls-summary", title: "Risk Controls Summary", required: false, advanced: true },
];

export const MANU_ALL_SECTIONS = [...MANU_DEFAULT_SECTIONS, ...MANU_ADVANCED_SECTIONS];

export const MANU_DOCUMENT_CATEGORY_OPTIONS = [
  { value: "prd", label: "Product Requirements Document" },
  { value: "engineering_test", label: "Engineering Test Report" },
  { value: "fmea", label: "Risk Assessment / FMEA" },
  { value: "regulatory", label: "Regulatory Certification Notes" },
  { value: "existing_manual", label: "Existing Manual" },
  { value: "translation", label: "Translation File" },
  { value: "quality_validation", label: "Quality / Validation Report" },
  { value: "labeling", label: "Labeling Notes" },
  { value: "other", label: "Other Supporting Document" },
] as const;

export const MANU_PROCESSING_STAGES = [
  "Reading source documents",
  "Extracting requirements and test evidence",
  "Mapping risks to warnings",
  "Applying manual template",
  "Running compliance and completeness checks",
  "Preparing approval workspace",
];
