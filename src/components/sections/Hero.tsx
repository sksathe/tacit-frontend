import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { ArrowRight, Play, Brain, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

const Hero = () => {
  const navigate = useNavigate();
  const [api, setApi] = useState<any>(null);
  const [current, setCurrent] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const resumeAutoPlayTimeoutRef = useRef<number | null>(null);
  
  const heroImages = [
    {
      src: "/lovable-uploads/a7f7db26-29f2-4e58-90cb-952ab8607775.png",
      alt: "The Problem - Comic showing tacit knowledge locked in SME brains"
    },
    {
      src: "/lovable-uploads/04d335b8-715e-4e13-889a-9d3edeae0aec.png", 
      alt: "The Solution - Comic showing Tacit-AI helping capture knowledge through conversations"
    },
    {
      src: "/lovable-uploads/1838940c-9f12-4f52-b2bc-9a2d8706707f.png",
      alt: "The Value Delivered - Comic showing knowledge captured in guides, SOPs, FAQs, and training"
    }
  ];

  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setCurrent(api.selectedScrollSnap());
    };

    api.on("select", onSelect);
    onSelect();

    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  useEffect(() => {
    if (!api || !isAutoPlaying) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 6000); // Change slide every 6 seconds (slower)

    return () => clearInterval(interval);
  }, [api, isAutoPlaying]);

  const handleDotClick = (index: number) => {
    if (!api) return;
    setIsAutoPlaying(false);
    api.scrollTo(index);

    if (resumeAutoPlayTimeoutRef.current) {
      window.clearTimeout(resumeAutoPlayTimeoutRef.current);
    }

    resumeAutoPlayTimeoutRef.current = window.setTimeout(() => {
      setIsAutoPlaying(true);
    }, 10000);
  };

  useEffect(() => {
    return () => {
      if (resumeAutoPlayTimeoutRef.current) {
        window.clearTimeout(resumeAutoPlayTimeoutRef.current);
      }
    };
  }, []);

  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-muted/50" />
      
      <div className="container relative px-4 mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8 max-w-xl">
            <div className="space-y-4">
              <div className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                <Brain className="w-4 h-4 mr-2" />
                AI-Powered Knowledge Extraction
              </div>
              <h1 className="text-balance text-4xl font-bold tracking-tight leading-tight lg:text-6xl lg:leading-[1.08]">
                Capture <span className="text-primary">Tacit SME knowledge</span> and turn it into shared team intelligence.
              </h1>
              <h2 className="max-w-lg border-l-2 border-primary/40 pl-4 text-base italic text-muted-foreground lg:text-lg">
                "Tacit knowledge lives in the minds of your top performers - unwritten, unseen, and hard to capture."
              </h2>
              <p className="max-w-lg text-lg leading-relaxed text-muted-foreground lg:text-xl">
                Our AI agent acts like an intelligent trainee, engaging SMEs in natural conversations to surface and transform their expertise into lasting, actionable knowledge.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="h-12 rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground shadow-floating transition-smooth hover:shadow-glow sm:min-w-[220px]"
                onClick={() => navigate("/login")}
              >
                Start Extracting Knowledge
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="h-12 rounded-lg border-accent px-8 text-base font-semibold text-accent transition-smooth hover:bg-accent hover:text-accent-foreground sm:min-w-[220px]"
                onClick={() => {
                  document.getElementById('demos')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <Play className="mr-2 h-5 w-5" />
                Listen to Tacit Demos
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
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 pt-8 sm:gap-5">
              <div className="rounded-xl border border-border/60 bg-card/70 px-3 py-4 text-center backdrop-blur-sm sm:px-4">
                <div className="text-3xl font-bold text-primary">95%</div>
                <div className="text-sm text-muted-foreground">Time Saved</div>
              </div>
              <div className="rounded-xl border border-border/60 bg-card/70 px-3 py-4 text-center backdrop-blur-sm sm:px-4">
                <div className="text-3xl font-bold text-primary">500+</div>
                <div className="text-sm text-muted-foreground">SMEs Onboarded</div>
              </div>
              <div className="rounded-xl border border-border/60 bg-card/70 px-3 py-4 text-center backdrop-blur-sm sm:px-4">
                <div className="text-3xl font-bold text-primary">10k+</div>
                <div className="text-sm text-muted-foreground">Hours Extracted</div>
              </div>
            </div>
          </div>

          {/* Right Column - Hero Image Carousel */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-2xl border border-border/60 shadow-elegant">
              <Carousel 
                setApi={setApi}
                opts={{
                  align: "start",
                  loop: true,
                }}
                className="w-full"
              >
                <CarouselContent>
                  {heroImages.map((image, index) => (
                    <CarouselItem key={index}>
                      <img 
                        src={image.src}
                        alt={image.alt}
                        loading={index === 0 ? "eager" : "lazy"}
                        decoding="async"
                        className="h-auto w-full"
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
              <div className="absolute inset-0 bg-primary/10" />
              
              {/* Dot Navigation */}
              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 space-x-2 rounded-full border border-white/25 bg-black/25 px-2.5 py-1.5 backdrop-blur-md">
                {heroImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleDotClick(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      current === index 
                        ? 'scale-110 bg-white shadow-lg' 
                        : 'bg-white/50 hover:bg-white/70'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                    aria-current={current === index}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
