import type {
  ObservationInput,
  SessionInitInput,
  SessionInitResponse,
  SearchOptions,
  SearchResult,
  TimelineOptions,
  ContextResponse,
  HealthResponse,
} from "./types.js";

export class MemClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl = "http://127.0.0.1:37777", timeout = 30000) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/health`, {
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async injectContext(project: string): Promise<ContextResponse | null> {
    try {
      const url = `${this.baseUrl}/api/context/inject?project=${encodeURIComponent(project)}`;
      const res = await fetch(url, {
        signal: AbortSignal.timeout(this.timeout),
      });
      if (!res.ok) return null;
      const text = await res.text();
      if (!text) return null;
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  async initSession(input: SessionInitInput): Promise<SessionInitResponse | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/sessions/init`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(this.timeout),
      });
      if (!res.ok) return null;
      const text = await res.text();
      if (!text) return null;
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  async saveObservation(data: ObservationInput): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/sessions/observations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(this.timeout),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async generateSummary(claudeSessionId: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/sessions/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claudeSessionId }),
        signal: AbortSignal.timeout(this.timeout),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async completeSession(claudeSessionId: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/sessions/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claudeSessionId }),
        signal: AbortSignal.timeout(this.timeout),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    try {
      const params = new URLSearchParams({ query });
      if (options?.limit) params.set("limit", String(options.limit));
      if (options?.type) params.set("type", options.type);
      if (options?.project) params.set("project", options.project);

      const res = await fetch(`${this.baseUrl}/api/search?${params}`, {
        signal: AbortSignal.timeout(this.timeout),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.results || [];
    } catch {
      return [];
    }
  }

  async timeline(options: TimelineOptions): Promise<SearchResult[]> {
    try {
      const params = new URLSearchParams();
      if (options.anchor) params.set("anchor", String(options.anchor));
      if (options.query) params.set("query", options.query);
      if (options.window) params.set("window", String(options.window));
      if (options.project) params.set("project", options.project);

      const res = await fetch(`${this.baseUrl}/api/timeline?${params}`, {
        signal: AbortSignal.timeout(this.timeout),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.results || [];
    } catch {
      return [];
    }
  }
}
