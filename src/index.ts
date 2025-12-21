import type { Plugin } from "@opencode-ai/plugin";
import { MemClient } from "./mem/client.js";
import { loadConfig } from "./config/schema.js";

const OBSERVABLE_TOOLS = new Set([
  "read", "write", "edit", "bash", "glob", "grep",
  "lsp_hover", "lsp_goto_definition", "lsp_find_references",
]);

const MAX_OUTPUT_CHARS = 10000;

function truncateOutput(output: string, maxLength: number): string {
  if (output.length <= maxLength) return output;
  return output.slice(0, maxLength) + "\n...[truncated]";
}

const OpenCodeMemPlugin: Plugin = async (ctx) => {
  const config = loadConfig();
  
  if (!config.enabled) {
    console.log("[opencode-mem] Plugin disabled via config");
    return {};
  }

  const client = new MemClient(config.workerUrl, config.workerTimeout);
  
  const healthy = await client.healthCheck();
  if (healthy) {
    console.log("[opencode-mem] Connected to worker at", config.workerUrl);
  } else {
    console.warn("[opencode-mem] Worker not available at", config.workerUrl);
  }

  const injectedSessions = new Set<string>();
  const toolInputCache = new Map<string, Record<string, unknown>>();

  return {
    event: async ({ event }) => {
      switch (event.type) {
        case "session.created": {
          const sessionInfo = (event as any).properties?.info;
          if (!sessionInfo?.id) break;
          
          const success = await client.createSession({
            claudeSessionId: sessionInfo.id,
            project: ctx.directory,
          });
          
          if (config.debug) {
            console.log("[opencode-mem] session.created:", sessionInfo.id, success ? "ok" : "failed");
          }
          break;
        }

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
      if (!config.injectOnFirstMessage) return;
      if (injectedSessions.has(input.sessionID)) return;
      
      injectedSessions.add(input.sessionID);
      
      const contextResponse = await client.injectContext(ctx.directory);
      if (contextResponse && config.debug) {
        console.log("[opencode-mem] Context injected:", contextResponse.observationCount, "observations");
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
  };
};

export default OpenCodeMemPlugin;
