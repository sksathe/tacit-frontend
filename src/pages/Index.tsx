import Header from "@/components/layout/Header";
import Hero from "@/components/sections/Hero";
import Features from "@/components/sections/Features";
import HowItWorks from "@/components/sections/HowItWorks";
import Demos from "@/components/sections/Demos";
import { Button } from "@/components/ui/button";
import { ArrowRight, Brain, FileText, Users, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <Features />
      <HowItWorks />
      <Demos />
      
      {/* CTA Section */}
      <section className="bg-muted/30 py-20">
        <div className="container px-4 mx-auto text-center">
          <div className="mx-auto max-w-3xl space-y-6">
            <h2 className="text-3xl font-bold tracking-tight text-primary lg:text-5xl lg:leading-tight">
              Ready to capture your team's expertise?
            </h2>
            <p className="text-lg leading-relaxed text-muted-foreground lg:text-xl">
              Start your first knowledge extraction session today and transform tacit knowledge into structured learning assets.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="h-12 rounded-lg bg-gradient-primary px-8 text-base font-semibold transition-smooth hover:shadow-glow sm:min-w-[220px]"
                onClick={() => navigate("/login")}
              >
                <Brain className="mr-2 h-5 w-5" />
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              
              <Button 
                size="lg" 
                variant="outline" 
                className="h-12 rounded-lg px-8 text-base font-semibold sm:min-w-[220px]"
                onClick={() => navigate("/knowledge-library")}
              >
                <Users className="mr-2 h-5 w-5" />
                Browse Knowledge Library
              </Button>

              <Button
                size="lg"
                variant="secondary"
                className="h-12 rounded-lg px-8 text-base font-semibold sm:min-w-[220px]"
                onClick={() => navigate("/contract-revrec")}
              >
                <FileText className="mr-2 h-5 w-5" />
                Contract Rev Rec POC
              </Button>

              <Button
                size="lg"
                variant="secondary"
                className="h-12 rounded-lg border-primary/40 px-8 text-base font-semibold text-primary hover:bg-primary/10 sm:min-w-[220px]"
                onClick={() => navigate("/manu")}
              >
                <FileText className="mr-2 h-5 w-5" />
                MANU · LabCorp POC
              </Button>
            </div>

            <div className="mx-auto grid max-w-2xl grid-cols-3 gap-3 pt-12 sm:gap-5">
              <div className="rounded-xl border border-border/60 bg-card/70 px-3 py-4 text-center backdrop-blur-sm sm:px-4">
                <div className="text-3xl font-bold text-primary mb-2">95%</div>
                <div className="text-sm text-muted-foreground">Efficiency Gain</div>
              </div>
              <div className="rounded-xl border border-border/60 bg-card/70 px-3 py-4 text-center backdrop-blur-sm sm:px-4">
                <div className="text-3xl font-bold text-accent mb-2">500+</div>
                <div className="text-sm text-muted-foreground">SMEs Trained</div>
              </div>
              <div className="rounded-xl border border-border/60 bg-card/70 px-3 py-4 text-center backdrop-blur-sm sm:px-4">
                <div className="text-3xl font-bold text-primary-glow mb-2">10k+</div>
                <div className="text-sm text-muted-foreground">Hours Saved</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Brain className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold tracking-tight bg-gradient-primary bg-clip-text text-transparent">
                Tacit-AI
              </span>
            </div>
            
            <div className="text-center md:text-right">
              <p className="text-sm text-muted-foreground">
                © 2025 Tacit-AI. Transforming knowledge transfer through AI.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
