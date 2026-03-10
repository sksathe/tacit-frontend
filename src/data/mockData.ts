import { Agent, Meeting, Workflow, Document, Project } from "@/types";

export const agents: Agent[] = [
    {
        id: "agent_1",
        name: "SOC2 Auditor",
        persona: "Compliance Specialist",
        description: "Expert in SOC2 compliance audits, security controls, and regulatory requirements. Ensures all security practices meet industry standards.",
        status: "Active",
        channels: ["Zoom", "Teams", "Meet"],
        lastActive: "2024-01-15",
        systemPrompt: "You are a SOC2 compliance auditor with expertise in security controls and regulatory requirements.",
        questions: [
            "What security controls are currently in place?",
            "How are access controls managed?",
            "What is the incident response process?"
        ]
    },
    {
        id: "agent_2",
        name: "Product Manager",
        persona: "Product Strategy Expert",
        description: "Specializes in product strategy, roadmap planning, and feature prioritization. Helps align product decisions with business goals.",
        status: "Active",
        channels: ["Zoom", "Meet"],
        lastActive: "2024-01-14",
        systemPrompt: "You are a product manager focused on strategic planning and feature prioritization.",
        questions: [
            "What are the key user pain points?",
            "How does this feature align with our roadmap?",
            "What is the expected impact on user engagement?"
        ]
    },
    {
        id: "agent_3",
        name: "Technical Writer",
        persona: "Documentation Specialist",
        description: "Creates clear, comprehensive technical documentation. Transforms complex technical information into accessible content.",
        status: "Inactive",
        channels: ["Teams"],
        systemPrompt: "You are a technical writer who creates clear and comprehensive documentation.",
        questions: [
            "Who is the target audience for this documentation?",
            "What level of technical detail is required?",
            "What format should the documentation follow?"
        ]
    }
];

export const meetings: Meeting[] = [
    {
        id: "meeting_1",
        title: "Q4 Security Review",
        description: "Review security controls and compliance status for Q4",
        status: "Completed",
        scheduledAt: "2024-01-10T10:00:00Z",
        agentIds: ["agent_1"],
        participants: ["John Doe", "Jane Smith"],
        duration: "45 minutes",
        meetingLink: "https://zoom.us/j/123456789"
    },
    {
        id: "meeting_2",
        title: "Product Roadmap Planning",
        description: "Discuss Q1 product roadmap and feature priorities",
        status: "Scheduled",
        scheduledAt: "2024-01-20T14:00:00Z",
        agentIds: ["agent_2"],
        participants: ["Alice Johnson", "Bob Williams"],
        duration: "60 minutes",
        meetingLink: "https://meet.google.com/abc-defg-hij"
    },
    {
        id: "meeting_3",
        title: "API Documentation Review",
        description: "Review and update API documentation",
        status: "In Progress",
        scheduledAt: "2024-01-15T11:00:00Z",
        agentIds: ["agent_3"],
        participants: ["Charlie Brown"],
        duration: "30 minutes",
        meetingLink: "https://teams.microsoft.com/l/meetup-join/123"
    }
];

export const workflows: Workflow[] = [
    {
        id: "workflow_1",
        name: "Meeting Summary to PDF",
        description: "Extract topics, summarize, and export as PDF",
        steps: [
            { id: "step_1", type: "extract_topics", order: 0 },
            { id: "step_2", type: "summarize", order: 1 },
            { id: "step_3", type: "export_pdf", order: 2 }
        ],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z"
    },
    {
        id: "workflow_2",
        name: "Action Items Extraction",
        description: "Extract action items and format as markdown",
        steps: [
            { id: "step_4", type: "generate_action_items", order: 0 },
            { id: "step_5", type: "format_markdown", order: 1 }
        ],
        createdAt: "2024-01-05T00:00:00Z",
        updatedAt: "2024-01-05T00:00:00Z"
    }
];

export const documents: Document[] = [
    {
        id: "doc_1",
        name: "Q4 Security Review Summary",
        title: "Q4 Security Review Summary",
        type: "Summary",
        description: "Summary of security controls and compliance status",
        sourceName: "Q4 Security Review",
        createdAt: "2024-01-10T11:00:00Z",
        sourceId: "meeting_1",
        source: "meeting",
        content: "Summary of security controls and compliance status..."
    },
    {
        id: "doc_2",
        name: "Product Roadmap Q1 2024",
        title: "Product Roadmap Q1 2024",
        type: "Document",
        description: "Product roadmap for Q1 2024",
        sourceName: "Product Roadmap Planning",
        createdAt: "2024-01-12T10:00:00Z",
        sourceId: "meeting_2",
        source: "meeting"
    }
];

export const projects: Project[] = [
    {
        id: "project_personal",
        name: "Personal",
        description: "Personal workspace",
        isPersonal: true
    },
    {
        id: "project_work",
        name: "Work",
        description: "Work projects",
        isPersonal: false
    }
];
