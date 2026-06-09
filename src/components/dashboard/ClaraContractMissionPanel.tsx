import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDispatchProfile } from "@/features/dispatch/catalog";
import type { DispatchAction } from "@/features/dispatch/model";
import { TACIT_AGENTS } from "@/data/agents";
import { cn } from "@/lib/utils";
import { FileText, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

interface ClaraContractMissionPanelProps {
  modeId: string | null;
  outputContractId: string | null;
  dispatchAction: (action: DispatchAction) => void;
}

export function ClaraContractMissionPanel({
  modeId,
  outputContractId,
  dispatchAction,
}: ClaraContractMissionPanelProps) {
  const navigate = useNavigate();
  const [personaImageFailed, setPersonaImageFailed] = useState(false);

  const personaAgent = useMemo(
    () => TACIT_AGENTS.find((a) => a.id === "lexa") ?? null,
    [],
  );
  const profile = getDispatchProfile("lexa");

  return (
    <div className="mission-brief-v4__clara-workspace space-y-6">
      <div>
        <h1 id="mb-wizard-heading" tabIndex={-1} className="mission-brief-v4__screen-title">
          Contract intelligence workspace
        </h1>
        <p className="mission-brief-v4__screen-desc">
          Choose how Clara should process your contracts, then open the full parse and export workspace.
        </p>
      </div>

      <Card className="relative overflow-hidden border-primary/25 bg-card/80 shadow-[0_0_0_1px_hsl(var(--primary)/0.12)]">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="relative shrink-0">
              {personaAgent?.image && !personaImageFailed ? (
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-primary/35 bg-muted/40">
                  <img
                    src={personaAgent.image}
                    alt={personaAgent.name}
                    className="h-full w-full object-cover"
                    onError={() => setPersonaImageFailed(true)}
                  />
                </div>
              ) : (
                <span className="inline-flex h-20 w-20 items-center justify-center rounded-2xl border border-primary/40 bg-primary/10 text-2xl">
                  {personaAgent?.icon ?? "??"}
                </span>
              )}
              <span className="absolute -right-1 -top-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-primary/40 bg-background text-primary shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
            </div>
            <div>
              <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-primary">
                Contract Copilot
              </span>
              <CardTitle className="mt-2 text-lg leading-tight">{personaAgent?.name ?? "Clara"}</CardTitle>
              <CardDescription className="mt-1 max-w-[36ch] text-sm text-primary/90">
                {personaAgent?.tagline ?? "Contract Intelligence & Revenue Recognition Expert"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">{personaAgent?.description}</p>
          <div className="flex flex-wrap gap-2">
            {(personaAgent?.specialties ?? []).slice(0, 4).map((s) => (
              <span
                key={s}
                className="inline-flex rounded-full border border-primary/30 bg-background/80 px-3 py-1 text-xs text-foreground/90"
              >
                {s}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      <div>
        <p className="mission-brief-v4__label mb-3">Processing mode</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {(profile?.modes ?? []).map((mode) => {
            const selected = modeId === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                className={cn(
                  "mission-brief-v4__clara-mission-tile text-left",
                  selected && "mission-brief-v4__clara-mission-tile--selected",
                )}
                onClick={() => dispatchAction({ type: "SELECT_MODE", modeId: mode.id })}
              >
                <span className="mission-brief-v4__clara-mission-tile-title">{mode.label}</span>
                <span className="mission-brief-v4__clara-mission-tile-desc">{mode.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mission-brief-v4__label mb-3">Output format</p>
        <div className="flex flex-wrap gap-2">
          {(profile?.outputContracts ?? []).map((contract) => {
            const selected = outputContractId === contract.id;
            return (
              <button
                key={contract.id}
                type="button"
                className={cn(
                  "mission-brief-v4__clara-output-chip",
                  selected && "mission-brief-v4__clara-output-chip--selected",
                )}
                onClick={() =>
                  dispatchAction({
                    type: "SET_OUTPUT_CONTRACT",
                    outputContractId: selected ? null : contract.id,
                  })
                }
              >
                {contract.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <Button
          type="button"
          className="gap-2 bg-gradient-primary"
          onClick={() => navigate("/contract-revrec")}
        >
          <FileText className="h-4 w-4" />
          Open full contract workspace
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate("/contract-revrec")}>
          Upload &amp; parse contracts
        </Button>
      </div>
    </div>
  );
}
