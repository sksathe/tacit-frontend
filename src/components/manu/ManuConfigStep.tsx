import { MANU_ADVANCED_SECTIONS, MANU_DEFAULT_SECTIONS } from "@/data/manuSections";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MANU_LANGUAGES, MANU_MANUAL_TEMPLATES, MANU_MARKETS } from "@/data/manuLabcorp";
import type { ManuManualMetadata } from "@/types/manu";

interface ManuConfigStepProps {
  metadata: ManuManualMetadata;
  selectedSectionIds: string[];
  onMetadataChange: (meta: ManuManualMetadata) => void;
  onSectionsChange: (ids: string[]) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function ManuConfigStep({
  metadata,
  selectedSectionIds,
  onMetadataChange,
  onSectionsChange,
  onContinue,
  onBack,
}: ManuConfigStepProps) {
  const toggleSection = (id: string, checked: boolean) => {
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

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Configure manual</h2>
        <p className="mt-2 text-muted-foreground">Define product metadata and which manual sections MANU should generate.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manual metadata</CardTitle>
          <CardDescription>Product identity and publication context</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Product name</Label>
            <Input className="mt-1" value={metadata.productName} onChange={(e) => onMetadataChange({ ...metadata, productName: e.target.value })} placeholder="e.g. LabCentrifuge Pro" />
          </div>
          <div>
            <Label>Model code</Label>
            <Input className="mt-1" value={metadata.modelCode} onChange={(e) => onMetadataChange({ ...metadata, modelCode: e.target.value })} placeholder="LC-4500" />
          </div>
          <div>
            <Label>Manual type</Label>
            <Select value={metadata.manualType} onValueChange={(v) => onMetadataChange({ ...metadata, manualType: v })}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Equipment / Product Manual (IFU)">Equipment / Product Manual (IFU)</SelectItem>
                <SelectItem value="Service Manual">Service Manual</SelectItem>
                <SelectItem value="Quick Reference Guide">Quick Reference Guide</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Template type</Label>
            <Select value={metadata.templateType} onValueChange={(v) => onMetadataChange({ ...metadata, templateType: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MANU_MANUAL_TEMPLATES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Revision / version</Label>
            <Input className="mt-1" value={metadata.revision} onChange={(e) => onMetadataChange({ ...metadata, revision: e.target.value })} placeholder="Rev 1.0" />
          </div>
          <div>
            <Label>Approver role</Label>
            <Input className="mt-1" value={metadata.approverRole} onChange={(e) => onMetadataChange({ ...metadata, approverRole: e.target.value })} placeholder="Quality / Regulatory" />
          </div>
          <div className="sm:col-span-2">
            <Label>Intended audience</Label>
            <Input className="mt-1" value={metadata.intendedAudience} onChange={(e) => onMetadataChange({ ...metadata, intendedAudience: e.target.value })} placeholder="Qualified laboratory personnel" />
          </div>
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
          <div className="sm:col-span-2">
            <Label>Target languages</Label>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manual sections</CardTitle>
          <CardDescription>Select sections to generate. Required sections are pre-selected.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <SectionGroup title="Default sections" sections={MANU_DEFAULT_SECTIONS} selected={selectedSectionIds} onToggle={toggleSection} />
          <SectionGroup title="Advanced sections" sections={MANU_ADVANCED_SECTIONS} selected={selectedSectionIds} onToggle={toggleSection} />
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button className="bg-gradient-primary" disabled={!metadata.productName || selectedSectionIds.length === 0} onClick={onContinue}>
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
