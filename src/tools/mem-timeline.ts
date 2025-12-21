import { tool } from "@opencode-ai/plugin/tool";
import { z } from "zod";
import type { MemClient } from "../mem/client.js";
import type { SearchResult } from "../mem/types.js";

function formatTimelineResults(results: SearchResult[], anchorId?: number): string {
  if (results.length === 0) {
    return "No timeline entries found.";
  }

  return results
    .map((r) => {
      const isAnchor = anchorId && r.id === anchorId;
      const marker = isAnchor ? ">>> " : "    ";
      const date = r.created_at_epoch
        ? new Date(r.created_at_epoch * 1000).toISOString().split("T")[0]
        : "unknown";

      const title = r.title || r.concept || "Untitled";
      const files = r.source_files ? ` (${r.source_files})` : "";

      return `${marker}[${date}] ${title} [${r.type}]${files}`;
    })
    .join("\n");
}

export const createMemTimelineTool = (client: MemClient) =>
  tool({
    description: `Get a timeline of memories around a specific point or search result.

Use when:
- Need to understand the sequence of events
- Want context before/after a specific memory
- Looking at the history of changes to a feature
- Understanding how a bug was introduced or fixed`,

    args: z.object({
      observationId: z
        .number()
        .optional()
        .describe("Get context around this observation ID"),
      query: z
        .string()
        .optional()
        .describe("Search and get timeline around best match"),
      window: z
        .number()
        .optional()
        .default(5)
        .describe("Number of items before/after (default: 5)"),
    }),

    execute: async ({ observationId, query, window }) => {
      try {
        if (!observationId && !query) {
          return "Please provide either an observationId or a query to center the timeline.";
        }

        const results = await client.timeline({
          anchor: observationId,
          query,
          window,
        });

        return formatTimelineResults(results, observationId);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return `Timeline retrieval failed: ${message}`;
      }
    },
  });
