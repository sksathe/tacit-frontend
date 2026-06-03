import { MANU_ALL_SECTIONS } from "@/data/manuSections";
import {
  MANU_MISSION_IDS,
  MANU_PRODUCT_CONTENT,
  MANU_REG_ROWS_CS,
  MANU_RISK_ROWS_CS,
  MANU_TRANSLATION_SCORES,
  MANU_LANGUAGES,
  getMissionFocus,
  resolveProductKey,
  type ManuProductContent,
  type ManuProductContentKey,
} from "@/data/manuLabcorp";
import type {
  ManuCoverageStatus,
  ManuDocumentCategory,
  ManuManualConfig,
  ManuManualMetadata,
  ManuMission,
  ManuRun,
  ManuUploadedDocument,
  ManuMode,
} from "@/types/manu";
import { MANU_AGENT_ID, MANU_CLIENT } from "@/types/manu";

const CATEGORY_LABELS: Record<ManuDocumentCategory, string> = {
  prd: "Product Requirements Document",
  engineering_test: "Engineering Test Report",
  fmea: "Risk Assessment / FMEA",
  regulatory: "Regulatory Certification Notes",
  existing_manual: "Existing Manual",
  translation: "Translation File",
  quality_validation: "Quality / Validation Report",
  labeling: "Labeling Notes",
  other: "Other Supporting Document",
};

function hasCategory(docs: ManuUploadedDocument[], cat: ManuDocumentCategory) {
  return docs.some((d) => d.category === cat);
}

/** Category inference aligned with labcorp/manu-agent-core.js */
export function inferDocumentCategory(fileName: string): ManuDocumentCategory {
  const n = fileName.toLowerCase();
  if (/requirements|prd/.test(n)) return "prd";
  if (/engineering|design.?spec|test.?report|assay/.test(n)) return "engineering_test";
  if (/fmea|risk/.test(n)) return "fmea";
  if (/regulatory|certification|submission/.test(n)) return "regulatory";
  if (/manual|ifu/.test(n) && !/translat/.test(n)) return "existing_manual";
  if (/translat|locale|_es_|_fr_|_de_/.test(n)) return "translation";
  if (/verif|valid|clinical|quality|vv/.test(n)) return "quality_validation";
  if (/label/.test(n)) return "labeling";
  return "other";
}

export function classifyUploadedFile(file: File): ManuDocumentCategory {
  return inferDocumentCategory(file.name);
}

function sectionContentMap(sectionId: string, content: ManuProductContent): string {
  const table: Record<string, string> = {
    "product-overview": content.overview,
    "intended-use": content.intendedUse,
    "system-description": content.systemDesc,
    "technical-specifications": content.specs,
    "safety-warnings": content.safety,
    "installation-setup": content.install,
    "operating-instructions": content.operating,
    "performance-characteristics": content.performance,
    "maintenance-cleaning": content.maintenance,
    "troubleshooting": content.troubleshooting,
    "regulatory-compliance": content.regulatory,
    "country-certification": content.countryCert,
    "revision-history": content.revision,
    "accessories-rotor": content.accessories,
    "environmental-conditions": content.environmental,
    "storage-transport": content.storageTransport,
    "decontamination": content.decontamination,
    "service-instructions": content.service,
    "quality-control": content.qualityControl,
    "post-market": content.postMarket,
    "labeling-requirements": content.labelingReqs,
    "risk-controls-summary": content.riskControls,
  };
  return table[sectionId] ?? content.overview;
}

const SIM_TRANSLATION_PHRASES: Record<string, Array<[RegExp, string]>> = {
  es: [
    [/\bwarning\b/gi, "advertencia"],
    [/\bcaution\b/gi, "precaucion"],
    [/\bmanual\b/gi, "manual"],
    [/\bdevice\b/gi, "dispositivo"],
    [/\bsafety\b/gi, "seguridad"],
    [/\btemperature\b/gi, "temperatura"],
    [/\blaboratory\b/gi, "laboratorio"],
    [/\bintended use\b/gi, "uso previsto"],
  ],
  fr: [
    [/\bwarning\b/gi, "avertissement"],
    [/\bcaution\b/gi, "attention"],
    [/\bmanual\b/gi, "manuel"],
    [/\bdevice\b/gi, "dispositif"],
    [/\bsafety\b/gi, "securite"],
    [/\btemperature\b/gi, "temperature"],
    [/\blaboratory\b/gi, "laboratoire"],
    [/\bintended use\b/gi, "utilisation prevue"],
  ],
  de: [
    [/\bwarning\b/gi, "warnhinweis"],
    [/\bcaution\b/gi, "vorsicht"],
    [/\bmanual\b/gi, "handbuch"],
    [/\bdevice\b/gi, "geraet"],
    [/\bsafety\b/gi, "sicherheit"],
    [/\btemperature\b/gi, "temperatur"],
    [/\blaboratory\b/gi, "labor"],
    [/\bintended use\b/gi, "bestimmungsgemaesse verwendung"],
  ],
};

function simulateTranslatedText(source: string, code: string, label: string): string {
  const truncated = source.slice(0, 220) + (source.length > 220 ? "…" : "");
  const dictionary = SIM_TRANSLATION_PHRASES[code];
  if (!dictionary) return `[${label}] ${truncated}`;
  const translated = dictionary.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), truncated);
  return `[${label}] ${translated}`;
}

function sectionSources(sectionId: string, docs: ManuUploadedDocument[]): ManuUploadedDocument[] {
  const map: Record<string, ManuDocumentCategory[]> = {
    "product-overview": ["prd", "engineering_test"],
    "intended-use": ["prd", "regulatory"],
    "system-description": ["prd", "engineering_test"],
    "technical-specifications": ["prd", "engineering_test"],
    "safety-warnings": ["fmea", "engineering_test", "regulatory"],
    "installation-setup": ["engineering_test", "prd"],
    "operating-instructions": ["engineering_test", "prd", "existing_manual"],
    "performance-characteristics": ["quality_validation", "engineering_test", "prd"],
    "maintenance-cleaning": ["fmea", "engineering_test", "quality_validation"],
    "troubleshooting": ["engineering_test", "quality_validation"],
    "regulatory-compliance": ["regulatory", "prd"],
    "country-certification": ["regulatory", "labeling"],
    "revision-history": ["prd", "existing_manual"],
    "accessories-rotor": ["engineering_test", "prd"],
    "environmental-conditions": ["engineering_test"],
    "decontamination": ["fmea", "labeling"],
    "risk-controls-summary": ["fmea", "quality_validation"],
    "labeling-requirements": ["labeling", "regulatory"],
  };
  const cats = map[sectionId] ?? ["prd"];
  const matched = docs.filter((d) => cats.includes(d.category));
  return matched.length ? matched : docs.slice(0, 1);
}

function buildGaps(docs: ManuUploadedDocument[], missionId: string): string[] {
  const gaps: string[] = [];
  if (!hasCategory(docs, "fmea")) {
    gaps.push("No FMEA — risk-to-warning mapping limited");
  }
  if (!hasCategory(docs, "regulatory")) {
    gaps.push("No regulatory notes — compliance checklist incomplete");
  }
  if (!hasCategory(docs, "engineering_test")) {
    gaps.push("No engineering report — technical specs may be incomplete");
  }
  if (!hasCategory(docs, "prd")) {
    gaps.push("No PRD — intended use requires verification");
  }
  if (!hasCategory(docs, "existing_manual")) {
    gaps.push("No existing manual — treated as new manual generation");
  }
  if (missionId === MANU_MISSION_IDS.manualUpdate && !hasCategory(docs, "existing_manual")) {
    gaps.push("No existing manual uploaded — running as new manual generation with revision baseline");
  }
  if (missionId === MANU_MISSION_IDS.translationQa && !hasCategory(docs, "translation")) {
    gaps.push("No translation files uploaded — translation QA will use simulated translated content");
  }
  return gaps;
}

function buildExtractedFacts(
  docs: ManuUploadedDocument[],
  meta: ManuManualMetadata,
  productKey: ManuProductContentKey,
  gaps: string[],
) {
  const content = MANU_PRODUCT_CONTENT[productKey];
  const categoryLabel =
    productKey === "CS-ULTRA-24R"
      ? "Laboratory Centrifuge"
      : productKey === "HCP-5000"
        ? "IVD Hematology Analyzer"
        : "Laboratory Equipment";

  return [
    {
      id: "fact-identity",
      group: "Product identity",
      label: "Product",
      value: `${meta.productName || content.overview.slice(0, 60)} · Model ${meta.modelCode || "—"}`,
      sourceDocumentIds: docs.filter((d) => d.category === "prd").map((d) => d.id),
      confidence: 0.94,
    },
    {
      id: "fact-intended",
      group: "Intended use",
      label: "Use statement",
      value: content.intendedUse,
      sourceDocumentIds: docs.filter((d) => ["prd", "regulatory"].includes(d.category)).map((d) => d.id),
      confidence: hasCategory(docs, "prd") ? 0.91 : 0.55,
      uncertain: !hasCategory(docs, "prd"),
    },
    {
      id: "fact-performance",
      group: "Performance requirements",
      label: "Validated performance",
      value:
        productKey === "HCP-5000"
          ? "Throughput ≥80/hr; WBC CV ≤1.5%; CLSI-aligned verification"
          : productKey === "CS-ULTRA-24R"
            ? "Speed, temperature, and imbalance controls per PRD acceptance limits"
            : "Performance per verification evidence in source bundle",
      sourceDocumentIds: docs
        .filter((d) => ["prd", "quality_validation"].includes(d.category))
        .map((d) => d.id),
      confidence: hasCategory(docs, "prd") || hasCategory(docs, "quality_validation") ? 0.89 : 0.55,
      uncertain: !hasCategory(docs, "prd") && !hasCategory(docs, "quality_validation"),
    },
    {
      id: "fact-engineering",
      group: "Engineering validation",
      label: "Validation evidence",
      value: hasCategory(docs, "engineering_test") || hasCategory(docs, "quality_validation")
        ? "Engineering test / V&V evidence referenced in source bundle"
        : "Limited — no engineering or V&V report in bundle",
      sourceDocumentIds: docs
        .filter((d) => ["engineering_test", "quality_validation"].includes(d.category))
        .map((d) => d.id),
      confidence: hasCategory(docs, "engineering_test") ? 0.9 : 0.5,
      uncertain: !hasCategory(docs, "engineering_test"),
    },
    {
      id: "fact-safety",
      group: "Safety mechanisms",
      label: "Controls",
      value: hasCategory(docs, "fmea")
        ? "Interlocks, sensors, fail-safe speed limits, maintenance controls"
        : "Limited — no FMEA in bundle",
      sourceDocumentIds: docs.filter((d) => ["fmea", "engineering_test"].includes(d.category)).map((d) => d.id),
      confidence: hasCategory(docs, "fmea") ? 0.92 : 0.6,
      uncertain: !hasCategory(docs, "fmea"),
    },
    {
      id: "fact-risks",
      group: "Risks / hazards",
      label: "Primary hazards",
      value: hasCategory(docs, "fmea") ? "See Risk-to-Warning mapping panel" : "FMEA not provided",
      sourceDocumentIds: docs.filter((d) => d.category === "fmea").map((d) => d.id),
      confidence: hasCategory(docs, "fmea") ? 0.93 : 0.45,
      uncertain: !hasCategory(docs, "fmea"),
    },
    {
      id: "fact-regulatory",
      group: "Regulatory certifications",
      label: "Markets",
      value: hasCategory(docs, "regulatory")
        ? meta.targetMarkets.length
          ? meta.targetMarkets.join(", ")
          : "Multi-market approvals documented"
        : "Regulatory source documents missing",
      sourceDocumentIds: docs.filter((d) => d.category === "regulatory").map((d) => d.id),
      confidence: hasCategory(docs, "regulatory") ? 0.9 : 0.5,
      uncertain: !hasCategory(docs, "regulatory"),
    },
    {
      id: "fact-category",
      group: "Product identity",
      label: "Category",
      value: categoryLabel,
      sourceDocumentIds: docs.filter((d) => d.category === "prd").map((d) => d.id),
      confidence: 0.88,
    },
    {
      id: "fact-missing",
      group: "Gaps & uncertainty",
      label: "Data gaps",
      value: gaps.length ? gaps.join(" · ") : "No critical gaps detected for selected mission.",
      sourceDocumentIds: [],
      confidence: 0.99,
      uncertain: gaps.length > 0,
    },
  ];
}

function buildTraceability(
  docs: ManuUploadedDocument[],
  sections: ManuRun["generatedSections"],
): ManuRun["traceabilityMatrix"] {
  const rows: ManuRun["traceabilityMatrix"] = [];
  sections.forEach((sec) => {
    const sources = sectionSources(sec.id, docs);
    if (sources.length) {
      sources.forEach((doc) => {
        rows.push({
          sectionId: sec.id,
          sectionTitle: sec.title,
          fact: sec.title.replace(/^\d+\.\s*/, "") + " content synthesized",
          sourceDocument: doc.fileName,
          excerpt:
            doc.extractedText.slice(0, 120) + (doc.extractedText.length > 120 ? "…" : "") ||
            "Excerpt from classified source document",
          confidence: sec.confidence,
          status: sec.status,
        });
      });
    } else {
      rows.push({
        sectionId: sec.id,
        sectionTitle: sec.title,
        fact: "Limited source linkage",
        sourceDocument: "—",
        excerpt: "No matching document type in bundle",
        confidence: Math.max(0.45, sec.confidence - 0.15),
        status: sec.status,
      });
    }
  });
  return rows;
}

function buildRiskCoverage(docs: ManuUploadedDocument[], productKey: ManuProductContentKey) {
  if (!hasCategory(docs, "fmea")) return [];
  if (productKey === "CS-ULTRA-24R") {
    return MANU_RISK_ROWS_CS.map((r, i) => ({
      id: `risk-${i + 1}`,
      hazard: r.hazard,
      cause: r.cause,
      effect: r.effect,
      mitigation: r.mitigation,
      manualWarning: r.manualWarning,
      coverageStatus: r.coverageStatus,
    }));
  }
  return MANU_RISK_ROWS_CS.map((r, i) => ({
    id: `risk-${i + 1}`,
    hazard: r.hazard,
    cause: r.cause,
    effect: r.effect,
    mitigation: r.mitigation,
    manualWarning: r.manualWarning || "",
    coverageStatus: (i === 0 ? "covered" : "needs_review") as ManuCoverageStatus,
  }));
}

function buildRegulatoryChecklist(docs: ManuUploadedDocument[], productKey: ManuProductContentKey) {
  if (!hasCategory(docs, "regulatory")) return [];
  const rows = productKey === "CS-ULTRA-24R" ? MANU_REG_ROWS_CS : MANU_REG_ROWS_CS.slice(0, 2);
  return rows.map((r, i) => ({
    id: `reg-${i + 1}`,
    market: r.market,
    standard: r.standard,
    certificationStatus: r.certificationStatus,
    requiredStatement: r.requiredStatement,
    missingInfo: r.missingInfo,
  }));
}

function sectionConfidence(
  sectionId: string,
  docs: ManuUploadedDocument[],
  idx: number,
): number {
  let base = hasCategory(docs, "prd") ? 91 : 78;
  if (hasCategory(docs, "fmea") && sectionId === "safety-warnings") base = 96;
  if (hasCategory(docs, "regulatory") && (sectionId === "regulatory-compliance" || sectionId === "country-certification")) {
    base = 93;
  }
  return Math.min(99, base + (idx % 3));
}

export function simulateManuRun(params: {
  mission: ManuMission;
  mode: ManuMode;
  documents: ManuUploadedDocument[];
  manualConfig: ManuManualConfig;
}): ManuRun {
  const { mission, mode, documents, manualConfig } = params;
  const now = new Date().toISOString();
  const meta = manualConfig.metadata;
  const productKey = resolveProductKey(meta.modelCode);
  const content = MANU_PRODUCT_CONTENT[productKey];
  const gaps = buildGaps(documents, mission.id);
  const focus = getMissionFocus(mission.id);

  const selectedDefs = MANU_ALL_SECTIONS.filter((s) => manualConfig.selectedSectionIds.includes(s.id));

  const generatedSections = selectedDefs.map((def, idx) => {
    const relatedDocs = sectionSources(def.id, documents);
    const riskFlags: string[] = [];
    const complianceFlags: string[] = [];

    if (def.id === "safety-warnings" && !hasCategory(documents, "fmea")) {
      riskFlags.push("FMEA not in bundle");
    }
    if ((def.id === "regulatory-compliance" || def.id === "country-certification") && !hasCategory(documents, "regulatory")) {
      complianceFlags.push("Regulatory source missing");
    }
    if (mission.id === MANU_MISSION_IDS.manualUpdate && !hasCategory(documents, "existing_manual")) {
      complianceFlags.push("Revision baseline — no prior manual for redline comparison");
    }

    const confidence = sectionConfidence(def.id, documents, idx) / 100;

    return {
      id: def.id,
      title: def.title,
      content: sectionContentMap(def.id, content),
      confidence,
      sourceReferences: relatedDocs.map((d) => ({
        documentId: d.id,
        documentName: d.fileName,
        category: d.category,
        excerpt: d.extractedText.slice(0, 180) + (d.extractedText.length > 180 ? "…" : ""),
      })),
      relatedDocumentIds: relatedDocs.map((d) => d.id),
      riskFlags,
      complianceFlags,
      status: "draft" as const,
      required: def.required,
    };
  });

  const langCodes =
    meta.targetLanguages.length > 0
      ? meta.targetLanguages
      : ["es", "fr", "de"];

  const translationSections =
    mission.id === MANU_MISSION_IDS.translationQa
      ? generatedSections.filter((s) =>
          ["safety-warnings", "intended-use", "regulatory-compliance", "operating-instructions"].includes(s.id),
        )
      : generatedSections.filter((s) => s.required).slice(0, 6);

  const translationQA = langCodes.flatMap((code) => {
    const lang = MANU_LANGUAGES.find((l) => l.code === code);
    const score = (MANU_TRANSLATION_SCORES[code] ?? 90) / 100;
    const languageLabel = lang?.label ?? code;
    return translationSections.map((section) => ({
      sectionId: section.id,
      sectionTitle: section.title,
      sourceText: section.content,
      translatedText: simulateTranslatedText(section.content, code, languageLabel),
      language: languageLabel,
      accuracyScore: score,
      terminologyFlags:
        section.id === "safety-warnings" ? [] : ["Verify localized warning symbols per market labeling checklist"],
      missingWarnings: [],
    }));
  });

  const totalSections = generatedSections.length;

  return {
    runId: `manu-${crypto.randomUUID()}`,
    agentId: MANU_AGENT_ID,
    missionId: mission.id,
    mode,
    client: MANU_CLIENT,
    uploadedDocuments: documents,
    documentClassifications: Object.fromEntries(documents.map((d) => [d.id, d.category])),
    extractedFacts: buildExtractedFacts(documents, meta, productKey, gaps),
    manualConfig,
    generatedSections,
    traceabilityMatrix: buildTraceability(documents, generatedSections),
    riskCoverage: buildRiskCoverage(documents, productKey),
    regulatoryChecklist: buildRegulatoryChecklist(documents, productKey),
    approvalStatus: {
      allRequiredApproved: false,
      approvedCount: 0,
      flaggedCount: 0,
      requiredCount: totalSections,
    },
    translationQA,
    exportStatus: {
      approved_manual: "idle",
      traceability_matrix: "idle",
      risk_coverage: "idle",
      regulatory_checklist: "idle",
      translation_qa: "idle",
      audit_package: "idle",
    },
    gaps,
    missionFocus: focus,
    createdAt: now,
    updatedAt: now,
  };
}

export function getCategoryLabel(cat: ManuDocumentCategory): string {
  return CATEGORY_LABELS[cat];
}

// Re-export sample builder for backwards compatibility
export { buildUploadedDocumentFromFile as buildUploadedDocument } from "@/lib/manuSampleLoader";
