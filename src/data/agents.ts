/**
 * Tacit voice agents: rich descriptions for schedule/start session UI.
 */

export interface TacitAgent {
  id: string;
  name: string;
  /** Short line for search results and list (e.g. "Finance Strategy Expert") */
  tagline: string;
  /** Fallback emoji if image is unavailable */
  icon: string;
  /** Optional image used as the primary avatar for this agent (served from public/images) */
  image?: string;
  /** Role label (e.g. "AI Finance Partner") */
  role: string;
  /** Persona traits, shown as bullet-separated (e.g. "Analytical • Strategic • Data-driven") */
  persona: string;
  /** Full description paragraph */
  description: string;
  /** Second paragraph or continuation */
  descriptionContinued?: string;
  /** Bullet list of specialties */
  specialties: string[];
  /** Keywords for search (name, tagline, role, description, specialties) */
  keywords: string[];
}

export const TACIT_AGENTS: TacitAgent[] = [
  {
    id: "rachael",
    name: "Rachel",
    tagline: "Finance Strategy Expert",
    icon: "🟣",
    image: `${import.meta.env.BASE_URL}images/rachel.png`,
    role: "AI Finance Partner",
    persona: "Analytical • Strategic • Data-driven • Decisive",
    description:
      "Rachel helps teams understand their financial reality in minutes, not weeks. She analyzes revenue, burn, margins, forecasts, and budget allocations to surface insights that drive smarter decisions.",
    descriptionContinued:
      "From board-ready summaries to granular cost breakdowns, Rachel turns financial data into actionable strategy.",
    specialties: [
      "Financial modeling & forecasting",
      "Budget optimization",
      "Revenue & margin analysis",
      "SaaS metrics (ARR, LTV, CAC)",
      "Executive-ready financial summaries",
    ],
    keywords: [
      "finance",
      "financial",
      "accounting",
      "money",
      "budget",
      "revenue",
      "expenses",
      "forecast",
      "margin",
      "ARR",
      "LTV",
      "CAC",
    ],
  },
  {
    id: "ross",
    name: "Ross",
    tagline: "Compliance & Risk Specialist",
    icon: "🔵",
    image: `${import.meta.env.BASE_URL}images/ross.png`,
    role: "AI Compliance Officer",
    persona: "Structured • Detail-oriented • Risk-aware • Methodical",
    description:
      "Ross ensures your organization stays audit-ready and compliant. He reviews policies, access controls, documentation, and operational workflows to identify gaps before regulators do.",
    descriptionContinued:
      "Whether it's SOC 2 alignment, internal controls, or governance tracking, Ross keeps risk visible and manageable.",
    specialties: [
      "SOC 2 & regulatory readiness",
      "Risk assessment & gap analysis",
      "Policy review & documentation",
      "Access control & governance",
      "Audit preparation support",
    ],
    keywords: [
      "compliance",
      "legal",
      "regulation",
      "policy",
      "audit",
      "governance",
      "risk",
      "SOC 2",
      "controls",
    ],
  },
  {
    id: "monica",
    name: "Monica",
    tagline: "Operations Excellence Lead",
    icon: "🟠",
    image: `${import.meta.env.BASE_URL}images/monica.png`,
    role: "AI Operations Partner",
    persona: "Organized • Process-focused • Efficient • Reliable",
    description:
      "Monica helps teams document and improve how work gets done. She captures processes, workflows, and runbooks so operations scale without losing institutional knowledge.",
    descriptionContinued:
      "From standard operating procedures to capacity planning and vendor coordination, Monica turns operational chaos into repeatable playbooks.",
    specialties: [
      "Process documentation & SOPs",
      "Workflow design & optimization",
      "Capacity planning & resource allocation",
      "Vendor & stakeholder coordination",
      "Operational runbooks & playbooks",
    ],
    keywords: [
      "operations",
      "operational",
      "process",
      "workflow",
      "efficiency",
      "management",
      "logistics",
      "SOP",
      "runbook",
    ],
  },
  {
    id: "chandler",
    name: "Chandler",
    tagline: "Data & Analytics Specialist",
    icon: "🟢",
    image: `${import.meta.env.BASE_URL}images/chandler.png`,
    role: "AI Data Partner",
    persona: "Curious • Precise • Insight-driven • Clear",
    description:
      "Chandler helps teams get more value from their data. He clarifies metrics, dashboards, and reporting so that numbers tell a clear story and support better decisions.",
    descriptionContinued:
      "From KPI definitions to trend analysis and data quality checks, Chandler makes analytics accessible and actionable.",
    specialties: [
      "Metrics definition & KPI frameworks",
      "Dashboard design & reporting",
      "Trend analysis & forecasting",
      "Data quality & validation",
      "Stakeholder-friendly data narratives",
    ],
    keywords: [
      "data",
      "analytics",
      "analysis",
      "reporting",
      "metrics",
      "insights",
      "statistics",
      "KPI",
      "dashboard",
    ],
  },
];
