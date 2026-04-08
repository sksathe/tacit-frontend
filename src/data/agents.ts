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
  background?: string;
  /** Bullet list of specialties */
  specialties: string[];
  /** Keywords for search (name, tagline, role, description, specialties) */
  keywords: string[];
}

export const TACIT_AGENTS: TacitAgent[] = [
 /* {
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
  },*/
  {
    id: "sage",
    name: "SAGE",
    tagline: "Strategic Analysis & Guided Extraction",
    icon: "🧠",
    image: `${import.meta.env.BASE_URL}images/sage.png`,
    role: "AI Strategy & Discovery Partner",
    persona: "Analytical • Structured • Insight-driven",
    description: "SAGE helps teams uncover how their business actually works. It facilitates structured discovery conversations to map processes, identify inefficiencies, and capture critical operational knowledge that is often undocumented.",
    background: "Through guided questioning and analytical reasoning, SAGE extracts institutional knowledge from stakeholders and transforms it into clear insights, structured documentation, and actionable next steps.",
    specialties: [
      "Business process discovery",
      "Operational workflow mapping",
      "Technology stack assessment",
      "Stakeholder alignment conversations",
      "Future state planning",
      "Knowledge capture and synthesis"
    ],
    keywords: [
      "sage",
      "strategy",
      "business discovery",
      "process mapping",
      "consulting",
      "analysis",
      "workflow discovery",
      "stakeholder analysis",
      "technology assessment",
      "future state planning"
    ]
  },
  {
    id: "aria",
    name: "ARIA",
    tagline: "Advisor Registration & Integration Assistant",
    icon: "🤝",
    image: `${import.meta.env.BASE_URL}images/aria.png`,
    role: "AI Client Onboarding Specialist",
    persona: "Professional • Empathetic • Detail-oriented",
    description: "ARIA specializes in onboarding conversations with financial advisors and clients. It helps gather compliance information, understand practice structure, and guide new participants through complex onboarding workflows.",
    background: "Former McKinsey Senior Consultant with 12 years in digital transformation. PhD in Organizational Psychology from Stanford. Certified in Design Thinking and Systems Mapping. Published thought leader on knowledge extraction methodologies.",
    specialties: [
      "Financial advisor onboarding",
      "Compliance documentation collection",
      "Practice structure assessment",
      "Technology onboarding discussions",
      "Client relationship discovery",
      "Operational readiness preparation"
    ],
    keywords: [
      "aria",
      "advisor onboarding",
      "client onboarding",
      "financial advisor",
      "wealth management",
      "compliance intake",
      "practice setup",
      "registration",
      "integration",
      "advisor workflows"
    ]
  },
  {
    id: "mason",
    name: "MASON",
    tagline: "Managed Agreement & SaaS Operations Navigator",
    icon: "📑",
    image: `${import.meta.env.BASE_URL}images/mason.png`,
    role: "AI Contract & Operations Advisor",
    persona: "Methodical • Precise • Operational",
    description: "MASON helps organizations navigate complex agreements, operational contracts, and SaaS implementation workflows. It facilitates structured conversations around contracts, pricing models, service agreements, and operational requirements.",
    background: "By guiding stakeholders through contract reviews and operational planning discussions, MASON ensures that important details are documented clearly and that organizations can move from negotiation to implementation smoothly.",
    specialties: [
      "Contract and agreement review",
      "Redline negotiation preparation",
      "SaaS onboarding discussions",
      "Financial onboarding coordination",
      "Vendor relationship planning",
      "Renewal and contract lifecycle management"
    ],
    keywords: [
      "mason",
      "contracts",
      "agreement review",
      "vendor negotiations",
      "saas onboarding",
      "contract lifecycle",
      "renewals",
      "financial onboarding",
      "legal workflow",
      "operations"
    ]
  },
  {
    id: "lexa",
    name: "Clara",
    tagline: "Contract Intelligence & Revenue Recognition Expert",
    icon: "📄",
    image: `${import.meta.env.BASE_URL}images/clara.png`,
    role: "AI Contract Intelligence Partner",
    persona: "Analytical • Detail-oriented • Compliance-driven • Financially-aware • Structured thinker",
    description:
      "Clara is an AI-powered contract intelligence agent designed to extract, interpret, and structure complex customer contracts into actionable business data. She understands nuanced legal and financial language across order forms, MSAs, and amendments, transforming unstructured documents into clean, system-ready outputs.",
    background:
      "From identifying billing terms and subscription schedules to mapping obligations into revenue recognition timelines, Clara ensures every contract is parsed with precision and aligned with compliance policies. She bridges the gap between legal documents and operational systems like Salesforce and DriveTrain.",
    specialties: [
      "PDF Contract Parsing (Order Forms, MSAs, Amendments)",
      "Table Extraction with Formatting Preservation (Merged Cells, Multi-line Fields)",
      "Clause-Level Understanding (Billing Terms, Renewal, Termination)",
      "Field Mapping to Structured Schemas (Customer, Pricing, Terms)",
      "Revenue Recognition Modeling (ASC 606 / IFRS 15 alignment)",
      "Multi-contract Type Handling with Schema Variability",
      "Confidence Scoring & Validation Layers",
      "Integration-ready Outputs (Salesforce, DriveTrain)"
    ],
    keywords: [
      "contract parsing",
      "pdf to structured data",
      "rev rec",
      "revenue recognition",
      "salesforce integration",
      "drivetrain finance",
      "order form extraction",
      "legal document ai",
      "table extraction",
      "contract intelligence",
      "financial compliance",
      "asc 606",
      "ifrs 15",
      "subscription contracts",
      "billing terms extraction"
    ]
  },
  {
    id: "eagle",
    name: "Eagle",
    tagline: "Logistics Document Extraction & Shipment Intelligence",
    icon: "🦅",
    image: `${import.meta.env.BASE_URL}images/chandler.png`,
    role: "AI Logistics Document Partner",
    persona: "Precise • Operations-aware • Compliance-minded • Throughput-focused",
    description:
      "Eagle extracts structured data from logistics paperwork—bills of lading, packing lists, freight quotations and rate sheets, commercial invoices, customs entries, proof of delivery, and rate confirmations—so teams can validate shipments, reconcile charges, and feed TMS, WMS, and ERP systems without manual re-keying.",
    background:
      "It handles noisy scans, multi-page PDFs, and carrier-specific layouts while surfacing line-level details (quantities, weights, references, ports, dates) and flagging mismatches for exception workflows.",
    specialties: [
      "BOL and freight document parsing",
      "Packing list and ASN extraction",
      "Commercial invoice and customs support fields",
      "Proof of delivery and delivery-order capture",
      "Freight quotations, rate sheets, and accessorial line items",
      "Multi-leg and consolidated shipment batches",
      "Exception and discrepancy highlighting for ops review",
    ],
    keywords: [
      "eagle",
      "logistics",
      "freight",
      "BOL",
      "bill of lading",
      "packing list",
      "ASN",
      "customs",
      "commercial invoice",
      "POD",
      "proof of delivery",
      "TMS",
      "WMS",
      "3PL",
      "carrier",
      "shipment",
      "document extraction",
      "freight quote",
      "rate sheet",
      "supply chain",
    ],
  },
];
