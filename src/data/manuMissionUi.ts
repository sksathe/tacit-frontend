import { MANU_MISSION_IDS } from "@/data/manuLabcorp";
import { MANU_ADVANCED_SECTIONS, MANU_DEFAULT_SECTIONS, MANU_ALL_SECTIONS } from "@/data/manuSections";

export type ManuMissionUiProfile = {
  configTitle: string;
  configDescription: string;
  bundleDescription: string;
  bundleContinueLabel: string;
  /** Which manual sections appear on the configure step */
  sectionMode: "full" | "filtered" | "locked";
  /** When filtered/locked ù section ids to show */
  sectionIds: string[];
  showManualType: boolean;
  showTemplate: boolean;
  showMarkets: boolean;
  showLanguages: boolean;
  showAudience: boolean;
  showApprover: boolean;
  /** Emphasize target languages (translation QA) */
  languagesPrimary: boolean;
  /** Emphasize revision field (manual update) */
  revisionPrimary: boolean;
  requiredDocCategories: Array<{ category: string; label: string; required: boolean }>;
  bundleWarnings: Array<{ when: (counts: Record<string, number>) => boolean; message: string }>;
  /** Approval workspace copy */
  workspaceTitle: string;
  workspaceDescription: string;
  sourceColumnTitle: string;
  sectionsColumnTitle: string;
  continueButtonLabel: string;
  approvalProgressHint: string;
  showRiskPanel: boolean;
  showRegulatoryPanel: boolean;
  showTraceability: boolean;
};

const TRANSLATION_QA_SECTIONS = [
  "safety-warnings",
  "intended-use",
  "regulatory-compliance",
  "operating-instructions",
];

const RISK_QA_SECTIONS = ["safety-warnings", "risk-controls-summary", "decontamination"];

const REGULATORY_QA_SECTIONS = [
  "regulatory-compliance",
  "country-certification",
  "labeling-requirements",
  "post-market",
  "revision-history",
];

const PROFILES: Record<string, ManuMissionUiProfile> = {
  [MANU_MISSION_IDS.productManualGen]: {
    configTitle: "Configure manual",
    configDescription: "Define product metadata and which manual sections MANU should generate.",
    bundleDescription:
      "Upload PRD, engineering reports, FMEA, and regulatory notes. MANU maps evidence to manual sections.",
    bundleContinueLabel: "Continue to manual configuration",
    sectionMode: "full",
    sectionIds: MANU_ALL_SECTIONS.map((s) => s.id),
    showManualType: true,
    showTemplate: true,
    showMarkets: true,
    showLanguages: true,
    showAudience: true,
    showApprover: true,
    languagesPrimary: false,
    revisionPrimary: false,
    requiredDocCategories: [
      { category: "fmea", label: "FMEA / risk assessment", required: false },
      { category: "regulatory", label: "Regulatory notes", required: false },
    ],
    bundleWarnings: [
      {
        when: (c) => !c.fmea,
        message: "Risk-to-warning mapping will be limited without a Risk Assessment / FMEA file.",
      },
      {
        when: (c) => !c.regulatory,
        message: "Regulatory checklist may be incomplete without certification notes.",
      },
    ],
    workspaceTitle: "Manual approval workspace",
    workspaceDescription:
      "Review source intelligence and approve generated sections before translation or export.",
    sourceColumnTitle: "Source intelligence",
    sectionsColumnTitle: "Generated manual sections",
    continueButtonLabel: "Continue to translation QA",
    approvalProgressHint: "approve all sections before translation or export (LabCorp workflow)",
    showRiskPanel: true,
    showRegulatoryPanel: true,
    showTraceability: true,
  },
  [MANU_MISSION_IDS.manualUpdate]: {
    configTitle: "Configure manual update",
    configDescription:
      "Set product identity and sections to revise. Upload the existing manual in the source bundle for redline comparison.",
    bundleDescription:
      "Include the existing manual plus any new PRD, FMEA, or regulatory files that drive this revision.",
    bundleContinueLabel: "Continue to update configuration",
    sectionMode: "full",
    sectionIds: MANU_ALL_SECTIONS.map((s) => s.id),
    showManualType: true,
    showTemplate: true,
    showMarkets: true,
    showLanguages: false,
    showAudience: true,
    showApprover: true,
    languagesPrimary: false,
    revisionPrimary: true,
    requiredDocCategories: [
      { category: "existing_manual", label: "Existing manual (baseline)", required: true },
    ],
    bundleWarnings: [
      {
        when: (c) => !c.existing_manual,
        message: "No existing manual uploaded ù MANU will treat this as a new manual with revision notes.",
      },
    ],
    workspaceTitle: "Manual update approval workspace",
    workspaceDescription:
      "Review revision evidence and approve updated sections before export.",
    sourceColumnTitle: "Source intelligence",
    sectionsColumnTitle: "Revised manual sections",
    continueButtonLabel: "Continue to translation QA",
    approvalProgressHint: "approve all revised sections before export",
    showRiskPanel: true,
    showRegulatoryPanel: true,
    showTraceability: true,
  },
  [MANU_MISSION_IDS.riskCoverageQa]: {
    configTitle: "Configure risk coverage QA",
    configDescription:
      "Select safety-related manual sections to validate against FMEA hazards. MANU produces a risk coverage report.",
    bundleDescription: "Upload FMEA / risk assessment and the manual (or draft warnings) to compare coverage.",
    bundleContinueLabel: "Continue to risk QA configuration",
    sectionMode: "filtered",
    sectionIds: RISK_QA_SECTIONS,
    showManualType: false,
    showTemplate: false,
    showMarkets: false,
    showLanguages: false,
    showAudience: false,
    showApprover: true,
    languagesPrimary: false,
    revisionPrimary: false,
    requiredDocCategories: [{ category: "fmea", label: "FMEA / risk assessment", required: true }],
    bundleWarnings: [
      {
        when: (c) => !c.fmea,
        message: "Risk coverage QA requires an FMEA or risk assessment document.",
      },
    ],
    workspaceTitle: "Risk coverage approval workspace",
    workspaceDescription:
      "Review FMEA mapping and approve safety sections before export.",
    sourceColumnTitle: "Source intelligence",
    sectionsColumnTitle: "Safety sections & coverage report",
    continueButtonLabel: "Continue to export",
    approvalProgressHint: "approve all safety sections before export",
    showRiskPanel: true,
    showRegulatoryPanel: false,
    showTraceability: true,
  },
  [MANU_MISSION_IDS.regulatoryQa]: {
    configTitle: "Configure regulatory compliance QA",
    configDescription:
      "Set target markets and regulatory sections to validate. MANU checks certification requirements against source evidence.",
    bundleDescription: "Upload regulatory certification notes and the manual sections to audit for market compliance.",
    bundleContinueLabel: "Continue to regulatory QA configuration",
    sectionMode: "filtered",
    sectionIds: REGULATORY_QA_SECTIONS,
    showManualType: false,
    showTemplate: false,
    showMarkets: true,
    showLanguages: false,
    showAudience: false,
    showApprover: true,
    languagesPrimary: false,
    revisionPrimary: false,
    requiredDocCategories: [{ category: "regulatory", label: "Regulatory certification notes", required: true }],
    bundleWarnings: [
      {
        when: (c) => !c.regulatory,
        message: "Regulatory QA works best with certification / submission notes in the bundle.",
      },
    ],
    workspaceTitle: "Regulatory QA approval workspace",
    workspaceDescription:
      "Review certification evidence and approve regulatory sections before export.",
    sourceColumnTitle: "Source intelligence",
    sectionsColumnTitle: "Regulatory sections & gap report",
    continueButtonLabel: "Continue to export",
    approvalProgressHint: "approve all regulatory sections before export",
    showRiskPanel: false,
    showRegulatoryPanel: true,
    showTraceability: true,
  },
  [MANU_MISSION_IDS.translationQa]: {
    configTitle: "Configure translation QA",
    configDescription:
      "Set product identity and English source sections. Optionally select target languages ó if none are chosen, the workflow stays English-only with no translation step.",
    bundleDescription:
      "Upload source documents (PRD, existing English manual, regulatory notes). Translated output is generated from approved English sections ù reference translation files are optional.",
    bundleContinueLabel: "Continue to translation QA configuration",
    sectionMode: "locked",
    sectionIds: TRANSLATION_QA_SECTIONS,
    showManualType: false,
    showTemplate: false,
    showMarkets: false,
    showLanguages: true,
    showAudience: false,
    showApprover: false,
    languagesPrimary: true,
    revisionPrimary: false,
    requiredDocCategories: [
      { category: "prd", label: "English source (PRD or existing manual)", required: false },
    ],
    bundleWarnings: [
      {
        when: (c) => !c.existing_manual && !c.prd,
        message: "Provide an English source via PRD or Existing Manual for best translation quality.",
      },
    ],
    workspaceTitle: "English source approval",
    workspaceDescription:
      "Approve English source sections first, then review AI-generated translations in each target language.",
    sourceColumnTitle: "Source documents",
    sectionsColumnTitle: "English source sections",
    continueButtonLabel: "Continue to translation QA",
    approvalProgressHint: "approve all English source sections before generating translations",
    showRiskPanel: false,
    showRegulatoryPanel: false,
    showTraceability: false,
  },
};

/** Gaps shown in the approval workspace ù mission-specific only. */
export function filterGapsForMission(missionId: string, gaps: string[]): string[] {
  if (missionId === MANU_MISSION_IDS.translationQa) {
    return gaps.filter(
      (g) =>
        /english source|source manual|existing manual|reference translation/i.test(g) &&
        !/fmea|regulatory|engineering|prd|new manual generation|upload translation category/i.test(g),
    );
  }
  if (missionId === MANU_MISSION_IDS.riskCoverageQa) {
    return gaps.filter((g) => /fmea|risk|warning|coverage/i.test(g));
  }
  if (missionId === MANU_MISSION_IDS.regulatoryQa) {
    return gaps.filter((g) => /regulatory|certification|market|compliance|labeling/i.test(g));
  }
  if (missionId === MANU_MISSION_IDS.manualUpdate) {
    return gaps.filter((g) => !/treated as new manual generation/i.test(g));
  }
  return gaps;
}

export function getMissionUiProfile(missionId: string): ManuMissionUiProfile {
  return PROFILES[missionId] ?? PROFILES[MANU_MISSION_IDS.productManualGen];
}

export function getMissionSectionDefinitions(missionId: string) {
  const profile = getMissionUiProfile(missionId);
  const allowed = new Set(profile.sectionIds);
  return MANU_ALL_SECTIONS.filter((s) => allowed.has(s.id));
}

export function countDocumentsByCategory(
  documents: { category: string }[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const d of documents) {
    counts[d.category] = (counts[d.category] ?? 0) + 1;
  }
  return counts;
}

/** Sync selected sections when mission changes */
export function defaultSectionIdsForMission(missionId: string): string[] {
  return getMissionSectionDefinitions(missionId).map((s) => s.id);
}
