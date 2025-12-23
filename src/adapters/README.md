# Agent Adapters

This directory contains the agent abstraction layer that enables claude-mem to work with any AI coding agent that supports hooks.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AGENT LAYER                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ Claude Code │  │  OpenCode   │  │   Cursor    │  ...     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘          │
└─────────┼────────────────┼────────────────┼─────────────────┘
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                   ADAPTER LAYER                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ClaudeAdapter│  │OpenCodeAdapt│  │CursorAdapter│  ...     │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│                          │                                   │
│                          ▼                                   │
│              ┌───────────────────────┐                       │
│              │   Generic Interfaces   │                      │
│              │  • GenericSessionData │                       │
│              │  • GenericObservation │                       │
│              │  • GenericMessage     │                       │
│              └───────────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   WORKER SERVICE (unchanged)                 │
│  HTTP API → SessionManager → SQLite + Chroma                │
└─────────────────────────────────────────────────────────────┘
```

## Creating a New Adapter

### Step 1: Create the Adapter File

Create a new file in `src/adapters/agents/` (e.g., `cursor.ts`):

```typescript
import type {
  AgentAdapter,
  AgentConfig,
  GenericSessionData,
  GenericObservationData,
  // ... other types
} from '../types.js';

const CURSOR_CONFIG: AgentConfig = {
  id: 'cursor',
  name: 'Cursor',
  paths: {
    configDir: join(homedir(), '.cursor'),
    dataDir: join(homedir(), '.cursor-mem'),
  },
  env: {
    pluginRootVar: 'CURSOR_PLUGIN_ROOT',
  },
  hookEvents: {
    'session.start': 'onSessionStart',
    'tool.after': 'onToolComplete',
    // ... map generic events to Cursor's event names
  },
  exitCodes: {
    success: 0,
    failure: 1,
  },
  defaults: {
    skipTools: [],
    settingsPrefix: 'CURSOR_MEM_',
    workerPort: 37777,
  },
};

export class CursorAdapter implements AgentAdapter {
  readonly config = CURSOR_CONFIG;

  parseSessionInput(raw: string): GenericSessionData {
    // Transform Cursor's input format to generic format
    const input = JSON.parse(raw);
    return {
      sessionId: input.session_id,
      projectName: input.project,
      workingDir: input.cwd,
    };
  }

  // ... implement all AgentAdapter methods
}

export function detectCursor(): boolean {
  return !!process.env.CURSOR_PLUGIN_ROOT;
}

export function createCursorAdapter(): AgentAdapter {
  return new CursorAdapter();
}
```

### Step 2: Register the Adapter

In `src/adapters/registry.ts`, add:

```typescript
import { detectCursor, createCursorAdapter } from './agents/cursor.js';

// Register with priority (higher = checked first)
registerAdapter('cursor', 80, detectCursor, createCursorAdapter);
```

### Step 3: Export the Adapter

In `src/adapters/index.ts`, add:

```typescript
export { CursorAdapter, detectCursor, createCursorAdapter } from './agents/cursor.js';
```

## Key Interfaces

### AgentAdapter

The main interface that adapters must implement:

| Method | Purpose |
|--------|---------|
| `parseSessionInput(raw)` | Transform agent's session data to generic format |
| `parseObservationInput(raw)` | Transform tool execution data to generic format |
| `parseSummaryInput(raw)` | Transform summary request to generic format |
| `parsePromptInput(raw)` | Transform user prompt data to generic format |
| `formatHookOutput(event, response)` | Format generic response for agent |
| `getExitCode(status)` | Get agent-specific exit code |
| `parseTranscript(path)` | Parse conversation transcript |
| `getLastMessage(path, role)` | Extract last message from transcript |
| `getPaths()` | Get resolved path configuration |
| `getProjectName(dir)` | Extract project name from directory |
| `shouldSkipTool(name)` | Check if tool should be skipped |

### AgentConfig

Configuration object defining agent-specific settings:

```typescript
interface AgentConfig {
  id: string;           // Unique identifier
  name: string;         // Human-readable name
  paths: AgentPaths;    // Directory paths
  env: AgentEnvVars;    // Environment variable names
  hookEvents: HookEventMapping;  // Event name mappings
  exitCodes: AgentExitCodes;     // Exit code definitions
  defaults: AgentDefaults;       // Default settings
}
```

### Generic Event Types

| Generic Event | Description |
|---------------|-------------|
| `session.start` | Session/conversation begins |
| `session.end` | Session/conversation ends |
| `user.prompt` | User submits a new prompt |
| `tool.before` | Before tool/function execution |
| `tool.after` | After tool execution (main observation) |
| `agent.stop` | Agent pauses/stops |
| `context.inject` | Context injection opportunity |

## Detection Priority

Adapters are checked in priority order (highest first). Default priorities:

| Agent | Priority |
|-------|----------|
| Claude Code | 100 |
| OpenCode | 90 |

If no adapter detects its environment, Claude Code is used as the fallback.

## Testing Your Adapter

```typescript
import { registerAdapter, getAdapter, clearCache } from '../adapters';
import { MyCursorAdapter, detectCursor, createCursorAdapter } from './agents/cursor';

describe('CursorAdapter', () => {
  beforeEach(() => clearCache());

  it('detects Cursor environment', () => {
    process.env.CURSOR_PLUGIN_ROOT = '/path/to/plugin';
    expect(detectCursor()).toBe(true);
  });

  it('parses session input correctly', () => {
    const adapter = createCursorAdapter();
    const result = adapter.parseSessionInput('{"session_id":"123","cwd":"/project"}');
    expect(result.sessionId).toBe('123');
  });
});
```
