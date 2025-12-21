import type { Plugin } from "@opencode-ai/plugin";

const OpenCodeMemPlugin: Plugin = async (ctx) => {
  console.log("[opencode-mem] Plugin initialized");
  console.log("[opencode-mem] Project:", ctx.project.name);
  console.log("[opencode-mem] Directory:", ctx.directory);

  return {
    event: async ({ event }) => {
      switch (event.type) {
        case "session.created": {
          const sessionInfo = (event as any).properties?.info;
          console.log("[opencode-mem] session.created:", sessionInfo?.id);
          break;
        }

        case "session.idle": {
          const sessionID = (event as any).properties?.sessionID;
          console.log("[opencode-mem] session.idle:", sessionID);
          break;
        }

        case "session.deleted": {
          const sessionInfo = (event as any).properties?.info;
          console.log("[opencode-mem] session.deleted:", sessionInfo?.id);
          break;
        }

        case "session.compacted": {
          const sessionID = (event as any).properties?.sessionID;
          console.log("[opencode-mem] session.compacted:", sessionID);
          break;
        }
      }
    },

    "chat.message": async (input, output) => {
      console.log("[opencode-mem] chat.message:", input.sessionID);
    },

    "tool.execute.before": async (input, output) => {},

    "tool.execute.after": async (input, output) => {},

    config: async (config) => {},
  };
};

export default OpenCodeMemPlugin;
