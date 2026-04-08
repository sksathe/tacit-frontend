import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, MessageSquare, FileText, Search, Share2, Brain, Zap, Users } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Bot,
      title: "AI Agent as Trainee",
      description: "Our intelligent AI agent adapts different personas to naturally extract knowledge from SMEs through conversational interactions.",
    },
    {
      icon: MessageSquare,
      title: "Adaptive Questioning",
      description: "Dynamic questioning that adjusts based on responses, identifying knowledge gaps and seeking clarification in real-time.",
    },
    {
      icon: FileText,
      title: "Automated Structuring",
      description: "Transform unstructured conversations into logical hierarchies with summaries, guides, FAQs, and learning modules.",
    },
    {
      icon: Search,
      title: "Searchable Knowledge Library",
      description: "Central repository with tagging, categorization, and version control for all captured knowledge assets.",
    },
    {
      icon: Share2,
      title: "Multi-Format Content",
      description: "Generate various learning assets including written guides, audio snippets, quizzes, and structured courses.",
    },
  ];

  return (
    <section id="features" className="py-20 bg-muted/30">
      <div className="container px-4 mx-auto">
        <div className="mb-16 space-y-4 text-center">
          <div className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
            <Brain className="w-4 h-4 mr-2" />
            Core Features
          </div>
          <h2 className="text-3xl font-bold tracking-tight lg:text-5xl lg:leading-tight">
            Everything you need to capture{" "}
            <span className="text-primary">tacit knowledge</span>
          </h2>
          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-muted-foreground lg:text-xl">
            From conversation to structured learning assets, our platform handles the entire knowledge extraction and synthesis process.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="group relative h-full overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-elegant backdrop-blur-sm transition-smooth hover:-translate-y-1 hover:shadow-floating focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              <div className="absolute inset-0 bg-primary/5 transition-smooth group-hover:bg-primary/10" />
              <CardHeader className="relative pb-4">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary shadow-glow">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <CardTitle className="text-xl tracking-tight">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="inline-flex flex-col items-center gap-4 rounded-2xl border border-border/60 bg-card/80 p-5 shadow-floating backdrop-blur-sm sm:flex-row sm:gap-8 sm:p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">500+ SMEs</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-accent" />
              <span className="text-sm font-medium">10k+ Hours Extracted</span>
            </div>
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">95% Accuracy</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
