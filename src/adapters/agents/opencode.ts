import { readFileSync, existsSync } from 'fs';
import { join, basename } from 'path';
import { homedir } from 'os';
import { execSync } from 'child_process';
import type {
  AgentAdapter,
  AgentConfig,
  AgentPaths,
  GenericSessionData,
  GenericObservationData,
  GenericSummaryData,
  GenericMessage,
  GenericHookEvent,
  GenericHookResponse,
} from '../types.js';

interface OpenCodeToolExecuteInput {
  tool: string;
  sessionID: string;
  callID: string;
}

interface OpenCodeToolExecuteOutput {
  args?: unknown;
  title?: string;
  output?: string;
  metadata?: unknown;
}

interface OpenCodeChatMessageInput {
  sessionID: string;
  agent?: string;
  model?: { providerID: string; modelID: string };
  messageID?: string;
}

interface OpenCodeSessionInput {
  sessionID: string;
  project?: string;
  directory?: string;
  worktree?: string;
}

const OPENCODE_CONFIG: AgentConfig = {
  id: 'opencode',
  name: 'OpenCode',
  paths: {
    configDir: process.env.XDG_CONFIG_HOME
      ? join(process.env.XDG_CONFIG_HOME, 'opencode')
      : join(homedir(), '.config', 'opencode'),
    dataDir: join(homedir(), '.opencode-mem'),
    pluginDir: join(homedir(), '.opencode', 'plugins'),
  },
  env: {
    pluginRootVar: 'OPENCODE_PLUGIN_ROOT',
    configDirVar: 'OPENCODE_CONFIG_DIR',
    dataDirVar: 'OPENCODE_MEM_DATA_DIR',
  },
  hookEvents: {
    'session.start': 'session.created',
    'session.end': 'session.deleted',
    'user.prompt': 'chat.message',
    'tool.before': 'tool.execute.before',
    'tool.after': 'tool.execute.after',
    'agent.stop': 'session.idle',
    'context.inject': 'session.created',
  },
  exitCodes: {
    success: 0,
    failure: 1,
    infoOnly: 0,
  },
  defaults: {
    skipTools: [],
    settingsPrefix: 'OPENCODE_MEM_',
    workerPort: 37777,
    model: 'claude-sonnet-4-5',
  },
};

export class OpenCodeAdapter implements AgentAdapter {
  readonly config: AgentConfig = OPENCODE_CONFIG;

  private skipToolsSet: Set<string>;

  constructor() {
    this.skipToolsSet = new Set(this.config.defaults.skipTools);
  }

  parseSessionInput(raw: string): GenericSessionData {
    const input: OpenCodeSessionInput = raw.trim() ? JSON.parse(raw) : {};
    const workingDir = input.directory || input.worktree || process.cwd();

    return {
      sessionId: input.sessionID || '',
      projectName: input.project || this.getProjectName(workingDir),
      workingDir,
      metadata: {
        worktree: input.worktree,
      },
    };
  }

  parseObservationInput(raw: string): GenericObservationData {
    const parsed = JSON.parse(raw);
    const input: OpenCodeToolExecuteInput = parsed.input || parsed;
    const output: OpenCodeToolExecuteOutput = parsed.output || {};

    return {
      sessionId: input.sessionID,
      toolName: input.tool,
      toolInput: output.args,
      toolOutput: output.output || output.metadata,
      workingDir: process.cwd(),
      callId: input.callID,
      metadata: {
        title: output.title,
      },
    };
  }

  parseSummaryInput(raw: string): GenericSummaryData {
    const input: OpenCodeSessionInput = JSON.parse(raw);

    return {
      sessionId: input.sessionID,
    };
  }

  parsePromptInput(raw: string): GenericSessionData {
    const parsed = JSON.parse(raw);
    const input: OpenCodeChatMessageInput = parsed.input || parsed;
    const output = parsed.output || {};

    return {
      sessionId: input.sessionID,
      projectName: this.getProjectName(process.cwd()),
      workingDir: process.cwd(),
      prompt: output.message?.content || '',
      metadata: {
        agent: input.agent,
        model: input.model,
        messageID: input.messageID,
      },
    };
  }

  formatHookOutput(_eventType: GenericHookEvent, response: GenericHookResponse): string {
    if (response.context) {
      return JSON.stringify({
        context: response.context,
        source: 'opencode-mem',
      });
    }

    return JSON.stringify({
      success: true,
    });
  }

  getExitCode(status: 'success' | 'failure' | 'info'): number {
    switch (status) {
      case 'success':
      case 'info':
        return this.config.exitCodes.success;
      case 'failure':
        return this.config.exitCodes.failure;
    }
  }

  supportsTranscriptParsing(): boolean {
    return true;
  }

  parseTranscript(transcriptPath: string): GenericMessage[] {
    if (!existsSync(transcriptPath)) {
      throw new Error(`Transcript file not found: ${transcriptPath}`);
    }

    const content = readFileSync(transcriptPath, 'utf-8');
    const data = JSON.parse(content);

    if (!data.messages || !Array.isArray(data.messages)) {
      return [];
    }

    return data.messages.map((msg: { role: string; content?: string; parts?: Array<{ text?: string }>; time?: { created?: number } }) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content || this.extractPartsContent(msg.parts),
      timestamp: msg.time?.created,
    }));
  }

  private extractPartsContent(parts?: Array<{ text?: string }>): string {
    if (!parts || !Array.isArray(parts)) return '';
    return parts
      .filter((p) => p.text)
      .map((p) => p.text)
      .join('\n');
  }

  getLastMessage(
    transcriptPath: string,
    role: 'user' | 'assistant',
    _stripSystemTags = false
  ): GenericMessage | null {
    const messages = this.parseTranscript(transcriptPath);
    const filtered = messages.filter((m) => m.role === role);
    return filtered.length > 0 ? filtered[filtered.length - 1] : null;
  }

  getPaths(): AgentPaths {
    const configDir = process.env[this.config.env.configDirVar!] || this.config.paths.configDir;
    const dataDir = process.env[this.config.env.dataDirVar!] || this.config.paths.dataDir;

    return {
      configDir,
      dataDir,
      pluginDir: this.config.paths.pluginDir,
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

export function detectOpenCode(): boolean {
  return (
    !!process.env.OPENCODE_PLUGIN_ROOT ||
    !!process.env.OPENCODE_CONFIG ||
    existsSync(join(homedir(), '.opencode.json')) ||
    existsSync(join(homedir(), '.config', 'opencode'))
  );
}

export function createOpenCodeAdapter(): AgentAdapter {
  return new OpenCodeAdapter();
}
