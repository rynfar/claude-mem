export interface ObservationInput {
  claudeSessionId: string;
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_response: {
    title?: string;
    output: string;
    metadata?: unknown;
  };
  cwd: string;
}

export interface SessionInitInput {
  claudeSessionId: string;
  project: string;
  prompt: string;
}

export interface SessionInitResponse {
  sessionDbId: number;
  promptNumber: number;
  skipped: boolean;
  reason?: string;
}

export interface SearchOptions {
  limit?: number;
  type?: "decision" | "bugfix" | "feature" | "refactor" | "discovery" | "change";
  project?: string;
}

export interface SearchResult {
  id: number;
  title?: string;
  text?: string;
  type: string;
  project: string;
  created_at_epoch: number;
  source_files?: string;
  concept?: string;
}

export interface TimelineOptions {
  anchor?: number;
  query?: string;
  window?: number;
  project?: string;
}

export interface ContextResponse {
  context: string;
  observationCount: number;
  tokenEstimate?: number;
}

export interface HealthResponse {
  status: "ok" | "error";
  version?: string;
  uptime?: number;
}
