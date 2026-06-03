import { MANU_LANGUAGES, MANU_TRANSLATION_SCORES } from "@/data/manuLabcorp";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ManuRun } from "@/types/manu";
import { AlertTriangle } from "lucide-react";
import { useMemo, useState } from "react";

interface ManuTranslationStepProps {
  run: ManuRun;
  onContinue: () => void;
  onBack: () => void;
}

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
};

function fallbackTranslate(source: string, langCode: string, langLabel: string): string {
  const dictionary = FALLBACK_TRANSLATION_MAP[langCode];
  if (!dictionary) return `[${langLabel}] ${source.slice(0, 220)}${source.length > 220 ? "…" : ""}`;
  const translated = dictionary.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), source);
  return `[${langLabel}] ${translated.slice(0, 220)}${translated.length > 220 ? "…" : ""}`;
}

export function ManuTranslationStep({ run, onContinue, onBack }: ManuTranslationStepProps) {
  const langCodes = useMemo(() => {
    const fromMeta = run.manualConfig.metadata.targetLanguages;
    if (fromMeta.length) return fromMeta;
    const fromQA = [...new Set(run.translationQA.map((r) => r.language))];
    return fromQA.length ? fromQA : ["es", "fr", "de"];
  }, [run]);

  const [activeLang, setActiveLang] = useState(langCodes[0] ?? "es");

  const activeLabel = MANU_LANGUAGES.find((l) => l.code === activeLang)?.label ?? activeLang;
  const activeScore = (MANU_TRANSLATION_SCORES[activeLang] ?? 90) / 100;

  const rowsForLang = run.translationQA.filter(
    (r) => r.language === activeLabel || r.language === activeLang,
  );

  const displayRows =
    rowsForLang.length > 0
      ? rowsForLang
      : run.translationQA.slice(0, 4).map((r) => ({
          ...r,
          language: activeLabel,
          translatedText: `[${activeLabel} simulated] ${r.sourceText.slice(0, 200)}…`,
          accuracyScore: activeScore,
        }));

  const normalizedRows = displayRows.map((row) => {
    const looksUntranslated = row.translatedText.includes(row.sourceText.slice(0, 60));
    if (!looksUntranslated) return row;
    return {
      ...row,
      translatedText: fallbackTranslate(row.sourceText, activeLang, activeLabel),
    };
  });

  const avgScore =
    normalizedRows.length > 0
      ? normalizedRows.reduce((a, r) => a + r.accuracyScore, 0) / normalizedRows.length
      : activeScore;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Translation accuracy QA</h2>
        <p className="mt-2 text-muted-foreground">
          Compare translated sections against approved English source. Scores align with LabCorp HTML prototype (simulated per language).
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {langCodes.map((code) => {
          const label = MANU_LANGUAGES.find((l) => l.code === code)?.label ?? code;
          const score = MANU_TRANSLATION_SCORES[code] ?? 90;
          return (
            <button
              key={code}
              type="button"
              onClick={() => setActiveLang(code)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                activeLang === code ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"
              }`}
            >
              {label}
              <span className="ml-2 text-xs opacity-80">{score}%</span>
            </button>
          );
        })}
      </div>

      <Card className="border-primary/25">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
          <div>
            <p className="text-sm text-muted-foreground">Semantic accuracy ({activeLabel})</p>
            <p className="text-3xl font-bold text-primary">{Math.round(avgScore * 100)}%</p>
          </div>
          <Badge variant={avgScore >= 0.92 ? "default" : "secondary"}>
            {avgScore >= 0.92 ? "Pass threshold" : "Review recommended"}
          </Badge>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {normalizedRows.map((row) => (
          <Card key={`${row.sectionId}-${activeLang}`}>
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base">{row.sectionTitle}</CardTitle>
                <Badge variant="outline">{Math.round(row.accuracyScore * 100)}% match</Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">English source</p>
                <p className="text-sm leading-relaxed">{row.sourceText}</p>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">{activeLabel} (translated)</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{row.translatedText}</p>
              </div>
              {row.terminologyFlags.length > 0 && (
                <p className="md:col-span-2 text-xs text-amber-500">{row.terminologyFlags.join(" · ")}</p>
              )}
              {row.missingWarnings.length > 0 && (
                <p className="md:col-span-2 flex gap-2 text-xs text-destructive">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  {row.missingWarnings.join(" · ")}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back to approval
        </Button>
        <Button className="bg-gradient-primary" onClick={onContinue}>
          Continue to export
        </Button>
      </div>
    </div>
  );
}
