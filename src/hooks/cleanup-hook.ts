/**
 * Cleanup Hook - SessionEnd
 *
 * Pure HTTP client - sends data to worker, worker handles all database operations.
 * Uses the adapter layer for agent-agnostic handling.
 */

import { stdin } from 'process';
import { ensureWorkerRunning, getWorkerPort } from '../shared/worker-utils.js';
import { HOOK_TIMEOUTS } from '../shared/hook-constants.js';
import { getAdapter } from '../adapters/index.js';

export interface SessionEndInput {
  session_id: string;
  reason: 'exit' | 'clear' | 'logout' | 'prompt_input_exit' | 'other';
}

/**
 * Cleanup Hook Main Logic - Fire-and-forget HTTP client
 *
 * Uses the adapter layer for agent-agnostic input/output handling.
 */
async function cleanupHook(rawInput: string): Promise<void> {
  await ensureWorkerRunning();

  const adapter = getAdapter();
  const sessionEndData = adapter.parseSessionEndInput(rawInput);

  const port = getWorkerPort();

  // Send to worker - worker handles finding session, marking complete, and stopping spinner
  const response = await fetch(`http://127.0.0.1:${port}/api/sessions/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      claudeSessionId: sessionEndData.sessionId,
      reason: sessionEndData.reason
    }),
    signal: AbortSignal.timeout(HOOK_TIMEOUTS.DEFAULT)
  });

  if (!response.ok) {
    throw new Error(`Session cleanup failed: ${response.status}`);
  }

  const output = adapter.formatHookOutput('session.end', { continue: true, suppressOutput: true });
  console.log(output);
  process.exit(adapter.getExitCode('success'));
}

// Entry Point
if (stdin.isTTY) {
  // Running manually - provide default input for testing
  cleanupHook('{"session_id":"manual","reason":"exit"}');
} else {
  let rawInput = '';
  stdin.on('data', (chunk) => rawInput += chunk);
  stdin.on('end', async () => {
    if (!rawInput.trim()) {
      throw new Error('cleanup-hook requires input');
    }
    await cleanupHook(rawInput);
  });
}
