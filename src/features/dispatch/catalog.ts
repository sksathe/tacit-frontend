/**
 * Dispatch profiles: agents with hybrid mission flows.
 * Agents in TACIT_AGENTS without an entry here show a soft “missions coming soon” state for modes.
 */

export type DispatchMode = {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
};

export type OutputContractOption = {
  id: string;
  label: string;
  description: string;
};

export type DispatchProfile = {
  agentId: string;
  modes: DispatchMode[];
  outputContracts: OutputContractOption[];
};

export type ExecutionExperience = "meeting" | "document" | "generic";

/** Drives Mission Brief execution panel: Facilitate → meeting; Clara, Eagle, MASON agreement review → documents + transcript. */
export function getExecutionExperience(agentId: string | null, modeId: string | null): ExecutionExperience {
  if (!agentId) return "generic";
  if (modeId === "facilitate") return "meeting";
  if (agentId === "lexa" || agentId === "eagle") return "document";
  if (agentId === "mason" && modeId === "contract-review") return "document";
  return "generic";
}

export const DISPATCH_PROFILES: DispatchProfile[] = [
  {
    agentId: "sage",
    modes: [
      {
        id: "facilitate",
        label: "Facilitate",
        shortLabel: "F",
        description: "Live facilitation with a scheduled or immediate Tacit session (phone or web meeting).",
      },
      {
        id: "discovery",
        label: "Discovery",
        shortLabel: "D",
        description: "Structured stakeholder interviews and process mapping.",
      },
      {
        id: "extraction",
        label: "Knowledge extraction",
        shortLabel: "E",
        description: "Focused sessions to capture and document tacit expertise.",
      },
      {
        id: "hybrid",
        label: "Hybrid workshop",
        shortLabel: "H",
        description: "Blended facilitation with live synthesis and follow-up artifacts.",
      },
    ],
    outputContracts: [
      {
        id: "sage-brief",
        label: "Executive brief",
        description: "Condensed findings with recommendations and next steps.",
      },
      {
        id: "sage-map",
        label: "Process map pack",
        description: "Workflow diagrams plus dependency and risk notes.",
      },
      {
        id: "sage-raw",
        label: "Structured notes (JSON)",
        description: "Machine-readable capture for downstream automation.",
      },
    ],
  },
  {
    agentId: "aria",
    modes: [
      {
        id: "facilitate",
        label: "Facilitate",
        shortLabel: "F",
        description: "Live facilitation with a scheduled or immediate Tacit session (phone or web meeting).",
      },
      {
        id: "advisor-intake",
        label: "Advisor intake",
        shortLabel: "A",
        description: "Registration-oriented conversation for new advisor relationships.",
      },
      {
        id: "client-onboarding",
        label: "Client onboarding",
        shortLabel: "C",
        description: "Guided setup for new household or entity onboarding.",
      },
      {
        id: "compliance-prep",
        label: "Compliance prep",
        shortLabel: "K",
        description: "Document and attestation gathering ahead of reviews.",
      },
    ],
    outputContracts: [
      {
        id: "aria-checklist",
        label: "Onboarding checklist",
        description: "Field-level completion status with open items highlighted.",
      },
      {
        id: "aria-summary",
        label: "Stakeholder summary",
        description: "Plain-language recap for CRM or email follow-up.",
      },
      {
        id: "aria-forms",
        label: "Form-ready fields",
        description: "Normalized key-value pairs mapped to common templates.",
      },
    ],
  },
  {
    agentId: "mason",
    modes: [
      {
        id: "facilitate",
        label: "Facilitate",
        shortLabel: "F",
        description: "Live facilitation with a scheduled or immediate Tacit session (phone or web meeting).",
      },
      {
        id: "contract-review",
        label: "Agreement review",
        shortLabel: "R",
        description: "Walkthrough of terms, riders, and operational implications.",
      },
      {
        id: "saas-onboarding",
        label: "SaaS onboarding",
        shortLabel: "S",
        description: "Implementation planning tied to subscription and services language.",
      },
      {
        id: "renewal",
        label: "Renewal planning",
        shortLabel: "N",
        description: "Renewal timeline, commercials, and obligation tracking.",
      },
    ],
    outputContracts: [
      {
        id: "mason-redline",
        label: "Redline summary",
        description: "Change list with clause references and owner suggestions.",
      },
      {
        id: "mason-ops",
        label: "Ops handoff",
        description: "Tasks, owners, and dates for finance and legal coordination.",
      },
      {
        id: "mason-schedule",
        label: "Obligation schedule",
        description: "Renewal, notice, and pricing milestone table.",
      },
    ],
  },
  {
    agentId: "lexa",
    modes: [
      {
        id: "parse-order",
        label: "Order form parse",
        shortLabel: "P",
        description: "Deep extraction from order forms and short-form agreements.",
      },
      {
        id: "revrec",
        label: "RevRec mapping",
        shortLabel: "V",
        description: "Align billing language with revenue recognition treatment.",
      },
      {
        id: "batch",
        label: "Multi-document batch",
        shortLabel: "B",
        description: "Consistent schema across several PDFs or amendments.",
      },
    ],
    outputContracts: [
      {
        id: "lexa-sf",
        label: "Salesforce-ready",
        description: "Objects and fields aligned to common CPQ / CRM patterns.",
      },
      {
        id: "lexa-dt",
        label: "DriveTrain finance",
        description: "Structured rows for downstream finance automation.",
      },
      {
        id: "lexa-audit",
        label: "Audit trail",
        description: "Confidence scores, sources, and human review flags.",
      },
    ],
  },
  {
    agentId: "eagle",
    modes: [
      {
        id: "freight-bol",
        label: "Freight & BOL",
        shortLabel: "B",
        description: "Extract parties, references, equipment, and line items from bills of lading and freight paperwork.",
      },
      {
        id: "customs-trade",
        label: "Customs & trade",
        shortLabel: "C",
        description: "Capture invoice, HTS, origin, and declaration-oriented fields from trade documents.",
      },
      {
        id: "receiving-wms",
        label: "Receiving & WMS",
        shortLabel: "R",
        description: "Packing lists, ASNs, and receiving docs normalized for putaway and inventory updates.",
      },
      {
        id: "batch-shipments",
        label: "Batch shipments",
        shortLabel: "M",
        description: "Run consistent extraction across many shipment PDFs in one mission.",
      },
    ],
    outputContracts: [
      {
        id: "eagle-tms",
        label: "TMS-ready",
        description: "Stops, references, and charges shaped for common TMS import patterns.",
      },
      {
        id: "eagle-wms",
        label: "WMS / receiving",
        description: "SKU, quantity, UOM, and location-oriented rows for warehouse systems.",
      },
      {
        id: "eagle-exceptions",
        label: "Exception report",
        description: "Variance flags, missing fields, and human review queue for ops.",
      },
    ],
  },
];

export function getDispatchProfile(agentId: string): DispatchProfile | undefined {
  return DISPATCH_PROFILES.find((p) => p.agentId === agentId);
}
