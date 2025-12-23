import { readFileSync, existsSync } from 'fs';
import { join, basename } from 'path';
import { homedir } from 'os';
import { execSync } from 'child_process';
import type {
  AgentAdapter,
  AgentConfig,
  AgentPaths,
  GenericSessionData,
  GenericSessionEndData,
  GenericObservationData,
  GenericSummaryData,
  GenericMessage,
  GenericHookEvent,
  GenericHookResponse,
} from '../types.js';

interface ClaudeSessionStartInput {
  session_id: string;
  transcript_path: string;
  cwd: string;
  hook_event_name?: string;
}

interface ClaudePostToolUseInput {
  session_id: string;
  cwd: string;
  tool_name: string;
  tool_input: unknown;
  tool_response: unknown;
}

interface ClaudeStopInput {
  session_id: string;
  cwd: string;
  transcript_path: string;
}

interface ClaudeUserPromptInput {
  session_id: string;
  cwd: string;
  prompt: string;
}

interface ClaudeSessionEndInput {
  session_id: string;
  reason: 'exit' | 'clear' | 'logout' | 'prompt_input_exit' | 'other';
}

const CLAUDE_CONFIG: AgentConfig = {
  id: 'claude-code',
  name: 'Claude Code',
  paths: {
    configDir: process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude'),
    dataDir: join(homedir(), '.claude-mem'),
    pluginDir: join(homedir(), '.claude', 'plugins'),
    marketplaceDir: join(homedir(), '.claude', 'plugins', 'marketplaces', 'thedotmack'),
  },
  env: {
    pluginRootVar: 'CLAUDE_PLUGIN_ROOT',
    configDirVar: 'CLAUDE_CONFIG_DIR',
    dataDirVar: 'CLAUDE_MEM_DATA_DIR',
  },
  hookEvents: {
    'session.start': 'SessionStart',
    'session.end': 'SessionEnd',
    'user.prompt': 'UserPromptSubmit',
    'tool.after': 'PostToolUse',
    'agent.stop': 'Stop',
    'context.inject': 'SessionStart',
  },
  exitCodes: {
    success: 0,
    failure: 1,
    infoOnly: 3,
  },
  defaults: {
    skipTools: [
      'ListMcpResourcesTool',
      'SlashCommand',
      'Skill',
      'TodoWrite',
      'AskUserQuestion',
    ],
    settingsPrefix: 'CLAUDE_MEM_',
    workerPort: 37777,
    model: 'claude-sonnet-4-5',
  },
};

export class ClaudeAdapter implements AgentAdapter {
  readonly config: AgentConfig = CLAUDE_CONFIG;

  private skipToolsSet: Set<string>;

  constructor() {
    this.skipToolsSet = new Set(this.config.defaults.skipTools);
  }

  parseSessionInput(raw: string): GenericSessionData {
    try {
      const input: ClaudeSessionStartInput = raw.trim() ? JSON.parse(raw) : {};

      return {
        sessionId: input.session_id || '',
        projectName: this.getProjectName(input.cwd || process.cwd()),
        workingDir: input.cwd || process.cwd(),
        transcriptPath: input.transcript_path,
        metadata: {
          hookEventName: input.hook_event_name,
        },
      };
    } catch {
      return {
        sessionId: '',
        projectName: this.getProjectName(process.cwd()),
        workingDir: process.cwd(),
      };
    }
  }

  parseObservationInput(raw: string): GenericObservationData {
    try {
      const input: ClaudePostToolUseInput = JSON.parse(raw);

      return {
        sessionId: input.session_id || '',
        toolName: input.tool_name || 'unknown',
        toolInput: input.tool_input,
        toolOutput: input.tool_response,
        workingDir: input.cwd || process.cwd(),
      };
    } catch {
      return {
        sessionId: '',
        toolName: 'unknown',
        toolInput: {},
        toolOutput: {},
        workingDir: process.cwd(),
      };
    }
  }

  parseSummaryInput(raw: string): GenericSummaryData {
    try {
      const input: ClaudeStopInput = JSON.parse(raw);

      const result: GenericSummaryData = {
        sessionId: input.session_id || '',
        transcriptPath: input.transcript_path,
      };

      if (input.transcript_path) {
        const lastUser = this.getLastMessage(input.transcript_path, 'user');
        const lastAssistant = this.getLastMessage(input.transcript_path, 'assistant', true);

        if (lastUser) result.lastUserMessage = lastUser.content;
        if (lastAssistant) result.lastAssistantMessage = lastAssistant.content;
      }

      return result;
    } catch {
      return {
        sessionId: '',
      };
    }
  }

  parsePromptInput(raw: string): GenericSessionData {
    try {
      const input: ClaudeUserPromptInput = JSON.parse(raw);

      return {
        sessionId: input.session_id || '',
        projectName: this.getProjectName(input.cwd || process.cwd()),
        workingDir: input.cwd || process.cwd(),
        prompt: input.prompt,
      };
    } catch {
      return {
        sessionId: '',
        projectName: this.getProjectName(process.cwd()),
        workingDir: process.cwd(),
      };
    }
  }

  parseSessionEndInput(raw: string): GenericSessionEndData {
    try {
      const input: ClaudeSessionEndInput = JSON.parse(raw);

      return {
        sessionId: input.session_id || '',
        reason: input.reason || 'other',
      };
    } catch {
      return {
        sessionId: '',
        reason: 'other',
      };
    }
  }

  formatHookOutput(eventType: GenericHookEvent, response: GenericHookResponse): string {
    if (eventType === 'context.inject' && response.context) {
      return JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'SessionStart',
          additionalContext: response.context,
        },
      });
    }

    return JSON.stringify({
      continue: response.continue ?? true,
      suppressOutput: response.suppressOutput ?? true,
    });
  }

  getExitCode(status: 'success' | 'failure' | 'info'): number {
    switch (status) {
      case 'success':
        return this.config.exitCodes.success;
      case 'failure':
        return this.config.exitCodes.failure;
      case 'info':
        return this.config.exitCodes.infoOnly ?? 3;
    }
  }

  supportsTranscriptParsing(): boolean {
    return true;
  }

  parseTranscript(transcriptPath: string): GenericMessage[] {
    if (!existsSync(transcriptPath)) {
      throw new Error(`Transcript file not found: ${transcriptPath}`);
    }

    const content = readFileSync(transcriptPath, 'utf-8').trim();
    if (!content) {
      return [];
    }

    const lines = content.split('\n');
    const messages: GenericMessage[] = [];

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        if (parsed.type === 'user' || parsed.type === 'assistant') {
          messages.push({
            role: parsed.type,
            content: this.extractMessageContent(parsed.message?.content),
            timestamp: parsed.timestamp,
            metadata: parsed,
          });
        }
      } catch {
        // Skip malformed lines
      }
    }

    return messages;
  }

  getLastMessage(
    transcriptPath: string,
    role: 'user' | 'assistant',
    stripSystemTags = false
  ): GenericMessage | null {
    if (!existsSync(transcriptPath)) {
      return null;
    }

    const content = readFileSync(transcriptPath, 'utf-8').trim();
    if (!content) {
      return null;
    }

    const lines = content.split('\n');

    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const parsed = JSON.parse(lines[i]);
        if (parsed.type === role && parsed.message?.content) {
          let text = this.extractMessageContent(parsed.message.content);

          if (stripSystemTags) {
            text = text.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '');
            text = text.replace(/\n{3,}/g, '\n\n').trim();
          }

          return {
            role,
            content: text,
            timestamp: parsed.timestamp,
            metadata: parsed,
          };
        }
      } catch {
        // Skip malformed lines
      }
    }

    return null;
  }

  private extractMessageContent(msgContent: unknown): string {
    if (typeof msgContent === 'string') {
      return msgContent;
    }

    if (Array.isArray(msgContent)) {
      return msgContent
        .filter((c: { type?: string }) => c.type === 'text')
        .map((c: { text?: string }) => c.text || '')
        .join('\n');
    }

    return '';
  }

  getPaths(): AgentPaths {
    const configDir = process.env[this.config.env.configDirVar!] || this.config.paths.configDir;
    const dataDir = process.env[this.config.env.dataDirVar!] || this.config.paths.dataDir;

    return {
      configDir,
      dataDir,
      pluginDir: this.config.paths.pluginDir,
      marketplaceDir: this.config.paths.marketplaceDir,
    };
  }

  getProjectName(workingDir: string): string {
    try {
      const gitRoot = execSync('git rev-parse --show-toplevel', {
        cwd: workingDir,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
        windowsHide: true,
      }).trim();
      return basename(gitRoot);
    } catch {
      return basename(workingDir);
    }
  }

  shouldSkipTool(toolName: string): boolean {
    return this.skipToolsSet.has(toolName);
  }

  getSkippedTools(): string[] {
    return [...this.skipToolsSet];
  }

  getSettingsPrefix(): string {
    return this.config.defaults.settingsPrefix;
  }

  getDefaultWorkerPort(): number {
    return this.config.defaults.workerPort;
  }
}

/**
 * Detect if running under Claude Code.
 *
 * Uses ONLY runtime environment signals - no filesystem checks.
 * Directory existence indicates "installed", not "currently running".
 * Claude Code sets CLAUDE_PLUGIN_ROOT when executing hooks.
 */
export function detectClaude(): boolean {
  return !!process.env.CLAUDE_PLUGIN_ROOT;
}

export function createClaudeAdapter(): AgentAdapter {
  return new ClaudeAdapter();
}
