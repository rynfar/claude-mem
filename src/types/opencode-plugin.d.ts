/**
 * Type declarations for @opencode-ai/plugin
 * These types are provided by the OpenCode runtime at execution time.
 */

declare module "@opencode-ai/plugin" {
  export interface PluginContext {
    directory: string;
    client: {
      session: {
        prompt: (options: {
          path: { id: string };
          body: {
            noReply?: boolean;
            parts: Array<{ type: string; text: string }>;
          };
        }) => Promise<void>;
      };
    };
  }

  export interface PluginEvent {
    type: string;
    properties?: Record<string, unknown>;
  }

  export interface PluginToolInput {
    tool: string;
    sessionID: string;
    callID: string;
  }

  export interface PluginToolOutput {
    title: string;
    output: string;
    metadata?: unknown;
    args?: Record<string, unknown>;
  }

  export interface PluginMessageInput {
    sessionID: string;
  }

  export interface PluginMessageOutput {
    message: Record<string, unknown>;
    parts: Array<{ type: string; text?: string }>;
  }

  export interface PluginHandlers {
    event?: (input: { event: PluginEvent }) => Promise<void>;
    "chat.message"?: (
      input: PluginMessageInput,
      output: PluginMessageOutput
    ) => Promise<void>;
    "tool.execute.before"?: (
      input: PluginToolInput,
      output: PluginToolOutput
    ) => Promise<void>;
    "tool.execute.after"?: (
      input: PluginToolInput,
      output: PluginToolOutput
    ) => Promise<void>;
    config?: (cfg: unknown) => Promise<void>;
    tool?: Record<string, unknown>;
  }

  export type Plugin = (ctx: PluginContext) => Promise<PluginHandlers>;
}

declare module "@opencode-ai/plugin/tool" {
  import { z } from "zod";

  export interface ToolDefinition<T extends z.ZodType> {
    description: string;
    args: T;
    execute: (args: z.infer<T>) => Promise<string>;
  }

  export function tool<T extends z.ZodType>(definition: ToolDefinition<T>): unknown;
}
