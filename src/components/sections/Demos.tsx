import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Headphones } from "lucide-react";

const Demos = () => {

  return (
    <section id="demos" className="py-20 bg-background">
      <div className="container px-4 mx-auto">
        <div className="mb-12 space-y-4 text-center">
          <div className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
            <Headphones className="mr-2 h-4 w-4" />
            Sample Conversations
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-primary lg:text-5xl lg:leading-tight">
            Listen to Tacit Demos
          </h2>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground lg:text-xl">
            Experience how our AI agent naturally extracts and captures tacit knowledge through conversational sessions.
          </p>
        </div>

        <div className="flex justify-center max-w-2xl mx-auto">
          <Card className="w-full rounded-2xl border border-border/60 bg-card/80 shadow-elegant transition-smooth hover:-translate-y-0.5 hover:shadow-floating">
            <CardHeader>
              <CardTitle className="text-2xl tracking-tight">Payments Operations</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                Scenario: Vikas a Payment Ops Manager speaks with AI-Payments Operations Analyst Racheal to help her understand Payments Operations setup in Advantage Bank.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Use Case(s)</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Ai-Assisted Process Discovery</Badge>
                  <Badge variant="secondary">AI-Assisted Onboarding</Badge>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Industry</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Management Consulting</Badge>
                  <Badge variant="secondary">B2B SaaS</Badge>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Listen to Demo</p>
                <audio controls className="h-12 w-full rounded-lg border border-border/60 bg-secondary/50 p-1 accent-primary">
                  <source src="/audio/vikas-racheal.mp3" type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Demos;
