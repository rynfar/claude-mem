import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { ClaudeAdapter, detectClaude } from '../agents/claude.js';

describe('ClaudeAdapter', () => {
  let adapter: ClaudeAdapter;

  beforeEach(() => {
    adapter = new ClaudeAdapter();
  });

  describe('config', () => {
    it('should have correct id', () => {
      expect(adapter.config.id).toBe('claude-code');
    });

    it('should have correct name', () => {
      expect(adapter.config.name).toBe('Claude Code');
    });

    it('should define all hook events', () => {
      expect(adapter.config.hookEvents['session.start']).toBe('SessionStart');
      expect(adapter.config.hookEvents['session.end']).toBe('SessionEnd');
      expect(adapter.config.hookEvents['user.prompt']).toBe('UserPromptSubmit');
      expect(adapter.config.hookEvents['tool.after']).toBe('PostToolUse');
      expect(adapter.config.hookEvents['agent.stop']).toBe('Stop');
      expect(adapter.config.hookEvents['context.inject']).toBe('SessionStart');
    });

    it('should define exit codes', () => {
      expect(adapter.config.exitCodes.success).toBe(0);
      expect(adapter.config.exitCodes.failure).toBe(1);
      expect(adapter.config.exitCodes.infoOnly).toBe(3);
    });
  });

  describe('parseSessionInput', () => {
    it('should parse Claude session JSON', () => {
      const input = JSON.stringify({
        session_id: 'ses_123',
        cwd: '/project/path',
        transcript_path: '/path/to/transcript.jsonl',
      });

      const result = adapter.parseSessionInput(input);
      expect(result.sessionId).toBe('ses_123');
      expect(result.workingDir).toBe('/project/path');
      expect(result.transcriptPath).toBe('/path/to/transcript.jsonl');
    });

    it('should handle empty input', () => {
      const result = adapter.parseSessionInput('');
      expect(result.sessionId).toBe('');
      expect(result.workingDir).toBe(process.cwd());
    });

    it('should handle malformed JSON gracefully', () => {
      const result = adapter.parseSessionInput('not valid json');
      expect(result.sessionId).toBe('');
      expect(result.workingDir).toBe(process.cwd());
    });
  });

  describe('parseObservationInput', () => {
    it('should parse tool execution data', () => {
      const input = JSON.stringify({
        session_id: 'ses_123',
        tool_name: 'Read',
        tool_input: { file_path: '/test.ts' },
        tool_response: 'file contents here',
        cwd: '/project',
      });

      const result = adapter.parseObservationInput(input);
      expect(result.sessionId).toBe('ses_123');
      expect(result.toolName).toBe('Read');
      expect(result.toolInput).toEqual({ file_path: '/test.ts' });
      expect(result.toolOutput).toBe('file contents here');
      expect(result.workingDir).toBe('/project');
    });

    it('should handle malformed JSON gracefully', () => {
      const result = adapter.parseObservationInput('invalid');
      expect(result.sessionId).toBe('');
      expect(result.toolName).toBe('unknown');
    });
  });

  describe('parseSummaryInput', () => {
    it('should parse summary request data', () => {
      const input = JSON.stringify({
        session_id: 'ses_123',
        transcript_path: '/path/to/transcript.jsonl',
        cwd: '/project',
      });

      const result = adapter.parseSummaryInput(input);
      expect(result.sessionId).toBe('ses_123');
      expect(result.transcriptPath).toBe('/path/to/transcript.jsonl');
    });

    it('should handle malformed JSON gracefully', () => {
      const result = adapter.parseSummaryInput('invalid');
      expect(result.sessionId).toBe('');
    });
  });

  describe('parsePromptInput', () => {
    it('should parse user prompt data', () => {
      const input = JSON.stringify({
        session_id: 'ses_123',
        prompt: 'Help me fix this bug',
        cwd: '/project',
      });

      const result = adapter.parsePromptInput(input);
      expect(result.sessionId).toBe('ses_123');
      expect(result.prompt).toBe('Help me fix this bug');
      expect(result.workingDir).toBe('/project');
    });

    it('should handle malformed JSON gracefully', () => {
      const result = adapter.parsePromptInput('invalid');
      expect(result.sessionId).toBe('');
    });
  });

  describe('parseSessionEndInput', () => {
    it('should parse session end data', () => {
      const input = JSON.stringify({
        session_id: 'ses_123',
        reason: 'exit',
      });

      const result = adapter.parseSessionEndInput(input);
      expect(result.sessionId).toBe('ses_123');
      expect(result.reason).toBe('exit');
    });

    it('should handle all valid reason types', () => {
      const reasons = ['exit', 'clear', 'logout', 'prompt_input_exit', 'other'] as const;
      for (const reason of reasons) {
        const input = JSON.stringify({ session_id: 'ses_123', reason });
        const result = adapter.parseSessionEndInput(input);
        expect(result.reason).toBe(reason);
      }
    });

    it('should handle malformed JSON gracefully', () => {
      const result = adapter.parseSessionEndInput('invalid');
      expect(result.sessionId).toBe('');
      expect(result.reason).toBe('other');
    });
  });

  describe('formatHookOutput', () => {
    it('should format context injection response', () => {
      const output = adapter.formatHookOutput('context.inject', {
        context: 'Previous session context here',
      });
      const parsed = JSON.parse(output);
      expect(parsed.hookSpecificOutput.additionalContext).toBe('Previous session context here');
      expect(parsed.hookSpecificOutput.hookEventName).toBe('SessionStart');
    });

    it('should return continue/suppress JSON for non-context events', () => {
      const output = adapter.formatHookOutput('tool.after', { continue: true });
      const parsed = JSON.parse(output);
      expect(parsed.continue).toBe(true);
      expect(parsed.suppressOutput).toBe(true);
    });
  });

  describe('getExitCode', () => {
    it('should return 0 for success', () => {
      expect(adapter.getExitCode('success')).toBe(0);
    });

    it('should return 1 for failure', () => {
      expect(adapter.getExitCode('failure')).toBe(1);
    });

    it('should return 3 for info (Claude-specific)', () => {
      expect(adapter.getExitCode('info')).toBe(3);
    });
  });

  describe('supportsTranscriptParsing', () => {
    it('should return true', () => {
      expect(adapter.supportsTranscriptParsing()).toBe(true);
    });
  });

  describe('shouldSkipTool', () => {
    it('should skip ListMcpResourcesTool by default', () => {
      expect(adapter.shouldSkipTool('ListMcpResourcesTool')).toBe(true);
    });

    it('should skip SlashCommand by default', () => {
      expect(adapter.shouldSkipTool('SlashCommand')).toBe(true);
    });

    it('should skip Skill by default', () => {
      expect(adapter.shouldSkipTool('Skill')).toBe(true);
    });

    it('should not skip Edit tool', () => {
      expect(adapter.shouldSkipTool('Edit')).toBe(false);
    });

    it('should not skip Bash tool', () => {
      expect(adapter.shouldSkipTool('Bash')).toBe(false);
    });

    it('should not skip Read tool', () => {
      expect(adapter.shouldSkipTool('Read')).toBe(false);
    });
  });

  describe('getSkippedTools', () => {
    it('should return array of skipped tools', () => {
      const skipped = adapter.getSkippedTools();
      expect(Array.isArray(skipped)).toBe(true);
      expect(skipped).toContain('ListMcpResourcesTool');
      expect(skipped).toContain('SlashCommand');
      expect(skipped).toContain('Skill');
      expect(skipped).toContain('TodoWrite');
      expect(skipped).toContain('AskUserQuestion');
    });
  });

  describe('getSettingsPrefix', () => {
    it('should return CLAUDE_MEM_', () => {
      expect(adapter.getSettingsPrefix()).toBe('CLAUDE_MEM_');
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
      expect(typeof projectName).toBe('string');
      expect(projectName.length).toBeGreaterThan(0);
    });
  });
});

describe('detectClaude', () => {
  let savedPluginRoot: string | undefined;

  beforeEach(() => {
    savedPluginRoot = process.env.CLAUDE_PLUGIN_ROOT;
    delete process.env.CLAUDE_PLUGIN_ROOT;
  });

  afterEach(() => {
    if (savedPluginRoot === undefined) {
      delete process.env.CLAUDE_PLUGIN_ROOT;
    } else {
      process.env.CLAUDE_PLUGIN_ROOT = savedPluginRoot;
    }
  });

  it('should detect when CLAUDE_PLUGIN_ROOT is set', () => {
    process.env.CLAUDE_PLUGIN_ROOT = '/some/path';
    expect(detectClaude()).toBe(true);
  });

  it('should return false when CLAUDE_PLUGIN_ROOT is not set', () => {
    delete process.env.CLAUDE_PLUGIN_ROOT;
    expect(detectClaude()).toBe(false);
  });
});
