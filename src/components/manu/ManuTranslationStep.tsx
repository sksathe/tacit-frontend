import { MANU_LANGUAGES, MANU_TRANSLATION_SCORES } from "@/data/manuLabcorp";

import { Button } from "@/components/ui/button";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import { Textarea } from "@/components/ui/textarea";

import { manuSectionCardPalette } from "@/components/manu/manuTheme";

import { generateManuTranslationQAForLanguages } from "@/lib/manuApi";

import {

  approveAllTranslations,

  approveAllTranslationsForLanguage,

  buildFallbackTranslationQA,

  enrichTranslationQA,

  getLangLabel,

  getRunTargetLanguageCodes,

  getTranslationRowsForLanguage,

  patchTranslationRow,

} from "@/lib/manuTranslationUtils";

import type { ManuRun, ManuSectionStatus } from "@/types/manu";

import { AlertTriangle, CheckCircle2, Flag } from "lucide-react";

import { useEffect, useMemo, useRef, useState } from "react";



interface ManuTranslationStepProps {

  run: ManuRun;

  onRunChange: (run: ManuRun) => void;

  onContinue: () => void;

  onBack: () => void;

}



function statusBadge(status: ManuSectionStatus, approvedClass?: string) {

  if (status === "approved") return <Badge className={approvedClass ?? "bg-emerald-600/90"}>Approved</Badge>;

  if (status === "flagged") return <Badge variant="destructive">Flagged</Badge>;

  return <Badge variant="secondary">Draft</Badge>;

}



function translationCardClass(

  status: ManuSectionStatus,

  palette: (typeof manuSectionCardPalette)[number],

) {

  const base = `border-l-4 shadow-sm ${palette.card}`;

  if (status === "flagged") return `${base} border-l-destructive ring-1 ring-destructive/25`;

  if (status === "approved") return `${base} ring-1 ring-black/5 dark:ring-white/10`;

  return `${base} opacity-95`;

}



export function ManuTranslationStep({ run, onRunChange, onContinue, onBack }: ManuTranslationStepProps) {

  const langCodes = useMemo(() => getRunTargetLanguageCodes(run), [run]);

  const [activeLang, setActiveLang] = useState(langCodes[0] ?? "");

  const [isGenerating, setIsGenerating] = useState(false);

  const [genError, setGenError] = useState<string | null>(null);
  const generationStartedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const applyRows = (translationQA: ManuRun["translationQA"]) => {
      onRunChange({
        ...run,
        translationQA,
        updatedAt: new Date().toISOString(),
        translationApprovalStatus: {
          allRequiredApproved: false,
          approvedCount: translationQA.filter((r) => r.status === "approved").length,
          flaggedCount: translationQA.filter((r) => r.status === "flagged").length,
          requiredCount: translationQA.length,
        },
      });
    };

    if (!langCodes.length) return;

    if (run.translationQA.length > 0) {
      const enriched = enrichTranslationQA(run.translationQA, run.translationQA, run, langCodes);
      const needsEnrichment = enriched.length !== run.translationQA.length;
      if (needsEnrichment) {
        applyRows(enriched);
      }
      return;
    }

    if (generationStartedRef.current) return;
    generationStartedRef.current = true;

    const generate = async () => {
      setIsGenerating(true);
      setGenError(null);
      try {
        const fromApi = await generateManuTranslationQAForLanguages(run, langCodes);
        if (cancelled) return;
        applyRows(enrichTranslationQA(fromApi, run.translationQA, run, langCodes));
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Failed to generate translation QA";
        setGenError(message);
        applyRows(buildFallbackTranslationQA(run, langCodes));
      } finally {
        if (!cancelled) setIsGenerating(false);
      }
    };

    void generate();
    return () => {
      cancelled = true;
    };
  }, [run.runId, run.missionId, run.translationQA.length, langCodes.join(",")]);



  if (!langCodes.length) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Translation accuracy QA</h2>
          <p className="mt-2 text-muted-foreground">
            No target languages were selected — this run is English-only. Continue to export your manual package.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button className="bg-gradient-primary" onClick={onContinue}>
            Continue to export
          </Button>
        </div>
      </div>
    );
  }

  const activeLabel = getLangLabel(activeLang);

  const activeScore = (MANU_TRANSLATION_SCORES[activeLang] ?? 90) / 100;

  const rowsForLang = getTranslationRowsForLanguage(run.translationQA, activeLang);



  const avgScore =

    rowsForLang.length > 0

      ? rowsForLang.reduce((a, r) => a + r.accuracyScore, 0) / rowsForLang.length

      : activeScore;



  const approval = run.translationApprovalStatus ?? {
    allRequiredApproved: false,
    approvedCount: 0,
    flaggedCount: 0,
    requiredCount: 0,
  };

  const langApprovedCount = rowsForLang.filter((r) => r.status === "approved").length;

  const allTranslationsApproved = approval.allRequiredApproved && approval.requiredCount > 0;

  const allActiveLangApproved = rowsForLang.length > 0 && rowsForLang.every((r) => r.status === "approved");



  const updateRow = (sectionId: string, patch: Parameters<typeof patchTranslationRow>[3]) => {

    onRunChange(patchTranslationRow(run, sectionId, activeLang, patch));

  };



  return (

    <div className="space-y-6">

      <div className="flex flex-wrap items-start justify-between gap-4">

        <div>

          <h2 className="text-2xl font-bold">Translation accuracy QA</h2>

          <p className="mt-2 text-muted-foreground">

            Review AI-generated translations for each target language. Approve section-by-section before export.

          </p>

        </div>

        <div className="flex flex-wrap gap-2">

          <Button variant="outline" onClick={() => onRunChange(approveAllTranslationsForLanguage(run, activeLang))}>

            Approve all ({activeLabel})

          </Button>

          <Button variant="outline" onClick={() => onRunChange(approveAllTranslations(run))}>

            Approve all languages

          </Button>

          <Button className="bg-gradient-primary" disabled={!allTranslationsApproved} onClick={onContinue}>

            Continue to export

          </Button>

        </div>

      </div>



      {isGenerating && (

        <Card className="border-primary/30 bg-primary/5">

          <CardContent className="py-3 text-sm text-muted-foreground">

            Generating translated manual sections with OpenAI…

          </CardContent>

        </Card>

      )}

      {genError && (

        <Card className="border-amber-500/40 bg-amber-500/10">

          <CardContent className="py-3 text-sm text-amber-700 dark:text-amber-400">

            {genError} — showing placeholder translations until AI generation is available. You can still review and

            approve.

          </CardContent>

        </Card>

      )}



      <p className="text-sm text-muted-foreground">

        Translation approval: {approval.approvedCount} of {approval.requiredCount} rows approved

        {langApprovedCount > 0 && ` · ${activeLabel}: ${langApprovedCount} of ${rowsForLang.length}`}

        {!allTranslationsApproved && " — approve every translation row before export."}

      </p>



      <div className="flex flex-wrap gap-2">

        {langCodes.map((code) => {

          const label = getLangLabel(code);

          const score = MANU_TRANSLATION_SCORES[code] ?? 90;

          const langRows = getTranslationRowsForLanguage(run.translationQA, code);

          const langDone = langRows.length > 0 && langRows.every((r) => r.status === "approved");

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

              {langDone && <span className="ml-2 text-xs text-emerald-500">✓</span>}

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

            {allActiveLangApproved ? "Language approved" : avgScore >= 0.92 ? "Pass threshold" : "Review recommended"}

          </Badge>

        </CardContent>

      </Card>



      <div className="space-y-4">

        {rowsForLang.map((row, index) => {

          const palette = manuSectionCardPalette[index % manuSectionCardPalette.length];

          return (

            <Card key={`${row.sectionId}-${activeLang}`} className={translationCardClass(row.status, palette)}>

              <CardHeader className="pb-2">

                <div className="flex flex-wrap items-center justify-between gap-2">

                  <CardTitle className={`text-base ${palette.header}`}>{row.sectionTitle}</CardTitle>

                  <div className="flex items-center gap-2">

                    {statusBadge(row.status, palette.approvedBadge)}

                    <Badge variant="outline" className="border-border/80 bg-background/60">

                      {Math.round(row.accuracyScore * 100)}% match

                    </Badge>

                  </div>

                </div>

              </CardHeader>

              <CardContent className="space-y-3">

                <div className="grid gap-4 md:grid-cols-2">

                  <div>

                    <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">English source</p>

                    <p className="text-sm leading-relaxed">{row.sourceText}</p>

                  </div>

                  <div>

                    <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">{activeLabel} (translated)</p>

                    <p className="text-sm leading-relaxed text-muted-foreground">{row.translatedText}</p>

                  </div>

                </div>

                {row.terminologyFlags.length > 0 && (

                  <p className="text-xs text-amber-500">{row.terminologyFlags.join(" · ")}</p>

                )}

                {row.missingWarnings.length > 0 && (

                  <p className="flex gap-2 text-xs text-destructive">

                    <AlertTriangle className="h-3 w-3 shrink-0" />

                    {row.missingWarnings.join(" · ")}

                  </p>

                )}

                {row.flagReason && <p className="text-xs text-destructive">Flag reason: {row.flagReason}</p>}

                <Textarea

                  placeholder="Approver notes and translation comments…"

                  value={row.approverNotes ?? ""}

                  onChange={(e) => updateRow(row.sectionId, { approverNotes: e.target.value })}

                  className="min-h-[60px] text-xs"

                />

                <div className="flex gap-2">

                  <Button

                    size="sm"

                    variant="outline"

                    className={`gap-1 border-current/20 ${palette.header}`}

                    onClick={() => updateRow(row.sectionId, { status: "approved", flagReason: undefined })}

                  >

                    <CheckCircle2 className="h-3 w-3" /> Approve

                  </Button>

                  <Button

                    size="sm"

                    variant="outline"

                    className="gap-1 text-destructive"

                    onClick={() =>

                      updateRow(row.sectionId, {

                        status: "flagged",

                        flagReason: row.approverNotes || "Requires revision — terminology or warning localization",

                      })

                    }

                  >

                    <Flag className="h-3 w-3" /> Flag

                  </Button>

                </div>

              </CardContent>

            </Card>

          );

        })}

      </div>



      <div className="flex justify-between">

        <Button type="button" variant="outline" onClick={onBack}>

          Back to approval

        </Button>

        <Button className="bg-gradient-primary" disabled={!allTranslationsApproved} onClick={onContinue}>

          Continue to export

        </Button>

      </div>

    </div>

  );

}

