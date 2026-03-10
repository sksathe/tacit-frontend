import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { TACIT_AGENTS } from "@/data/agents";
import { GeneratedAssets } from "./GeneratedAssets";
import { AutomationOptions } from "./AutomationOptions";
import { AutomationOutputModal } from "./AutomationOutputModal";
import type { SessionItem } from "./AutomateSessionsList";
import { apiClient } from "@/lib/apiClient";

const ARTIFACTS_BUCKET = import.meta.env.VITE_SUPABASE_ARTIFACTS_BUCKET || "tacit-artifacts";

/** Summary row from Supabase */
interface SummaryDetails {
  id?: string;
  summary_text?: string | null;
  key_points?: string[] | null;
  action_items?: any[] | null;
  model?: string | null;
  created_at?: string | null;
}

/** Session + meeting + invitees from GET /api/sessions/:id */
interface SessionDetails {
  id: string;
  duration_sec?: number | null;
  recording_path?: string | null;
  started_at?: string | null;
  meeting?: {
    title?: string;
    agenda?: string | null;
    agent_name?: string | null;
    scheduled_start_at?: string;
    scheduled_end_at?: string;
    meeting_invitees?: Array<{ email?: string; name?: string }>;
  } | null;
  /** Transcript relation: may be array (Supabase one-to-many) or single object */
  transcript?: Array<{ raw?: unknown }> | { raw?: unknown } | null;
  /** Embedded summary from summaries table, if it exists */
  summary?: SummaryDetails | null;
}

interface ClarityDimension {
  id: string;
  label: string;
  emoji: string;
  score: number;
  whyHigh: string[];
  whyLow: string[];
}

interface ClarityScore {
  model?: string;
  title?: string;
  dimensions: ClarityDimension[];
  overallScore?: number;
  overallLabel?: string;
  interpretation: string[];
}

interface PersistedAutomationResult {
  id: string;
  automation_type: string;
  title: string;
  mime_type?: string;
  preview_text?: string | null;
  created_at?: string | null;
}

interface AssetListItem {
  id?: string;
  type: string;
  title: string;
  icon: string;
  timestamp: string;
}

interface SessionDetailViewProps {
  session: {
    agentName: string;
    sessionName: string;
    sessionId: string;
  };
  /** When provided, show "Choose the session to automate" dropdown and allow switching. */
  sessions?: SessionItem[];
  onSessionChange?: (session: SessionItem) => void;
  onBack: () => void;
  /** When provided, show a link/button to go back to the sessions list (same agent). */
  onBackToSessions?: () => void;
  onOpenConfigDrawer: (type: string, title: string, icon: string) => void;
  /** Optional: when set, open a specific automation panel by default (e.g. "summary"). */
  initialAutomationId?: string;
  /** When true, hides the internal breadcrumb row (Home | Sessions | ...). */
  hideBreadcrumb?: boolean;
  /** When true, show only session bar + results (no Step 3 / workspace grid / Automation Studio). */
  compactLayout?: boolean;
  /** When true, hide the top session strip section. */
  hideSessionStrip?: boolean;
  /** When true, hides the compact bottom "Available automations" block. */
  hideCompactAutomationOptions?: boolean;
}

function formatDateTime(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  });
}

function formatDuration(sec: number | undefined | null): string {
  if (sec == null || sec <= 0) return "—";
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m} minute${m !== 1 ? "s" : ""}`;
  const h = Math.floor(m / 60);
  const mins = m % 60;
  if (mins === 0) return `${h} hour${h !== 1 ? "s" : ""}`;
  return `${h}h ${mins}m`;
}

function formatClock(sec: number | undefined | null): string {
  if (sec == null || sec < 0) return "—";
  const total = Math.floor(sec);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function hasTranscript(details: SessionDetails | null): boolean {
  if (!details?.transcript) return false;
  const t = Array.isArray(details.transcript) ? details.transcript[0] : details.transcript;
  return Boolean(t?.raw);
}

function resolveStoragePath(rawPath: string | null | undefined): { bucket: string; path: string } | { externalUrl: string } | null {
  if (!rawPath) return null;
  const value = String(rawPath).trim();
  if (!value) return null;

  if (/^https?:\/\//i.test(value)) {
    return { externalUrl: value };
  }

  if (value.startsWith(`${ARTIFACTS_BUCKET}/`)) {
    return { bucket: ARTIFACTS_BUCKET, path: value.slice(ARTIFACTS_BUCKET.length + 1) };
  }

  const parts = value.split("/");
  if (parts.length > 1 && /^[a-z0-9._-]+$/i.test(parts[0]) && parts[0] !== "org") {
    return { bucket: parts[0], path: parts.slice(1).join("/") };
  }

  return { bucket: ARTIFACTS_BUCKET, path: value };
}

function normalizeAssetType(type: string): string {
  if (type === "financial-concept-map") return "visual-concept-map";
  return type;
}

function getAssetIcon(type: string): string {
  switch (normalizeAssetType(type)) {
    case "soc2-document":
      return "🛡️";
    case "compliance-gap-analysis":
      return "📋";
    case "summary":
      return "📄";
    case "clarity-scorer":
      return "💎";
    case "visual-concept-map":
      return "📈";
    case "minutes":
      return "📝";
    case "finance-faq":
      return "❓";
    case "financial-risk-detector":
      return "⚠️";
    default:
      return "✅";
  }
}

function toMarkdownSummary(summary: any): string {
  if (typeof summary === "string") return summary;
  if (!summary || typeof summary !== "object") return "Summary generated, but output was empty.";
  const summaryText = summary.summary_text ?? summary.summary ?? summary.text ?? summary.body ?? "";
  const keyPoints: any[] = Array.isArray(summary.key_points) ? summary.key_points : [];
  const actionItems: any[] = Array.isArray(summary.action_items) ? summary.action_items : [];
  const lines: string[] = [];
  if (summaryText) lines.push(summaryText);
  if (keyPoints.length) {
    lines.push("", "### Key takeaways");
    keyPoints.forEach((p) => lines.push(`- ${String(p)}`));
  }
  if (actionItems.length) {
    lines.push("", "### Action items");
    actionItems.forEach((a) => lines.push(`- ${typeof a === "string" ? a : JSON.stringify(a)}`));
  }
  return lines.join("\n").trim() || "Summary generated, but no readable text was returned.";
}

function toMarkdownClarity(clarity: any): string {
  if (typeof clarity === "string") return clarity;
  if (!clarity || typeof clarity !== "object") return "Clarity score generated, but output was empty.";
  const lines: string[] = [];
  if (clarity.summary) lines.push(String(clarity.summary));
  if (clarity.overallScore != null) lines.push("", `**Overall score:** ${String(clarity.overallScore)}`);
  if (clarity.overallLabel) lines.push(`**Overall label:** ${String(clarity.overallLabel)}`);
  const dimensions: any[] = Array.isArray(clarity.dimensions) ? clarity.dimensions : [];
  if (dimensions.length) {
    lines.push("", "### Dimensions");
    dimensions.forEach((d) => {
      lines.push(`- ${String(d?.label ?? d?.id ?? "Dimension")} (${String(d?.score ?? "0")}/100)`);
    });
  }
  const interpretation: any[] = Array.isArray(clarity.interpretation) ? clarity.interpretation : [];
  if (interpretation.length) {
    lines.push("", "### Interpretation");
    interpretation.forEach((item) => lines.push(`- ${String(item)}`));
  }
  return lines.join("\n").trim() || "Clarity score generated, but no readable text was returned.";
}

function toMarkdownSoc2(doc: any): string {
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

  if (doc.disclaimer) lines.push("", "## Disclaimer", String(doc.disclaimer));

  return lines.join("\n").trim() || JSON.stringify(doc, null, 2);
}

function toMarkdownComplianceGap(analysis: any): string {
  if (typeof analysis === "string") return analysis;
  if (!analysis || typeof analysis !== "object") return "Compliance gap analysis generated, but output was empty.";
  const lines: string[] = [];
  lines.push(`# ${String(analysis.title ?? "Compliance Gap Analysis")}`);
  if (analysis.summary) lines.push("", "## Summary", String(analysis.summary));
  const strengths: any[] = Array.isArray(analysis.strengths) ? analysis.strengths : [];
  const gaps: any[] = Array.isArray(analysis.gaps) ? analysis.gaps : [];
  if (strengths.length) {
    lines.push("", "## Good");
    strengths.forEach((x) => lines.push(`- ${String(x)}`));
  }
  if (gaps.length) {
    lines.push("", "## Bad / Gaps");
    gaps.forEach((x) => lines.push(`- ${String(x)}`));
  }
  const findings: any[] = Array.isArray(analysis.findings) ? analysis.findings : [];
  if (findings.length) {
    lines.push("", "## Findings");
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
  }
  const priorityActions: any[] = Array.isArray(analysis.priority_actions) ? analysis.priority_actions : [];
  if (priorityActions.length) {
    lines.push("", "## Priority Actions");
    priorityActions.forEach((x) => lines.push(`- ${String(x)}`));
  }
  const future: any[] = Array.isArray(analysis.future_steps) ? analysis.future_steps : [];
  if (future.length) {
    lines.push("", "## Future Steps");
    future.forEach((x) => lines.push(`- ${String(x)}`));
  }
  if (analysis.disclaimer) lines.push("", "## Disclaimer", String(analysis.disclaimer));
  return lines.join("\n").trim() || JSON.stringify(analysis, null, 2);
}

export function SessionDetailView({
  session,
  sessions = [],
  onSessionChange,
  onBack,
  onBackToSessions,
  onOpenConfigDrawer,
  initialAutomationId,
  hideBreadcrumb = false,
  compactLayout = false,
  hideSessionStrip = false,
  hideCompactAutomationOptions = false,
}: SessionDetailViewProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isAutomationRoute = /^\/dashboard\/[^/]+\/[^/]+\/[^/]+/.test(location.pathname);
  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(true);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<SummaryDetails[]>([]);
  const [isSummaryPanelOpen, setIsSummaryPanelOpen] = useState(initialAutomationId === "summary");
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioDurationSeconds, setAudioDurationSeconds] = useState<number | null>(null);
  const [audioElapsedSeconds, setAudioElapsedSeconds] = useState(0);
  const [assets, setAssets] = useState<AssetListItem[]>([]);
  const [clarityScore, setClarityScore] = useState<ClarityScore | null>(null);
  const [expandedDimensionId, setExpandedDimensionId] = useState<string | null>(null);
  const [outputModalOpen, setOutputModalOpen] = useState(false);
  const [outputModalLoading, setOutputModalLoading] = useState(false);
  const [outputModalError, setOutputModalError] = useState<string | null>(null);
  const [outputModalTitle, setOutputModalTitle] = useState("Automation Output");
  const [outputModalIcon, setOutputModalIcon] = useState("✅");
  const [outputModalText, setOutputModalText] = useState<string | null>(null);
  const [outputModalImage, setOutputModalImage] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // When route automation changes (e.g. Summary → Clarity Scorer), clean slate: show summary panel only for "summary", scroll to top
  useEffect(() => {
    setIsSummaryPanelOpen(initialAutomationId === "summary");
    window.scrollTo(0, 0);
  }, [initialAutomationId]);

  const navigateToAutomationRoute = (automationId: string) => {
    // Use the full automation route for all agents by default.
    const agent = TACIT_AGENTS.find((a) => a.name === session.agentName);
    const agentId = agent?.id ?? session.agentName.toLowerCase();

    navigate(`/dashboard/${agentId}/${automationId}/${session.sessionId}`, {
      state: {
        session,
        sessionsForAgent: sessions,
      },
      replace: isAutomationRoute, // when already on route, replace so back doesn't cycle through automations
    });
    return true;
  };

  useEffect(() => {
    let cancelled = false;

    async function loadDetails() {
      setDetailsLoading(true);
      setDetailsError(null);
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: { session: authSession } } = await supabase.auth.getSession();
        if (!authSession || cancelled) return;

        const data = await apiClient.requestJson<any>(`/api/sessions/${session.sessionId}`, {
          token: authSession.access_token,
        });
        if (!cancelled) {
          setSessionDetails(data.session ?? null);
        }
      } catch (e) {
        if (!cancelled) setDetailsError(e instanceof Error ? e.message : "Failed to load session");
      } finally {
        if (!cancelled) setDetailsLoading(false);
      }
    }

    loadDetails();
    return () => { cancelled = true; };
  }, [session.sessionId]);

  // Resolve recording_path from session details into a signed playable URL.
  useEffect(() => {
    let cancelled = false;

    async function loadRecordingUrl() {
      setAudioUrl(null);
      setAudioDurationSeconds(null);
      setAudioElapsedSeconds(0);
      setProgress(0);
      setIsPlaying(false);

      const target = resolveStoragePath(sessionDetails?.recording_path);
      if (!target) return;
      if ("externalUrl" in target) {
        if (!cancelled) setAudioUrl(target.externalUrl);
        return;
      }

      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: { session: authSession } } = await supabase.auth.getSession();
        if (!authSession || cancelled) return;

        const data = await apiClient.requestJson<any>(`/api/sessions/${session.sessionId}/recording-url`, {
          token: authSession.access_token,
        });
        if (!cancelled) {
          const resolved = data?.recordingUrl || data?.url || null;
          setAudioUrl(typeof resolved === "string" ? resolved : null);
        }
      } catch {
        if (!cancelled) {
          setAudioUrl(null);
        }
      }
    }

    loadRecordingUrl();
    return () => {
      cancelled = true;
    };
  }, [sessionDetails?.recording_path]);

  // Bind audio element events to player state.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setAudioDurationSeconds(Math.round(audio.duration));
      }
    };
    const onTimeUpdate = () => {
      const elapsed = Number.isFinite(audio.currentTime) ? Math.round(audio.currentTime) : 0;
      const total = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
      setAudioElapsedSeconds(elapsed);
      setProgress(total > 0 ? (audio.currentTime / total) * 100 : 0);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setProgress(100);
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, [audioUrl]);

  // Load persisted automation assets for this session.
  useEffect(() => {
    let cancelled = false;

    async function loadPersistedAssets() {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: { session: authSession } } = await supabase.auth.getSession();
        if (!authSession || cancelled) return;

        const data = await apiClient.requestJson<any>(`/api/sessions/${session.sessionId}/automation-results`, {
          token: authSession.access_token,
        });
        const list: PersistedAutomationResult[] = Array.isArray(data.results) ? data.results : [];
        if (cancelled) return;

        setAssets(
          list.map((item) => ({
            id: item.id,
            type: normalizeAssetType(item.automation_type),
            title: item.title || "Generated Asset",
            icon: getAssetIcon(item.automation_type),
            timestamp: item.created_at
              ? new Date(item.created_at).toLocaleString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })
              : "Unknown time",
          }))
        );
      } catch {
        // Ignore fetch failures; UI continues with in-memory generated assets.
      }
    }

    loadPersistedAssets();
    return () => { cancelled = true; };
  }, [session.sessionId]);

  // Load summary history for this session
  useEffect(() => {
    let cancelled = false;

    async function loadSummaries() {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: { session: authSession } } = await supabase.auth.getSession();
        if (!authSession || cancelled) return;

        const res = await apiClient.request(`/api/sessions/${session.sessionId}/summaries`, {
          token: authSession.access_token,
        });
        if (!res.ok) {
          // If endpoint not available or no permission, just hide summaries
          setSummaries([]);
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          const list: SummaryDetails[] = Array.isArray(data.summaries) ? data.summaries : [];
          setSummaries(list);
        }
      } catch {
        if (!cancelled) setSummaries([]);
      }
    }

    loadSummaries();
    return () => { cancelled = true; };
  }, [session.sessionId]);

  useEffect(() => {
    const handleAssetGenerated = (event: CustomEvent) => {
      const { type, title, icon, summary: generatedSummary, clarity } = event.detail as {
        type: string;
        title: string;
        icon: string;
        summary?: SummaryDetails;
        clarity?: ClarityScore;
      };
      const now = new Date();
      const timestamp = now.toLocaleString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      setAssets((prev) => [
        {
          type,
          title,
          icon,
          timestamp,
        },
        ...prev,
      ]);

      // If this automation produced a summary, reflect it at the top of the summaries list
      if (generatedSummary) {
        setSummaries((prev) => [generatedSummary, ...prev]);
        setIsSummaryPanelOpen(true);
      }

      // If this automation produced a clarity score, surface it in a dedicated panel of cards.
      if (clarity && clarity.dimensions && clarity.dimensions.length > 0 && type === "clarity-scorer") {
        setClarityScore(clarity);
        setTimeout(() => {
          const panel = document.getElementById("clarity-score-panel");
          if (panel) {
            panel.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 100);
      }

      // Scroll to assets section after a short delay
      setTimeout(() => {
        const assetsSection = document.getElementById("generated-assets-section");
        if (assetsSection) {
          assetsSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    };

    window.addEventListener("assetGenerated" as any, handleAssetGenerated as EventListener);
    return () => {
      window.removeEventListener("assetGenerated" as any, handleAssetGenerated as EventListener);
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;
    if (audio.paused) {
      void audio.play();
    } else {
      audio.pause();
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const progressBar = e.currentTarget;
    const clickPosition = e.nativeEvent.offsetX;
    const barWidth = progressBar.offsetWidth;
    const percentage = (clickPosition / barWidth) * 100;
    const total = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
    if (total > 0) {
      audio.currentTime = (percentage / 100) * total;
    }
    setProgress(percentage);
  };

  const transcriptAvailable = hasTranscript(sessionDetails);
  const totalDurationSeconds =
    audioDurationSeconds != null && audioDurationSeconds > 0
      ? audioDurationSeconds
      : sessionDetails?.duration_sec != null && sessionDetails.duration_sec > 0
        ? sessionDetails.duration_sec
        : null;
  const elapsedSeconds = audioElapsedSeconds > 0 ? audioElapsedSeconds : totalDurationSeconds != null ? Math.round((progress / 100) * totalDurationSeconds) : 0;

  const handleViewGeneratedAsset = (asset: { type: string; title?: string; icon?: string }) => {
    if (asset && (asset as any).id) {
      const item = asset as AssetListItem;
      void (async () => {
        setOutputModalTitle(item.title || "Automation Output");
        setOutputModalIcon(item.icon || "✅");
        setOutputModalText(null);
        setOutputModalImage(null);
        setOutputModalError(null);
        setOutputModalLoading(true);
        setOutputModalOpen(true);
        try {
          const { supabase } = await import("@/integrations/supabase/client");
          const { data: { session: authSession } } = await supabase.auth.getSession();
          if (!authSession) throw new Error("Not authenticated");

          const data = await apiClient.requestJson<any>(
            `/api/sessions/${session.sessionId}/automation-results/item/${item.id}`,
            { token: authSession.access_token }
          );
          const saved = data?.result;
          if (!saved) throw new Error("No output found");

          const type = normalizeAssetType(saved.automation_type || item.type);
          if (type === "visual-concept-map") {
            setOutputModalImage(saved.signed_url || null);
            setOutputModalText(null);
          } else if (type === "summary") {
            setOutputModalText(toMarkdownSummary(saved.result_json || {}));
          } else if (type === "clarity-scorer") {
            setOutputModalText(toMarkdownClarity(saved.result_json || {}));
          } else if (type === "soc2-document") {
            setOutputModalText(toMarkdownSoc2(saved.result_json || {}));
          } else if (type === "compliance-gap-analysis") {
            setOutputModalText(toMarkdownComplianceGap(saved.result_json || {}));
          } else {
            setOutputModalText(String(saved.preview_text || "No readable output available."));
          }
        } catch (e) {
          setOutputModalError(e instanceof Error ? e.message : "Failed to load output");
        } finally {
          setOutputModalLoading(false);
        }
      })();
      return;
    }

    const normalizedType = normalizeAssetType(asset.type);
    const navigated = navigateToAutomationRoute(normalizedType);
    if (navigated) return;

    if (asset.type === "summary") {
      setIsSummaryPanelOpen(true);
      setTimeout(() => {
        const el = document.getElementById("session-summaries-panel");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 50);
    } else if (asset.type === "clarity-scorer") {
      const el = document.getElementById("clarity-score-panel");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else if (asset.title && asset.icon) {
      onOpenConfigDrawer(normalizedType, asset.title, asset.icon);
    }
  };

  const resolveGeneratedAssetContent = (asset: { type: string; title: string; timestamp: string }) => {
    if (asset.type === "summary" && summaries.length > 0) {
      const latest = summaries[0];
      const parts: string[] = [
        `${asset.title}`,
        `Generated: ${asset.timestamp}`,
      ];

      if (latest.summary_text) {
        parts.push("", "Summary", latest.summary_text);
      }

      if (latest.key_points && latest.key_points.length > 0) {
        parts.push("", "Key Points", ...latest.key_points.map((point) => `- ${point}`));
      }

      if (latest.action_items && latest.action_items.length > 0) {
        parts.push(
          "",
          "Action Items",
          ...latest.action_items.map((item) => `- ${typeof item === "string" ? item : JSON.stringify(item)}`)
        );
      }

      return parts.join("\n");
    }

    if (asset.type === "clarity-scorer" && clarityScore?.dimensions?.length) {
      const parts: string[] = [
        `${asset.title}`,
        `Generated: ${asset.timestamp}`,
        "",
      ];

      if (typeof clarityScore.overallScore === "number") {
        parts.push(`Overall Score: ${Math.round(clarityScore.overallScore)}/100`);
      }
      if (clarityScore.overallLabel) {
        parts.push(`Overall Label: ${clarityScore.overallLabel}`);
      }

      parts.push("", "Dimensions");
      clarityScore.dimensions.forEach((dimension) => {
        parts.push(`- ${dimension.label}: ${Math.round(dimension.score)}/100`);
      });

      if (clarityScore.interpretation && clarityScore.interpretation.length > 0) {
        parts.push("", "Interpretation", ...clarityScore.interpretation.map((item) => `- ${item}`));
      }

      return parts.join("\n");
    }

    return null;
  };

  return (
    <>
      {!hideBreadcrumb && (
        <div className="mb-5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <button
            type="button"
            onClick={onBack}
            className="cursor-pointer border-none bg-transparent p-0 transition-colors hover:text-primary"
          >
            Home
          </button>
          {onBackToSessions && (
            <>
              <span className="text-primary/40">|</span>
              <button
                type="button"
                onClick={onBackToSessions}
                className="cursor-pointer border-none bg-transparent p-0 transition-colors hover:text-primary"
              >
                Sessions
              </button>
            </>
          )}
          <span className="text-primary/40">|</span>
          <span className="text-muted-foreground">Automate Past Session</span>
          <span className="text-primary/40">|</span>
          <span className="text-primary font-semibold">{session.agentName}</span>
        </div>
      )}

      {!hideSessionStrip && (
      <section className={compactLayout ? "mb-4 flex flex-wrap items-center gap-4 rounded-lg border border-primary/20 bg-card/40 px-4 py-3" : "mb-4 rounded-xl border border-primary/25 bg-card/55 p-4"}>
        {compactLayout ? (
          <>
            <span className="text-xs font-semibold text-foreground">{session.sessionName}</span>
            {sessions.length > 0 && onSessionChange && (
              <select
                id="session-select"
                value={session.sessionId}
                onChange={(e) => {
                  const s = sessions.find((s) => s.sessionId === e.target.value);
                  if (s) onSessionChange(s);
                }}
                className="h-8 max-w-[220px] rounded-lg border border-primary/30 bg-background/70 px-3 text-xs text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {sessions.map((s) => (
                  <option key={s.sessionId} value={s.sessionId}>
                    {s.sessionName}
                    {s.startedAt ? ` · ${new Date(s.startedAt).toLocaleDateString()}` : ""}
                  </option>
                ))}
              </select>
            )}
            <span className="rounded-full border border-primary/35 bg-primary/10 px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-[0.1em] text-primary">{session.agentName}</span>
            <span
              className={`rounded-full border px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-[0.1em] ${
                transcriptAvailable
                  ? "border-primary/35 bg-primary/10 text-primary"
                  : "border-amber-500/35 bg-amber-500/10 text-amber-500"
              }`}
            >
              {transcriptAvailable ? "Transcript ready" : "Transcript missing"}
            </span>
          </>
        ) : (
          <>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="mb-1.5 inline-flex rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.11em] text-primary">
                  Step 3 of 3
                </div>
                <h1 className="text-xl font-extrabold tracking-tight text-foreground sm:text-[1.35rem]">Automation Workspace</h1>
                <p className="mt-0.5 text-xs text-muted-foreground">Review the recording on the left and run automations from the studio panel on the right.</p>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="rounded-full border border-primary/35 bg-primary/10 px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-[0.1em] text-primary">{session.agentName}</span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-[0.1em] ${
                    transcriptAvailable
                      ? "border-primary/35 bg-primary/10 text-primary"
                      : "border-amber-500/35 bg-amber-500/10 text-amber-500"
                  }`}
                >
                  {transcriptAvailable ? "Transcript Ready" : "Transcript Missing"}
                </span>
              </div>
            </div>

            {sessions.length > 0 && onSessionChange && (
              <div className="max-w-[26rem]">
                <label htmlFor="session-select" className="mb-1.5 block text-[0.65rem] font-bold uppercase tracking-[0.1em] text-primary/80">
                  Choose the session to automate
                </label>
                <select
                  id="session-select"
                  value={session.sessionId}
                  onChange={(e) => {
                    const s = sessions.find((s) => s.sessionId === e.target.value);
                    if (s) onSessionChange(s);
                  }}
                  className="h-9 w-full rounded-lg border border-primary/30 bg-background/70 px-3 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  {sessions.map((s) => (
                    <option key={s.sessionId} value={s.sessionId}>
                      {s.sessionName}
                      {s.startedAt ? ` · ${new Date(s.startedAt).toLocaleDateString()}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}
      </section>
      )}

      {detailsError && (
        <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          {detailsError}
        </div>
      )}

      {!compactLayout && (
      <div className="mb-8 grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.95fr)]">
        <div className="rounded-xl border border-primary/30 bg-card/55 p-4 md:p-5">
          {detailsLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading session details…</div>
          ) : (
            <>
              <div className="mb-4 rounded-lg border border-primary/20 bg-black/25 px-4 py-3">
                <div className="mb-2 inline-flex rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-[0.1em] text-primary">
                  Session Overview
                </div>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="mb-1 text-lg font-extrabold text-foreground sm:text-[1.25rem]">
                      {sessionDetails?.meeting?.title ?? session.sessionName}
                    </h2>
                    <p className="font-mono text-xs text-muted-foreground">
                      Date & Time: {formatDateTime(sessionDetails?.meeting?.scheduled_start_at)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full border border-primary/35 bg-primary/10 px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-[0.1em] text-primary">
                      {session.agentName}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-[0.1em] ${
                        transcriptAvailable
                          ? "border-primary/35 bg-primary/10 text-primary"
                          : "border-amber-500/35 bg-amber-500/10 text-amber-500"
                      }`}
                    >
                      {transcriptAvailable ? "Transcript ready" : "Transcript missing"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-12">
                <div className="rounded-lg border border-primary/20 bg-background/45 p-3 sm:col-span-2 xl:col-span-8">
                  <div className="text-[0.6rem] font-bold uppercase tracking-[0.1em] text-primary/80">
                    Agenda
                  </div>
                  <div className="mt-0.5 text-sm font-medium text-foreground">
                    {sessionDetails?.meeting?.agenda?.trim() || "No agenda provided"}
                  </div>
                </div>
                <div className="rounded-lg border border-primary/20 bg-background/45 p-3 sm:col-span-2 xl:col-span-4">
                  <div className="text-[0.6rem] font-bold uppercase tracking-[0.1em] text-primary/80">
                    Invited Parties
                  </div>
                  <div className="mt-0.5 text-sm font-medium text-foreground">
                    {sessionDetails?.meeting?.meeting_invitees?.length
                      ? sessionDetails.meeting.meeting_invitees.map((i) => i.email).filter(Boolean).join(", ")
                      : "—"}
                  </div>
                </div>

              </div>

              <div className="rounded-xl border border-primary/20 bg-black/35 p-4 md:p-5">
                <audio
                  key={audioUrl || "no-audio"}
                  ref={audioRef}
                  src={audioUrl ?? undefined}
                  preload="metadata"
                />
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-primary/80">Playback</span>
                  <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    Notebook mode
                  </span>
                </div>

                <div className="flex justify-center">
                  <div className="w-[90%] max-w-[1400px] text-center">
                    <button
                      onClick={togglePlayPause}
                      disabled={!audioUrl}
                      className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-primary/25 text-2xl text-primary-foreground shadow-elegant transition-all ${
                        audioUrl
                          ? "cursor-pointer bg-gradient-primary hover:scale-105 hover:shadow-glow"
                          : "cursor-not-allowed bg-primary/30 opacity-60"
                      }`}
                    >
                      {isPlaying ? "⏸" : "▶"}
                    </button>

                    <div className="mx-auto w-full space-y-2">
                      <div
                        onClick={handleSeek}
                        className="h-3 w-full cursor-pointer overflow-hidden rounded-full border border-primary/25 bg-primary/10"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(progress)}
                        aria-label="Playback progress"
                      >
                        <div
                          className="h-full rounded-full bg-gradient-primary transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-muted-foreground">{formatClock(elapsedSeconds)}</span>
                        <span className="text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-primary/80">
                          {Math.round(progress)}%
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">{formatClock(totalDurationSeconds)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="self-start space-y-4 xl:sticky xl:top-24 xl:max-h-[calc(100vh-7.2rem)] xl:overflow-y-auto xl:pr-1">
          <AutomationOptions
            onOpenConfigDrawer={(type, title, icon) => {
              const handled = navigateToAutomationRoute(type);
              if (!handled) {
                onOpenConfigDrawer(type, title, icon);
              }
            }}
            onOpenSummaryPanel={() => {
              const handled = navigateToAutomationRoute("summary");
              if (!handled) {
                setIsSummaryPanelOpen(true);
              }
            }}
            agentName={session.agentName}
            layout="grid"
            className="mt-0"
            title="Automation Studio"
          />
        </div>
      </div>
      )}

      {/* All summaries for this session (latest first) */}
      {isSummaryPanelOpen && (
        <div id="session-summaries-panel" className="mb-10 space-y-4">
          <h3 className="text-[1.4rem] font-bold text-primary">
            Session Summaries
          </h3>

          {summaries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No summaries have been generated yet for this session.
            </p>
          ) : (
            summaries.map((s, index) => (
              <div
                key={s.id ?? index}
                className="bg-card/60 border-2 border-primary/40 rounded-2xl p-6 space-y-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-primary">
                      {index === 0 ? "Latest summary" : `Previous summary ${summaries.length - index}`}
                    </span>
                    {s.model && (
                      <span className="text-[0.7rem] text-muted-foreground font-mono">
                        Model: {s.model}
                      </span>
                    )}
                  </div>
                  {s.created_at && (
                    <span className="text-xs text-muted-foreground font-mono">
                      {new Date(s.created_at).toLocaleString()}
                    </span>
                  )}
                </div>

                {s.summary_text && (
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                    {s.summary_text}
                  </p>
                )}

                {s.key_points && s.key_points.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-primary mb-1">Key points</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {s.key_points.map((point, idx) => (
                        <li key={idx}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {s.action_items && s.action_items.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-primary mb-1">Action items</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {s.action_items.map((item, idx) => (
                        <li key={idx}>
                          {typeof item === "string" ? item : JSON.stringify(item)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {clarityScore && clarityScore.dimensions && clarityScore.dimensions.length > 0 && (
        <div
          id="clarity-score-panel"
          className="mb-10 space-y-6"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="inline-flex items-center gap-2 text-[0.9rem] font-semibold text-primary uppercase tracking-wide">
                <span>✨ Clarity Scorer</span>
                <span className="text-[0.7rem] text-muted-foreground uppercase tracking-wide">
                  Based strictly on transcript
                </span>
              </span>
              {clarityScore.title && (
                <span className="text-[0.9rem] font-semibold text-foreground">
                  {clarityScore.title}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {clarityScore.dimensions.map((dim) => (
              <div
                key={dim.id}
                onClick={() =>
                  setExpandedDimensionId((current) => (current === dim.id ? null : dim.id))
                }
                className={`bg-card/60 border rounded-2xl p-4 flex flex-col justify-between items-stretch shadow-sm cursor-pointer transition-all min-h-[220px] text-center self-start ${
                  expandedDimensionId === dim.id
                    ? "border-primary/80 shadow-elegant scale-[1.02]"
                    : "border-primary/40 hover:border-primary/70 hover:shadow-elegant hover:scale-[1.01]"
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <span className="text-3xl">{dim.emoji}</span>
                  <span className="text-[1rem] font-extrabold text-foreground">
                    {dim.label}
                  </span>
                  <div className="mt-1">
                    <span className="block text-[0.7rem] uppercase tracking-wide text-muted-foreground">
                      Score
                    </span>
                    <div className="text-2xl font-black text-primary">
                      {Math.round(dim.score)}{" "}
                      <span className="text-xs text-muted-foreground">/ 100</span>
                    </div>
                  </div>
                </div>

                {expandedDimensionId === dim.id && (
                  <div className="mt-3 space-y-3 border-t border-primary/20 pt-2 text-left">
                    {dim.whyHigh && dim.whyHigh.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-[0.75rem] font-semibold text-emerald-400 uppercase tracking-wide">
                          Why high
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-[0.8rem] text-muted-foreground">
                          {dim.whyHigh.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {dim.whyLow && dim.whyLow.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-[0.75rem] font-semibold text-amber-400 uppercase tracking-wide">
                          Why low
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-[0.8rem] text-muted-foreground">
                          {dim.whyLow.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            <div
              key="overall-clarity"
              onClick={() =>
                setExpandedDimensionId((current) => (current === "overall" ? null : "overall"))
              }
              className={`bg-card/70 border rounded-2xl p-4 flex flex-col justify-between items-stretch shadow-sm cursor-pointer transition-all min-h-[220px] text-center self-start ${
                expandedDimensionId === "overall"
                  ? "border-primary/80 shadow-elegant scale-[1.02]"
                  : "border-primary/50 hover:border-primary/80 hover:shadow-elegant hover:scale-[1.01]"
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <span className="text-3xl">🎯</span>
                <span className="text-[1rem] font-extrabold text-foreground">
                  Overall Clarity
                </span>
                {typeof clarityScore.overallScore === "number" && (
                  <div className="mt-1">
                    <span className="block text-[0.7rem] uppercase tracking-wide text-muted-foreground">
                      Score
                    </span>
                    <div className="text-2xl font-black text-primary">
                      {Math.round(clarityScore.overallScore)}{" "}
                      <span className="text-xs text-muted-foreground">/ 100</span>
                    </div>
                  </div>
                )}
              </div>

              {expandedDimensionId === "overall" && (
                <div className="mt-3 space-y-3 border-t border-primary/20 pt-2 text-left">
                  {clarityScore.overallLabel && (
                    <div className="text-[0.8rem] text-muted-foreground">
                      {clarityScore.overallLabel}
                    </div>
                  )}

                  {clarityScore.interpretation && clarityScore.interpretation.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[0.75rem] font-semibold text-primary uppercase tracking-wide">
                        Interpretation
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-[0.8rem] text-muted-foreground">
                        {clarityScore.interpretation.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {compactLayout && assets.length > 0 && (
        <div className="mb-10">
          <GeneratedAssets
            assets={assets}
            onViewAsset={handleViewGeneratedAsset}
            resolveAssetContent={resolveGeneratedAssetContent}
            variant="full"
          />
        </div>
      )}

      {!compactLayout && assets.length > 0 && (
        <div className="mb-10">
          <GeneratedAssets
            assets={assets}
            onViewAsset={handleViewGeneratedAsset}
            resolveAssetContent={resolveGeneratedAssetContent}
            variant="full"
          />
        </div>
      )}

      {compactLayout && !hideCompactAutomationOptions && (
        <div className="mt-10 rounded-xl border border-primary/25 bg-card/55 p-4">
          <AutomationOptions
            onOpenConfigDrawer={(type, title, icon) => {
              const handled = navigateToAutomationRoute(type);
              if (!handled) {
                onOpenConfigDrawer(type, title, icon);
              }
            }}
            onOpenSummaryPanel={() => {
              const handled = navigateToAutomationRoute("summary");
              if (!handled) {
                setIsSummaryPanelOpen(true);
              }
            }}
            agentName={session.agentName}
            layout="grid"
            className="mt-0"
            title="Available automations"
          />
        </div>
      )}

      <AutomationOutputModal
        open={outputModalOpen}
        onClose={() => setOutputModalOpen(false)}
        title={outputModalTitle}
        icon={outputModalIcon}
        loading={outputModalLoading}
        error={outputModalError}
        textContent={outputModalText}
        imageUrl={outputModalImage}
      />

    </>
  );
}
