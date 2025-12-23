import type { AgentAdapter, RegisteredAdapter, AdapterFactory, AgentDetector } from './types.js';
import { ClaudeAdapter, detectClaude, createClaudeAdapter } from './agents/claude.js';
import { detectOpenCode, createOpenCodeAdapter } from './agents/opencode.js';

const registeredAdapters: RegisteredAdapter[] = [];
let cachedAdapter: AgentAdapter | null = null;
let detectedAgentId: string | null = null;

export function registerAdapter(
  id: string,
  priority: number,
  detect: AgentDetector,
  create: AdapterFactory
): void {
  const existing = registeredAdapters.findIndex((a) => a.id === id);
  if (existing !== -1) {
    registeredAdapters[existing] = { id, priority, detect, create };
  } else {
    registeredAdapters.push({ id, priority, detect, create });
  }
  registeredAdapters.sort((a, b) => b.priority - a.priority);
  cachedAdapter = null;
  detectedAgentId = null;
}

export function unregisterAdapter(id: string): boolean {
  const index = registeredAdapters.findIndex((a) => a.id === id);
  if (index !== -1) {
    registeredAdapters.splice(index, 1);
    if (detectedAgentId === id) {
      cachedAdapter = null;
      detectedAgentId = null;
    }
    return true;
  }
  return false;
}

export function detectAgent(): string {
  if (detectedAgentId) {
    return detectedAgentId;
  }

  for (const adapter of registeredAdapters) {
    if (adapter.detect()) {
      detectedAgentId = adapter.id;
      return adapter.id;
    }
  }

  detectedAgentId = 'claude-code';
  return detectedAgentId;
}

export function getAdapter(agentId?: string): AgentAdapter {
  const targetId = agentId || detectAgent();

  if (cachedAdapter && detectedAgentId === targetId) {
    return cachedAdapter;
  }

  const registration = registeredAdapters.find((a) => a.id === targetId);
  if (registration) {
    cachedAdapter = registration.create();
    detectedAgentId = targetId;
    return cachedAdapter;
  }

  cachedAdapter = new ClaudeAdapter();
  detectedAgentId = 'claude-code';
  return cachedAdapter;
}

export function getRegisteredAdapters(): ReadonlyArray<{ id: string; priority: number }> {
  return registeredAdapters.map(({ id, priority }) => ({ id, priority }));
}

export function clearCache(): void {
  cachedAdapter = null;
  detectedAgentId = null;
}

export function forceAdapter(adapter: AgentAdapter): void {
  cachedAdapter = adapter;
  detectedAgentId = adapter.config.id;
}

registerAdapter('claude-code', 100, detectClaude, createClaudeAdapter);
registerAdapter('opencode', 90, detectOpenCode, createOpenCodeAdapter);

export { ClaudeAdapter } from './agents/claude.js';
export { OpenCodeAdapter } from './agents/opencode.js';
export * from './types.js';
