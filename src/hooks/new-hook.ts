import { stdin } from 'process';
import { ensureWorkerRunning, getWorkerPort } from '../shared/worker-utils.js';
import { getAdapter } from '../adapters/index.js';

export interface UserPromptSubmitInput {
  session_id: string;
  cwd: string;
  prompt: string;
}


/**
 * New Hook Main Logic
 *
 * Uses the adapter layer for agent-agnostic input/output handling.
 */
async function newHook(rawInput: string): Promise<void> {
  // Ensure worker is running before any other logic
  await ensureWorkerRunning();

  const adapter = getAdapter();
  const sessionData = adapter.parsePromptInput(rawInput);

  const { sessionId: session_id, projectName: project, prompt } = sessionData;

  if (!session_id || session_id.trim() === '') {
    console.error('[new-hook] Missing or empty session_id, skipping');
    const output = adapter.formatHookOutput('user.prompt', { continue: true, suppressOutput: true });
    console.log(output);
    return;
  }

  if (!prompt) {
    const output = adapter.formatHookOutput('user.prompt', { continue: true, suppressOutput: true });
    console.log(output);
    return;
  }

  const port = getWorkerPort();

  // Initialize session via HTTP - handles DB operations and privacy checks
  const initResponse = await fetch(`http://127.0.0.1:${port}/api/sessions/init`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agentSessionId: session_id,
      project,
      prompt
    }),
    signal: AbortSignal.timeout(5000)
  });

  if (!initResponse.ok) {
    throw new Error(`Session initialization failed: ${initResponse.status}`);
  }

  const initResult = await initResponse.json();
  const sessionDbId = initResult.sessionDbId;
  const promptNumber = initResult.promptNumber;

  // Check if prompt was entirely private (worker performs privacy check)
  if (initResult.skipped && initResult.reason === 'private') {
    console.error(`[new-hook] Session ${sessionDbId}, prompt #${promptNumber} (fully private - skipped)`);
    const output = adapter.formatHookOutput('user.prompt', { continue: true, suppressOutput: true });
    console.log(output);
    return;
  }

  console.error(`[new-hook] Session ${sessionDbId}, prompt #${promptNumber}`);

  // Strip leading slash from commands for memory agent
  // /review 101 → review 101 (more semantic for observations)
  const cleanedPrompt = prompt.startsWith('/') ? prompt.substring(1) : prompt;

  // Initialize SDK agent session via HTTP (starts the agent!)
  const response = await fetch(`http://127.0.0.1:${port}/sessions/${sessionDbId}/init`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userPrompt: cleanedPrompt, promptNumber }),
    signal: AbortSignal.timeout(5000)
  });

  if (!response.ok) {
    throw new Error(`SDK agent start failed: ${response.status}`);
  }

  const output = adapter.formatHookOutput('user.prompt', { continue: true, suppressOutput: true });
  console.log(output);
}

// Entry Point
let rawInput = '';
stdin.on('data', (chunk) => rawInput += chunk);
stdin.on('end', async () => {
  if (!rawInput.trim()) {
    throw new Error('newHook requires input');
  }
  await newHook(rawInput);
});
