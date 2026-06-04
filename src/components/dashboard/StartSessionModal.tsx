import { useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { TACIT_AGENTS } from "@/data/agents";
import { SelectedAgentDescription } from "./SelectedAgentDescription";
import { AgentAvatar } from "./AgentAvatar";
import { apiClient } from "@/lib/apiClient";
import type { SessionModalPrefill } from "./sessionModalPrefill";

interface StartSessionModalProps {
  open: boolean;
  onClose: () => void;
  prefill?: SessionModalPrefill | null;
}

export function StartSessionModal({ open, onClose, prefill = null }: StartSessionModalProps) {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [meetingMode, setMeetingMode] = useState<"phone" | "web">("phone");
  const [formData, setFormData] = useState({
    sessionTitle: "",
    inviteeEmail: "",
    sessionNotes: "",
    meetingUrl: "",
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const agents = TACIT_AGENTS;

  const filteredAgents = agents.filter((agent) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      agent.name.toLowerCase().includes(query) ||
      agent.tagline.toLowerCase().includes(query) ||
      agent.role.toLowerCase().includes(query) ||
      agent.keywords.some((k) => k.toLowerCase().includes(query))
    );
  });

  const shouldShowSearchResults = isSearchFocused && searchQuery.trim().length > 0;

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };

    if (isSearchFocused) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSearchFocused]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent || !formData.sessionTitle || !formData.inviteeEmail) return;
    if (meetingMode === "web" && !formData.meetingUrl.trim()) return;

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to start a session.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { session } } = await (await import("@/integrations/supabase/client")).supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      const projectsData = await apiClient.requestJson<any>("/api/projects", {
        token: session.access_token,
      });
      const projects = projectsData?.projects ?? projectsData ?? [];
      if (!Array.isArray(projects) || projects.length === 0) {
        throw new Error("No projects found. Please create a project first.");
      }
      const projectId = projects[0].id;

      const now = new Date();
      const scheduledStartAt = now.toISOString();
      const scheduledEndAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString(); // 1 hour from now

      const inviteeEmails = formData.inviteeEmail.split(",").map((e) => e.trim()).filter(Boolean);
      const invitees = inviteeEmails.map((email) => ({
        name: email.split("@")[0] || "Invitee",
        email,
      }));

      const selectedAgentData = agents.find((a) => a.id === selectedAgent);
      const agentPayload = selectedAgentData
        ? {
            agent: {
              name: selectedAgentData.name,
              tagline: selectedAgentData.tagline,
              role: selectedAgentData.role,
              persona: selectedAgentData.persona,
              description: selectedAgentData.description,
              // Map new background field to legacy descriptionContinued for backend/email templates
              descriptionContinued: selectedAgentData.background,
              specialties: selectedAgentData.specialties,
            },
          }
        : {};

      const endpoint = meetingMode === "web" ? "/api/web-meetings" : "/api/meetings";
      const data = await apiClient.requestJson<any>(endpoint, {
        method: "POST",
        token: session.access_token,
        body: JSON.stringify({
          project_id: projectId,
          title: formData.sessionTitle,
          agenda: formData.sessionNotes || undefined,
          scheduled_start_at: scheduledStartAt,
          scheduled_end_at: scheduledEndAt,
          invitees,
          ...(meetingMode === "web" ? { meeting_url: formData.meetingUrl.trim() } : {}),
          ...agentPayload,
        }),
      });
      const inviteEmailsSent = data.inviteEmailsSent !== false;
      const inviteEmailErrors = data.inviteEmailErrors as { email: string; error: string }[] | undefined;

      if (inviteEmailsSent) {
        toast({
          title: "Session started",
          description: invitees.length > 1
            ? `Invitation email sent to ${invitees.length} invitees with call-in number and access code.`
            : `Invitation email sent to ${formData.inviteeEmail} with call-in number and access code.`,
        });
      } else {
        toast({
          title: "Session created, but invite email failed",
          description: inviteEmailErrors?.[0]?.error ?? "Set RESEND_API_KEY in server-api/.env to send invite emails.",
          variant: "destructive",
        });
      }
      onClose();
      setSelectedAgent(null);
      setSearchQuery("");
      setIsSearchFocused(false);
      setMeetingMode("phone");
      setFormData({ sessionTitle: "", inviteeEmail: "", sessionNotes: "", meetingUrl: "" });
    } catch (error: any) {
      console.error("Error starting session:", error);
      toast({
        title: "Failed to start session",
        description: error.message || "Could not create meeting or send invite.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset search when modal closes
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setIsSearchFocused(false);
      setMeetingMode("phone");
      setSelectedAgent(null);
      setFormData({
        sessionTitle: "",
        inviteeEmail: "",
        sessionNotes: "",
        meetingUrl: "",
      });
    }
  }, [open]);

  // Apply Mission Brief / meeting-chooser prefill when opening
  useEffect(() => {
    if (!open || !prefill) return;
    if (prefill.initialMeetingMode) setMeetingMode(prefill.initialMeetingMode);
    if (prefill.initialSessionTitle?.trim()) {
      setFormData((prev) => ({ ...prev, sessionTitle: prefill.initialSessionTitle!.trim() }));
    }
    if (prefill.initialSessionNotes?.trim()) {
      setFormData((prev) => ({ ...prev, sessionNotes: prefill.initialSessionNotes!.trim() }));
    }
    if (prefill.initialAgentId) {
      setSelectedAgent(prefill.initialAgentId);
      const ag = agents.find((a) => a.id === prefill.initialAgentId);
      if (ag) setSearchQuery(ag.name);
    }
  }, [open, prefill, agents]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[1000] flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-card border-2 border-primary rounded-[20px] p-12 max-w-[800px] w-[90%] max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 bg-transparent border-none text-muted-foreground text-[2rem] cursor-pointer transition-colors leading-none hover:text-primary"
        >
          ×
        </button>
        <h2 className="text-[2rem] font-extrabold text-primary mb-4 text-center">
          Start New Tacit Session NOW
        </h2>
        <p className="text-muted-foreground mb-8 text-center text-base">
        Pick an agent and we’ll send the invitee an email with the call-in number and access code so they can join now.
        </p>

        <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setMeetingMode("phone")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              meetingMode === "phone"
                ? "bg-primary text-primary-foreground"
                : "bg-black/30 text-muted-foreground hover:text-foreground"
            }`}
          >
            Phone session
          </button>
          <button
            type="button"
            onClick={() => setMeetingMode("web")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              meetingMode === "web"
                ? "bg-primary text-primary-foreground"
                : "bg-black/30 text-muted-foreground hover:text-foreground"
            }`}
          >
            Web meeting (Zoom/Meet)
          </button>
        </div>

        {/* Netflix-style Search Bar */}
        <div ref={searchRef} className="relative mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="Search agents by name, expertise, or keywords (e.g., 'operations', 'finance', 'data')..."
              className="w-full bg-black/40 border border-white/20 rounded-md pl-12 pr-4 py-4 text-white text-lg placeholder:text-white/50 focus:outline-none focus:border-white/40 focus:bg-black/60 transition-all"
            />
          </div>

          {/* Search Results Dropdown */}
          {shouldShowSearchResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-black/95 backdrop-blur-md border border-white/20 rounded-md shadow-2xl max-h-[400px] overflow-y-auto z-50">
              {filteredAgents.length > 0 ? (
                <div className="p-2">
                  {filteredAgents.map((agent) => (
                    <div
                      key={agent.id}
                      onClick={() => {
                        setSelectedAgent(agent.id);
                        setSearchQuery(agent.name);
                        setIsSearchFocused(false);
                      }}
                      className={`flex items-center gap-4 p-4 rounded-md cursor-pointer transition-all ${
                        selectedAgent === agent.id
                          ? "bg-primary/20 border border-primary"
                          : "hover:bg-white/10 border border-transparent"
                      }`}
                    >
                      <AgentAvatar agent={agent} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-semibold text-lg mb-0.5">{agent.name}</div>
                        <div className="text-white/80 text-sm font-medium">{agent.tagline}</div>
                        <div className="text-white/60 text-xs mt-0.5">{agent.role}</div>
                        {searchQuery && (
                          <div className="text-white/50 text-xs mt-1">
                            Matched: {agent.keywords.filter((k) => k.toLowerCase().includes(searchQuery.toLowerCase())).join(", ")}
                          </div>
                        )}
                      </div>
                      {selectedAgent === agent.id && (
                        <div className="text-primary text-xl">✓</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-white/50">
                  <div className="text-lg mb-2">No agents found</div>
                  <div className="text-sm">Try searching for "finance", "operations", "compliance", or "data"</div>
                </div>
              )}
            </div>
          )}

          {/* Selected Agent – full description */}
          {selectedAgent && !isSearchFocused && (() => {
            const agent = agents.find((a) => a.id === selectedAgent);
            return agent ? (
              <SelectedAgentDescription
                agent={agent}
                onClear={() => {
                  setSelectedAgent(null);
                  setSearchQuery("");
                }}
              />
            ) : null;
          })()}
        </div>

        <form onSubmit={handleSubmit} className="mt-8">
          {meetingMode === "web" && (
            <div className="mb-6">
              <label htmlFor="meetingUrl" className="block text-primary font-semibold mb-2 text-[0.95rem]">
                Meeting Link
              </label>
              <input
                type="url"
                id="meetingUrl"
                value={formData.meetingUrl}
                onChange={(e) => setFormData({ ...formData, meetingUrl: e.target.value })}
                placeholder="Paste Zoom/Google Meet link"
                required
                className="w-full bg-input border-2 border-primary/30 rounded-lg px-4 py-3 text-foreground text-base transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          )}
          <div className="mb-6">
            <label htmlFor="sessionTitle" className="block text-primary font-semibold mb-2 text-[0.95rem]">
              Meeting Title
            </label>
            <input
              type="text"
              id="sessionTitle"
              value={formData.sessionTitle}
              onChange={(e) => setFormData({ ...formData, sessionTitle: e.target.value })}
              placeholder="e.g., Payment Gateway Integration"
              required
              className="w-full bg-input border-2 border-primary/30 rounded-lg px-4 py-3 text-foreground text-base transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="inviteeEmail" className="block text-primary-dashboard font-semibold mb-2 text-[0.95rem]">
              Invitee Emails (Comma separated)
            </label>
            <input
              type="email"
              id="inviteeEmail"
              value={formData.inviteeEmail}
              onChange={(e) => setFormData({ ...formData, inviteeEmail: e.target.value })}
              placeholder="expert@company.com"
              required
              className="w-full bg-input border-2 border-primary/30 rounded-lg px-4 py-3 text-foreground text-base transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="sessionNotes" className="block text-primary-dashboard font-semibold mb-2 text-[0.95rem]">
              Meeting Agenda (Optional)
            </label>
            <textarea
              id="sessionNotes"
              value={formData.sessionNotes}
              onChange={(e) => setFormData({ ...formData, sessionNotes: e.target.value })}
              placeholder="Any specific topics or areas to focus on..."
              rows={4}
              className="w-full bg-input border-2 border-primary-dashboard/30 rounded-lg px-4 py-3 text-foreground text-base transition-all focus:outline-none focus:border-primary-dashboard focus:ring-2 focus:ring-primary-dashboard/20 resize-none min-h-[100px]"
            />
          </div>

          <button
            type="submit"
            disabled={!selectedAgent || !formData.sessionTitle || !formData.inviteeEmail || isSubmitting}
            className="w-full bg-primary text-primary-foreground px-5 py-4 rounded-xl text-[1.1rem] font-bold cursor-pointer transition-all border-none shadow-elegant hover:bg-primary-glow hover:shadow-glow hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 mt-4"
          >
            {isSubmitting ? "Sending invite…" : "Submit & Send Invite"}
          </button>
        </form>
      </div>
    </div>
  );
}
