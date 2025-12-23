/**
 * Summary Hook - Stop
 *
 * Pure HTTP client - sends data to worker, worker handles all database operations
 * including privacy checks. Uses the adapter layer for agent-agnostic handling.
 */

import { stdin } from 'process';
import { logger } from '../utils/logger.js';
import { ensureWorkerRunning, getWorkerPort } from '../shared/worker-utils.js';
import { HOOK_TIMEOUTS } from '../shared/hook-constants.js';
import { getAdapter } from '../adapters/index.js';

export interface StopInput {
  session_id: string;
  cwd: string;
  transcript_path: string;
}

/**
 * Summary Hook Main Logic - Fire-and-forget HTTP client
 *
 * Uses the adapter layer for agent-agnostic input/output handling.
 */
async function summaryHook(rawInput: string): Promise<void> {
  await ensureWorkerRunning();

  const adapter = getAdapter();
  const summaryData = adapter.parseSummaryInput(rawInput);

  const port = getWorkerPort();

  logger.dataIn('HOOK', 'Stop: Requesting summary', {
    workerPort: port,
    hasLastUserMessage: !!summaryData.lastUserMessage,
    hasLastAssistantMessage: !!summaryData.lastAssistantMessage
  });

  // Send to worker - worker handles privacy check and database operations
  const response = await fetch(`http://127.0.0.1:${port}/api/sessions/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      claudeSessionId: summaryData.sessionId,
      last_user_message: summaryData.lastUserMessage,
      last_assistant_message: summaryData.lastAssistantMessage
    }),
    signal: AbortSignal.timeout(HOOK_TIMEOUTS.DEFAULT)
  });

  if (!response.ok) {
    throw new Error(`Summary generation failed: ${response.status}`);
  }

  logger.debug('HOOK', 'Summary request sent successfully');

  const output = adapter.formatHookOutput('agent.stop', { continue: true, suppressOutput: true });
  console.log(output);
}

// Entry Point
let rawInput = '';
stdin.on('data', (chunk) => rawInput += chunk);
stdin.on('end', async () => {
  if (!rawInput.trim()) {
    throw new Error('summaryHook requires input');
  }
  await summaryHook(rawInput);
});
