import type { ManuMission } from "@/types/manu";
import { MANU_MISSION_IDS } from "@/data/manuLabcorp";

/** Missions aligned with labcorp/manu-agent-core.js */
export const MANU_MISSIONS: ManuMission[] = [
  {
    id: MANU_MISSION_IDS.productManualGen,
    title: "Product Manual Generation",
    description:
      "Generate a structured equipment/product manual from mixed source documents such as PRDs, engineering reports, risk assessments, and regulatory notes.",
    outputs: [
      "Manual Draft",
      "Source Traceability Matrix",
      "Risk-to-Warning Mapping",
      "Compliance Checklist",
      "Section Confidence Report",
    ],
  },
  {
    id: MANU_MISSION_IDS.manualUpdate,
    title: "Manual Update & Revision",
    description:
      "Update an existing manual using new source documents, changed requirements, revised risks, or updated regulatory notes.",
    outputs: [
      "Updated Manual Draft",
      "Change Log",
      "Redline Delta Summary",
      "Newly Introduced Risks",
      "Compliance Impact Summary",
    ],
  },
  {
    id: MANU_MISSION_IDS.riskCoverageQa,
    title: "Risk-to-Manual Coverage QA",
    description:
      "Check whether FMEA risks, hazards, mitigations, and safety controls are properly represented in the generated or existing manual.",
    outputs: [
      "Risk Coverage Report",
      "Missing Warnings",
      "Weak / Ambiguous Safety Language",
      "Risk-to-Manual Traceability Table",
    ],
  },
  {
    id: MANU_MISSION_IDS.regulatoryQa,
    title: "Regulatory Compliance QA",
    description:
      "Check whether country-specific regulatory and certification requirements are reflected in the manual.",
    outputs: [
      "Regulatory Checklist",
      "Certification Summary",
      "Market-Specific Gaps",
      "Required Labeling / Manual Notes",
    ],
  },
  {
    id: MANU_MISSION_IDS.translationQa,
    title: "Translation Accuracy QA",
    description:
      "Generate translated manual sections in your chosen languages from approved English source, then review accuracy section by section.",
    outputs: [
      "Translation Accuracy Score",
      "Flagged Paragraphs",
      "Terminology Mismatch Report",
      "QA Summary Export",
    ],
  },
];
