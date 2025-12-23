/**
 * Save Hook - PostToolUse
 *
 * Pure HTTP client - sends data to worker, worker handles all database operations
 * including privacy checks. Uses the adapter layer for agent-agnostic handling.
 */

import { stdin } from 'process';
import { logger } from '../utils/logger.js';
import { ensureWorkerRunning, getWorkerPort } from '../shared/worker-utils.js';
import { HOOK_TIMEOUTS } from '../shared/hook-constants.js';
import { getAdapter } from '../adapters/index.js';

export interface PostToolUseInput {
  session_id: string;
  cwd: string;
  tool_name: string;
  tool_input: any;
  tool_response: any;
}

async function saveHook(rawInput: string): Promise<void> {
  await ensureWorkerRunning();

  const adapter = getAdapter();
  const observation = adapter.parseObservationInput(rawInput);

  if (!observation.sessionId || observation.sessionId.trim() === '') {
    logger.debug('HOOK', 'Missing or empty session_id, skipping observation');
    const output = adapter.formatHookOutput('tool.after', { continue: true, suppressOutput: true });
    console.log(output);
    return;
  }

  if (adapter.shouldSkipTool(observation.toolName)) {
    logger.debug('HOOK', 'Skipping tool observation', { toolName: observation.toolName });
    const output = adapter.formatHookOutput('tool.after', { continue: true, suppressOutput: true });
    console.log(output);
    return;
  }

  const port = getWorkerPort();
  const toolStr = logger.formatTool(observation.toolName, observation.toolInput);

  logger.dataIn('HOOK', `PostToolUse: ${toolStr}`, { workerPort: port });

  if (!observation.workingDir) {
    throw new Error(`Missing workingDir in PostToolUse hook input for session ${observation.sessionId}`);
  }

  const response = await fetch(`http://127.0.0.1:${port}/api/sessions/observations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agentSessionId: observation.sessionId,
      tool_name: observation.toolName,
      tool_input: observation.toolInput,
      tool_response: observation.toolOutput,
      cwd: observation.workingDir
    }),
    signal: AbortSignal.timeout(HOOK_TIMEOUTS.DEFAULT)
  });

  if (!response.ok) {
    throw new Error(`Observation storage failed: ${response.status}`);
  }

  logger.debug('HOOK', 'Observation sent successfully', { toolName: observation.toolName });

  const output = adapter.formatHookOutput('tool.after', { continue: true, suppressOutput: true });
  console.log(output);
}

let rawInput = '';
stdin.on('data', (chunk) => rawInput += chunk);
stdin.on('end', async () => {
  if (!rawInput.trim()) {
    throw new Error('saveHook requires input');
  }
  await saveHook(rawInput);
});
