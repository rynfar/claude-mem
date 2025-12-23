/**
 * Context Hook - SessionStart
 *
 * Pure HTTP client - calls worker to generate context.
 * Uses the adapter layer for agent-agnostic input/output handling.
 */

import { stdin } from "process";
import { ensureWorkerRunning, getWorkerPort } from "../shared/worker-utils.js";
import { HOOK_TIMEOUTS } from "../shared/hook-constants.js";
import { getAdapter } from "../adapters/index.js";
import type { GenericSessionData } from "../adapters/types.js";

export interface SessionStartInput {
  session_id: string;
  transcript_path: string;
  cwd: string;
  hook_event_name?: string;
}

async function contextHook(rawInput?: string): Promise<string> {
  await ensureWorkerRunning();

  const adapter = getAdapter();
  const sessionData = rawInput ? adapter.parseSessionInput(rawInput) : {
    sessionId: '',
    projectName: adapter.getProjectName(process.cwd()),
    workingDir: process.cwd(),
  };

  const port = getWorkerPort();
  const url = `http://127.0.0.1:${port}/api/context/inject?project=${encodeURIComponent(sessionData.projectName)}`;

  const response = await fetch(url, { signal: AbortSignal.timeout(HOOK_TIMEOUTS.DEFAULT) });

  if (!response.ok) {
    throw new Error(`Context generation failed: ${response.status}`);
  }

  const result = await response.text();
  return result.trim();
}

const forceColors = process.argv.includes("--colors");

if (stdin.isTTY || forceColors) {
  contextHook(undefined).then((text) => {
    console.log(text);
    process.exit(0);
  });
} else {
  let rawInput = "";
  stdin.on("data", (chunk) => (rawInput += chunk));
  stdin.on("end", async () => {
    const text = await contextHook(rawInput.trim() || undefined);
    const adapter = getAdapter();
    const output = adapter.formatHookOutput('context.inject', { context: text });
    console.log(output);
    process.exit(0);
  });
}
