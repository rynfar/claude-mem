import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { OpenCodeAdapter, detectOpenCode } from '../agents/opencode.js';

describe('OpenCodeAdapter', () => {
  let adapter: OpenCodeAdapter;

  beforeEach(() => {
    adapter = new OpenCodeAdapter();
  });

  describe('config', () => {
    it('should have correct id', () => {
      expect(adapter.config.id).toBe('opencode');
    });

    it('should have correct name', () => {
      expect(adapter.config.name).toBe('OpenCode');
    });

    it('should define all hook events', () => {
      expect(adapter.config.hookEvents['session.start']).toBe('session.created');
      expect(adapter.config.hookEvents['session.end']).toBe('session.deleted');
      expect(adapter.config.hookEvents['user.prompt']).toBe('chat.message');
      expect(adapter.config.hookEvents['tool.before']).toBe('tool.execute.before');
      expect(adapter.config.hookEvents['tool.after']).toBe('tool.execute.after');
      expect(adapter.config.hookEvents['agent.stop']).toBe('session.idle');
    });

    it('should define exit codes', () => {
      expect(adapter.config.exitCodes.success).toBe(0);
      expect(adapter.config.exitCodes.failure).toBe(1);
    });

    it('should use XDG config path when available', () => {
      const originalXdg = process.env.XDG_CONFIG_HOME;
      process.env.XDG_CONFIG_HOME = '/custom/config';

      const testAdapter = new OpenCodeAdapter();
      expect(testAdapter.config.paths.configDir).toContain('opencode');

      if (originalXdg) {
        process.env.XDG_CONFIG_HOME = originalXdg;
      } else {
        delete process.env.XDG_CONFIG_HOME;
      }
    });
  });

  describe('parseSessionInput', () => {
    it('should parse OpenCode session JSON', () => {
      const input = JSON.stringify({
        sessionID: 'oc_123',
        project: 'my-project',
        directory: '/project/path',
        worktree: '/worktree/path',
      });

      const result = adapter.parseSessionInput(input);
      expect(result.sessionId).toBe('oc_123');
      expect(result.projectName).toBe('my-project');
      expect(result.workingDir).toBe('/project/path');
      expect(result.metadata?.worktree).toBe('/worktree/path');
    });

    it('should handle empty input', () => {
      const result = adapter.parseSessionInput('');
      expect(result.sessionId).toBe('');
      expect(result.workingDir).toBe(process.cwd());
    });

    it('should use worktree as workingDir fallback', () => {
      const input = JSON.stringify({
        sessionID: 'oc_123',
        worktree: '/worktree/path',
      });

      const result = adapter.parseSessionInput(input);
      expect(result.workingDir).toBe('/worktree/path');
    });

    it('should handle malformed JSON gracefully', () => {
      const result = adapter.parseSessionInput('not valid json');
      expect(result.sessionId).toBe('');
      expect(result.workingDir).toBe(process.cwd());
    });
  });

  describe('parseObservationInput', () => {
    it('should parse OpenCode tool execution data', () => {
      const input = JSON.stringify({
        input: {
          tool: 'bash',
          sessionID: 'oc_123',
          callID: 'call_456',
        },
        output: {
          args: { command: 'ls -la' },
          title: 'List files',
          output: 'file1.ts\nfile2.ts',
        },
      });

      const result = adapter.parseObservationInput(input);
      expect(result.sessionId).toBe('oc_123');
      expect(result.toolName).toBe('bash');
      expect(result.toolInput).toEqual({ command: 'ls -la' });
      expect(result.toolOutput).toBe('file1.ts\nfile2.ts');
      expect(result.callId).toBe('call_456');
      expect(result.metadata?.title).toBe('List files');
    });

    it('should handle flat input structure', () => {
      const input = JSON.stringify({
        tool: 'read',
        sessionID: 'oc_123',
        callID: 'call_789',
      });

      const result = adapter.parseObservationInput(input);
      expect(result.sessionId).toBe('oc_123');
      expect(result.toolName).toBe('read');
    });

    it('should handle malformed JSON gracefully', () => {
      const result = adapter.parseObservationInput('invalid');
      expect(result.sessionId).toBe('');
      expect(result.toolName).toBe('unknown');
    });
  });

  describe('parseSummaryInput', () => {
    it('should parse OpenCode summary request', () => {
      const input = JSON.stringify({
        sessionID: 'oc_123',
      });

      const result = adapter.parseSummaryInput(input);
      expect(result.sessionId).toBe('oc_123');
    });

    it('should handle malformed JSON gracefully', () => {
      const result = adapter.parseSummaryInput('invalid');
      expect(result.sessionId).toBe('');
    });
  });

  describe('parsePromptInput', () => {
    it('should parse OpenCode chat message', () => {
      const input = JSON.stringify({
        input: {
          sessionID: 'oc_123',
          agent: 'main',
          model: { providerID: 'anthropic', modelID: 'claude-4' },
          messageID: 'msg_456',
        },
        output: {
          message: { content: 'Fix the bug in auth.ts' },
        },
      });

      const result = adapter.parsePromptInput(input);
      expect(result.sessionId).toBe('oc_123');
      expect(result.prompt).toBe('Fix the bug in auth.ts');
      expect(result.metadata?.agent).toBe('main');
      expect(result.metadata?.model).toEqual({ providerID: 'anthropic', modelID: 'claude-4' });
    });

    it('should coerce non-string prompt content to JSON', () => {
      const input = JSON.stringify({
        input: { sessionID: 'oc_123' },
        output: {
          message: { content: { type: 'structured', text: 'hello' } },
        },
      });

      const result = adapter.parsePromptInput(input);
      expect(result.prompt).toContain('structured');
    });

    it('should handle malformed JSON gracefully', () => {
      const result = adapter.parsePromptInput('invalid');
      expect(result.sessionId).toBe('');
    });
  });

  describe('parseSessionEndInput', () => {
    it('should parse session end data', () => {
      const input = JSON.stringify({
        sessionID: 'oc_123',
        reason: 'exit',
      });

      const result = adapter.parseSessionEndInput(input);
      expect(result.sessionId).toBe('oc_123');
      expect(result.reason).toBe('exit');
    });

    it('should default reason to other', () => {
      const input = JSON.stringify({ sessionID: 'oc_123' });
      const result = adapter.parseSessionEndInput(input);
      expect(result.reason).toBe('other');
    });

    it('should handle malformed JSON gracefully', () => {
      const result = adapter.parseSessionEndInput('invalid');
      expect(result.sessionId).toBe('');
      expect(result.reason).toBe('other');
    });
  });

  describe('formatHookOutput', () => {
    it('should format context injection as JSON with context', () => {
      const output = adapter.formatHookOutput('context.inject', {
        context: 'Memory context here',
      });
      const parsed = JSON.parse(output);
      expect(parsed.context).toBe('Memory context here');
      expect(parsed.source).toBe('opencode-mem');
    });

    it('should return success JSON for non-context events', () => {
      const output = adapter.formatHookOutput('tool.after', { continue: true });
      const parsed = JSON.parse(output);
      expect(parsed.success).toBe(true);
    });
  });

  describe('getExitCode', () => {
    it('should return 0 for success', () => {
      expect(adapter.getExitCode('success')).toBe(0);
    });

    it('should return 1 for failure', () => {
      expect(adapter.getExitCode('failure')).toBe(1);
    });

    it('should return 0 for info', () => {
      expect(adapter.getExitCode('info')).toBe(0);
    });
  });

  describe('supportsTranscriptParsing', () => {
    it('should return true', () => {
      expect(adapter.supportsTranscriptParsing()).toBe(true);
    });
  });

  describe('shouldSkipTool', () => {
    it('should not skip any tools by default', () => {
      expect(adapter.shouldSkipTool('bash')).toBe(false);
      expect(adapter.shouldSkipTool('read')).toBe(false);
      expect(adapter.shouldSkipTool('edit')).toBe(false);
    });
  });

  describe('getSkippedTools', () => {
    it('should return empty array by default', () => {
      expect(adapter.getSkippedTools()).toEqual([]);
    });
  });

  describe('getSettingsPrefix', () => {
    it('should return OPENCODE_MEM_', () => {
      expect(adapter.getSettingsPrefix()).toBe('OPENCODE_MEM_');
    });
  });

  describe('getDefaultWorkerPort', () => {
    it('should return 37777', () => {
      expect(adapter.getDefaultWorkerPort()).toBe(37777);
    });
  });

  describe('getProjectName', () => {
    it('should extract project name from directory', () => {
      const projectName = adapter.getProjectName('/Users/test/repos/my-project');
      expect(projectName).toBe('my-project');
    });
  });
});

describe('detectOpenCode', () => {
  let savedPluginRoot: string | undefined;

  beforeEach(() => {
    savedPluginRoot = process.env.OPENCODE_PLUGIN_ROOT;
    delete process.env.OPENCODE_PLUGIN_ROOT;
  });

  afterEach(() => {
    if (savedPluginRoot === undefined) {
      delete process.env.OPENCODE_PLUGIN_ROOT;
    } else {
      process.env.OPENCODE_PLUGIN_ROOT = savedPluginRoot;
    }
  });

  it('should detect when OPENCODE_PLUGIN_ROOT is set', () => {
    process.env.OPENCODE_PLUGIN_ROOT = '/some/path';
    expect(detectOpenCode()).toBe(true);
  });

  it('should return false when OPENCODE_PLUGIN_ROOT is not set', () => {
    delete process.env.OPENCODE_PLUGIN_ROOT;
    expect(detectOpenCode()).toBe(false);
  });
});
