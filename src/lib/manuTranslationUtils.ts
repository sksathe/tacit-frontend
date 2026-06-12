import { MANU_LANGUAGES, MANU_TRANSLATION_SCORES } from "@/data/manuLabcorp";
import type { ManuRun, ManuSectionStatus, ManuTranslationQARow } from "@/types/manu";

const FALLBACK_TRANSLATION_MAP: Record<string, Array<[RegExp, string]>> = {
  es: [
    [/\bwarning\b/gi, "advertencia"],
    [/\bcaution\b/gi, "precaucion"],
    [/\bsafety\b/gi, "seguridad"],
    [/\bdevice\b/gi, "dispositivo"],
    [/\blaboratory\b/gi, "laboratorio"],
  ],
  fr: [
    [/\bwarning\b/gi, "avertissement"],
    [/\bcaution\b/gi, "attention"],
    [/\bsafety\b/gi, "securite"],
    [/\bdevice\b/gi, "dispositif"],
    [/\blaboratory\b/gi, "laboratoire"],
  ],
  de: [
    [/\bwarning\b/gi, "warnhinweis"],
    [/\bcaution\b/gi, "vorsicht"],
    [/\bsafety\b/gi, "sicherheit"],
    [/\bdevice\b/gi, "geraet"],
    [/\blaboratory\b/gi, "labor"],
  ],
  hi: [
    [/\bwarning\b/gi, "चेतावनी"],
    [/\bcaution\b/gi, "सावधानी"],
    [/\bsafety\b/gi, "सुरक्षा"],
    [/\bdevice\b/gi, "उपकरण"],
    [/\blaboratory\b/gi, "प्रयोगशाला"],
  ],
};

export function getLangLabel(langCode: string): string {
  return MANU_LANGUAGES.find((l) => l.code === langCode)?.label ?? langCode;
}

export function matchesTranslationLanguage(rowLanguage: string, langCode: string): boolean {
  const label = getLangLabel(langCode);
  const normalized = rowLanguage.toLowerCase().trim();
  return normalized === langCode.toLowerCase() || normalized === label.toLowerCase();
}

export function translationRowKey(sectionId: string, language: string): string {
  return `${sectionId}::${language.toLowerCase()}`;
}

export function normalizeTranslationRow(row: Partial<ManuTranslationQARow>): ManuTranslationQARow {
  return {
    sectionId: row.sectionId ?? "",
    sectionTitle: row.sectionTitle ?? "",
    sourceText: row.sourceText ?? "",
    translatedText: row.translatedText ?? "",
    language: row.language ?? "",
    accuracyScore: typeof row.accuracyScore === "number" ? row.accuracyScore : 0.85,
    terminologyFlags: Array.isArray(row.terminologyFlags) ? row.terminologyFlags : [],
    missingWarnings: Array.isArray(row.missingWarnings) ? row.missingWarnings : [],
    status: (row.status ?? "draft") as ManuSectionStatus,
    flagReason: row.flagReason,
    approverNotes: row.approverNotes,
  };
}

export function computeTranslationApprovalStatus(rows: ManuTranslationQARow[]) {
  const requiredCount = rows.length;
  const approvedCount = rows.filter((r) => r.status === "approved").length;
  const flaggedCount = rows.filter((r) => r.status === "flagged").length;
  return {
    allRequiredApproved: requiredCount > 0 && rows.every((r) => r.status === "approved"),
    approvedCount,
    flaggedCount,
    requiredCount,
  };
}

export function getRunTargetLanguageCodes(run: ManuRun): string[] {
  const fromMeta = run.manualConfig.metadata.targetLanguages;
  if (fromMeta.length) return fromMeta;
  const fromQA = [
    ...new Set(
      run.translationQA
        .map((r) => MANU_LANGUAGES.find((l) => matchesTranslationLanguage(r.language, l.code))?.code ?? r.language)
        .filter(Boolean),
    ),
  ];
  return fromQA;
}

export function needsTranslationQA(run: ManuRun): boolean {
  return getRunTargetLanguageCodes(run).length > 0;
}

export function getTranslationTargetSections(run: ManuRun) {
  if (run.missionId === "translation-qa") {
    return run.generatedSections.filter((s) =>
      ["safety-warnings", "intended-use", "regulatory-compliance", "operating-instructions"].includes(s.id),
    );
  }
  return run.generatedSections.filter((s) => s.required).slice(0, 6);
}

export function fallbackTranslate(source: string, langCode: string, langLabel: string): string {
  const dictionary = FALLBACK_TRANSLATION_MAP[langCode];
  if (!dictionary) return `[${langLabel}] ${source.slice(0, 220)}${source.length > 220 ? "…" : ""}`;
  const translated = dictionary.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), source);
  return `[${langLabel}] ${translated.slice(0, 220)}${translated.length > 220 ? "…" : ""}`;
}

function buildFallbackRow(
  section: ManuRun["generatedSections"][0],
  langCode: string,
  langLabel: string,
  isPlaceholder: boolean,
): ManuTranslationQARow {
  const score = (MANU_TRANSLATION_SCORES[langCode] ?? 90) / 100;
  return normalizeTranslationRow({
    sectionId: section.id,
    sectionTitle: section.title,
    sourceText: section.content.slice(0, 220),
    language: langLabel,
    translatedText: fallbackTranslate(section.content, langCode, langLabel),
    accuracyScore: Math.max(0.75, score - 0.08),
    terminologyFlags: isPlaceholder
      ? ["AI output missing for this language; showing placeholder translation"]
      : section.id === "safety-warnings"
        ? []
        : ["Verify localized warning symbols per market labeling checklist"],
    missingWarnings: [],
    status: "draft",
  });
}

export function getTranslationRowsForLanguage(
  translationQA: ManuTranslationQARow[],
  langCode: string,
): ManuTranslationQARow[] {
  return translationQA.filter((r) => matchesTranslationLanguage(r.language, langCode));
}

export function enrichTranslationQA(
  incoming: ManuTranslationQARow[],
  existing: ManuTranslationQARow[],
  run: ManuRun,
  langCodes: string[],
): ManuTranslationQARow[] {
  const preserved = new Map(
    existing.map((r) => [translationRowKey(r.sectionId, r.language), r]),
  );

  const rows = incoming.map((row) => {
    const normalized = normalizeTranslationRow(row);
    const prev = preserved.get(translationRowKey(normalized.sectionId, normalized.language));
    if (!prev) return normalized;
    return normalizeTranslationRow({
      ...normalized,
      status: prev.status,
      approverNotes: prev.approverNotes,
      flagReason: prev.flagReason,
    });
  });

  const sections = getTranslationTargetSections(run);
  for (const code of langCodes) {
    const label = getLangLabel(code);
    for (const section of sections) {
      const exists = rows.some(
        (r) => r.sectionId === section.id && matchesTranslationLanguage(r.language, code),
      );
      if (!exists) {
        rows.push(buildFallbackRow(section, code, label, incoming.length === 0));
      }
    }
  }

  return rows.map((row) => {
    const looksUntranslated = row.translatedText.includes(row.sourceText.slice(0, 60));
    if (!looksUntranslated) return row;
    const langCode =
      MANU_LANGUAGES.find((l) => matchesTranslationLanguage(row.language, l.code))?.code ?? row.language;
    return {
      ...row,
      translatedText: fallbackTranslate(row.sourceText, langCode, getLangLabel(langCode)),
    };
  });
}

export function buildFallbackTranslationQA(run: ManuRun, langCodes: string[]): ManuTranslationQARow[] {
  const sections = getTranslationTargetSections(run);
  return langCodes.flatMap((code) => {
    const label = getLangLabel(code);
    return sections.map((section) => buildFallbackRow(section, code, label, true));
  });
}

export function patchTranslationRow(
  run: ManuRun,
  sectionId: string,
  langCode: string,
  patch: Partial<ManuTranslationQARow>,
): ManuRun {
  const label = getLangLabel(langCode);
  const translationQA = run.translationQA.map((row) => {
    if (row.sectionId !== sectionId || !matchesTranslationLanguage(row.language, langCode)) return row;
    return normalizeTranslationRow({ ...row, ...patch, language: row.language || label });
  });

  return {
    ...run,
    translationQA,
    updatedAt: new Date().toISOString(),
    translationApprovalStatus: computeTranslationApprovalStatus(translationQA),
  };
}

export function approveAllTranslationsForLanguage(run: ManuRun, langCode: string): ManuRun {
  const translationQA = run.translationQA.map((row) =>
    matchesTranslationLanguage(row.language, langCode)
      ? normalizeTranslationRow({ ...row, status: "approved", flagReason: undefined })
      : row,
  );
  return {
    ...run,
    translationQA,
    updatedAt: new Date().toISOString(),
    translationApprovalStatus: computeTranslationApprovalStatus(translationQA),
  };
}

export function approveAllTranslations(run: ManuRun): ManuRun {
  const translationQA = run.translationQA.map((row) =>
    normalizeTranslationRow({ ...row, status: "approved", flagReason: undefined }),
  );
  return {
    ...run,
    translationQA,
    updatedAt: new Date().toISOString(),
    translationApprovalStatus: computeTranslationApprovalStatus(translationQA),
  };
}
