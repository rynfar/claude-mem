import { tool } from "@opencode-ai/plugin/tool";
import { z } from "zod";
import type { MemClient } from "../mem/client.js";
import type { SearchResult } from "../mem/types.js";

function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) {
    return "No memories found matching your query.";
  }

  return results
    .map((r, i) => {
      const lines = [`### ${i + 1}. ${r.title || r.concept || "Untitled"} [${r.type}]`];

      if (r.text) {
        lines.push(r.text);
      }

      const meta: string[] = [];
      if (r.source_files) {
        meta.push(`Files: ${r.source_files}`);
      }
      if (r.created_at_epoch) {
        const date = new Date(r.created_at_epoch * 1000).toISOString().split("T")[0];
        meta.push(`Date: ${date}`);
      }
      meta.push(`ID: ${r.id}`);

      if (meta.length > 0) {
        lines.push(`_${meta.join(" | ")}_`);
      }

      return lines.join("\n");
    })
    .join("\n\n");
}

export const createMemSearchTool = (client: MemClient) =>
  tool({
    description: `Search persistent memory for past observations, decisions, and learnings from previous sessions.

Use when:
- User asks "did we already solve this?"
- User asks "how did we do X last time?"
- User needs context from previous sessions
- Looking for past decisions or implementations
- Searching for previous bugfixes or features`,

    args: {
      query: z.string().describe("Natural language search query"),
      limit: z
        .number()
        .optional()
        .default(10)
        .describe("Maximum results to return (default: 10)"),
      type: z
        .enum(["bugfix", "feature", "refactor", "change", "discovery", "decision"])
        .optional()
        .describe("Filter by observation type"),
    },

    execute: async ({ query, limit, type }) => {
      try {
        const results = await client.search(query, { limit, type });
        return formatSearchResults(results);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return `Memory search failed: ${message}`;
      }
    },
  });
