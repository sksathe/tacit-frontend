export type WorkflowStepType =
    | 'extract_topics'
    | 'summarize'
    | 'extract_quotes'
    | 'generate_action_items'
    | 'create_transcript'
    | 'format_markdown'
    | 'export_pdf'
    | 'export_docx'
    | 'custom_prompt';

export interface WorkflowStep {
    id: string;
    name?: string;
    description?: string;
    type: WorkflowStepType;
    config?: Record<string, any>;
    order?: number;
}

export interface Agent {
    id: string;
    name: string;
    persona: string;
    description: string;
    status: 'Active' | 'Inactive';
    channels: string[];
    lastActive?: string;
    systemPrompt?: string;
    questions?: string[];
}

export interface Meeting {
    id: string;
    title: string;
    description: string;
    status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
    scheduledAt: string;
    agentIds: string[];
    participants?: string[];
    duration?: string;
    meetingLink?: string;
    workflowId?: string;
    summary?: string[];
}

export interface Workflow {
    id: string;
    name: string;
    description?: string;
    steps: WorkflowStep[];
    createdAt?: string;
    updatedAt?: string;
}

export interface Document {
    id: string;
    name: string;
    title: string;
    type: string;
    description?: string;
    sourceName?: string;
    createdAt: string;
    sourceId?: string;
    source?: string;
    content?: string;
    fileUrl?: string;
}

export interface KnowledgeItem {
    id: string;
    title: string;
    type: string;
    content: string;
    createdAt: string;
    createdDate?: string;
    agentName?: string;
    sourceMeetingTitle?: string;
    markdownContent?: string;
    contentSnippet?: string;
    metadata?: Record<string, any>;
}

export interface Project {
    id: string;
    name: string;
    description?: string;
    isPersonal?: boolean;
}
