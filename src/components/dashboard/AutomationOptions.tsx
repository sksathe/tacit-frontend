import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

interface AutomationItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  category: "core" | "finance" | "analysis" | "insights" | "documentation" | "training";
  recommended?: boolean;
}

export interface EagleAutomationHandlers {
  onExportJson: () => void;
  onExportExcel: () => void;
  onValidationNotes: () => void;
  canExportExcel: boolean;
  disabled?: boolean;
}

interface AutomationOptionsProps {
  onOpenConfigDrawer: (type: string, title: string, icon: string) => void;
  /** Optional: open a richer summary panel instead of config drawer for Generate Summary */
  onOpenSummaryPanel?: () => void;
  /** Agent name so we can customize automations per agent (e.g. Rachel = finance-focused) */
  agentName?: string;
  /** Eagle: export / validation actions (no transcript automations) */
  eagleHandlers?: EagleAutomationHandlers;
  /** Layout mode for where this appears in the page */
  layout?: "grid" | "stack";
  className?: string;
  title?: string;
}

export function AutomationOptions({
  onOpenConfigDrawer,
  onOpenSummaryPanel,
  agentName,
  eagleHandlers,
  layout = "grid",
  className,
  title = "Available Automations",
}: AutomationOptionsProps) {
  const processingAutomations = new Set<string>();
  const isStack = layout === "stack";
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | "core" | "finance" | "analysis" | "insights" | "documentation" | "training">("all");

  const automations: AutomationItem[] =
    agentName === "Eagle"
      ? [
          {
            id: "eagle-export-json",
            icon: "📥",
            title: "Export JSON",
            description: "Download the full logistics API response as JSON.",
            category: "core",
            recommended: true,
          },
          {
            id: "eagle-export-excel",
            icon: "📊",
            title: "Export Excel",
            description: "Download the spreadsheet when the server included an XLSX payload.",
            category: "core",
          },
          {
            id: "eagle-validation",
            icon: "📋",
            title: "Validation notes",
            description: "Review parser warnings and validation messages in one place.",
            category: "analysis",
          },
        ]
      : agentName === "Rachel"
      ? [
          {
            id: "summary",
            icon: "📄",
            title: "Generate Summary",
            description: "Create an executive summary of the session with key takeaways and action items.",
            category: "core",
            recommended: true,
          },
          {
            id: "minutes",
            icon: "📝",
            title: "Meeting Minutes",
            description: "Generate formal meeting minutes with attendees, discussions, and resolutions.",
            category: "documentation",
          },
          {
            id: "visual-concept-map",
            icon: "📈",
            title: "Visual Concept Map",
            description:
              "Turns any transcript into a whiteboard-style visual concept map with labeled sections, flow arrows, and actionable callouts.",
            category: "core",
            recommended: true,
          },
          {
            id: "finance-faq",
            icon: "❓",
            title: "Finance-Specific FAQ Generator",
            description:
              "Extracts and answers key finance questions grounded strictly in transcript citations, surfacing missing or unanswered questions.",
            category: "finance",
          },
          {
            id: "clarity-scorer",
            icon: "💎",
            title: "Clarity Scorer",
            description:
              "Judges how clearly the conversation explains operations and governance, with scored dimensions and a narrative, transcript-only report.",
            category: "analysis",
            recommended: true,
          },
          {
            id: "financial-risk-detector",
            icon: "⚠️",
            title: "Financial Risk Detector",
            description:
              "Flags unsupported projections, optimistic assumptions, and missing metrics, and scores financial clarity and risk.",
            category: "finance",
          },
        ]
      : agentName === "Ross"
        ? [
            {
              id: "soc2-document",
              icon: "🛡️",
              title: "SOC2 Document",
              description: "Generate SOC 2-oriented control documentation and evidence-ready policy sections from the transcript.",
              category: "core",
              recommended: true,
            },
            {
              id: "compliance-gap-analysis",
              icon: "📋",
              title: "Compliance Gap Analysis",
              description: "Identify control gaps, missing evidence, and remediation priorities mapped to compliance expectations.",
              category: "analysis",
              recommended: true,
            },
            {
              id: "visual-concept-map",
              icon: "📈",
              title: "Visual Concept Map",
              description:
                "Create a whiteboard-style visual concept map from the transcript with structure, pain points, solutions, and next steps.",
              category: "insights",
              recommended: true,
            },
            {
              id: "summary",
              icon: "📄",
              title: "Generate Summary",
              description: "Create an executive summary of the session with key takeaways and action items.",
              category: "core",
            },
            {
              id: "minutes",
              icon: "📝",
              title: "Meeting Minutes",
              description: "Generate formal meeting minutes with attendees, discussions, and resolutions.",
              category: "documentation",
            },
            {
              id: "clarity-scorer",
              icon: "💎",
              title: "Clarity Scorer",
              description:
                "Judges how clearly the conversation explains controls, ownership, and governance with scored dimensions.",
              category: "analysis",
            },
          ]
      : [
          {
            id: "summary",
            icon: "📄",
            title: "Generate Summary",
            description: "Create an executive summary of the session with key takeaways and action items.",
            category: "core",
            recommended: true,
          },
          {
            id: "insights",
            icon: "📊",
            title: "Extract Insights",
            description: "AI-powered analysis to identify patterns, themes, and critical insights from the conversation.",
            category: "insights",
            recommended: true,
          },
          {
            id: "visual-concept-map",
            icon: "📈",
            title: "Visual Concept Map",
            description:
              "Create a whiteboard-style visual concept map from the transcript with structure, pain points, solutions, and next steps.",
            category: "insights",
            recommended: true,
          },
          {
            id: "training",
            icon: "📚",
            title: "Create Training Module",
            description: "Transform session content into a structured training module with lessons and quizzes.",
            category: "training",
          },
          {
            id: "actions",
            icon: "✅",
            title: "Action Items List",
            description: "Extract and organize all action items, decisions, and next steps mentioned in the session.",
            category: "core",
          },
          {
            id: "kb-article",
            icon: "🎯",
            title: "Knowledge Base Article",
            description: "Convert tacit knowledge into a well-structured article for your knowledge base.",
            category: "documentation",
          },
          {
            id: "minutes",
            icon: "📝",
            title: "Meeting Minutes",
            description: "Generate formal meeting minutes with attendees, discussions, and resolutions.",
            category: "documentation",
          },
        ];

  const filteredAutomations = useMemo(() => {
    return automations.filter((automation) => {
      const categoryMatch = category === "all" || automation.category === category;
      if (!categoryMatch) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return automation.title.toLowerCase().includes(q) || automation.description.toLowerCase().includes(q);
    });
  }, [automations, category, query]);

  const categoryPills: Array<{ key: "all" | "core" | "finance" | "analysis" | "insights" | "documentation" | "training"; label: string }> =
    agentName === "Eagle"
      ? [
          { key: "all", label: "All" },
          { key: "core", label: "Core" },
          { key: "analysis", label: "Analysis" },
        ]
      : agentName === "Rachel"
      ? [
          { key: "all", label: "All" },
          { key: "core", label: "Core" },
          { key: "finance", label: "Finance" },
          { key: "analysis", label: "Analysis" },
          { key: "documentation", label: "Docs" },
        ]
      : [
          { key: "all", label: "All" },
          { key: "core", label: "Core" },
          { key: "insights", label: "Insights" },
          { key: "training", label: "Training" },
          { key: "documentation", label: "Docs" },
        ];

  const categoryCardStyles: Record<string, string> = {
    core: "bg-primary/12 border-primary/30 hover:bg-primary/18 hover:border-primary/50",
    finance: "bg-emerald-500/12 border-emerald-500/30 hover:bg-emerald-500/18 hover:border-emerald-500/50",
    analysis: "bg-blue-500/12 border-blue-500/30 hover:bg-blue-500/18 hover:border-blue-500/50",
    insights: "bg-violet-500/12 border-violet-500/30 hover:bg-violet-500/18 hover:border-violet-500/50",
    documentation: "bg-amber-500/12 border-amber-500/30 hover:bg-amber-500/18 hover:border-amber-500/50",
    training: "bg-rose-500/12 border-rose-500/30 hover:bg-rose-500/18 hover:border-rose-500/50",
  };

  return (
    <div className={cn("mt-6", className)}>
      <div className={cn("rounded-xl border border-primary/25 bg-card/55", isStack ? "p-4" : "p-4")}>
        <div className="mb-3">
          <h3 className={cn("font-extrabold text-primary", isStack ? "text-[1.15rem]" : "text-[1.2rem]")}>{title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Search, filter, and run automations while reviewing the recording.</p>
        </div>

        <div className="mb-2.5 flex items-center gap-2 rounded-lg border border-primary/25 bg-background/60 px-2.5 py-1.5">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search automations"
            className="h-7 w-full bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground/80"
          />
        </div>

        <div className="mb-3 flex flex-wrap gap-1.5">
          {categoryPills.map((pill) => (
            <button
              key={pill.key}
              type="button"
              onClick={() => setCategory(pill.key)}
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.11em] transition-all",
                category === pill.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-primary/30 bg-primary/10 text-primary hover:border-primary hover:bg-primary/20"
              )}
            >
              {pill.label}
            </button>
          ))}
        </div>

        <div
          className={cn(
            isStack
              ? "grid grid-cols-1 gap-3"
              : "grid grid-cols-2 items-stretch gap-4 sm:grid-cols-3 lg:grid-cols-4"
          )}
        >
          {filteredAutomations.map((automation) => {
            const isProcessing = processingAutomations.has(automation.id);
            const eagleCardDisabled =
              agentName === "Eagle" &&
              (!eagleHandlers ||
                eagleHandlers.disabled ||
                (automation.id === "eagle-export-excel" && !eagleHandlers.canExportExcel));
            const handleOpen = () => {
              if (isProcessing) return;
              if (agentName === "Eagle") {
                if (!eagleHandlers || eagleHandlers.disabled) return;
                if (automation.id === "eagle-export-excel" && !eagleHandlers.canExportExcel) return;
                if (automation.id === "eagle-export-json") eagleHandlers.onExportJson();
                else if (automation.id === "eagle-export-excel") eagleHandlers.onExportExcel();
                else if (automation.id === "eagle-validation") eagleHandlers.onValidationNotes();
                return;
              }
              if (automation.id === "summary" && onOpenSummaryPanel) {
                onOpenSummaryPanel();
              } else {
                onOpenConfigDrawer(automation.id, automation.title, automation.icon);
              }
            };
            const cardStyle = categoryCardStyles[automation.category] ?? categoryCardStyles.core;
            return (
              <button
                key={automation.id}
                type="button"
                onClick={handleOpen}
                disabled={isProcessing || eagleCardDisabled}
                className={cn(
                  "flex h-full cursor-pointer flex-col rounded-2xl border text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  "shadow-sm hover:shadow-md hover:-translate-y-0.5",
                  isStack ? "p-4" : "min-h-[130px] justify-start p-4",
                  cardStyle,
                  (isProcessing || eagleCardDisabled) && "pointer-events-none opacity-60"
                )}
              >
                <div
                  className={cn(
                    "flex flex-col gap-3",
                    !isStack && "h-full items-start"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5",
                      isStack ? "text-[1.25rem]" : "text-xl"
                    )}
                  >
                    {automation.icon}
                  </span>
                  <div className="min-h-0 flex-1">
                    <h4
                      className={cn(
                        "font-display font-bold text-foreground leading-tight",
                        isStack ? "text-[0.99rem]" : "text-[0.875rem] line-clamp-2 sm:text-[0.9375rem]"
                      )}
                    >
                      {automation.title}
                    </h4>
                    {isStack && (
                      <p className="mt-1 text-[0.79rem] text-muted-foreground leading-relaxed">
                        {automation.description}
                      </p>
                    )}
                    {automation.recommended && (
                      <span className="mt-2 inline-block rounded-full border border-primary/35 bg-primary/10 px-2 py-0.5 text-[0.55rem] font-semibold uppercase tracking-wider text-primary">
                        Recommended
                      </span>
                    )}
                  </div>
                </div>
                {isProcessing && (
                  <div className="mt-2 flex items-center gap-2 text-[0.75rem] text-primary">
                    <span className="h-3 w-3 shrink-0 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                    <span>Processing...</span>
                  </div>
                )}
              </button>
            );
          })}

          {filteredAutomations.length === 0 && (
            <div className="col-span-full rounded-xl border border-primary/25 bg-background/40 px-4 py-8 text-center text-sm text-muted-foreground">
              No automations match your filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
