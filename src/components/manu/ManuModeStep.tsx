import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ManuMode } from "@/types/manu";
import { Compass, Play } from "lucide-react";

interface ManuModeStepProps {
  onSelect: (mode: ManuMode) => void;
}

export function ManuModeStep({ onSelect }: ManuModeStepProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Select mode</h2>
        <p className="mt-2 text-muted-foreground">
          MANU supports discovery conversations and execute-mode documentation workflows. This LabCorp POC runs in Execute mode.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-border/60 opacity-70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Compass className="h-5 w-5" />
              Discover
            </CardTitle>
            <CardDescription>Structured interviews to capture manual requirements and documentation gaps.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" disabled className="w-full">
              Coming soon
            </Button>
          </CardContent>
        </Card>
        <Card className="border-primary/35 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-primary">
              <Play className="h-5 w-5" />
              Execute
            </CardTitle>
            <CardDescription>
              Ingest a source document bundle, generate manual sections, route approvals, and export an auditable package.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-gradient-primary" onClick={() => onSelect("execute")}>
              Continue with Execute
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
