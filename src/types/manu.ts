export const MANU_AGENT_ID = "manu";
export const MANU_CLIENT = "LabCorp";

export type ManuMode = "discover" | "execute";

export type ManuDocumentCategory =
  | "prd"
  | "engineering_test"
  | "fmea"
  | "regulatory"
  | "existing_manual"
  | "translation"
  | "quality_validation"
  | "labeling"
  | "other";

export type ManuExtractionStatus = "pending" | "processing" | "complete" | "partial" | "simulated" | "failed";

export type ManuSectionStatus = "draft" | "approved" | "flagged";

export type ManuCoverageStatus = "covered" | "missing" | "needs_review";

export interface ManuMission {
  id: string;
  title: string;
  description: string;
  outputs: string[];
}

export interface ManuUploadedDocument {
  id: string;
  fileName: string;
  fileType: string;
  category: ManuDocumentCategory;
  uploadedAt: string;
  extractedText: string;
  extractionStatus: ManuExtractionStatus;
  parsingConfidence: number;
  notes?: string;
}

export interface ManuManualMetadata {
  productName: string;
  modelCode: string;
  manualType: string;
  targetMarkets: string[];
  targetLanguages: string[];
  intendedAudience: string;
  templateType: string;
  revision: string;
  approverRole: string;
}

export interface ManuManualConfig {
  selectedSectionIds: string[];
  metadata: ManuManualMetadata;
}

export interface ManuExtractedFact {
  id: string;
  group: string;
  label: string;
  value: string;
  sourceDocumentIds: string[];
  confidence: number;
  uncertain?: boolean;
}

export interface ManuSourceReference {
  documentId: string;
  documentName: string;
  category: ManuDocumentCategory;
  excerpt: string;
}

export interface ManuGeneratedSection {
  id: string;
  title: string;
  content: string;
  confidence: number;
  sourceReferences: ManuSourceReference[];
  relatedDocumentIds: string[];
  riskFlags: string[];
  complianceFlags: string[];
  status: ManuSectionStatus;
  flagReason?: string;
  approverNotes?: string;
  required: boolean;
}

export interface ManuTraceabilityRow {
  sectionId: string;
  sectionTitle: string;
  fact: string;
  sourceDocument: string;
  excerpt: string;
  confidence: number;
  status: ManuSectionStatus;
}

export interface ManuRiskMapping {
  id: string;
  hazard: string;
  cause: string;
  effect: string;
  mitigation: string;
  manualWarning: string;
  coverageStatus: ManuCoverageStatus;
}

export interface ManuRegulatoryRow {
  id: string;
  market: string;
  standard: string;
  certificationStatus: string;
  requiredStatement: string;
  missingInfo: string;
  postMarketObligation?: string;
}

export interface ManuTranslationQARow {
  sectionId: string;
  sectionTitle: string;
  sourceText: string;
  translatedText: string;
  language: string;
  accuracyScore: number;
  terminologyFlags: string[];
  missingWarnings: string[];
  status: ManuSectionStatus;
  flagReason?: string;
  approverNotes?: string;
}

export type ManuExportKind =
  | "approved_manual"
  | "traceability_matrix"
  | "risk_coverage"
  | "regulatory_checklist"
  | "translation_qa"
  | "audit_package";

export interface ManuRun {
  runId: string;
  agentId: string;
  missionId: string;
  mode: ManuMode;
  client: string;
  uploadedDocuments: ManuUploadedDocument[];
  documentClassifications: Record<string, ManuDocumentCategory>;
  extractedFacts: ManuExtractedFact[];
  manualConfig: ManuManualConfig;
  generatedSections: ManuGeneratedSection[];
  traceabilityMatrix: ManuTraceabilityRow[];
  riskCoverage: ManuRiskMapping[];
  regulatoryChecklist: ManuRegulatoryRow[];
  approvalStatus: {
    allRequiredApproved: boolean;
    approvedCount: number;
    flaggedCount: number;
    requiredCount: number;
  };
  translationApprovalStatus: {
    allRequiredApproved: boolean;
    approvedCount: number;
    flaggedCount: number;
    requiredCount: number;
  };
  translationQA: ManuTranslationQARow[];
  exportStatus: Record<ManuExportKind, "idle" | "ready" | "exported">;
  gaps: string[];
  missionFocus?: {
    title: string;
    description: string;
    emphasizeRisk: boolean;
    emphasizeRegulatory: boolean;
    emphasizeTranslation: boolean;
    emphasizeRevision: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export type ManuRunStatus = "queued" | "processing" | "ready" | "failed";

export interface ManuRunJobStatus {
  runId: string;
  status: ManuRunStatus;
  stageIndex: number;
  stageLabel: string;
  progress: number;
  error?: string;
}

export type ManuFlowStep =
  | "landing"
  | "mode"
  | "mission"
  | "documents"
  | "config"
  | "review"
  | "processing"
  | "workspace"
  | "translation"
  | "export";
