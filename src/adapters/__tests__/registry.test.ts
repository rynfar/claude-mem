import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import {
  registerAdapter,
  unregisterAdapter,
  getAdapter,
  detectAgent,
  getRegisteredAdapters,
  clearCache,
  forceAdapter,
} from '../registry.js';
import { ClaudeAdapter, createClaudeAdapter, detectClaude } from '../agents/claude.js';
import { OpenCodeAdapter, createOpenCodeAdapter, detectOpenCode } from '../agents/opencode.js';
import type { AgentAdapter, AgentConfig } from '../types.js';

const ENV_KEYS_TO_MANAGE = [
  'CLAUDE_PLUGIN_ROOT',
  'OPENCODE_PLUGIN_ROOT',
  'CLAUDE_MEM_AGENT',
] as const;

function saveEnvKeys(): Record<string, string | undefined> {
  const saved: Record<string, string | undefined> = {};
  for (const key of ENV_KEYS_TO_MANAGE) {
    saved[key] = process.env[key];
  }
  return saved;
}

function restoreEnvKeys(saved: Record<string, string | undefined>): void {
  for (const key of ENV_KEYS_TO_MANAGE) {
    if (saved[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = saved[key];
    }
  }
}

function clearDetectionEnvVars(): void {
  for (const key of ENV_KEYS_TO_MANAGE) {
    delete process.env[key];
  }
}

describe('Adapter Registry', () => {
  let savedEnv: Record<string, string | undefined>;

  beforeEach(() => {
    savedEnv = saveEnvKeys();
    clearDetectionEnvVars();
    clearCache();
  });

  afterEach(() => {
    clearCache();
    restoreEnvKeys(savedEnv);
  });

  describe('getRegisteredAdapters', () => {
    it('should return Claude and OpenCode adapters by default', () => {
      const adapters = getRegisteredAdapters();
      const ids = adapters.map((a) => a.id);
      expect(ids).toContain('claude-code');
      expect(ids).toContain('opencode');
    });

    it('should sort adapters by priority (highest first)', () => {
      const adapters = getRegisteredAdapters();
      expect(adapters[0].id).toBe('claude-code');
      expect(adapters[0].priority).toBe(100);
      expect(adapters[1].id).toBe('opencode');
      expect(adapters[1].priority).toBe(90);
    });
  });

  describe('detectAgent', () => {
    it('should detect Claude Code when CLAUDE_PLUGIN_ROOT is set', () => {
      process.env.CLAUDE_PLUGIN_ROOT = '/some/path';
      clearCache();
      expect(detectAgent()).toBe('claude-code');
    });

    it('should detect OpenCode when OPENCODE_PLUGIN_ROOT is set', () => {
      process.env.OPENCODE_PLUGIN_ROOT = '/some/path';
      clearCache();
      expect(detectAgent()).toBe('opencode');
    });

    it('should fall back to claude-code when no agent is detected', () => {
      clearCache();
      expect(detectAgent()).toBe('claude-code');
    });

    it('should cache detection result', () => {
      const first = detectAgent();
      process.env.OPENCODE_PLUGIN_ROOT = '/some/path';
      const second = detectAgent();
      expect(first).toBe(second);
    });

    it('should prefer Claude when both are detected (higher priority)', () => {
      process.env.CLAUDE_PLUGIN_ROOT = '/claude/path';
      process.env.OPENCODE_PLUGIN_ROOT = '/opencode/path';
      clearCache();
      expect(detectAgent()).toBe('claude-code');
    });

    it('should respect explicit CLAUDE_MEM_AGENT override', () => {
      process.env.CLAUDE_MEM_AGENT = 'opencode';
      clearCache();
      expect(detectAgent()).toBe('opencode');
    });

    it('should ignore invalid CLAUDE_MEM_AGENT values', () => {
      process.env.CLAUDE_MEM_AGENT = 'nonexistent-agent';
      clearCache();
      expect(detectAgent()).toBe('claude-code');
    });
  });

  describe('detectClaude', () => {
    it('should return true when CLAUDE_PLUGIN_ROOT is set', () => {
      process.env.CLAUDE_PLUGIN_ROOT = '/some/path';
      expect(detectClaude()).toBe(true);
    });

    it('should return false when no env vars are set', () => {
      expect(detectClaude()).toBe(false);
    });
  });

  describe('detectOpenCode', () => {
    it('should return true when OPENCODE_PLUGIN_ROOT is set', () => {
      process.env.OPENCODE_PLUGIN_ROOT = '/some/path';
      expect(detectOpenCode()).toBe(true);
    });

    it('should return false when no env vars are set', () => {
      expect(detectOpenCode()).toBe(false);
    });
  });

  describe('getAdapter', () => {
    it('should return ClaudeAdapter for claude-code', () => {
      const adapter = getAdapter('claude-code');
      expect(adapter).toBeInstanceOf(ClaudeAdapter);
      expect(adapter.config.id).toBe('claude-code');
    });

    it('should return OpenCodeAdapter for opencode', () => {
      const adapter = getAdapter('opencode');
      expect(adapter).toBeInstanceOf(OpenCodeAdapter);
      expect(adapter.config.id).toBe('opencode');
    });

    it('should auto-detect adapter when no id provided', () => {
      process.env.OPENCODE_PLUGIN_ROOT = '/some/path';
      clearCache();
      const adapter = getAdapter();
      expect(adapter).toBeInstanceOf(OpenCodeAdapter);
    });

    it('should cache adapter instance', () => {
      const first = getAdapter('claude-code');
      const second = getAdapter('claude-code');
      expect(first).toBe(second);
    });

    it('should fall back to ClaudeAdapter for unknown agent', () => {
      const adapter = getAdapter('unknown-agent');
      expect(adapter).toBeInstanceOf(ClaudeAdapter);
    });
  });

  describe('registerAdapter', () => {
    it('should allow registering a custom adapter', () => {
      const mockConfig: AgentConfig = {
        id: 'test-agent',
        name: 'Test Agent',
        paths: { configDir: '/test', dataDir: '/test' },
        env: {},
        hookEvents: {},
        exitCodes: { success: 0, failure: 1 },
        defaults: { skipTools: [], settingsPrefix: 'TEST_', workerPort: 37777 },
      };

      const mockAdapter: AgentAdapter = {
        config: mockConfig,
        parseSessionInput: () => ({ sessionId: '', projectName: '', workingDir: '' }),
        parseObservationInput: () => ({
          sessionId: '',
          toolName: '',
          toolInput: {},
          toolOutput: {},
          workingDir: '',
        }),
        parseSummaryInput: () => ({ sessionId: '' }),
        parsePromptInput: () => ({ sessionId: '', projectName: '', workingDir: '' }),
        parseSessionEndInput: () => ({ sessionId: '', reason: 'exit' }),
        formatHookOutput: () => '',
        getExitCode: () => 0,
        supportsTranscriptParsing: () => false,
        parseTranscript: () => [],
        getLastMessage: () => null,
        getPaths: () => mockConfig.paths,
        getProjectName: () => 'test',
        shouldSkipTool: () => false,
        getSkippedTools: () => [],
        getSettingsPrefix: () => 'TEST_',
        getDefaultWorkerPort: () => 37777,
      };

      registerAdapter('test-agent', 50, () => true, () => mockAdapter);

      const adapters = getRegisteredAdapters();
      expect(adapters.some((a) => a.id === 'test-agent')).toBe(true);

      clearCache();
      const adapter = getAdapter('test-agent');
      expect(adapter.config.id).toBe('test-agent');

      unregisterAdapter('test-agent');
    });

    it('should update existing adapter if registered again', () => {
      const adapters1 = getRegisteredAdapters();
      const claudePriority = adapters1.find((a) => a.id === 'claude-code')?.priority;

      registerAdapter('claude-code', 50, () => true, () => new ClaudeAdapter());

      const adapters2 = getRegisteredAdapters();
      const newClaudePriority = adapters2.find((a) => a.id === 'claude-code')?.priority;

      expect(newClaudePriority).toBe(50);

      registerAdapter('claude-code', 100, detectClaude, createClaudeAdapter);
    });
  });

  describe('unregisterAdapter', () => {
    it('should remove an adapter from the registry', () => {
      registerAdapter('temp-agent', 10, () => false, () => new ClaudeAdapter());
      expect(getRegisteredAdapters().some((a) => a.id === 'temp-agent')).toBe(true);

      const result = unregisterAdapter('temp-agent');
      expect(result).toBe(true);
      expect(getRegisteredAdapters().some((a) => a.id === 'temp-agent')).toBe(false);
    });

    it('should return false when unregistering non-existent adapter', () => {
      const result = unregisterAdapter('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('forceAdapter', () => {
    it('should override auto-detection with forced adapter', () => {
      const openCodeAdapter = new OpenCodeAdapter();
      forceAdapter(openCodeAdapter);

      const adapter = getAdapter();
      expect(adapter).toBe(openCodeAdapter);
      expect(adapter.config.id).toBe('opencode');
    });
  });

  describe('clearCache', () => {
    it('should clear cached adapter and detection', () => {
      const first = getAdapter('claude-code');
      clearCache();
      const second = getAdapter('claude-code');
      expect(first).not.toBe(second);
    });
  });
});
