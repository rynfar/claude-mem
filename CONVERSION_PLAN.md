# opencode-mem Conversion Plan

> Converting claude-mem (Claude Code plugin) to opencode-mem (OpenCode plugin)

**Source:** https://github.com/thedotmack/claude-mem  
**Fork:** https://github.com/rynfar/claude-mem  
**Target:** OpenCode plugin with persistent memory  
**License:** AGPL-3.0 (same as original)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     KEEP AS-IS (Worker)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ SQLite+FTS5 │  │ Chroma Vec  │  │ SDK Agent (extraction)  │  │
│  │   Database  │  │   Search    │  │ + prompts.ts            │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│                         ↑                                       │
│              HTTP API (localhost:37777)                         │
└─────────────────────────────────────────────────────────────────┘
                          ↑
┌─────────────────────────────────────────────────────────────────┐
│                    REPLACE (Plugin Layer)                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  OpenCode Plugin (src/index.ts)                         │    │
│  │  • event handler (session.created/idle/deleted)         │    │
│  │  • chat.message handler (inject context)                │    │
│  │  • tool.execute.after handler (capture observations)    │    │
│  │  • config handler (register tools)                      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              ↓                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Memory Client (src/mem/client.ts)                      │    │
│  │  • HTTP calls to worker API                             │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

**Strategy:** Keep the proven worker service (SQLite, Chroma, SDK Agent) unchanged. Replace only the Claude Code hook layer with OpenCode plugin handlers.

---

## Phase 0: Project Setup

**Complexity:** Low  
**Time:** 1-2 hours

### Files to Modify

| File | Changes |
|------|---------|
| `package.json` | Rename to `opencode-mem`, update description, keywords, entrypoints |
| `README.md` | Replace Claude Code instructions with OpenCode usage |
| `.github/workflows/*` | Update artifact names, package name |

### Files to Create

| File | Purpose |
|------|---------|
| `src/index.ts` | OpenCode plugin entry point |
| `src/config/schema.ts` | Plugin configuration (Zod) |

### Files to Delete

| File | Reason |
|------|--------|
| `plugin/hooks/hooks.json` | Claude Code specific |
| `plugin/.mcp.json` | Claude Code specific |
| `plugin/hooks/*.js` | Replaced by TS plugin handlers |

### Tasks

- [ ] Rename package in `package.json` to `opencode-mem`
- [ ] Update package description and keywords
- [ ] Update README with OpenCode installation instructions
- [ ] Remove Claude Code plugin registration files
- [ ] Update CI workflows with new package name

---

## Phase 1: Core Infrastructure

**Complexity:** Medium  
**Time:** 3-4 hours

### Keep Unchanged

These files form the core worker service and should remain as-is:

```
src/services/worker-service.ts    # HTTP server (Bun/Express)
src/services/sqlite/              # Database layer (SQLite + FTS5)
src/services/worker/SDKAgent.ts   # AI extraction using Claude Agent SDK
src/sdk/prompts.ts                # Observation extraction prompts
```

### Create: Memory Client

Create a clean HTTP client layer for the OpenCode plugin to communicate with the worker:

```
src/mem/
├── client.ts       # HTTP client for worker API
├── types.ts        # Request/response types
├── worker-url.ts   # Base URL resolution from config
└── index.ts        # Barrel exports
```

#### client.ts Implementation

```typescript
import type { ObservationInput, SearchResult, ContextResponse } from "./types";

export class MemClient {
  private baseUrl: string;
  
  constructor(baseUrl = "http://127.0.0.1:37777") {
    this.baseUrl = baseUrl;
  }
  
  async injectContext(sessionId: string, project: string): Promise<string> {
    const url = `${this.baseUrl}/api/context/inject?project=${encodeURIComponent(project)}`;
    const res = await fetch(url, { 
      signal: AbortSignal.timeout(30000) 
    });
    if (!res.ok) throw new Error(`Context injection failed: ${res.status}`);
    return res.text();
  }
  
  async createSession(claudeSessionId: string, project: string): Promise<void> {
    await fetch(`${this.baseUrl}/api/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claudeSessionId, project }),
    });
  }
  
  async saveObservation(data: ObservationInput): Promise<void> {
    await fetch(`${this.baseUrl}/api/sessions/observations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }
  
  async generateSummary(sessionId: string): Promise<void> {
    await fetch(`${this.baseUrl}/api/sessions/${sessionId}/summary`, {
      method: "POST",
    });
  }
  
  async search(query: string, options?: { limit?: number; type?: string }): Promise<SearchResult[]> {
    const params = new URLSearchParams({ query });
    if (options?.limit) params.set("limit", String(options.limit));
    if (options?.type) params.set("type", options.type);
    
    const res = await fetch(`${this.baseUrl}/api/search?${params}`);
    return res.json();
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
}
```

### Tasks

- [ ] Create `src/mem/types.ts` with request/response interfaces
- [ ] Create `src/mem/client.ts` with HTTP client class
- [ ] Create `src/mem/worker-url.ts` for config-based URL resolution
- [ ] Add graceful degradation when worker is unavailable
- [ ] Add payload truncation for large tool outputs

---

## Phase 2: Hook Conversion

**Complexity:** High  
**Time:** 4-6 hours

### Hook Mapping: Claude Code → OpenCode

| Claude Code Hook | OpenCode Equivalent | Purpose |
|-----------------|---------------------|---------|
| `SessionStart` | `event: session.created` | Initialize worker session, prepare context |
| `UserPromptSubmit` | `chat.message` | Inject context on first message |
| `PostToolUse` | `tool.execute.after` | Capture tool observations |
| `Stop` | `event: session.idle` | Generate incremental summary |
| `SessionEnd` | `event: session.deleted` | Finalize summary + cleanup |

### Plugin File Structure

```
src/
├── index.ts                    # Main plugin export
├── opencode/
│   ├── handlers/
│   │   ├── session.ts          # session.created/idle/deleted handlers
│   │   ├── message.ts          # chat.message (context injection)
│   │   └── tool.ts             # tool.execute.after (observations)
│   ├── injection.ts            # Context injection logic
│   └── session-state.ts        # Session ID mapping + caching
├── mem/
│   ├── client.ts               # Worker HTTP client
│   ├── types.ts                # Type definitions
│   └── index.ts                # Exports
├── tools/
│   ├── mem-search.ts           # Search tool
│   ├── mem-timeline.ts         # Timeline tool
│   └── index.ts                # Tool exports
└── config/
    └── schema.ts               # Plugin config schema (Zod)
```

### Main Plugin Entry (src/index.ts)

```typescript
import type { Plugin } from "@opencode-ai/plugin";
import { MemClient } from "./mem/client";
import { createSessionHandler } from "./opencode/handlers/session";
import { createMessageHandler } from "./opencode/handlers/message";
import { createToolHandler } from "./opencode/handlers/tool";
import { memSearchTool, memTimelineTool } from "./tools";
import { loadConfig } from "./config/schema";

const OpenCodeMem: Plugin = async (ctx) => {
  const config = loadConfig();
  const client = new MemClient(config.workerUrl);
  
  // Check worker health on startup
  const healthy = await client.healthCheck();
  if (!healthy) {
    console.warn("[opencode-mem] Worker not available at", config.workerUrl);
  }
  
  return {
    tool: {
      mem_search: memSearchTool(client),
      mem_timeline: memTimelineTool(client),
    },
    
    event: createSessionHandler(client, ctx),
    
    "chat.message": createMessageHandler(client, ctx),
    
    "tool.execute.after": createToolHandler(client, ctx),
    
    config: async (cfg) => {
      // Could register MCP here if needed
    },
  };
};

export default OpenCodeMem;
```

### Session Handler (src/opencode/handlers/session.ts)

```typescript
import type { PluginInput } from "@opencode-ai/plugin";
import type { MemClient } from "../../mem/client";

export function createSessionHandler(client: MemClient, ctx: PluginInput) {
  return async (input: { event: { type: string; properties?: unknown } }) => {
    const { event } = input;
    const props = event.properties as Record<string, unknown> | undefined;
    
    if (event.type === "session.created") {
      const sessionInfo = props?.info as { id?: string } | undefined;
      if (sessionInfo?.id) {
        try {
          await client.createSession(sessionInfo.id, ctx.directory);
        } catch (err) {
          console.warn("[opencode-mem] Failed to create session:", err);
        }
      }
    }
    
    if (event.type === "session.idle") {
      const sessionID = props?.sessionID as string | undefined;
      if (sessionID) {
        try {
          await client.generateSummary(sessionID);
        } catch (err) {
          console.warn("[opencode-mem] Failed to generate summary:", err);
        }
      }
    }
    
    if (event.type === "session.deleted") {
      const sessionInfo = props?.info as { id?: string } | undefined;
      if (sessionInfo?.id) {
        try {
          await client.generateSummary(sessionInfo.id);
          // Could add cleanup logic here
        } catch (err) {
          console.warn("[opencode-mem] Failed to finalize session:", err);
        }
      }
    }
  };
}
```

### Message Handler (src/opencode/handlers/message.ts)

```typescript
import type { PluginInput } from "@opencode-ai/plugin";
import type { MemClient } from "../../mem/client";

// Track which sessions have had context injected
const injectedSessions = new Set<string>();

export function createMessageHandler(client: MemClient, ctx: PluginInput) {
  return async (
    input: { sessionID: string },
    output: { message: Record<string, unknown>; parts: Array<{ type: string; text?: string }> }
  ) => {
    // Only inject context on first message per session
    if (injectedSessions.has(input.sessionID)) {
      return;
    }
    
    try {
      const context = await client.injectContext(input.sessionID, ctx.directory);
      
      if (context && context.trim()) {
        // Inject context into the conversation
        // This depends on how oh-my-opencode handles message injection
        // Could use hook-message-injector or similar pattern
        console.log("[opencode-mem] Context ready for injection:", context.length, "chars");
      }
      
      injectedSessions.add(input.sessionID);
    } catch (err) {
      console.warn("[opencode-mem] Failed to inject context:", err);
      injectedSessions.add(input.sessionID); // Don't retry on failure
    }
  };
}
```

### Tool Handler (src/opencode/handlers/tool.ts)

```typescript
import type { PluginInput } from "@opencode-ai/plugin";
import type { MemClient } from "../../mem/client";

// Tools worth capturing observations for
const OBSERVABLE_TOOLS = new Set([
  "read", "write", "edit", "bash", "glob", "grep",
  "lsp_hover", "lsp_goto_definition", "lsp_find_references",
]);

export function createToolHandler(client: MemClient, ctx: PluginInput) {
  return async (
    input: { tool: string; sessionID: string; callID: string },
    output: { title: string; output: string; metadata: unknown }
  ) => {
    // Only capture observations for relevant tools
    if (!OBSERVABLE_TOOLS.has(input.tool)) {
      return;
    }
    
    try {
      await client.saveObservation({
        claudeSessionId: input.sessionID,
        tool_name: input.tool,
        tool_input: {}, // Could capture from tool.execute.before if needed
        tool_response: {
          title: output.title,
          output: truncateOutput(output.output, 10000),
          metadata: output.metadata,
        },
        cwd: ctx.directory,
      });
    } catch (err) {
      console.warn("[opencode-mem] Failed to save observation:", err);
    }
  };
}

function truncateOutput(output: string, maxLength: number): string {
  if (output.length <= maxLength) return output;
  return output.slice(0, maxLength) + "\n...[truncated]";
}
```

### Key Challenge: Context Injection Timing

Claude Code injects context at `SessionStart` before any model interaction. OpenCode doesn't have this pre-model injection capability.

**Solution:** Inject on first `chat.message` using the hook-message-injector pattern from oh-my-opencode, or prepend context to the system message.

### Tasks

- [ ] Create session handler for lifecycle events
- [ ] Create message handler with first-message context injection
- [ ] Create tool handler for observation capture
- [ ] Implement session ID mapping (OpenCode ID → Worker ID)
- [ ] Add context injection mechanism (study oh-my-opencode patterns)
- [ ] Handle graceful degradation when worker unavailable

---

## Phase 3: Tools Integration

**Complexity:** Medium  
**Time:** 2-3 hours

### Native OpenCode Tools

Convert the MCP-based mem-search to native OpenCode tools for better integration.

#### mem_search Tool (src/tools/mem-search.ts)

```typescript
import { tool } from "@opencode-ai/plugin/tool";
import { z } from "zod";
import type { MemClient } from "../mem/client";

export const memSearchTool = (client: MemClient) => tool({
  description: `Search persistent memory for past observations, decisions, and learnings from previous sessions.
  
Use when:
- User asks "did we already solve this?"
- User asks "how did we do X last time?"
- User needs context from previous sessions
- Looking for past decisions or implementations`,
  
  args: z.object({
    query: z.string().describe("Natural language search query"),
    limit: z.number().optional().default(10).describe("Maximum results to return"),
    type: z.enum(["bugfix", "feature", "refactor", "change", "discovery", "decision"])
      .optional()
      .describe("Filter by observation type"),
  }),
  
  execute: async ({ query, limit, type }) => {
    try {
      const results = await client.search(query, { limit, type });
      
      if (results.length === 0) {
        return "No memories found matching your query.";
      }
      
      return formatSearchResults(results);
    } catch (err) {
      return `Memory search failed: ${err instanceof Error ? err.message : "Unknown error"}`;
    }
  },
});

function formatSearchResults(results: SearchResult[]): string {
  return results.map((r, i) => `
### ${i + 1}. ${r.title} [${r.type}]
**${r.subtitle}**
- Files: ${r.files?.join(", ") || "none"}
- Date: ${r.timestamp}
- ID: ${r.id}
`).join("\n");
}
```

#### mem_timeline Tool (src/tools/mem-timeline.ts)

```typescript
import { tool } from "@opencode-ai/plugin/tool";
import { z } from "zod";
import type { MemClient } from "../mem/client";

export const memTimelineTool = (client: MemClient) => tool({
  description: "Get a timeline of memories around a specific point or search result",
  
  args: z.object({
    observationId: z.string().optional().describe("Get context around this observation ID"),
    query: z.string().optional().describe("Search and get timeline around best match"),
    window: z.number().optional().default(5).describe("Number of items before/after"),
  }),
  
  execute: async ({ observationId, query, window }) => {
    // Implementation depends on worker API
    // ...
  },
});
```

### Additional Tools to Consider

| Tool | Purpose |
|------|---------|
| `mem_search` | Search observations by query |
| `mem_timeline` | Get context around a point in time |
| `mem_remember` | Force-save a specific memory |
| `mem_status` | Check worker health and stats |
| `mem_recent` | Get recent session context |

### Tasks

- [ ] Create `mem_search` tool with query, limit, type params
- [ ] Create `mem_timeline` tool for contextual retrieval
- [ ] Create `mem_status` tool for debugging
- [ ] Format search results for readability
- [ ] Add tool descriptions that help the model know when to use them

---

## Phase 4: Testing & Polish

**Complexity:** Medium  
**Time:** 2-3 hours

### Test Scenarios

#### Worker Connectivity
- [ ] Worker down → plugin degrades gracefully (no crashes)
- [ ] Worker up → session created successfully
- [ ] Worker restarts → plugin reconnects

#### Session Lifecycle
- [ ] `session.created` triggers worker session init
- [ ] `session.idle` generates incremental summary
- [ ] `session.deleted` finalizes and cleans up
- [ ] `session.error` doesn't wedge future sessions

#### Context Injection
- [ ] First user message gets memory context
- [ ] Subsequent messages don't duplicate context
- [ ] Large context is truncated appropriately

#### Tool Observation Capture
- [ ] `tool.execute.after` saves observations
- [ ] Large tool outputs are truncated
- [ ] Non-observable tools are skipped

#### Search Tool
- [ ] Returns relevant results
- [ ] Empty results handled gracefully
- [ ] Type filtering works

### Configuration Schema (src/config/schema.ts)

```typescript
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

export const OpenCodeMemConfigSchema = z.object({
  // Worker connection
  workerUrl: z.string().default("http://127.0.0.1:37777"),
  workerTimeout: z.number().default(30000),
  
  // Context injection
  contextMaxTokens: z.number().default(50),
  injectOnFirstMessage: z.boolean().default(true),
  
  // Observation capture
  toolOutputMaxChars: z.number().default(10000),
  observableTools: z.array(z.string()).optional(),
  
  // Summary generation
  summaryOnIdle: z.boolean().default(true),
  summaryOnDelete: z.boolean().default(true),
  
  // Feature flags
  enabled: z.boolean().default(true),
  debug: z.boolean().default(false),
});

export type OpenCodeMemConfig = z.infer<typeof OpenCodeMemConfigSchema>;

export function loadConfig(): OpenCodeMemConfig {
  // Load from ~/.config/opencode/opencode-mem.json or project config
  const userConfigPath = path.join(
    process.env.HOME || "",
    ".config/opencode/opencode-mem.json"
  );
  
  try {
    if (fs.existsSync(userConfigPath)) {
      const content = JSON.parse(fs.readFileSync(userConfigPath, "utf-8"));
      return OpenCodeMemConfigSchema.parse(content);
    }
  } catch (err) {
    console.warn("[opencode-mem] Failed to load config:", err);
  }
  
  return OpenCodeMemConfigSchema.parse({});
}
```

### Documentation Updates

#### README.md Sections
- [ ] Installation (OpenCode plugin + worker)
- [ ] Quick start guide
- [ ] Configuration options table
- [ ] Troubleshooting (port conflicts, worker not running)
- [ ] Migration from claude-mem (if applicable)

### Publishing Checklist
- [ ] Update package name to `opencode-mem`
- [ ] Update all entrypoints in package.json
- [ ] Ensure `bun run build` produces clean output
- [ ] Update CI to publish under new name
- [ ] Add OpenCode-specific keywords for discoverability

---

## Effort Summary

| Phase | Complexity | Estimated Time |
|-------|------------|----------------|
| Phase 0: Project Setup | Low | 1-2 hours |
| Phase 1: Core Infrastructure | Medium | 3-4 hours |
| Phase 2: Hook Conversion | High | 4-6 hours |
| Phase 3: Tools Integration | Medium | 2-3 hours |
| Phase 4: Testing & Polish | Medium | 2-3 hours |
| **Total** | | **12-18 hours** |

---

## Risk Mitigation

### Context Injection Timing
**Risk:** OpenCode may not support pre-model context injection like Claude Code's SessionStart.
**Mitigation:** Inject on first `chat.message`. Test different injection mechanisms (hook-message-injector, system message prepend).

### Worker Process Management
**Risk:** Users need to run worker separately.
**Mitigation:** Document clearly. Consider auto-start option in future version.

### Payload Size
**Risk:** Large tool outputs could overwhelm the worker/database.
**Mitigation:** Implement truncation in tool handler. Make limits configurable.

### Session Identity Mapping
**Risk:** OpenCode session IDs may differ from what worker expects.
**Mitigation:** Use OpenCode session ID directly, or maintain a mapping layer.

---

## Future Enhancements

After initial release, consider:

1. **Auto-start worker** - Spawn worker process from plugin if not running
2. **Web UI integration** - Link to localhost:37777 viewer from OpenCode
3. **Cross-project memory** - Share memories across projects (opt-in)
4. **Memory pruning** - Auto-cleanup old observations
5. **Export/import** - Backup and restore memories
6. **oh-my-opencode integration** - Optional tight integration as a hook

---

## References

- [claude-mem repository](https://github.com/thedotmack/claude-mem)
- [OpenCode plugin documentation](https://opencode.ai/docs)
- [oh-my-opencode patterns](https://github.com/code-yeongyu/oh-my-opencode)

---

*Plan created: December 2024*
*Last updated: December 2024*
