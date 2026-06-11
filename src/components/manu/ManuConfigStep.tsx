import { useEffect } from "react";
import { MANU_ADVANCED_SECTIONS, MANU_DEFAULT_SECTIONS } from "@/data/manuSections";
import {
  defaultSectionIdsForMission,
  getMissionSectionDefinitions,
  getMissionUiProfile,
} from "@/data/manuMissionUi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MANU_LANGUAGES, MANU_MANUAL_TEMPLATES, MANU_MARKETS } from "@/data/manuLabcorp";
import type { ManuManualMetadata } from "@/types/manu";

interface ManuConfigStepProps {
  missionId: string;
  metadata: ManuManualMetadata;
  selectedSectionIds: string[];
  onMetadataChange: (meta: ManuManualMetadata) => void;
  onSectionsChange: (ids: string[]) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function ManuConfigStep({
  missionId,
  metadata,
  selectedSectionIds,
  onMetadataChange,
  onSectionsChange,
  onContinue,
  onBack,
}: ManuConfigStepProps) {
  const profile = getMissionUiProfile(missionId);
  const missionSections = getMissionSectionDefinitions(missionId);
  const defaultSections = MANU_DEFAULT_SECTIONS.filter((s) => profile.sectionIds.includes(s.id));
  const advancedSections = MANU_ADVANCED_SECTIONS.filter((s) => profile.sectionIds.includes(s.id));

  useEffect(() => {
    if (profile.sectionMode === "locked") {
      const locked = defaultSectionIdsForMission(missionId);
      const same =
        locked.length === selectedSectionIds.length &&
        locked.every((id) => selectedSectionIds.includes(id));
      if (!same) onSectionsChange(locked);
    }
  }, [missionId, profile.sectionMode, selectedSectionIds, onSectionsChange]);

  const toggleSection = (id: string, checked: boolean) => {
    if (profile.sectionMode === "locked") return;
    if (checked) onSectionsChange([...selectedSectionIds, id]);
    else onSectionsChange(selectedSectionIds.filter((s) => s !== id));
  };

  const toggleMarket = (market: string) => {
    const next = metadata.targetMarkets.includes(market)
      ? metadata.targetMarkets.filter((m) => m !== market)
      : [...metadata.targetMarkets, market];
    onMetadataChange({ ...metadata, targetMarkets: next });
  };

  const toggleLanguage = (lang: string) => {
    const next = metadata.targetLanguages.includes(lang)
      ? metadata.targetLanguages.filter((l) => l !== lang)
      : [...metadata.targetLanguages, lang];
    onMetadataChange({ ...metadata, targetLanguages: next });
  };

  const canContinue =
    metadata.productName.trim().length > 0 &&
    selectedSectionIds.length > 0 &&
    (!profile.languagesPrimary || metadata.targetLanguages.length > 0);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">{profile.configTitle}</h2>
        <p className="mt-2 text-muted-foreground">{profile.configDescription}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{profile.languagesPrimary ? "Product & languages" : "Manual metadata"}</CardTitle>
          <CardDescription>
            {profile.languagesPrimary
              ? "Identify the product and select languages — MANU will generate translated manual sections for each."
              : "Product identity and publication context"}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Product name</Label>
            <Input
              className="mt-1"
              value={metadata.productName}
              onChange={(e) => onMetadataChange({ ...metadata, productName: e.target.value })}
              placeholder="e.g. CentraSpin Ultra 24R"
            />
          </div>
          <div>
            <Label>Model code</Label>
            <Input
              className="mt-1"
              value={metadata.modelCode}
              onChange={(e) => onMetadataChange({ ...metadata, modelCode: e.target.value })}
              placeholder="CS-ULTRA-24R"
            />
          </div>
          {profile.showManualType && (
            <div>
              <Label>Manual type</Label>
              <Select value={metadata.manualType} onValueChange={(v) => onMetadataChange({ ...metadata, manualType: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Equipment / Product Manual (IFU)">Equipment / Product Manual (IFU)</SelectItem>
                  <SelectItem value="Service Manual">Service Manual</SelectItem>
                  <SelectItem value="Quick Reference Guide">Quick Reference Guide</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {profile.showTemplate && (
            <div>
              <Label>Template type</Label>
              <Select value={metadata.templateType} onValueChange={(v) => onMetadataChange({ ...metadata, templateType: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MANU_MANUAL_TEMPLATES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {(profile.revisionPrimary || profile.showManualType) && (
            <div>
              <Label>{profile.revisionPrimary ? "Revision / version (required for update)" : "Revision / version"}</Label>
              <Input
                className="mt-1"
                value={metadata.revision}
                onChange={(e) => onMetadataChange({ ...metadata, revision: e.target.value })}
                placeholder="Rev 1.0"
              />
            </div>
          )}
          {profile.showApprover && (
            <div>
              <Label>Approver role</Label>
              <Input
                className="mt-1"
                value={metadata.approverRole}
                onChange={(e) => onMetadataChange({ ...metadata, approverRole: e.target.value })}
                placeholder="Quality / Regulatory"
              />
            </div>
          )}
          {profile.showAudience && (
            <div className="sm:col-span-2">
              <Label>Intended audience</Label>
              <Input
                className="mt-1"
                value={metadata.intendedAudience}
                onChange={(e) => onMetadataChange({ ...metadata, intendedAudience: e.target.value })}
                placeholder="Qualified laboratory personnel"
              />
            </div>
          )}
          {profile.showMarkets && (
            <div className="sm:col-span-2">
              <Label>Target markets</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {MANU_MARKETS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => toggleMarket(m)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${metadata.targetMarkets.includes(m) ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}
          {profile.showLanguages && (
            <div className={`sm:col-span-2 ${profile.languagesPrimary ? "rounded-lg border border-primary/35 bg-primary/5 p-4" : ""}`}>
              <Label>{profile.languagesPrimary ? "Target languages to generate *" : "Target languages"}</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                {profile.languagesPrimary
                  ? "OpenAI generates a full translated section for each language you select."
                  : "Post-approval translation targets"}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {MANU_LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => toggleLanguage(l.code)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${metadata.targetLanguages.includes(l.code) ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"}`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {profile.sectionMode === "locked"
              ? "English source sections (fixed for translation QA)"
              : profile.sectionMode === "filtered"
                ? "Sections to validate"
                : "Manual sections"}
          </CardTitle>
          <CardDescription>
            {profile.sectionMode === "locked"
              ? "These English sections are the source for AI-generated translations."
              : profile.sectionMode === "filtered"
                ? "Only mission-relevant sections are shown."
                : "Select sections to generate. Required sections are pre-selected."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {profile.sectionMode === "locked" ? (
            <ul className="space-y-2">
              {missionSections.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 text-sm"
                >
                  <span className="font-medium">{s.title}</span>
                  <span className="text-xs text-muted-foreground">English source</span>
                </li>
              ))}
            </ul>
          ) : (
            <>
              {defaultSections.length > 0 && (
                <SectionGroup
                  title={profile.sectionMode === "filtered" ? "Core sections" : "Default sections"}
                  sections={defaultSections}
                  selected={selectedSectionIds}
                  onToggle={toggleSection}
                />
              )}
              {advancedSections.length > 0 && (
                <SectionGroup title="Advanced sections" sections={advancedSections} selected={selectedSectionIds} onToggle={toggleSection} />
              )}
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button className="bg-gradient-primary" disabled={!canContinue} onClick={onContinue}>
          Continue to review
        </Button>
      </div>
    </div>
  );
}

function SectionGroup({
  title,
  sections,
  selected,
  onToggle,
}: {
  title: string;
  sections: { id: string; title: string; required?: boolean }[];
  selected: string[];
  onToggle: (id: string, checked: boolean) => void;
}) {
  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-muted-foreground">{title}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {sections.map((s) => (
          <label key={s.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/50 px-3 py-2 hover:bg-muted/30">
            <Checkbox
              checked={selected.includes(s.id)}
              onCheckedChange={(c) => onToggle(s.id, !!c)}
              disabled={s.required}
            />
            <span className="text-sm">
              {s.title}
              {s.required && <span className="ml-1 text-primary">*</span>}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

export { defaultSectionIdsForMission };
