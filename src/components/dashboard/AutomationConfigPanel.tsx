import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { AutomationOptions } from "./AutomationOptions";
import { AutomationOutputModal } from "./AutomationOutputModal";
import { apiClient } from "@/lib/apiClient";

interface AutomationConfigPanelProps {
  automation: {
    type: string;
    title: string;
    icon: string;
    sessionId?: string | null;
  } | null;
  agentName?: string;
  onSelectAutomation?: (type: string, title: string, icon: string) => void;
}

interface AutomationRunResult {
  type: string;
  title: string;
  icon: string;
  outputText?: string;
  imageDataUrl?: string;
  imagePrompt?: string;
  downloadExt: "md" | "txt" | "png";
}

function normalizeAutomationType(type: string | undefined): string {
  if (!type) return "";
  return type === "financial-concept-map" ? "visual-concept-map" : type;
}

function getDefaultInstructions(automationType: string | undefined): string {
  switch (automationType) {
    case "summary":
      return "Create a concise, high-level executive summary from the transcript with key takeaways, risks/unknowns, and action items (don’t invent details not in the transcript).";
    case "clarity-scorer":
      return "Score transcript clarity (0–10) across structure, operational detail, metrics/evidence, and risks/unknowns; then list strengths, gaps/ambiguities, and follow‑up questions (ground everything in the transcript).";
    case "visual-concept-map":
    case "financial-concept-map":
      return "Generate a whiteboard sketchnote architecture visual with a strong central system, surrounding sections, clear directional arrows, short readable labels, and a blue/teal corporate explainer style.";
    case "soc2-document":
      return "Generate a SOC 2-ready documentation draft with trust services mappings, control evidence, identified gaps, and remediation actions. Mark unknown areas as not specified.";
    case "compliance-gap-analysis":
      return "Generate a compliance gap analysis with clear strengths (good controls), weaknesses/gaps (bad or missing controls), impact, and prioritized future remediation steps.";
    default:
      return "Create a structured knowledge asset from the transcript with clear sections, concrete details, decisions, and next steps; call out risks and open questions (no unsupported claims).";
  }
}

function getDefaultVisualMode(automationType: string | undefined): "standard" | "illustrative" {
  if (automationType === "visual-concept-map" || automationType === "financial-concept-map") {
    return "illustrative";
  }
  return "standard";
}

export function AutomationConfigPanel({ automation, agentName, onSelectAutomation }: AutomationConfigPanelProps) {
  const [config, setConfig] = useState(() => ({
    outputTone: "professional",
    targetAudience: "",
    visualMode: getDefaultVisualMode(automation?.type),
    additionalInstructions: getDefaultInstructions(automation?.type),
  }));
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<AutomationRunResult | null>(null);
  const [isOutputOpen, setIsOutputOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (automation) {
      // Reset form and local result when automation changes
      setConfig({
        outputTone: "professional",
        targetAudience: "",
        visualMode: getDefaultVisualMode(automation.type),
        additionalInstructions: getDefaultInstructions(automation.type),
      });
      setIsProcessing(false);
      setResult(null);
      setIsOutputOpen(false);
    }
  }, [automation]);

  if (!automation) return null;

  const toMarkdownSummary = (summary: any) => {
    if (typeof summary === "string") return summary;
    if (!summary || typeof summary !== "object") return "Summary generated, but output was empty.";

    const summaryText =
      summary.summary_text ??
      summary.summary ??
      summary.text ??
      summary.body ??
      "";
    const keyPoints: any[] = Array.isArray(summary.key_points) ? summary.key_points : [];
    const actionItems: any[] = Array.isArray(summary.action_items) ? summary.action_items : [];

    const lines: string[] = [];
    if (summaryText) {
      lines.push(summaryText);
    }
    if (keyPoints.length) {
      lines.push("", "### Key takeaways");
      for (const p of keyPoints) lines.push(`- ${String(p)}`);
    }
    if (actionItems.length) {
      lines.push("", "### Action items");
      for (const a of actionItems) lines.push(`- ${typeof a === "string" ? a : JSON.stringify(a)}`);
    }
    return lines.join("\n").trim() || "Summary generated, but no text was returned.";
  };

  const toMarkdownClarity = (clarity: any) => {
    if (typeof clarity === "string") return clarity;
    if (!clarity || typeof clarity !== "object") return "Clarity score generated, but output was empty.";

    const overall =
      clarity.summary ??
      clarity.overview ??
      clarity.description ??
      clarity.notes ??
      "";

    const lines: string[] = [];
    if (overall) lines.push(overall);

    // Support current API shape (overallScore/overallLabel/dimensions/interpretation)
    // and older fallback shapes.
    const score = clarity.overallScore ?? clarity.score ?? clarity.overall_score ?? clarity.overall ?? undefined;
    if (score != null) {
      lines.push("", `**Overall score:** ${String(score)}`);
    }
    if (clarity.overallLabel) {
      lines.push(`**Overall label:** ${String(clarity.overallLabel)}`);
    }

    const dimensions: any[] = Array.isArray(clarity.dimensions) ? clarity.dimensions : [];
    if (dimensions.length) {
      lines.push("", "### Dimensions");
      for (const d of dimensions) {
        const label = String(d?.label ?? d?.id ?? "Dimension");
        const dScore = d?.score != null ? ` (${String(d.score)}/100)` : "";
        lines.push(`- ${label}${dScore}`);
        const whyHigh: any[] = Array.isArray(d?.whyHigh) ? d.whyHigh : [];
        const whyLow: any[] = Array.isArray(d?.whyLow) ? d.whyLow : [];
        for (const item of whyHigh.slice(0, 3)) lines.push(`  + Strength: ${String(item)}`);
        for (const item of whyLow.slice(0, 3)) lines.push(`  + Gap: ${String(item)}`);
      }
    }

    const strengths: any[] = Array.isArray(clarity.strengths) ? clarity.strengths : [];
    const gaps: any[] = Array.isArray(clarity.gaps ?? clarity.ambiguities) ? (clarity.gaps ?? clarity.ambiguities) : [];
    const questions: any[] = Array.isArray(clarity.follow_up_questions ?? clarity.questions) ? (clarity.follow_up_questions ?? clarity.questions) : [];

    if (strengths.length) {
      lines.push("", "### Strengths");
      for (const s of strengths) lines.push(`- ${String(s)}`);
    }
    if (gaps.length) {
      lines.push("", "### Gaps & ambiguities");
      for (const g of gaps) lines.push(`- ${String(g)}`);
    }
    if (questions.length) {
      lines.push("", "### Follow‑up questions");
      for (const q of questions) lines.push(`- ${String(q)}`);
    }
    const interpretation: any[] = Array.isArray(clarity.interpretation) ? clarity.interpretation : [];
    if (interpretation.length) {
      lines.push("", "### Interpretation");
      for (const i of interpretation) lines.push(`- ${String(i)}`);
    }

    return lines.join("\n").trim() || "Clarity score generated, but no readable text was returned.";
  };

  const toMarkdownSoc2 = (doc: any) => {
    if (typeof doc === "string") return doc;
    if (!doc || typeof doc !== "object") return "SOC2 document generated, but output was empty.";

    const lines: string[] = [];
    lines.push(`# ${String(doc.document_title ?? "SOC 2 Readiness Documentation Draft")}`);
    if (doc.report_date) lines.push(`Report Date: ${String(doc.report_date)}`);

    if (doc.system_description) {
      lines.push("", "## System Description", String(doc.system_description));
    }

    const inScope: any[] = Array.isArray(doc.scope?.in_scope) ? doc.scope.in_scope : [];
    const outOfScope: any[] = Array.isArray(doc.scope?.out_of_scope) ? doc.scope.out_of_scope : [];
    const boundaries: any[] = Array.isArray(doc.scope?.boundaries) ? doc.scope.boundaries : [];
    lines.push("", "## Scope");
    lines.push("### In Scope");
    if (inScope.length) inScope.forEach((x) => lines.push(`- ${String(x)}`));
    else lines.push("- Not specified in transcript.");
    lines.push("", "### Out of Scope");
    if (outOfScope.length) outOfScope.forEach((x) => lines.push(`- ${String(x)}`));
    else lines.push("- Not specified in transcript.");
    lines.push("", "### Boundaries");
    if (boundaries.length) boundaries.forEach((x) => lines.push(`- ${String(x)}`));
    else lines.push("- Not specified in transcript.");

    const tsc: any[] = Array.isArray(doc.trust_services_categories) ? doc.trust_services_categories : [];
    lines.push("", "## Trust Services Categories");
    if (tsc.length) tsc.forEach((x) => lines.push(`- ${String(x)}`));
    else lines.push("- Not specified in transcript.");

    const mappings: any[] = Array.isArray(doc.control_mappings) ? doc.control_mappings : [];
    lines.push("", "## Control Mapping");
    if (mappings.length) {
      mappings.forEach((m) => {
        lines.push("", `### ${String(m.criteria ?? "Criteria")} - ${String(m.control_objective ?? "Control Objective")}`);
        lines.push(`Status: ${String(m.status ?? "not_specified")}`);
        const evidence: any[] = Array.isArray(m.evidence_from_transcript) ? m.evidence_from_transcript : [];
        lines.push("Evidence:");
        if (evidence.length) evidence.forEach((e) => lines.push(`- ${String(e)}`));
        else lines.push("- Not specified in transcript.");
        const gaps: any[] = Array.isArray(m.gaps) ? m.gaps : [];
        lines.push("Gaps:");
        if (gaps.length) gaps.forEach((g) => lines.push(`- ${String(g)}`));
        else lines.push("- None identified from transcript evidence.");
      });
    } else {
      lines.push("- No control mappings returned.");
    }

    const evidenceInventory: any[] = Array.isArray(doc.evidence_inventory) ? doc.evidence_inventory : [];
    lines.push("", "## Evidence Inventory");
    if (evidenceInventory.length) evidenceInventory.forEach((x) => lines.push(`- ${String(x)}`));
    else lines.push("- Not specified in transcript.");

    const remediation: any[] = Array.isArray(doc.remediation_plan) ? doc.remediation_plan : [];
    lines.push("", "## Remediation Plan");
    if (remediation.length) remediation.forEach((x) => lines.push(`- ${String(x)}`));
    else lines.push("- Not specified in transcript.");

    if (doc.management_assertion_draft) {
      lines.push("", "## Management Assertion Draft", String(doc.management_assertion_draft));
    }

    const auditorNotes: any[] = Array.isArray(doc.auditor_notes) ? doc.auditor_notes : [];
    lines.push("", "## Auditor Notes");
    if (auditorNotes.length) auditorNotes.forEach((x) => lines.push(`- ${String(x)}`));
    else lines.push("- Not specified in transcript.");

    if (doc.disclaimer) {
      lines.push("", "## Disclaimer", String(doc.disclaimer));
    }

    return lines.join("\n").trim() || "SOC2 document generated, but no readable text was returned.";
  };

  const toMarkdownComplianceGapAnalysis = (analysis: any) => {
    if (typeof analysis === "string") return analysis;
    if (!analysis || typeof analysis !== "object") return "Compliance gap analysis generated, but output was empty.";

    const lines: string[] = [];
    lines.push(`# ${String(analysis.title ?? "Compliance Gap Analysis")}`);

    if (analysis.summary) {
      lines.push("", "## Summary", String(analysis.summary));
    }

    const strengths: any[] = Array.isArray(analysis.strengths) ? analysis.strengths : [];
    lines.push("", "## Good (Strengths)");
    if (strengths.length) strengths.forEach((x) => lines.push(`- ${String(x)}`));
    else lines.push("- Not specified in transcript.");

    const gaps: any[] = Array.isArray(analysis.gaps) ? analysis.gaps : [];
    lines.push("", "## Bad (Gaps)");
    if (gaps.length) gaps.forEach((x) => lines.push(`- ${String(x)}`));
    else lines.push("- No major gaps identified from transcript evidence.");

    const findings: any[] = Array.isArray(analysis.findings) ? analysis.findings : [];
    lines.push("", "## Findings");
    if (findings.length) {
      findings.forEach((finding) => {
        lines.push("", `### ${String(finding.area ?? "Area")}`);
        lines.push(`Status: ${String(finding.status ?? "not_specified")}`);
        if (finding.impact) lines.push(`Impact: ${String(finding.impact)}`);
        if (finding.recommendation) lines.push(`Recommendation: ${String(finding.recommendation)}`);

        const evidence: any[] = Array.isArray(finding.evidence_from_transcript) ? finding.evidence_from_transcript : [];
        lines.push("Evidence from transcript:");
        if (evidence.length) evidence.forEach((e) => lines.push(`- ${String(e)}`));
        else lines.push("- Not specified in transcript.");
      });
    } else {
      lines.push("- No detailed findings returned.");
    }

    const priorityActions: any[] = Array.isArray(analysis.priority_actions) ? analysis.priority_actions : [];
    lines.push("", "## Priority Actions");
    if (priorityActions.length) priorityActions.forEach((x) => lines.push(`- ${String(x)}`));
    else lines.push("- Not specified in transcript.");

    const futureSteps: any[] = Array.isArray(analysis.future_steps) ? analysis.future_steps : [];
    lines.push("", "## Future Steps");
    if (futureSteps.length) futureSteps.forEach((x) => lines.push(`- ${String(x)}`));
    else lines.push("- Not specified in transcript.");

    if (analysis.disclaimer) {
      lines.push("", "## Disclaimer", String(analysis.disclaimer));
    }

    return lines.join("\n").trim() || "Compliance gap analysis generated, but no readable text was returned.";
  };

  useEffect(() => {
    let cancelled = false;

    async function loadLatestSavedResult() {
      if (!automation?.sessionId || !automation?.type) return;

      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session || cancelled) return;

        const automationType = normalizeAutomationType(automation.type);
        const { result: saved } = await apiClient.requestJson<any>(
          `/api/sessions/${automation.sessionId}/automation-results/${automationType}/latest`,
          { token: session.access_token }
        );
        if (!saved || cancelled) return;

        const savedType = normalizeAutomationType(saved.automation_type || automation.type);

        if (savedType === "visual-concept-map") {
          setResult({
            type: automation.type,
            title: automation.title,
            icon: automation.icon,
            imageDataUrl: saved.signed_url || "",
            outputText: saved.preview_text || "",
            downloadExt: "png",
          });
          return;
        }

        if (savedType === "summary") {
          setResult({
            type: automation.type,
            title: automation.title,
            icon: automation.icon,
            outputText: toMarkdownSummary(saved.result_json || {}),
            downloadExt: "md",
          });
          return;
        }

        if (savedType === "clarity-scorer") {
          setResult({
            type: automation.type,
            title: automation.title,
            icon: automation.icon,
            outputText: toMarkdownClarity(saved.result_json || {}),
            downloadExt: "md",
          });
          return;
        }

        if (savedType === "soc2-document") {
          setResult({
            type: automation.type,
            title: automation.title,
            icon: automation.icon,
            outputText: toMarkdownSoc2(saved.result_json || {}),
            downloadExt: "md",
          });
          return;
        }

        if (savedType === "compliance-gap-analysis") {
          setResult({
            type: automation.type,
            title: automation.title,
            icon: automation.icon,
            outputText: toMarkdownComplianceGapAnalysis(saved.result_json || {}),
            downloadExt: "md",
          });
          return;
        }

        if (saved.preview_text) {
          setResult({
            type: automation.type,
            title: automation.title,
            icon: automation.icon,
            outputText: String(saved.preview_text),
            downloadExt: "txt",
          });
        }
      } catch (err) {
        console.warn("Unable to load saved automation result:", err);
      }
    }

    loadLatestSavedResult();
    return () => {
      cancelled = true;
    };
  }, [automation?.sessionId, automation?.type]);

  const handleRun = async () => {
    if (!automation) return;
    if (!automation.sessionId) {
      toast({
        title: "Missing session",
        description: "No session is attached to this automation.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Summary and clarity scorer automations are wired to the backend.
      if (automation.type === "summary" && automation.sessionId) {
        const { supabase } = await import("@/integrations/supabase/client");
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          throw new Error("Not authenticated. Please log in.");
        }

        const { summary } = await apiClient.requestJson<any>(`/api/sessions/${automation.sessionId}/summary`, {
          method: "POST",
          token: session.access_token,
          body: JSON.stringify({
            tone: config.outputTone,
            audience: config.targetAudience,
            instructions: config.additionalInstructions,
          }),
        });

        toast({
          title: "Summary generated",
          description: "Executive summary created from this session's transcript.",
        });

        setResult({
          type: automation.type,
          title: automation.title,
          icon: automation.icon,
          outputText: toMarkdownSummary(summary),
          downloadExt: "md",
        });
        setIsOutputOpen(true);

        // Emit assetGenerated event so other views (e.g., session overview) can also react.
        const event = new CustomEvent("assetGenerated", {
          detail: {
            type: automation.type,
            title: automation.title,
            icon: automation.icon,
            config,
            summary,
          },
        });
        window.dispatchEvent(event);
      } else if (automation.type === "clarity-scorer" && automation.sessionId) {
        const { supabase } = await import("@/integrations/supabase/client");
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          throw new Error("Not authenticated. Please log in.");
        }

        const { clarity } = await apiClient.requestJson<any>(`/api/sessions/${automation.sessionId}/clarity-score`, {
          method: "POST",
          token: session.access_token,
          body: JSON.stringify({
            instructions: config.additionalInstructions,
          }),
        });

        toast({
          title: "Clarity score generated",
          description: "Transcript clarity analysis created for this session.",
        });

        setResult({
          type: automation.type,
          title: automation.title,
          icon: automation.icon,
          outputText: toMarkdownClarity(clarity),
          downloadExt: "md",
        });
        setIsOutputOpen(true);

        const event = new CustomEvent("assetGenerated", {
          detail: {
            type: automation.type,
            title: automation.title,
            icon: automation.icon,
            config,
            clarity,
          },
        });
        window.dispatchEvent(event);
      } else if (automation.type === "soc2-document" && automation.sessionId) {
        const { supabase } = await import("@/integrations/supabase/client");
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          throw new Error("Not authenticated. Please log in.");
        }

        const { soc2Document } = await apiClient.requestJson<any>(`/api/sessions/${automation.sessionId}/soc2-document`, {
          method: "POST",
          token: session.access_token,
          body: JSON.stringify({
            tone: config.outputTone,
            audience: config.targetAudience,
            instructions: config.additionalInstructions,
          }),
        });

        toast({
          title: "SOC2 document generated",
          description: "Transcript-grounded SOC2 draft created for compliance workflows.",
        });

        setResult({
          type: automation.type,
          title: automation.title,
          icon: automation.icon,
          outputText: toMarkdownSoc2(soc2Document),
          downloadExt: "md",
        });
        setIsOutputOpen(true);

        const event = new CustomEvent("assetGenerated", {
          detail: {
            type: automation.type,
            title: automation.title,
            icon: automation.icon,
            config,
            soc2Document,
          },
        });
        window.dispatchEvent(event);
      } else if (automation.type === "compliance-gap-analysis" && automation.sessionId) {
        const { supabase } = await import("@/integrations/supabase/client");
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          throw new Error("Not authenticated. Please log in.");
        }

        const { complianceGapAnalysis } = await apiClient.requestJson<any>(
          `/api/sessions/${automation.sessionId}/compliance-gap-analysis`,
          {
            method: "POST",
            token: session.access_token,
            body: JSON.stringify({
            tone: config.outputTone,
            audience: config.targetAudience,
            instructions: config.additionalInstructions,
            }),
          }
        );

        toast({
          title: "Compliance gap analysis generated",
          description: "Compliance strengths, gaps, and next steps were generated from this transcript.",
        });

        setResult({
          type: automation.type,
          title: automation.title,
          icon: automation.icon,
          outputText: toMarkdownComplianceGapAnalysis(complianceGapAnalysis),
          downloadExt: "md",
        });
        setIsOutputOpen(true);

        const event = new CustomEvent("assetGenerated", {
          detail: {
            type: automation.type,
            title: automation.title,
            icon: automation.icon,
            config,
            complianceGapAnalysis,
          },
        });
        window.dispatchEvent(event);
      } else if ((automation.type === "visual-concept-map" || automation.type === "financial-concept-map") && automation.sessionId) {
        const { supabase } = await import("@/integrations/supabase/client");
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          throw new Error("Not authenticated. Please log in.");
        }

        const { conceptMap } = await apiClient.requestJson<any>(`/api/sessions/${automation.sessionId}/visual-concept-map`, {
          method: "POST",
          token: session.access_token,
          body: JSON.stringify({
            tone: config.outputTone,
            audience: config.targetAudience,
            visualMode: config.visualMode,
            instructions: config.additionalInstructions,
          }),
        });

        toast({
          title: "Visual concept map generated",
          description: "Whiteboard-style concept map image created from this session transcript.",
        });

        setResult({
          type: automation.type,
          title: automation.title,
          icon: automation.icon,
          imageDataUrl: conceptMap?.image_data_url,
          imagePrompt: conceptMap?.prompt_used,
          downloadExt: "png",
        });
        setIsOutputOpen(true);

        const event = new CustomEvent("assetGenerated", {
          detail: {
            type: automation.type,
            title: automation.title,
            icon: automation.icon,
            config,
            conceptMap,
          },
        });
        window.dispatchEvent(event);
      } else {
        // Other automations not yet wired; keep simulated behavior
        setResult({
          type: automation.type,
          title: automation.title,
          icon: automation.icon,
          outputText:
            "This automation is not yet fully wired to the backend. Showing simulated output.\n\n" +
            `Tone: ${config.outputTone}\n` +
            `Audience: ${config.targetAudience || "—"}\n\n` +
            `Instructions:\n${config.additionalInstructions}`.trim(),
          downloadExt: "txt",
        });
        setIsOutputOpen(true);

        const event = new CustomEvent("assetGenerated", {
          detail: {
            type: automation.type,
            title: automation.title,
            icon: automation.icon,
            config,
          },
        });
        window.dispatchEvent(event);
      }
    } catch (error: any) {
      console.error("Automation error:", error);
      toast({
        title: "Automation failed",
        description: error.message || "Could not run this automation.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="grid gap-5 xl:grid-cols-[1.2fr,0.8fr]">
        <div className="space-y-4 rounded-xl border border-primary/25 bg-card/55 p-4">
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-xl">
              {automation.icon}
            </div>
            <div className="min-w-0">
              <h1 className="text-[1.05rem] font-extrabold text-primary sm:text-[1.15rem]">
                Configure {automation.title}
              </h1>
              <p className="mt-0.5 text-[0.72rem] text-muted-foreground">
                Tune output and run this automation on the selected recording.
              </p>
            </div>
          </div>

          <div className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.11em] text-primary">
            Automation Config
          </div>

          <div>
            <label className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[0.1em] text-primary/85">
              Output tone
            </label>
            <select
              value={config.outputTone}
              onChange={(e) => setConfig({ ...config, outputTone: e.target.value })}
              className="h-10 w-full cursor-pointer rounded-lg border border-primary/30 bg-input px-3 text-xs text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="technical">Technical</option>
              <option value="friendly">Friendly</option>
              <option value="formal">Formal</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[0.1em] text-primary/85">
              Target audience
            </label>
            <input
              type="text"
              value={config.targetAudience}
              onChange={(e) => setConfig({ ...config, targetAudience: e.target.value })}
              placeholder="e.g., Executives, Engineers, General Staff"
              className="h-10 w-full rounded-lg border border-primary/30 bg-input px-3 text-xs text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {(automation.type === "visual-concept-map" || automation.type === "financial-concept-map") && (
            <div>
              <label className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[0.1em] text-primary/85">
                Visual mode
              </label>
              <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-primary/30 bg-input/60 p-1">
                {(["standard", "illustrative"] as const).map((mode) => {
                  const active = config.visualMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setConfig({ ...config, visualMode: mode })}
                      className={`rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition-all ${
                        active
                          ? "bg-primary text-primary-foreground shadow-elegant"
                          : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                      }`}
                    >
                      {mode}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[0.1em] text-primary/85">
              Additional instructions
            </label>
            <textarea
              value={config.additionalInstructions}
              onChange={(e) => setConfig({ ...config, additionalInstructions: e.target.value })}
              placeholder="Any specific requirements or focus areas for this automation..."
              rows={4}
              className="min-h-[90px] w-full resize-none rounded-lg border border-primary/30 bg-input px-3 py-2 text-xs text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <button
            type="button"
            onClick={handleRun}
            disabled={isProcessing}
            className="mt-1 w-full rounded-lg bg-primary px-4 py-2.5 text-[0.78rem] font-bold uppercase tracking-[0.12em] text-primary-foreground shadow-elegant transition-all hover:-translate-y-0.5 hover:bg-primary-glow hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {isProcessing ? "Processing…" : "Run automation"}
          </button>
          <button
            type="button"
            onClick={() => {
              if (!result) {
                toast({
                  title: "No output yet",
                  description: "Run this automation first, or open a generated asset from the list below.",
                });
                return;
              }
              setIsOutputOpen(true);
            }}
            className="w-full rounded-lg border border-primary/30 px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.11em] text-primary transition-all hover:bg-primary/10"
          >
            View latest output
          </button>
        </div>

        <div className="rounded-xl border border-primary/25 bg-card/55 p-4">
          <AutomationOptions
            layout="grid"
            className="!mt-0"
            title="Automation Studio"
            agentName={agentName}
            onOpenSummaryPanel={() => onSelectAutomation?.("summary", "Generate Summary", "📄")}
            onOpenConfigDrawer={(type, title, icon) => onSelectAutomation?.(type, title, icon)}
          />
        </div>
      </div>

      <AutomationOutputModal
        open={isOutputOpen}
        onClose={() => setIsOutputOpen(false)}
        title={result?.title || automation.title}
        icon={result?.icon || automation.icon}
        textContent={result?.outputText ?? null}
        imageUrl={result?.imageDataUrl ?? null}
      />
    </section>
  );
}
