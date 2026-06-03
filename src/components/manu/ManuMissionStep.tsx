import { MANU_MISSIONS } from "@/data/manuMissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

interface ManuMissionStepProps {
  selectedMissionId: string | null;
  onSelect: (missionId: string) => void;
  onContinue: () => void;
}

export function ManuMissionStep({ selectedMissionId, onSelect, onContinue }: ManuMissionStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Select mission</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Choose the documentation workflow MANU will run against your source document bundle.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {MANU_MISSIONS.map((mission) => {
          const selected = selectedMissionId === mission.id;
          return (
            <Card
              key={mission.id}
              className={`cursor-pointer transition-all hover:border-primary/50 ${selected ? "border-primary bg-primary/10 ring-1 ring-primary/30" : "border-border/60"}`}
              onClick={() => onSelect(mission.id)}
            >
              <CardHeader>
                <CardTitle className="flex items-start justify-between gap-2 text-lg">
                  {mission.title}
                  {selected && <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />}
                </CardTitle>
                <CardDescription>{mission.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Outputs</p>
                <div className="flex flex-wrap gap-1.5">
                  {mission.outputs.map((o) => (
                    <Badge key={o} variant="secondary" className="text-[0.65rem] font-normal">
                      {o}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <div className="flex justify-end">
        <Button disabled={!selectedMissionId} className="bg-gradient-primary" onClick={onContinue}>
          Continue to source bundle
        </Button>
      </div>
    </div>
  );
}
