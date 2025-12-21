import { tool } from "@opencode-ai/plugin/tool";
import { z } from "zod";
import type { MemClient } from "../mem/client.js";

export const createMemStatusTool = (client: MemClient) =>
  tool({
    description: `Check the status of the memory worker service.

Use when:
- Debugging memory issues
- Verifying the worker is running
- Checking if memories are being captured`,

    args: {},

    execute: async () => {
      try {
        const healthy = await client.healthCheck();

        if (healthy) {
          return `✓ Memory worker is running and healthy.

Worker URL: ${(client as any).baseUrl || "http://127.0.0.1:37777"}
Status: Connected

The memory system is capturing observations and ready to search.`;
        } else {
          return `✗ Memory worker is not responding.

Worker URL: ${(client as any).baseUrl || "http://127.0.0.1:37777"}
Status: Disconnected

To start the worker:
  npm run worker:start

To check logs:
  npm run worker:logs`;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return `Memory status check failed: ${message}`;
      }
    },
  });
