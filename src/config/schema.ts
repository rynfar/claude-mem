import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

export const OpenCodeMemConfigSchema = z.object({
  workerUrl: z.string().default("http://127.0.0.1:37777"),
  workerTimeout: z.number().default(30000),

  contextMaxObservations: z.number().default(50),
  injectOnFirstMessage: z.boolean().default(true),

  toolOutputMaxChars: z.number().default(10000),
  observableTools: z.array(z.string()).optional(),

  summaryOnIdle: z.boolean().default(true),
  summaryOnDelete: z.boolean().default(true),

  enabled: z.boolean().default(true),
  debug: z.boolean().default(false),
});

export type OpenCodeMemConfig = z.infer<typeof OpenCodeMemConfigSchema>;

export function loadConfig(): OpenCodeMemConfig {
  const configPaths = [
    path.join(process.env.HOME || "", ".config/opencode/opencode-mem.json"),
    path.join(process.env.HOME || "", ".opencode-mem/settings.json"),
  ];

  for (const configPath of configPaths) {
    try {
      if (fs.existsSync(configPath)) {
        const content = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        return OpenCodeMemConfigSchema.parse(content);
      }
    } catch (err) {
      console.warn("[opencode-mem] Failed to load config from", configPath, err);
    }
  }

  return OpenCodeMemConfigSchema.parse({});
}
