import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, UserPlus, MessageCircle, FileOutput, Search } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: UserPlus,
      step: "01",
      title: "Setup & Invitation",
      description: "L&D Associate or SME creates a session and invites participants. Our AI agent configures its persona based on the knowledge extraction context.",
    },
    {
      icon: MessageCircle,
      step: "02", 
      title: "AI-Guided Conversation",
      description: "SME engages in natural conversation with the AI agent, which asks intelligent questions and adapts its approach based on responses.",
    },
    {
      icon: FileOutput,
      step: "03",
      title: "Automated Synthesis",
      description: "The platform automatically structures the conversation into learning assets: guides, FAQs, quizzes, and course modules.",
    },
    {
      icon: Search,
      step: "04",
      title: "Knowledge Library",
      description: "Generated content is stored in a searchable library with tagging and categorization for easy access by team members.",
    }
  ];

  return (
    <section id="how-it-works" className="py-20">
      <div className="container px-4 mx-auto">
        <div className="mb-16 space-y-4 text-center">
          <div className="inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-sm font-semibold text-accent">
            <ArrowRight className="w-4 h-4 mr-2" />
            How It Works
          </div>
          <h2 className="text-3xl font-bold tracking-tight lg:text-5xl lg:leading-tight">
            From conversation to{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              structured knowledge
            </span>
          </h2>
          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-muted-foreground lg:text-xl">
            Our AI-powered process transforms tacit knowledge into actionable learning assets in just four simple steps.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <Card className="group h-full rounded-2xl border border-border/60 bg-card/80 shadow-elegant backdrop-blur-sm transition-smooth hover:-translate-y-1 hover:shadow-glow">
                <CardContent className="space-y-4 p-6 text-center">
                  <div className="relative">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-glow shadow-glow">
                      <step.icon className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {step.step}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold tracking-tight">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
              
              {/* Arrow connector */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                  <ArrowRight className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Use Cases */}
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 to-primary-glow/5 p-8 shadow-elegant">
            <h3 className="mb-4 text-2xl font-bold tracking-tight">Scenario 1: Urgent Documentation</h3>
            <p className="leading-relaxed text-muted-foreground">
              L&D Associate identifies a knowledge gap and needs to establish reference SOPs from the most experienced SME. They set up a Tacit-AI session and invite the SME to share their expertise.
            </p>
          </Card>

          <Card className="rounded-2xl border border-border/60 bg-gradient-to-br from-accent/5 to-primary/5 p-8 shadow-elegant">
            <h3 className="mb-4 text-2xl font-bold tracking-tight">Scenario 2: SME Self-Service</h3>
            <p className="leading-relaxed text-muted-foreground">
              SME is overwhelmed with repetitive help requests from colleagues. They proactively create a knowledge extraction session to document their expertise and reduce future interruptions.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
