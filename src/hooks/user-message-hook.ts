/**
 * User Message Hook - SessionStart
 * Displays context information to the user via stderr
 *
 * This hook runs in parallel with context-hook to show users what context
 * has been loaded into their session. Uses the adapter layer for agent-agnostic handling.
 */
import { ensureWorkerRunning, getWorkerPort } from "../shared/worker-utils.js";
import { getAdapter } from "../adapters/index.js";

// Ensure worker is running
await ensureWorkerRunning();

const adapter = getAdapter();
const port = getWorkerPort();
const project = adapter.getProjectName(process.cwd());

// Fetch formatted context directly from worker API
const response = await fetch(
  `http://127.0.0.1:${port}/api/context/inject?project=${encodeURIComponent(project)}&colors=true`,
  { method: 'GET', signal: AbortSignal.timeout(5000) }
);

if (!response.ok) {
  throw new Error(`Failed to fetch context: ${response.status}`);
}

const output = await response.text();
const agentName = adapter.config.name;

console.error(
  `\n\n📝 ${agentName}-Mem Context Loaded\n` +
  "   ℹ️  Note: This appears as stderr but is informational only\n\n" +
  output +
  "\n\n💡 New! Wrap all or part of any message with <private> ... </private> to prevent storing sensitive information in your observation history.\n" +
  "\n💬 Community https://discord.gg/J4wttp9vDu" +
  `\n📺 Watch live in browser http://localhost:${port}/\n`
);

process.exit(adapter.getExitCode('info'));