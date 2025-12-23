/**
 * Agent Adapter Types
 *
 * Generic interfaces for agent-agnostic memory system integration.
 * These types define the contract that all agent adapters must implement,
 * enabling claude-mem to work with any AI coding agent that supports hooks.
 *
 * Architecture:
 *   Agent Hooks → AgentAdapter → Generic Types → Worker Service
 *
 * The adapter layer transforms agent-specific formats to/from generic
 * internal formats, keeping the worker service completely agent-agnostic.
 */

// ============================================================================
// Generic Hook Events
// ============================================================================

/**
 * Generic hook event types that map to agent-specific events.
 *
 * These represent the lifecycle events that memory systems care about,
 * regardless of how the underlying agent names or triggers them.
 */
export type GenericHookEvent =
  | 'session.start'      // Session/conversation begins
  | 'session.end'        // Session/conversation ends
  | 'user.prompt'        // User submits a new prompt
  | 'tool.before'        // Before tool/function execution
  | 'tool.after'         // After tool/function execution (main observation capture)
  | 'agent.stop'         // Agent pauses/stops (summary generation)
  | 'context.inject';    // Context injection opportunity

/**
 * Mapping from generic events to agent-specific event names.
 * Agents may not support all events - missing mappings mean the event is unsupported.
 */
export type HookEventMapping = {
  [K in GenericHookEvent]?: string;
};

// ============================================================================
// Generic Data Types
// ============================================================================

/**
 * Generic session data - the core information about a session.
 * Adapters transform agent-specific session representations to this format.
 */
export interface GenericSessionData {
  /** Unique session identifier from the agent */
  sessionId: string;
  /** Project/repository name */
  projectName: string;
  /** Current working directory */
  workingDir: string;
  /** Path to transcript/conversation file (if applicable) */
  transcriptPath?: string;
  /** User's prompt text (for user.prompt events) */
  prompt?: string;
  /** Any agent-specific metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Generic observation data - represents a tool/function execution.
 * This is the primary data captured for memory.
 */
export interface GenericObservationData {
  /** Session this observation belongs to */
  sessionId: string;
  /** Name of the tool/function executed */
  toolName: string;
  /** Input arguments to the tool */
  toolInput: unknown;
  /** Output/result from the tool */
  toolOutput: unknown;
  /** Working directory at time of execution */
  workingDir: string;
  /** Optional call ID for tracking */
  callId?: string;
  /** Any agent-specific metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Generic message from a conversation transcript.
 */
export interface GenericMessage {
  /** Message role */
  role: 'user' | 'assistant' | 'system';
  /** Message content (text) */
  content: string;
  /** Timestamp (Unix seconds or milliseconds - adapter normalizes) */
  timestamp?: number;
  /** Message ID if available */
  id?: string;
  /** Any agent-specific metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Generic summary request data.
 */
export interface GenericSummaryData {
  /** Session to summarize */
  sessionId: string;
  /** Last user message (for context) */
  lastUserMessage?: string;
  /** Last assistant message (for context) */
  lastAssistantMessage?: string;
  /** Path to transcript if available */
  transcriptPath?: string;
}

/**
 * Generic session end data - for cleanup/session end events.
 */
export interface GenericSessionEndData {
  /** Session identifier */
  sessionId: string;
  /** Reason for session end */
  reason: 'exit' | 'clear' | 'logout' | 'prompt_input_exit' | 'other' | string;
}

// ============================================================================
// Agent Configuration
// ============================================================================

/**
 * Agent-specific path configuration.
 */
export interface AgentPaths {
  /** Agent's configuration directory (e.g., ~/.claude) */
  configDir: string;
  /** Memory data directory (e.g., ~/.claude-mem) */
  dataDir: string;
  /** Plugin/extension directory (if applicable) */
  pluginDir?: string;
  /** Marketplace directory for plugin distribution */
  marketplaceDir?: string;
}

/**
 * Agent-specific environment variable names.
 */
export interface AgentEnvVars {
  /** Environment variable for plugin root directory */
  pluginRootVar?: string;
  /** Environment variable for config directory override */
  configDirVar?: string;
  /** Environment variable for data directory override */
  dataDirVar?: string;
}

/**
 * Agent-specific exit codes for hook responses.
 */
export interface AgentExitCodes {
  /** Successful execution */
  success: number;
  /** Failure/error */
  failure: number;
  /** Info-only (user message, no context injection) */
  infoOnly?: number;
}

/**
 * Agent-specific default settings.
 */
export interface AgentDefaults {
  /** Tools to skip when capturing observations */
  skipTools: string[];
  /** Prefix for settings/environment variables (e.g., 'CLAUDE_MEM_') */
  settingsPrefix: string;
  /** Default worker port */
  workerPort: number;
  /** Default model for AI operations */
  model?: string;
}

/**
 * Complete agent configuration.
 */
export interface AgentConfig {
  /** Unique agent identifier (e.g., 'claude-code', 'opencode', 'cursor') */
  id: string;
  /** Human-readable agent name */
  name: string;
  /** Agent version (if detectable) */
  version?: string;
  /** Path configuration */
  paths: AgentPaths;
  /** Environment variable names */
  env: AgentEnvVars;
  /** Hook event name mappings */
  hookEvents: HookEventMapping;
  /** Exit codes */
  exitCodes: AgentExitCodes;
  /** Default settings */
  defaults: AgentDefaults;
}

// ============================================================================
// Hook I/O Types
// ============================================================================

/**
 * Standard hook response format.
 * Adapters may need to transform this to agent-specific format.
 */
export interface GenericHookResponse {
  /** Whether the agent should continue processing */
  continue?: boolean;
  /** Whether to suppress hook output from user view */
  suppressOutput?: boolean;
  /** Context to inject (for context.inject events) */
  context?: string;
  /** User-visible message */
  userMessage?: string;
}

/**
 * Hook execution result.
 */
export interface HookResult {
  /** Exit code to return */
  exitCode: number;
  /** Stdout content */
  stdout: string;
  /** Stderr content (for logging) */
  stderr?: string;
}

// ============================================================================
// Main Adapter Interface
// ============================================================================

/**
 * Main agent adapter interface.
 *
 * Implementations of this interface enable claude-mem to work with
 * different AI coding agents. Each adapter handles:
 *
 * 1. Agent detection and configuration
 * 2. Hook input/output format transformation
 * 3. Transcript/conversation parsing
 * 4. Path and settings management
 *
 * @example
 * ```typescript
 * class MyAgentAdapter implements AgentAdapter {
 *   readonly config: AgentConfig = {
 *     id: 'my-agent',
 *     name: 'My AI Agent',
 *     // ... configuration
 *   };
 *
 *   parseSessionInput(raw: string): GenericSessionData {
 *     // Transform agent-specific JSON to generic format
 *   }
 *   // ... implement other methods
 * }
 * ```
 */
export interface AgentAdapter {
  /**
   * Agent configuration.
   * Provides all agent-specific settings and mappings.
   */
  readonly config: AgentConfig;

  // --------------------------------------------------------------------------
  // Hook Input Parsing
  // --------------------------------------------------------------------------

  /**
   * Parse raw hook input into generic session data.
   * Used for session.start, session.end, context.inject events.
   *
   * @param raw - Raw stdin content (usually JSON)
   * @returns Parsed session data
   */
  parseSessionInput(raw: string): GenericSessionData;

  /**
   * Parse raw hook input into generic observation data.
   * Used for tool.before, tool.after events.
   *
   * @param raw - Raw stdin content (usually JSON)
   * @returns Parsed observation data
   */
  parseObservationInput(raw: string): GenericObservationData;

  /**
   * Parse raw hook input into generic summary request data.
   * Used for agent.stop events.
   *
   * @param raw - Raw stdin content (usually JSON)
   * @returns Parsed summary data
   */
  parseSummaryInput(raw: string): GenericSummaryData;

  /**
   * Parse raw hook input into generic prompt data.
   * Used for user.prompt events.
   *
   * @param raw - Raw stdin content (usually JSON)
   * @returns Parsed session data with prompt
   */
  parsePromptInput(raw: string): GenericSessionData;

  /**
   * Parse raw hook input into generic session end data.
   * Used for session.end events.
   *
   * @param raw - Raw stdin content (usually JSON)
   * @returns Parsed session end data
   */
  parseSessionEndInput(raw: string): GenericSessionEndData;

  // --------------------------------------------------------------------------
  // Hook Output Formatting
  // --------------------------------------------------------------------------

  /**
   * Format a generic hook response to agent-specific output.
   *
   * @param eventType - The generic event type
   * @param response - Generic response data
   * @returns Formatted string for stdout
   */
  formatHookOutput(eventType: GenericHookEvent, response: GenericHookResponse): string;

  /**
   * Get the appropriate exit code for a result status.
   *
   * @param status - Result status
   * @returns Agent-specific exit code
   */
  getExitCode(status: 'success' | 'failure' | 'info'): number;

  // --------------------------------------------------------------------------
  // Transcript Parsing
  // --------------------------------------------------------------------------

  /**
   * Check if this adapter supports transcript parsing.
   * Some agents may not have file-based transcripts.
   */
  supportsTranscriptParsing(): boolean;

  /**
   * Parse a transcript file into generic messages.
   *
   * @param transcriptPath - Path to transcript file
   * @returns Array of parsed messages
   * @throws If transcript parsing is not supported or file is invalid
   */
  parseTranscript(transcriptPath: string): GenericMessage[];

  /**
   * Extract the last message of a specific role from a transcript.
   *
   * @param transcriptPath - Path to transcript file
   * @param role - Message role to find
   * @param stripSystemTags - Whether to remove system-injected tags
   * @returns The last message, or null if not found
   */
  getLastMessage(
    transcriptPath: string,
    role: 'user' | 'assistant',
    stripSystemTags?: boolean
  ): GenericMessage | null;

  // --------------------------------------------------------------------------
  // Path Utilities
  // --------------------------------------------------------------------------

  /**
   * Get agent-specific paths, resolved with environment variable overrides.
   *
   * @returns Resolved path configuration
   */
  getPaths(): AgentPaths;

  /**
   * Get the project name from a working directory.
   *
   * @param workingDir - Working directory path
   * @returns Project name (usually git root basename or directory name)
   */
  getProjectName(workingDir: string): string;

  // --------------------------------------------------------------------------
  // Tool Filtering
  // --------------------------------------------------------------------------

  /**
   * Check if a tool should be skipped for observation capture.
   *
   * @param toolName - Name of the tool
   * @returns True if the tool should be skipped
   */
  shouldSkipTool(toolName: string): boolean;

  /**
   * Get the list of tools to skip.
   *
   * @returns Array of tool names to skip
   */
  getSkippedTools(): string[];

  // --------------------------------------------------------------------------
  // Settings
  // --------------------------------------------------------------------------

  /**
   * Get the settings prefix for this agent's environment variables.
   * E.g., 'CLAUDE_MEM_' for Claude, potentially 'OPENCODE_MEM_' for OpenCode.
   */
  getSettingsPrefix(): string;

  /**
   * Get the default worker port for this agent.
   */
  getDefaultWorkerPort(): number;
}

// ============================================================================
// Adapter Registry Types
// ============================================================================

/**
 * Function to detect if an agent is the current environment.
 * Returns true if the agent should be used.
 */
export type AgentDetector = () => boolean;

/**
 * Factory function to create an adapter instance.
 */
export type AdapterFactory = () => AgentAdapter;

/**
 * Registered adapter entry.
 */
export interface RegisteredAdapter {
  /** Agent identifier */
  id: string;
  /** Priority for detection (higher = checked first) */
  priority: number;
  /** Detection function */
  detect: AgentDetector;
  /** Factory function */
  create: AdapterFactory;
}
