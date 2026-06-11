/**
 * LabCorp MANU reference data � aligned with labcorp/manu-agent-core.js
 */

import type { ManuDocumentCategory } from "@/types/manu";

export const MANU_MARKETS = [
  "USA",
  "EU",
  "Canada",
  "Australia",
  "Japan",
  "China",
  "Brazil",
  "Saudi Arabia",
  "India",
  "UK",
] as const;

export const MANU_LANGUAGES = [
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "pt", label: "Portuguese" },
  { code: "zh", label: "Chinese (Simplified)" },
  { code: "ja", label: "Japanese" },
  { code: "ar", label: "Arabic" },
  { code: "hi", label: "Hindi" },
  { code: "it", label: "Italian" },
  { code: "pl", label: "Polish" },
] as const;

export const MANU_TRANSLATION_SCORES: Record<string, number> = {
  es: 96,
  fr: 94,
  de: 98,
  pt: 87,
  zh: 91,
  ja: 95,
  ar: 89,
  hi: 90,
  it: 93,
  pl: 92,
};

export const MANU_MANUAL_TEMPLATES = [
  "LabCorp Equipment Manual Template v2.0",
  "IVD IFU Template v3.1",
  "General Laboratory Equipment v1.4",
] as const;

export type ManuDemoBundleKey = "cs-ultra" | "hcp-5000" | "gs-pm-100" | "pd-rtpcr";

export interface ManuDemoBundleDoc {
  fileName: string;
  category: ManuDocumentCategory;
  parseStatus: "complete" | "partial" | "simulated";
  confidence: number;
}

export interface ManuDemoBundle {
  label: string;
  folder: string;
  productName: string;
  modelCode: string;
  documents: ManuDemoBundleDoc[];
}

export const MANU_DEMO_BUNDLES: Record<ManuDemoBundleKey, ManuDemoBundle> = {
  "cs-ultra": {
    label: "CentraSpin Ultra 24R (CS-ULTRA-24R)",
    folder: "CS-ULTRA-24R_CentraSpin",
    productName: "CentraSpin Ultra 24R Refrigerated Centrifuge",
    modelCode: "CS-ULTRA-24R",
    documents: [
      { fileName: "01_Product_Requirements_Document.txt", category: "prd", parseStatus: "complete", confidence: 94 },
      { fileName: "02_Engineering_Test_Report.txt", category: "engineering_test", parseStatus: "complete", confidence: 91 },
      { fileName: "03_Risk_Assessment_FMEA.csv", category: "fmea", parseStatus: "complete", confidence: 97 },
      { fileName: "04_Regulatory_Certification_Notes.txt", category: "regulatory", parseStatus: "complete", confidence: 89 },
    ],
  },
  "hcp-5000": {
    label: "HemaCount Pro 5000 (HCP-5000)",
    folder: "HCP-5000_HemaCount_Pro",
    productName: "HemaCount Pro 5000 Hematology Analyzer",
    modelCode: "HCP-5000",
    documents: [
      { fileName: "01_Product_Requirements_Document.txt", category: "prd", parseStatus: "complete", confidence: 95 },
      { fileName: "02_Regulatory_Submission_Notes.txt", category: "regulatory", parseStatus: "complete", confidence: 88 },
      { fileName: "03_Engineering_Design_Specification.txt", category: "engineering_test", parseStatus: "complete", confidence: 92 },
      { fileName: "04_Risk_Assessment_FMEA.csv", category: "fmea", parseStatus: "complete", confidence: 96 },
      { fileName: "05_Verification_Validation_Report.txt", category: "quality_validation", parseStatus: "complete", confidence: 90 },
      { fileName: "07_Labeling_Review_Checklist.txt", category: "labeling", parseStatus: "complete", confidence: 87 },
    ],
  },
  "gs-pm-100": {
    label: "GlucoSense PM-100 (GS-PM-100)",
    folder: "GS-PM-100_GlucoSense",
    productName: "GlucoSense PM-100 Blood Glucose Monitoring System",
    modelCode: "GS-PM-100",
    documents: [
      { fileName: "01_Product_Requirements_Document.txt", category: "prd", parseStatus: "complete", confidence: 93 },
      { fileName: "02_Clinical_Accuracy_Study_ISO15197.txt", category: "quality_validation", parseStatus: "complete", confidence: 91 },
      { fileName: "04_Risk_Assessment_FMEA.csv", category: "fmea", parseStatus: "complete", confidence: 95 },
      { fileName: "03_Multi_Language_Labeling_Review.txt", category: "labeling", parseStatus: "partial", confidence: 82 },
    ],
  },
  "pd-rtpcr": {
    label: "PathDetect RT-PCR 96 (PD-RTPCR-96)",
    folder: "PD-RTPCR-96_PathDetect",
    productName: "PathDetect RT-PCR 96 Molecular Detection System",
    modelCode: "PD-RTPCR-96",
    documents: [
      { fileName: "01_Product_Requirements_Document.txt", category: "prd", parseStatus: "complete", confidence: 94 },
      { fileName: "02_Assay_Development_Notes.txt", category: "engineering_test", parseStatus: "complete", confidence: 88 },
      { fileName: "03_Clinical_Performance_Study_Report.txt", category: "quality_validation", parseStatus: "complete", confidence: 90 },
      { fileName: "04_Risk_Assessment_FMEA.csv", category: "fmea", parseStatus: "complete", confidence: 97 },
      { fileName: "05_Regulatory_Multi_Country_Notes.txt", category: "regulatory", parseStatus: "complete", confidence: 86 },
    ],
  },
};

/** Extra translation files loaded for Translation Accuracy QA demos */
export const MANU_TRANSLATION_DEMO_DOCS: Partial<
  Record<ManuDemoBundleKey, ManuDemoBundle["documents"]>
> = {
  "cs-ultra": [
    { fileName: "05_IFU_Spanish_Translation.txt", category: "translation", parseStatus: "complete", confidence: 91 },
    { fileName: "06_IFU_French_Translation.txt", category: "translation", parseStatus: "complete", confidence: 90 },
  ],
};

export type ManuProductContentKey = "CS-ULTRA-24R" | "HCP-5000" | "DEFAULT";

export interface ManuProductContent {
  overview: string;
  intendedUse: string;
  systemDesc: string;
  specs: string;
  safety: string;
  install: string;
  operating: string;
  performance: string;
  maintenance: string;
  troubleshooting: string;
  regulatory: string;
  countryCert: string;
  revision: string;
  accessories: string;
  environmental: string;
  storageTransport: string;
  decontamination: string;
  service: string;
  qualityControl: string;
  postMarket: string;
  labelingReqs: string;
  riskControls: string;
}

export const MANU_PRODUCT_CONTENT: Record<ManuProductContentKey, ManuProductContent> = {
  "CS-ULTRA-24R": {
    overview:
      "The CentraSpin Ultra 24R is a refrigerated benchtop centrifuge for clinical and research laboratories requiring controlled temperature during high-speed separations. It supports multiple rotor types with RFID-based speed limiting.",
    intendedUse:
      "The CentraSpin Ultra 24R is intended for the separation of biological samples in clinical and research laboratories. For laboratory use only. Operators must be trained on centrifuge safety and rotor compatibility.",
    systemDesc:
      "The system comprises a refrigerated chamber, brushless DC drive, RFID rotor identification, dual lid interlocks, vibration monitoring, and touchscreen control with LIMS connectivity options.",
    specs:
      "Max speed: 15,000 RPM (rotor-dependent). Temperature range: 4�40�C. Capacity: 24 � 1.5/2.0 mL tubes (standard rotor). Power: 100�240 V AC, 50/60 Hz. Dimensions: 420 � 520 � 380 mm. Weight: 32 kg.",
    safety:
      "WARNING: Always balance tubes symmetrically before starting a run. Do not operate the centrifuge with visibly unbalanced loads. Do not open the lid until the rotor has completely stopped. Use only approved rotors with valid RFID tags. Annual rotor inspection by certified personnel is mandatory.",
    install:
      "Install on a level, vibration-resistant surface with minimum 15 cm clearance for ventilation. Connect to grounded mains supply. Allow 30 minutes for refrigeration stabilization before first use. Register rotor inventory in the instrument configuration menu.",
    operating:
      "Load balanced sample tubes into the rotor. Confirm rotor RFID is recognized. Set temperature, speed, and time per run protocol. Verify lid interlock self-test passes at power-on. Start run only when imbalance indicator is clear.",
    performance:
      "Temperature uniformity �2�C at 4�C setpoint. Speed accuracy �20 RPM. Imbalance detection triggers shutdown at factory-set vibration threshold. RFID fail-safe caps speed at 6,000 RPM if rotor cannot be identified.",
    maintenance:
      "Daily: clean bowl and inspect lid seal. Weekly: verify interlock function. Monthly: rotor visual inspection. Annually: certified rotor inspection, temperature calibration, and refrigerant leak check per service bulletin.",
    troubleshooting:
      "E-01 Lid interlock fault � do not operate; contact service. E-02 Imbalance shutdown � rebalance load. E-03 RFID read failure � remove rotor, inspect chip, use conservative speed limit until serviced.",
    regulatory:
      "FDA 510(k) cleared (Class II). CE marked under EU MDR with Notified Body oversight. Health Canada MDL on file. Designed to EN IEC 61010-2-020 and ISO 13485 quality system requirements.",
    countryCert:
      "USA: 510(k) K24-CS-8841. EU: CE-MDR-2025-CS24R-0123. Canada: MDL-99102. Australia: ARTG inclusion pending � manual notes interim distribution controls.",
    revision:
      "Document LC-MAN-CS24R v1.0 � Initial release generated from approved design inputs. Next review scheduled upon engineering change order or regulatory submission update.",
    accessories:
      "Use only rotors and adapters listed in the approved compatibility matrix. RFID-enforced speed tables apply per rotor catalog number.",
    environmental:
      "Operating ambient 15�30�C, relative humidity 20�80% non-condensing. Installation category per local electrical code.",
    storageTransport:
      "Transport in original packaging with shock indicator intact. Store in clean, dry conditions within specified temperature limits.",
    decontamination:
      "Follow institutional decontamination policy using approved agents compatible with wetted materials. Document cycle in maintenance log.",
    service: "Service must be performed by LabCorp authorized personnel or qualified agents using OEM parts only.",
    qualityControl:
      "Run system checks and controls per laboratory quality manual before reporting patient or release results.",
    postMarket: "Report serious incidents per applicable vigilance regulations (e.g., FDA MDR, EU vigilance) within required timelines.",
    labelingReqs: "Symbols and label text per ISO 15223-1 and market-specific annexes in labeling review checklist.",
    riskControls:
      "Residual risks documented in FMEA with mitigations implemented in design and reflected in warnings, maintenance, and training.",
  },
  "HCP-5000": {
    overview:
      "The HemaCount Pro 5000 is a fully automated 5-part differential hematology analyzer for mid-to-high volume clinical laboratories, replacing the legacy HemaCount 3200 platform.",
    intendedUse:
      "Intended for quantitative determination of hematological parameters in EDTA-anticoagulated whole blood from adult and pediatric patients. FOR IN VITRO DIAGNOSTIC USE ONLY.",
    systemDesc:
      "Closed-tube sampling, impedance/optical detection, autoloader option, bidirectional LIS/HL7 interface, and onboard QC with Westgard rules.",
    specs: "Throughput ?80 samples/hr. Sample volume 25 �L. WBC imprecision CV ?1.5%. Dimensions 480�350�520 mm. Weight 22.5 kg. Operating 15�30�C.",
    safety:
      "WARNING: Handle patient samples per institutional biohazard procedures. Do not bypass sample integrity checks. Verify reagent lot and QC acceptance before reporting patient results.",
    install:
      "Level bench, dedicated circuit recommended. Complete installation qualification per LC-IQ-HCP5000 checklist. Network configuration for LIS per IT security policy.",
    operating:
      "Daily startup includes blank, controls, and fluidics check. Load samples per rack map. Review flags and reflex morphology rules per laboratory protocol.",
    performance:
      "Linearity verified across reportable range per V&V report LC-VV-HCP5000-005. Carryover <0.5% on critical parameters. Method comparison meets CLSI EP09 criteria vs reference analyzer.",
    maintenance:
      "Daily probe wipe and system clean. Weekly deep clean cycle. Monthly preventive maintenance kit PM-HCP-5000. Annual OEM service contract recommended.",
    troubleshooting:
      "SC-12 Aspiration error � check sample volume and clot. SC-44 Reagent expired � replace lot. SC-90 LIS timeout � verify network and retry transmission.",
    regulatory:
      "FDA 510(k) K243891. EU MDR Class IIa CE marking. Health Canada MDL-98521. TGA ARTG-412987. Labeling per 21 CFR 809 and EN ISO 18113-1:2022.",
    countryCert:
      "Active distribution: USA, EU, Canada, Australia. Brazil ANVISA submission in progress � exclude from IFU until approved.",
    revision: "v2.1 � Updated connectivity section per ECO-2026-014. Regulatory table refreshed March 2026.",
    accessories: "Use only approved reagent packs and consumables listed in the compatibility matrix.",
    environmental: "Operating ambient 15�30�C per installation guide. Avoid direct sunlight on touchscreen.",
    storageTransport: "Ship upright with dust cover installed. Reagents stored per cold-chain labels.",
    decontamination: "Decontaminate fluidics path per institutional biohazard SOP after high-risk samples.",
    service: "Service by LabCorp-authorized engineers only. Use OEM parts for fluidics and optics.",
    qualityControl: "Westgard rules enforced onboard; external QC material per laboratory schedule.",
    postMarket: "Report serious device incidents per FDA MDR and EU vigilance requirements.",
    labelingReqs: "IFU symbols per ISO 15223-1; localized inserts per labeling review checklist.",
    riskControls: "Risk controls from FMEA implemented in software interlocks, warnings, and maintenance tasks.",
  },
  DEFAULT: {
    overview:
      "This equipment manual was generated from the uploaded source document bundle. Product identity and intended use statements were synthesized from requirements and engineering inputs.",
    intendedUse:
      "Refer to the Product Requirements Document for the authoritative intended use statement. This draft requires human approval before release.",
    systemDesc:
      "System architecture and subsystems are described based on engineering and design documentation in the source bundle.",
    specs:
      "Technical specifications consolidated from engineering reports and product requirements. Verify all values against released design records before approval.",
    safety:
      "Safety warnings derived from FMEA and risk controls where available. Additional warnings may be required after clinical or usability review.",
    install:
      "Installation prerequisites and setup steps should be validated against the latest engineering installation guide.",
    operating:
      "Operating instructions reflect nominal use scenarios from source documents. Supplement with site-specific laboratory procedures as needed.",
    performance:
      "Performance characteristics include acceptance criteria from verification and validation evidence where present in the bundle.",
    maintenance:
      "Maintenance intervals align with risk controls and manufacturer recommendations from engineering and quality sources.",
    troubleshooting:
      "Troubleshooting codes and corrective actions are preliminary until matched to released service documentation.",
    regulatory:
      "Regulatory compliance section aggregates certification notes. Gaps are flagged when regulatory source documents are missing or incomplete.",
    countryCert: "Country-specific certification statements require verification against current approval letters.",
    revision: "Revision 0.1 � Draft generated by MANU. Not approved for distribution.",
    accessories: "Use only accessories listed in the approved compatibility matrix.",
    environmental: "Operate within validated environmental limits per engineering documentation.",
    storageTransport: "Store and transport per manufacturer recommendations in the source bundle.",
    decontamination: "Follow institutional decontamination procedures for laboratory equipment.",
    service: "Service must be performed by qualified personnel using approved parts.",
    qualityControl: "Perform QC per laboratory quality manual before routine use.",
    postMarket: "Report serious incidents per applicable post-market regulations.",
    labelingReqs: "Labeling per market-specific requirements in regulatory and labeling source documents.",
    riskControls: "Risk controls summarized from FMEA where available in the source bundle.",
  },
};

export const MANU_RISK_ROWS_CS = [
  {
    hazard: "Rotor imbalance",
    cause: "Uneven loading; sensor degradation",
    effect: "Vibration damage; rotor failure",
    mitigation: "Vibration sensor + automatic shutdown",
    manualWarning:
      "Always balance tubes symmetrically before starting a run. Do not operate with visibly unbalanced loads.",
    coverageStatus: "covered" as const,
  },
  {
    hazard: "Lid opens during spin",
    cause: "Interlock failure",
    effect: "Operator exposure to rotating rotor",
    mitigation: "Dual electronic + mechanical interlock; daily test",
    manualWarning:
      "Do not open the lid until the rotor has completely stopped and the display indicates it is safe.",
    coverageStatus: "covered" as const,
  },
  {
    hazard: "Rotor fracture at max speed",
    cause: "Fatigue; unauthorized overspeed",
    effect: "Fragments inside bowl; injury risk",
    mitigation: "RFID speed limit; annual inspection",
    manualWarning: "Use only approved rotors. Do not exceed rated speed for installed rotor type.",
    coverageStatus: "covered" as const,
  },
  {
    hazard: "Incomplete bowl decontamination",
    cause: "Skipped decontamination step",
    effect: "Biohazard cross-contamination",
    mitigation: "IFU decontamination procedure; training",
    manualWarning:
      "Decontaminate bowl and drain port after biohazardous samples per institutional protocol.",
    coverageStatus: "needs_review" as const,
  },
];

export const MANU_REG_ROWS_CS = [
  {
    market: "United States",
    standard: "21 CFR 809 � IEC 61010-2-020",
    certificationStatus: "510(k) Cleared",
    requiredStatement: "For in vitro diagnostic use when used with approved accessories.",
    missingInfo: "",
  },
  {
    market: "European Union",
    standard: "EU MDR 2017/746 � EN ISO 15224",
    certificationStatus: "CE Marked",
    requiredStatement: "CE mark per Notified Body certificate; consult IFU for residual risks.",
    missingInfo: "",
  },
  {
    market: "Canada",
    standard: "SOR/98-282",
    certificationStatus: "MDL Active",
    requiredStatement: "Licensed for sale in Canada per MDL-99102.",
    missingInfo: "",
  },
  {
    market: "Australia",
    standard: "TGA essential principles",
    certificationStatus: "Pending",
    requiredStatement: "",
    missingInfo: "ARTG statement not yet available � hold distribution",
  },
];

/** Mission IDs aligned with labcorp/manu-agent-core.js */
export const MANU_MISSION_IDS = {
  productManualGen: "product-manual-gen",
  manualUpdate: "manual-update",
  riskCoverageQa: "risk-coverage-qa",
  regulatoryQa: "regulatory-qa",
  translationQa: "translation-qa",
} as const;

export function resolveProductKey(modelCode: string): ManuProductContentKey {
  const code = modelCode.toUpperCase();
  if (code.includes("CS-ULTRA") || code.includes("CS24")) return "CS-ULTRA-24R";
  if (code.includes("HCP")) return "HCP-5000";
  return "DEFAULT";
}

export function getMissionFocus(missionId: string): {
  title: string;
  description: string;
  emphasizeRisk: boolean;
  emphasizeRegulatory: boolean;
  emphasizeTranslation: boolean;
  emphasizeRevision: boolean;
} {
  switch (missionId) {
    case MANU_MISSION_IDS.manualUpdate:
      return {
        title: "Manual Update & Revision",
        description: "Compare new source evidence against prior manual baseline. Change impact is flagged in gaps and export.",
        emphasizeRisk: true,
        emphasizeRegulatory: true,
        emphasizeTranslation: false,
        emphasizeRevision: true,
      };
    case MANU_MISSION_IDS.riskCoverageQa:
      return {
        title: "Risk-to-Manual Coverage QA",
        description: "Primary focus: FMEA hazards mapped to manual warnings. Review missing or weak coverage before approval.",
        emphasizeRisk: true,
        emphasizeRegulatory: false,
        emphasizeTranslation: false,
        emphasizeRevision: false,
      };
    case MANU_MISSION_IDS.regulatoryQa:
      return {
        title: "Regulatory Compliance QA",
        description: "Primary focus: market-specific certification requirements reflected in regulatory and country sections.",
        emphasizeRisk: false,
        emphasizeRegulatory: true,
        emphasizeTranslation: false,
        emphasizeRevision: false,
      };
    case MANU_MISSION_IDS.translationQa:
      return {
        title: "Translation Accuracy QA",
        description: "Approve English source sections first, then review AI-generated translations in each target language.",
        emphasizeRisk: false,
        emphasizeRegulatory: false,
        emphasizeTranslation: true,
        emphasizeRevision: false,
      };
    default:
      return {
        title: "Product Manual Generation",
        description: "Generate a traceable manual draft from the full source document bundle.",
        emphasizeRisk: true,
        emphasizeRegulatory: true,
        emphasizeTranslation: false,
        emphasizeRevision: false,
      };
  }
}

/** Section defaults when a mission is selected (LabCorp HTML behavior) */
export function getDefaultSectionsForMission(missionId: string, current: string[]): string[] {
  const base = new Set(current);
  switch (missionId) {
    case MANU_MISSION_IDS.riskCoverageQa:
      ["safety-warnings", "risk-controls-summary", "decontamination"].forEach((id) => base.add(id));
      break;
    case MANU_MISSION_IDS.regulatoryQa:
      ["regulatory-compliance", "country-certification", "labeling-requirements"].forEach((id) => base.add(id));
      break;
    case MANU_MISSION_IDS.translationQa:
      ["safety-warnings", "intended-use", "regulatory-compliance"].forEach((id) => base.add(id));
      break;
    default:
      break;
  }
  return Array.from(base);
}

export function getDefaultMetadataForBundle(bundleKey: ManuDemoBundleKey) {
  const b = MANU_DEMO_BUNDLES[bundleKey];
  return {
    productName: b.productName,
    modelCode: b.modelCode,
    manualType: "Equipment / Product Manual (IFU)",
    targetMarkets: ["USA", "EU", "Canada"],
    targetLanguages: ["es", "fr", "de"],
    intendedAudience: "Trained laboratory personnel",
    templateType: MANU_MANUAL_TEMPLATES[0],
    revision: "1.0",
    approverRole: "Documentation Quality Lead",
  };
}
