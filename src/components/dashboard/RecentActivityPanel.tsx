import "./mission-brief-v4.css";
import { ChevronRight, Loader2, Search } from "lucide-react";
import { TACIT_AGENTS } from "@/data/agents";
import { cn } from "@/lib/utils";
import type { RecentAgentActivity } from "@/types/recentActivity";

function agentById(id: string) {
  return TACIT_AGENTS.find((a) => a.id === id);
}

function agentBadgeText(agentId: string): string {
  const agent = agentById(agentId);
  const raw = agent?.name ?? agentId;
  return raw.replace(/\s/g, "").toUpperCase().slice(0, 5);
}

function pickupBadgeModifier(agentId: string): string {
  const map: Record<string, string> = {
    sage: "mission-brief-v4__pickup-badge--sage",
    aria: "mission-brief-v4__pickup-badge--aria",
    mason: "mission-brief-v4__pickup-badge--mason",
    lexa: "mission-brief-v4__pickup-badge--lexa",
    eagle: "mission-brief-v4__pickup-badge--eagle",
    manu: "mission-brief-v4__pickup-badge--manu",
    ross: "mission-brief-v4__pickup-badge--ross",
    monica: "mission-brief-v4__pickup-badge--monica",
    chandler: "mission-brief-v4__pickup-badge--chandler",
  };
  return map[agentId] ?? "mission-brief-v4__pickup-badge--default";
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 45) return "Just now";
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const d = Math.floor(hr / 24);
  if (d > 0) return d === 1 ? "1 day ago" : `${d} days ago`;
  if (hr > 0) return hr === 1 ? "1 hour ago" : `${hr} hours ago`;
  if (min > 0) return min === 1 ? "1 min ago" : `${min} min ago`;
  return "Just now";
}

function statusClass(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("ready")) return "mission-brief-v4__activity-status--ready";
  if (s.includes("fail")) return "mission-brief-v4__activity-status--failed";
  return "mission-brief-v4__activity-status--progress";
}

export type RecentActivityPanelProps = {
  activities: RecentAgentActivity[];
  loading: boolean;
  error: string | null;
  agentFilter: string;
  onAgentFilterChange: (agentId: string) => void;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  activeId: string | null;
  onSelect: (activity: RecentAgentActivity) => void;
};

export function RecentActivityPanel({
  activities,
  loading,
  error,
  agentFilter,
  onAgentFilterChange,
  searchQuery,
  onSearchQueryChange,
  activeId,
  onSelect,
}: RecentActivityPanelProps) {
  const filterChips = [
    { id: "all", label: "All" },
    ...TACIT_AGENTS.map((a) => ({ id: a.id, label: a.name })),
  ];

  return (
    <section className="mission-brief-v4__landing-zone" aria-label="Pick up where you left off">
      <h2 className="mission-brief-v4__landing-heading">Pick up where you left off</h2>
      <p className="mission-brief-v4__landing-sub">
        Recent sessions, MANU runs, and workspace launches across all agents.
      </p>

      <div className="mission-brief-v4__activity-toolbar">
        <div className="mission-brief-v4__activity-filters" role="group" aria-label="Filter by agent">
          {filterChips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              className={cn(
                "mission-brief-v4__activity-chip",
                agentFilter === chip.id && "mission-brief-v4__activity-chip--active",
              )}
              onClick={() => onAgentFilterChange(chip.id)}
            >
              {chip.label}
            </button>
          ))}
        </div>
        <label className="mission-brief-v4__activity-search">
          <Search className="mission-brief-v4__activity-search-icon" aria-hidden />
          <input
            type="search"
            placeholder="Search title or subtitle�"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="mission-brief-v4__activity-search-input"
          />
        </label>
      </div>

      {loading && (
        <div className="mission-brief-v4__activity-state" role="status">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          <span>Loading recent activity�</span>
        </div>
      )}

      {!loading && error && (
        <p className="mission-brief-v4__activity-state mission-brief-v4__activity-state--error" role="alert">
          {error} � showing cached entries if available.
        </p>
      )}

      {!loading && activities.length === 0 && (
        <p className="mission-brief-v4__activity-state">
          No recent activity yet � launch a mission below.
        </p>
      )}

      {!loading && activities.length > 0 && (
        <ul className="mission-brief-v4__activity-list">
          {activities.map((activity, index) => {
            const badge = agentBadgeText(activity.agentId);
            const featured = activities.length >= 2 ? index < 2 : index === 0;
            return (
              <li key={activity.id}>
                <button
                  type="button"
                  className={cn(
                    "mission-brief-v4__activity-row",
                    featured && "mission-brief-v4__activity-row--featured",
                    activeId === activity.id && "mission-brief-v4__activity-row--active",
                  )}
                  onClick={() => onSelect(activity)}
                >
                  <span
                    className={cn(
                      "mission-brief-v4__pickup-badge mission-brief-v4__activity-badge",
                      pickupBadgeModifier(activity.agentId),
                    )}
                  >
                    {badge}
                  </span>
                  <span className="mission-brief-v4__activity-main">
                    <span className="mission-brief-v4__activity-title">{activity.title}</span>
                    <span className="mission-brief-v4__activity-sub">{activity.subtitle}</span>
                  </span>
                  <span className="mission-brief-v4__activity-meta">
                    <span className="mission-brief-v4__activity-time">
                      {formatRelativeTime(activity.createdAt)}
                    </span>
                    <span
                      className={cn(
                        "mission-brief-v4__activity-status",
                        statusClass(activity.status),
                      )}
                    >
                      {activity.status}
                    </span>
                  </span>
                  <ChevronRight className="mission-brief-v4__activity-chevron" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
