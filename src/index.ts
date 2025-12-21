import type { Plugin } from "@opencode-ai/plugin";
import { MemClient } from "./mem/client.js";
import { loadConfig } from "./config/schema.js";
import {
  createMemSearchTool,
  createMemTimelineTool,
  createMemStatusTool,
} from "./tools/index.js";
import { ensureWorkerRunning } from "./shared/worker-utils.js";

const OBSERVABLE_TOOLS = new Set([
  "read", "write", "edit", "bash", "glob", "grep",
  "lsp_hover", "lsp_goto_definition", "lsp_find_references",
]);

const MAX_OUTPUT_CHARS = 10000;

function truncateOutput(output: string, maxLength: number): string {
  if (output.length <= maxLength) return output;
  return output.slice(0, maxLength) + "\n...[truncated]";
}

function extractUserPromptText(parts: Array<{ type: string; text?: string }>): string {
  return parts
    .filter((p) => p.type === "text" && p.text)
    .map((p) => p.text)
    .join("\n");
}

const OpenCodeMemPlugin: Plugin = async (ctx) => {
  const config = loadConfig();

  if (!config.enabled) {
    console.log("[opencode-mem] Plugin disabled via config");
    return {};
  }

  try {
    await ensureWorkerRunning();
    console.log("[opencode-mem] Worker running at", config.workerUrl);
  } catch (err) {
    // Non-fatal: plugin continues in degraded mode without memory persistence
    console.error("[opencode-mem] Failed to start worker:", err);
  }

  const client = new MemClient(config.workerUrl, config.workerTimeout);

  const injectedSessions = new Set<string>();
  const toolInputCache = new Map<string, Record<string, unknown>>();

  return {
    event: async ({ event }) => {
      switch (event.type) {
        case "session.idle": {
          if (!config.summaryOnIdle) break;
          const sessionID = (event as any).properties?.sessionID;
          if (!sessionID) break;

          await client.generateSummary(sessionID);
          if (config.debug) {
            console.log("[opencode-mem] session.idle summary:", sessionID);
          }
          break;
        }

        case "session.deleted": {
          if (!config.summaryOnDelete) break;
          const sessionInfo = (event as any).properties?.info;
          if (!sessionInfo?.id) break;

          await client.completeSession(sessionInfo.id);
          injectedSessions.delete(sessionInfo.id);
          if (config.debug) {
            console.log("[opencode-mem] session.deleted:", sessionInfo.id);
          }
          break;
        }
      }
    },

    "chat.message": async (input, output) => {
      const sessionID = input.sessionID;
      const userPrompt = extractUserPromptText(output.parts);
      const isFirstMessage = !injectedSessions.has(sessionID);

      if (isFirstMessage && config.injectOnFirstMessage) {
        injectedSessions.add(sessionID);

        const contextResponse = await client.injectContext(ctx.directory);

        if (contextResponse?.context) {
          try {
            await ctx.client.session.prompt({
              path: { id: sessionID },
              body: {
                noReply: true,
                parts: [{ type: "text", text: contextResponse.context }],
              },
            });

            if (config.debug) {
              console.log(
                "[opencode-mem] Context injected:",
                contextResponse.observationCount,
                "observations"
              );
            }
          } catch (err) {
            if (config.debug) {
              console.warn("[opencode-mem] Failed to inject context:", err);
            }
          }
        }
      }

      if (userPrompt) {
        const result = await client.initSession({
          claudeSessionId: sessionID,
          project: ctx.directory,
          prompt: userPrompt,
        });

        if (config.debug && result) {
          console.log("[opencode-mem] User prompt saved:", result.promptNumber);
        }
      }
    },

    "tool.execute.before": async (input, output) => {
      if (!OBSERVABLE_TOOLS.has(input.tool)) return;
      const cacheKey = `${input.sessionID}:${input.callID}`;
      toolInputCache.set(cacheKey, output.args as Record<string, unknown>);
    },

    "tool.execute.after": async (input, output) => {
      if (!OBSERVABLE_TOOLS.has(input.tool)) return;

      const cacheKey = `${input.sessionID}:${input.callID}`;
      const toolInput = toolInputCache.get(cacheKey) || {};
      toolInputCache.delete(cacheKey);

      const success = await client.saveObservation({
        claudeSessionId: input.sessionID,
        tool_name: input.tool,
        tool_input: toolInput,
        tool_response: {
          title: output.title,
          output: truncateOutput(output.output, config.toolOutputMaxChars || MAX_OUTPUT_CHARS),
          metadata: output.metadata,
        },
        cwd: ctx.directory,
      });

      if (config.debug && !success) {
        console.warn("[opencode-mem] Failed to save observation for", input.tool);
      }
    },

    config: async (cfg) => {},

    tool: {
      mem_search: createMemSearchTool(client),
      mem_timeline: createMemTimelineTool(client),
      mem_status: createMemStatusTool(client),
    },
  };
};

export default OpenCodeMemPlugin;
